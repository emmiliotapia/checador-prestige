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

@app.api_route("/iclock/cdata", methods=["GET", "POST"])
async def receive_zkteco_data(request: Request, db: Session = Depends(get_db)):
    """
    ZKTeco ADMS Webhook.
    Handles data push from devices.
    """
    if request.method == "GET":
        # Handshake / Initialization response expected by ZKTeco
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

    # If POST, it's pushing data
    params = request.query_params
    sn = params.get("SN")
    table = params.get("table", "")
    
    body = await request.body()
    body_text = body.decode("utf-8", errors="ignore")
    
    # We only care about ATTLOG (Attendance Logs)
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
                    
                    # Find employee
                    empleado = db.query(models.Empleado).filter(models.Empleado.id_reloj == id_reloj).first()
                    
                    if empleado:
                        # Avoid duplicates
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
                    print(f"Error parsing line {line}: {e}")
                    continue
                    
        db.commit()
    
    # Always acknowledge receipt
    return PlainTextResponse("OK\n")

@app.get("/api/empleados", response_model=List[schemas.EmpleadoOut])
def list_empleados(tenant_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(models.Empleado).filter(models.Empleado.tenant_id == tenant_id).all()

@app.post("/api/empleados", response_model=schemas.EmpleadoOut)
def create_empleado(empleado: schemas.EmpleadoCreate, db: Session = Depends(get_db)):
    db_empleado = models.Empleado(**empleado.dict())
    db.add(db_empleado)
    db.commit()
    db.refresh(db_empleado)
    return db_empleado

@app.get("/api/areas", response_model=List[schemas.AreaOut])
def list_areas(tenant_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(models.Area).filter(models.Area.tenant_id == tenant_id).all()

@app.post("/api/areas", response_model=schemas.AreaOut)
def create_area(area: schemas.AreaCreate, db: Session = Depends(get_db)):
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
    if current_user.rol not in ["ROOT", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_area = db.query(models.Area).filter(models.Area.id == area_id).first()
    if not db_area:
        raise HTTPException(status_code=404, detail="Area not found")
        
    db_area.correo_responsable = area_update.correo_responsable
    db.commit()
    db.refresh(db_area)
    return db_area

@app.get("/api/reportes/exportar")
def export_report(
    tenant_id: uuid.UUID, 
    fecha_inicio: datetime, 
    fecha_fin: datetime, 
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    query = db.query(models.Registro).join(models.Empleado).filter(
        models.Registro.tenant_id == tenant_id,
        models.Registro.timestamp_checada >= fecha_inicio,
        models.Registro.timestamp_checada <= fecha_fin
    )
    
    if current_user.rol == "MANAGER" and current_user.area_id:
        query = query.filter(models.Empleado.area_id == current_user.area_id)
        
    registros = query.all()
    
    result = []
    for reg in registros:
        result.append({
            "empleado": reg.empleado.nombre_completo,
            "id_reloj": reg.empleado.id_reloj,
            "timestamp": reg.timestamp_checada.isoformat(),
            "tipo": reg.tipo_registro,
            "dispositivo": reg.dispositivo_sn
        })
    
    return result

@app.post("/api/auth/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
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
    
    # If manager, filter by their area
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
