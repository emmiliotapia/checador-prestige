from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from typing import Optional, List

class AreaBase(BaseModel):
    nombre_area: str
    correo_responsable: Optional[str] = None
    tenant_id: uuid.UUID

class AreaCreate(AreaBase):
    pass

class AreaOut(AreaBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class EmpleadoBase(BaseModel):
    nombre_completo: str
    id_reloj: str
    area_id: uuid.UUID
    tenant_id: uuid.UUID

class EmpleadoCreate(EmpleadoBase):
    pass

class EmpleadoOut(EmpleadoBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class RegistroOut(BaseModel):
    id: uuid.UUID
    timestamp_checada: datetime
    tipo_registro: str
    dispositivo_sn: Optional[str]
    empleado_id: uuid.UUID
    tenant_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class RegistroDetailOut(BaseModel):
    id: uuid.UUID
    timestamp_checada: datetime
    tipo_registro: str
    dispositivo_sn: Optional[str]
    nombre_empleado: str
    id_reloj: str
    model_config = ConfigDict(from_attributes=True)
