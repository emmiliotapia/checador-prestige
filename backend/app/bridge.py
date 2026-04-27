from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
import uuid

from . import models, database, schemas

router = APIRouter(prefix="/api/v1/bridge", tags=["bridge"])

class BridgeRecord(BaseModel):
    user_id: str
    timestamp: datetime

class BridgeSyncRequest(BaseModel):
    sn: str
    records: List[BridgeRecord]

@router.post("/sync")
async def bridge_sync(payload: BridgeSyncRequest, db: Session = Depends(database.get_db)):
    """
    Endpoint for local bridge script to push data.
    Format: {"sn": "SN123", "records": [{"user_id": "1001", "timestamp": "..."}]}
    """
    count = 0
    for record in payload.records:
        # Find employee by id_reloj
        empleado = db.query(models.Empleado).filter(
            models.Empleado.id_reloj == record.user_id
        ).first()
        
        if empleado:
            # Check if this record already exists to avoid duplicates (optional but recommended)
            exists = db.query(models.Registro).filter(
                models.Registro.empleado_id == empleado.id,
                models.Registro.timestamp_checada == record.timestamp
            ).first()
            
            if not exists:
                nuevo_registro = models.Registro(
                    tenant_id=empleado.tenant_id,
                    empleado_id=empleado.id,
                    timestamp_checada=record.timestamp,
                    tipo_registro="0", # Default to Check-In, can be enhanced later
                    dispositivo_sn=payload.sn
                )
                db.add(nuevo_registro)
                count += 1
        else:
            print(f"Bridge Sync: Employee with id_reloj {record.user_id} not found.")

    db.commit()
    return {"status": "success", "processed": count}
