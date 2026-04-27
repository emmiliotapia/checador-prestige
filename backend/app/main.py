from fastapi import FastAPI, Request, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from typing import List, Optional

from . import models, database, schemas

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SmartOps Time Attendance API")

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
    # Get SN from query params
    params = request.query_params
    sn = params.get("SN")
    
    # Get raw text body
    body = await request.body()
    body_text = body.decode("utf-8")
    
    # Parse ZKTeco payload (Text Plain)
    # Typical format: 1234\t2023-10-01 08:00:00\t0\t0\t0\t0
    lines = body_text.strip().split("\n")
    
    for line in lines:
        parts = line.strip().split("\t")
        if len(parts) >= 2:
            id_reloj = parts[0]
            timestamp_str = parts[1]
            tipo_registro = parts[2] if len(parts) > 2 else "0"
            
            try:
                timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
                
                # Find employee by id_reloj
                # Note: In a real multi-tenant scenario, we might need SN to identify the tenant
                # For this MVP, we'll assume id_reloj is unique across the system or filter by SN if SN is linked to tenant
                # Let's find the employee and their tenant
                empleado = db.query(models.Empleado).filter(models.Empleado.id_reloj == id_reloj).first()
                
                if empleado:
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
    
    # ZKTeco expects "OK" in plain text to acknowledge receipt
    return PlainTextResponse("OK")

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

@app.get("/api/reportes/exportar")
def export_report(
    tenant_id: uuid.UUID, 
    fecha_inicio: datetime, 
    fecha_fin: datetime, 
    db: Session = Depends(get_db)
):
    registros = db.query(models.Registro).join(models.Empleado).filter(
        models.Registro.tenant_id == tenant_id,
        models.Registro.timestamp_checada >= fecha_inicio,
        models.Registro.timestamp_checada <= fecha_fin
    ).all()
    
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

@app.get("/api/registros/recientes", response_model=List[schemas.RegistroDetailOut])
def list_recent_registros(
    tenant_id: uuid.UUID, 
    limit: int = 10, 
    db: Session = Depends(get_db)
):
    registros = db.query(models.Registro).filter(
        models.Registro.tenant_id == tenant_id
    ).order_by(models.Registro.timestamp_checada.desc()).limit(limit).all()
    
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
