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
import unicodedata

app = FastAPI(title="SmartOps Time Attendance API")

def normalize_string(s: str) -> str:
    """
    Normaliza una cadena eliminando acentos pero preservando la ñ y Ñ.
    """
    if not s:
        return s
    # Normalizar para separar caracteres base de acentos
    normalized = unicodedata.normalize('NFD', s)
    # Filtrar solo caracteres que no sean acentos, pero permitir la Ñ (que es U+0303 en NFD)
    # En NFD, la Ñ es 'N' + COMBINING TILDE (U+0303). 
    # La ñ es 'n' + COMBINING TILDE.
    # Vamos a reconstruir permitiendo solo los caracteres deseados y pasar a MAYÚSCULAS.
    result = ""
    for char in normalized:
        if unicodedata.category(char) != 'Mn' or char == '\u0303':
            result += char
    return unicodedata.normalize('NFC', result).upper()

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
            "CmdInterval=15\n"
            "Realtime=1\n"
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
                    
                    if empleado and empleado.activo:
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
        (models.Comando.dispositivo_sn == sn) | (models.Comando.dispositivo_sn == "TODOS"),
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
    import urllib.parse
    for line in lines:
        parsed = urllib.parse.parse_qs(line.strip())
        if "ID" in parsed:
            try:
                cmd_id = int(parsed["ID"][0])
                comando = db.query(models.Comando).filter(models.Comando.id == cmd_id).first()
                if comando:
                    comando.ejecutado = True
            except Exception as e:
                print(f"Error parsing devicecmd ID: {e}")
    
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
        
    # Normalizar nombre antes de guardar
    db_empleado = models.Empleado(**empleado.dict())
    db_empleado.nombre_completo = normalize_string(db_empleado.nombre_completo)
    if db_empleado.puesto:
        db_empleado.puesto = normalize_string(db_empleado.puesto)
    
    # Evitar duplicados por ID de Reloj
    exists = db.query(models.Empleado).filter(
        models.Empleado.tenant_id == empleado.tenant_id,
        models.Empleado.id_reloj == db_empleado.id_reloj
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail=f"Ya existe un empleado con el ID de reloj {db_empleado.id_reloj}")
        
    db.add(db_empleado)
    db.commit()
    db.refresh(db_empleado)
    
    # Cola de comando para el dispositivo (Sync automático)
    # Por ahora asumiendo un SN genérico o todos los del tenant
    # En un sistema real, buscaríamos los dispositivos del tenant
    nuevo_comando = models.Comando(
        dispositivo_sn="TODOS", # O un SN específico
        comando=f"DATA UPDATE USERINFO PIN={db_empleado.id_reloj}\tName={db_empleado.nombre_completo}\tPri=0"
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
    db_area.nombre_area = normalize_string(db_area.nombre_area)
    
    # Evitar duplicados por nombre
    exists = db.query(models.Area).filter(
        models.Area.tenant_id == area.tenant_id,
        models.Area.nombre_area == db_area.nombre_area
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Ya existe un área con ese nombre")

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
        nombre_norm = normalize_string(area_update.nombre_area)
        # Verificar que no exista otra área con ese nombre (excepto esta misma)
        exists = db.query(models.Area).filter(
            models.Area.tenant_id == db_area.tenant_id,
            models.Area.nombre_area == nombre_norm,
            models.Area.id != area_id
        ).first()
        if exists:
            raise HTTPException(status_code=400, detail="Ya existe otra área con ese nombre")
        db_area.nombre_area = nombre_norm
    if area_update.correo_responsable:
        db_area.correo_responsable = area_update.correo_responsable
    if area_update.encargado_id:
        db_area.encargado_id = area_update.encargado_id
        
    db.commit()
    db.refresh(db_area)
    return db_area

@app.delete("/api/areas/{area_id}")
def delete_area(
    area_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    if current_user.rol not in ["ROOT", "ADMIN", "RRHH"]:
        raise HTTPException(status_code=403, detail="No autorizado")
        
    db_area = db.query(models.Area).filter(models.Area.id == area_id).first()
    if not db_area:
        raise HTTPException(status_code=404, detail="Area no encontrada")
    
    # Verificar si hay empleados vinculados
    has_employees = db.query(models.Empleado).filter(models.Empleado.area_id == area_id).first()
    if has_employees:
        raise HTTPException(status_code=400, detail="No se puede borrar un área con empleados vinculados. Reasígnelos primero.")
        
    db.delete(db_area)
    db.commit()
    return {"message": "Área eliminada"}

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
    limit: int = 50,
    area_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    query = db.query(models.Registro).filter(models.Registro.tenant_id == tenant_id)
    
    if area_id:
        query = query.join(models.Empleado).filter(models.Empleado.area_id == area_id)
    elif current_user.rol == "MANAGER" and current_user.area_id:
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

# --- ENDPOINTS ADICIONALES (Gestión, Reportes, Dashboard) ---

@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    tenant_id: uuid.UUID,
    fecha_hoy: Optional[str] = None, # Formato YYYY-MM-DD
    area_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    """
    Estadísticas para el Dashboard de Inicio.
    Calcula asistencias, retardos y faltas aproximadas.
    """
    if fecha_hoy:
        hoy_dt = datetime.strptime(fecha_hoy, "%Y-%m-%d").date()
    else:
        hoy_dt = datetime.now().date()
        
    inicio_dia = datetime.combine(hoy_dt, datetime.min.time())
    fin_dia = datetime.combine(hoy_dt, datetime.max.time())

    query_regs = db.query(models.Registro).filter(
        models.Registro.tenant_id == tenant_id,
        models.Registro.timestamp_checada >= inicio_dia,
        models.Registro.timestamp_checada <= fin_dia
    )

    query_emps = db.query(models.Empleado).filter(
        models.Empleado.tenant_id == tenant_id,
        models.Empleado.activo == True
    )

    if area_id:
        query_regs = query_regs.join(models.Empleado).filter(models.Empleado.area_id == area_id)
        query_emps = query_emps.filter(models.Empleado.area_id == area_id)
    elif current_user.rol == "MANAGER" and current_user.area_id:
        query_regs = query_regs.join(models.Empleado).filter(models.Empleado.area_id == current_user.area_id)
        query_emps = query_emps.filter(models.Empleado.area_id == current_user.area_id)

    registros_hoy = query_regs.all()
    empleados_activos = query_emps.count()
    
    # Entradas de hoy
    entradas = [r for r in registros_hoy if r.tipo_registro == "0"]
    
    # Cálculo de retardos
    retardos = 0
    for reg in entradas:
        if reg.empleado.horario:
            hora_entrada_h = datetime.strptime(reg.empleado.horario.hora_entrada, "%H:%M").time()
            hora_checada = reg.timestamp_checada.time()
            
            # Tolerancia en minutos
            tolerancia = reg.empleado.horario.tolerancia_entrada
            # Usamos datetime.combine para comparar tiempos con tolerancia
            base_dt = datetime.combine(hoy_dt, hora_entrada_h)
            limite_entrada = (base_dt + timedelta(minutes=tolerancia)).time()
            
            if hora_checada > limite_entrada:
                retardos += 1

    # Faltas aproximadas (empleados activos que no tienen entrada hoy)
    emp_ids_con_entrada = {r.empleado_id for r in entradas}
    faltas = max(0, empleados_activos - len(emp_ids_con_entrada))

    return {
        "asistencias_hoy": len(entradas),
        "retardos_hoy": retardos,
        "faltas_hoy": faltas,
        "empleados_totales": empleados_activos
    }

@app.get("/api/reportes/exportar")
def exportar_reporte_detallado(
    tenant_id: uuid.UUID,
    fecha_inicio: datetime,
    fecha_fin: datetime,
    area_id: Optional[uuid.UUID] = None,
    empleado_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    """
    Genera los datos enriquecidos para la exportación CSV.
    Agrupa checadas por empleado y día para deducir inteligentemente
    Entrada, Salida a Comer, Regreso, y Salida.
    """
    from collections import defaultdict
    
    query = db.query(models.Registro).filter(
        models.Registro.tenant_id == tenant_id,
        models.Registro.timestamp_checada >= fecha_inicio,
        models.Registro.timestamp_checada <= fecha_fin
    )

    # Filtrar por empleado específico si se provee
    if empleado_id:
        query = query.filter(models.Registro.empleado_id == empleado_id)

    # Filtros de área
    if area_id:
        query = query.join(models.Empleado).filter(models.Empleado.area_id == area_id)
    elif current_user.rol == "MANAGER" and current_user.area_id:
        query = query.join(models.Empleado).filter(models.Empleado.area_id == current_user.area_id)

    registros = query.order_by(models.Registro.timestamp_checada.asc()).all()

    # Agrupar por (empleado_id, fecha_local)
    agrupados = defaultdict(list)
    for reg in registros:
        key = (reg.empleado_id, reg.timestamp_checada.date())
        agrupados[key].append(reg)

    result = []
    for (emp_id, fecha), daily_regs in agrupados.items():
        count = len(daily_regs)
        
        for i, reg in enumerate(daily_regs):
            tipo = "Desconocido"
            
            if count == 1:
                tipo = "Entrada"
            elif count == 2:
                if i == 0:
                    tipo = "Entrada"
                else:
                    # Diferencia en horas entre la 1ra y 2da checada
                    diff = daily_regs[1].timestamp_checada - daily_regs[0].timestamp_checada
                    if diff.total_seconds() >= 7.5 * 3600:
                        tipo = "Salida"
                    else:
                        tipo = "Salida a Comer"
            elif count == 3:
                if i == 0: tipo = "Entrada"
                elif i == 1: tipo = "Salida a Comer"
                elif i == 2: tipo = "Regreso de Comer"
            elif count >= 4:
                if i == 0: tipo = "Entrada"
                elif i == 1: tipo = "Salida a Comer"
                elif i == 2: tipo = "Regreso de Comer"
                elif i == 3: tipo = "Salida"
                else: tipo = "Checada Adicional"
                
            result.append({
                "empleado": reg.empleado.nombre_completo,
                "id_reloj": reg.empleado.id_reloj,
                "area": reg.empleado.area.nombre_area if reg.empleado.area else "N/A",
                "puesto": reg.empleado.puesto or "N/A",
                "fecha": reg.timestamp_checada.strftime("%Y-%m-%d"),
                "hora": reg.timestamp_checada.strftime("%H:%M:%S"),
                "tipo": tipo,
                "dispositivo": reg.dispositivo_sn
            })
            
    # Ordenar finalmente por fecha y hora cronológicamente
    result.sort(key=lambda x: (x["fecha"], x["hora"]))
    
    return result

@app.put("/api/empleados/{empleado_id}")
def update_empleado(
    empleado_id: uuid.UUID,
    data: schemas.EmpleadoUpdate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    """
    Permite editar un empleado (ROOT, ADMIN o RRHH).
    """
    if current_user.rol not in ["ROOT", "ADMIN", "RRHH"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar empleados")
        
    empleado = db.query(models.Empleado).filter(models.Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    update_dict = data.model_dump(exclude_unset=True)
    
    # Si se intenta cambiar el id_reloj, verificar que no esté duplicado
    if "id_reloj" in update_dict:
        exists = db.query(models.Empleado).filter(
            models.Empleado.tenant_id == empleado.tenant_id,
            models.Empleado.id_reloj == update_dict["id_reloj"],
            models.Empleado.id != empleado_id
        ).first()
        if exists:
            raise HTTPException(status_code=400, detail=f"Ya existe otro empleado con el ID de reloj {update_dict['id_reloj']}")

    for key, value in update_dict.items():
        if key in ["nombre_completo", "puesto"] and value:
            value = normalize_string(value)
        setattr(empleado, key, value)

    db.commit()
    
    # Encolar comando de actualización para el reloj si el nombre cambió
    if "nombre_completo" in update_dict:
        cmd = models.Comando(
            dispositivo_sn="TODOS",
            comando=f"DATA UPDATE USERINFO PIN={empleado.id_reloj}\tName={empleado.nombre_completo}\tPri=0"
        )
        db.add(cmd)
        db.commit()

    return {"message": "Empleado actualizado"}

@app.put("/api/registros/{registro_id}")
def update_registro(
    registro_id: uuid.UUID,
    data: schemas.RegistroUpdate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    """
    Permite editar una checada pasiva (SOLO ROOT).
    """
    if current_user.rol != "ROOT":
        raise HTTPException(status_code=403, detail="SOLO ROOT puede editar registros de asistencia")
        
    registro = db.query(models.Registro).filter(models.Registro.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(registro, key, value)

    db.commit()
    return {"message": "Registro actualizado exitosamente"}

@app.delete("/api/registros/{registro_id}")
def delete_registro(
    registro_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    """
    Permite eliminar una checada (SOLO ROOT).
    """
    if current_user.rol != "ROOT":
        raise HTTPException(status_code=403, detail="SOLO ROOT puede eliminar registros de asistencia")
        
    registro = db.query(models.Registro).filter(models.Registro.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    db.delete(registro)
    db.commit()
    return {"message": "Registro eliminado exitosamente"}

@app.delete("/api/empleados/{empleado_id}")
def delete_empleado(
    empleado_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    """
    Permite eliminar físicamente un empleado (SOLO ROOT).
    """
    if current_user.rol != "ROOT":
        raise HTTPException(status_code=403, detail="SOLO ROOT puede eliminar empleados")
        
    empleado = db.query(models.Empleado).filter(models.Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # Al eliminar al empleado, sus registros quedarán huérfanos o darán error si hay FK restrict
    # En este sistema eliminaremos también sus registros para limpiar "partidas dobles"
    db.query(models.Registro).filter(models.Registro.empleado_id == empleado_id).delete()
    
    db.delete(empleado)
    db.commit()
    return {"message": "Empleado y sus registros eliminados"}

@app.put("/api/usuarios/{usuario_id}")
def update_usuario(
    usuario_id: uuid.UUID,
    data: schemas.UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(auth.get_current_user)
):
    """
    Permite actualizar permisos y roles de usuarios (ROOT o ADMIN).
    """
    if current_user.rol not in ["ROOT", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
        
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        # Solo ROOT o el propio usuario pueden cambiar la contraseña
        if current_user.rol != "ROOT" and str(current_user.id) != str(usuario_id):
             raise HTTPException(status_code=403, detail="Solo ROOT puede resetear claves ajenas")
        usuario.hashed_password = auth.get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(usuario, key, value)

    db.commit()
    return {"message": "Usuario actualizado"}
