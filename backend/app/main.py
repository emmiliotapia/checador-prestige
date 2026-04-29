from fastapi import FastAPI, Request, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from typing import List, Optional

from . import models, database, schemas, bridge, auth
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SmartOps Time Attendance API")

app.include_router(bridge.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
models.Base.metadata.create_all(bind=database.engine)

# Dependency to get DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ADMS PROTOCOL ENDPOINTS ---

@app.api_route("/iclock/cdata", methods=["GET", "POST"])
async def receive_zkteco_data(request: Request, db: Session = Depends(get_db)):
    """
    Webhook ADMS de ZKTeco.
    Maneja el saludo inicial (GET) y el envío de registros (POST).
    """
    if request.method == "GET":
        # Respuesta de handshake esperada por el dispositivo
        response_text = (
            "Registry=OK\n"
            "GET OPTION FROM: 1\n"
            "ATTLOGStamp=0\n"
            "OPERLOGStamp=0\n"
            "ATTPHOTOStamp=0\n"
            "ErrorDelay=60\n"
            "Delay=30\n"
            "TransTimes=00:00;14:00\n"
            "TransInterval=1\n"
        )
        return PlainTextResponse(response_text)

    # Si es POST, el dispositivo está enviando datos (checadas)
    params = request.query_params
    sn = params.get("SN")
    table = params.get("table", "")
    
    body = await request.body()
    body_text = body.decode("utf-8", errors="ignore")
    
    # Solo procesamos la tabla de asistencias (ATTLOG)
    if table == "ATTLOG":
        lines = body_text.strip().split("\n")
        
        for line in lines:
            parts = line.strip().split("\t")
            if len(parts) >= 2:
                id_reloj = parts[0]
                timestamp_str = parts[1]
                tipo_registro = parts[2] if len(parts) > 2 else "0"
                
                try:
                    timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
                    
                    # Buscar empleado por su ID de reloj físico
                    empleado = db.query(models.Empleado).filter(models.Empleado.id_reloj == id_reloj).first()
                    
                    if empleado:
                        # Evitar duplicados (misma persona, mismo segundo)
                        exists = db.query(models.Registro).filter(
                            models.Registro.empleado_id == empleado.id,
                            models.Registro.timestamp_checada == timestamp
                        ).first()
                        
                        if not exists:
                            nuevo_registro = models.Registro(
                                tenant_id=empleado.tenant_id,
                                empleado_id=empleado.id,
                                timestamp_checada=timestamp,
                                tipo_registro=tipo_registro,
                                dispositivo_sn=sn
                            )
                            db.add(nuevo_registro)
                except Exception as e:
                    print(f"Error parseando linea {line}: {e}")
                    continue
                    
        db.commit()
    
    # Respuesta OK en texto plano es vital para que el reloj limpie su memoria
    return PlainTextResponse("OK\n")

@app.get("/iclock/getrequest")
async def get_request(sn: str, db: Session = Depends(get_db)):
    """
    El dispositivo pregunta si hay comandos pendientes.
    """
    comandos = db.query(models.Comando).filter(
        models.Comando.dispositivo_sn == sn,
        models.Comando.ejecutado == False
    ).all()
    
    if not comandos:
        return PlainTextResponse("OK\n")
    
    # Enviamos los comandos uno por uno o concatenados según protocolo
    response = ""
    for cmd in comandos:
        response += f"C:{cmd.id}:{cmd.comando}\n"
    
    return PlainTextResponse(response)

@app.post("/iclock/devicecmd")
async def device_cmd(request: Request, db: Session = Depends(get_db)):
    """
    El dispositivo confirma que ejecutó un comando.
    """
    body = await request.body()
    body_text = body.decode("utf-8")
    # Formato: ID=cmd_id&Return=0 (0 es éxito)
    lines = body_text.strip().split("\n")
    for line in lines:
        if "ID=" in line:
            parts = line.split("&")
            cmd_id = parts[0].split("=")[1]
            ret_code = parts[1].split("=")[1]
            
            if ret_code == "0":
                comando = db.query(models.Comando).filter(models.Comando.id == cmd_id).first()
                if comando:
                    comando.ejecutado = True
    
    db.commit()
    return PlainTextResponse("OK\n")

# --- API ENDPOINTS (GESTION) ---

@app.get("/api/empleados", response_model=List[schemas.EmpleadoOut])
def list_empleados(
    tenant_id: uuid.UUID, 
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    query = db.query(models.Empleado).filter(models.Empleado.tenant_id == tenant_id)
    if search:
        query = query.filter(models.Empleado.nombre_completo.ilike(f"%{search}%"))
    return query.all()

@app.post("/api/empleados", response_model=schemas.EmpleadoOut)
def create_empleado(
    empleado: schemas.EmpleadoCreate, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    # Solo ROOT, ADMIN o RRHH pueden crear empleados
    if current_user.rol not in ["ROOT", "ADMIN", "RRHH"]:
        raise HTTPException(status_code=403, detail="No tienes permisos")
        
    db_empleado = models.Empleado(**empleado.dict())
    db.add(db_empleado)
    db.commit()
    db.refresh(db_empleado)
    
    # Cola de comando para el dispositivo (Sync automático)
    # Por ahora asumiendo un SN genérico o todos los del tenant
    # En un sistema real, buscaríamos los dispositivos del tenant
    nuevo_comando = models.Comando(
        dispositivo_sn="TODOS", # O un SN específico
        comando=f"DATA USER PIN={db_empleado.id_reloj}\tName={db_empleado.nombre_completo}\tPri=0\tPass=\tCard="
    )
    db.add(nuevo_comando)
    db.commit()
    
    return db_empleado

@app.get("/api/areas", response_model=List[schemas.AreaOut])
def list_areas(tenant_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(models.Area).filter(models.Area.tenant_id == tenant_id).all()

@app.post("/api/areas", response_model=schemas.AreaOut)
def create_area(
    area: schemas.AreaCreate, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    if current_user.rol not in ["ROOT", "ADMIN", "RRHH"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    db_area = models.Area(**area.dict())
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    return db_area

@app.put("/api/areas/{area_id}", response_model=schemas.AreaOut)
def update_area(
    area_id: uuid.UUID, 
    area_update: schemas.AreaUpdate, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    if current_user.rol not in ["ROOT", "ADMIN", "RRHH"]:
        raise HTTPException(status_code=403, detail="No autorizado")
        
    db_area = db.query(models.Area).filter(models.Area.id == area_id).first()
    if not db_area:
        raise HTTPException(status_code=404, detail="Area no encontrada")
        
    if area_update.nombre_area:
        db_area.nombre_area = area_update.nombre_area
    if area_update.correo_responsable:
        db_area.correo_responsable = area_update.correo_responsable
    if area_update.encargado_id:
        db_area.encargado_id = area_update.encargado_id
        
    db.commit()
    db.refresh(db_area)
    return db_area

@app.get("/api/horarios", response_model=List[schemas.HorarioOut])
def list_horarios(tenant_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(models.Horario).filter(models.Horario.tenant_id == tenant_id).all()

@app.post("/api/horarios", response_model=schemas.HorarioOut)
def create_horario(
    horario: schemas.HorarioCreate, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    if current_user.rol not in ["ROOT", "ADMIN", "RRHH"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    db_horario = models.Horario(**horario.dict())
    db.add(db_horario)
    db.commit()
    db.refresh(db_horario)
    return db_horario

@app.post("/api/usuarios", response_model=schemas.UsuarioOut)
def create_user(
    user_in: schemas.UsuarioCreate, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    if current_user.rol not in ["ROOT", "ADMIN", "RRHH"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para crear usuarios")
    
    # Evitar duplicados
    exists = db.query(models.Usuario).filter(models.Usuario.email == user_in.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
        
    db_user = models.Usuario(
        tenant_id=user_in.tenant_id,
        email=user_in.email,
        hashed_password=auth.get_password_hash(user_in.password),
        rol=user_in.rol,
        area_id=user_in.area_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/api/usuarios", response_model=List[schemas.UsuarioOut])
def list_users(
    tenant_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    if current_user.rol not in ["ROOT", "ADMIN", "RRHH"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    return db.query(models.Usuario).filter(models.Usuario.tenant_id == tenant_id).all()

@app.post("/api/dispositivos/sync")
def force_sync(sn: str, db: Session = Depends(get_db), current_user: models.Usuario = Depends(auth.get_current_user)):
    """
    Encola un comando de recarga total para el dispositivo.
    """
    if current_user.rol not in ["ROOT", "ADMIN", "RRHH"]:
        raise HTTPException(status_code=403, detail="No autorizado")
        
    # Comando para recargar usuarios y opciones
    cmd1 = models.Comando(dispositivo_sn=sn, comando="RELOAD OPTIONS")
    cmd2 = models.Comando(dispositivo_sn=sn, comando="RELOAD USERDATA")
    db.add(cmd1)
    db.add(cmd2)
    db.commit()
    return {"message": f"Sincronización encolada para el dispositivo {sn}"}

@app.post("/api/auth/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "usuario": user}

@app.put("/api/auth/password")
def change_password(
    password_data: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    if not auth.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
        
    current_user.hashed_password = auth.get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "Contraseña actualizada exitosamente"}

@app.get("/api/registros/recientes", response_model=List[schemas.RegistroDetailOut])
def list_recent_registros(
    tenant_id: uuid.UUID, 
    limit: int = 10, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    query = db.query(models.Registro).filter(models.Registro.tenant_id == tenant_id)
    
    if current_user.rol == "MANAGER" and current_user.area_id:
        query = query.join(models.Empleado).filter(models.Empleado.area_id == current_user.area_id)
        
    registros = query.order_by(models.Registro.timestamp_checada.desc()).limit(limit).all()
    
    result = []
    for reg in registros:
        result.append({
            "id": reg.id,
            "timestamp_checada": reg.timestamp_checada,
            "tipo_registro": reg.tipo_registro,
            "dispositivo_sn": reg.dispositivo_sn,
            "nombre_empleado": reg.empleado.nombre_completo,
            "id_reloj": reg.empleado.id_reloj
        })
    
    return result
