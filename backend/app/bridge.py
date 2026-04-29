from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
import uuid

from . import models, database, schemas

# Router para la integración con el Puente Local (Bridge)
router = APIRouter(prefix="/api/v1/bridge", tags=["bridge"])

# Esquema para registros individuales enviados desde el bridge
class BridgeRecord(BaseModel):
    user_id: str # ID del reloj (id_reloj)
    timestamp: datetime

# Esquema para el payload de sincronización masiva
class BridgeSyncRequest(BaseModel):
    sn: str # Serial Number del dispositivo físico
    records: List[BridgeRecord]

@router.post("/sync")
async def bridge_sync(payload: BridgeSyncRequest, db: Session = Depends(database.get_db)):
    """
    Endpoint para que el script bridge local suba datos cacheados.
    Permite resiliencia ante caídas de internet en el casino.
    """
    count = 0
    for record in payload.records:
        # Buscamos al empleado por su ID de reloj físico
        empleado = db.query(models.Empleado).filter(
            models.Empleado.id_reloj == record.user_id
        ).first()
        
        if empleado:
            # Evitamos duplicados verificando si ya existe la checada en ese segundo exacto
            exists = db.query(models.Registro).filter(
                models.Registro.empleado_id == empleado.id,
                models.Registro.timestamp_checada == record.timestamp
            ).first()
            
            if not exists:
                nuevo_registro = models.Registro(
                    tenant_id=empleado.tenant_id,
                    empleado_id=empleado.id,
                    timestamp_checada=record.timestamp,
                    tipo_registro="0", # Por defecto entrada, el bridge puede mejorarse para enviar el tipo
                    dispositivo_sn=payload.sn
                )
                db.add(nuevo_registro)
                count += 1
        else:
            print(f"Bridge Sync: Empleado con id_reloj {record.user_id} no encontrado.")

    db.commit()
    return {"status": "success", "processed": count}
