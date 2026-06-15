from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from typing import Optional, List

class AreaBase(BaseModel):
    nombre_area: str
    correo_responsable: Optional[str] = None
    encargado_id: Optional[uuid.UUID] = None
    tenant_id: uuid.UUID

class AreaCreate(AreaBase):
    pass

class AreaUpdate(BaseModel):
    nombre_area: Optional[str] = None
    correo_responsable: Optional[str] = None
    encargado_id: Optional[uuid.UUID] = None

class AreaOut(AreaBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class HorarioBase(BaseModel):
    nombre: str
    hora_entrada: str
    hora_salida: str
    tolerancia_entrada: int = 15
    inicio_comida: Optional[str] = None
    fin_comida: Optional[str] = None
    tenant_id: uuid.UUID

class HorarioCreate(HorarioBase):
    pass

class HorarioOut(HorarioBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class EmpleadoBase(BaseModel):
    nombre_completo: str
    id_reloj: str
    puesto: Optional[str] = None
    area_id: uuid.UUID
    horario_id: Optional[uuid.UUID] = None
    tenant_id: uuid.UUID

class EmpleadoCreate(EmpleadoBase):
    pass

class EmpleadoUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    area_id: Optional[uuid.UUID] = None
    horario_id: Optional[uuid.UUID] = None
    puesto: Optional[str] = None
    activo: Optional[bool] = None

class EmpleadoOut(EmpleadoBase):
    id: uuid.UUID
    activo: bool
    model_config = ConfigDict(from_attributes=True)

class RegistroOut(BaseModel):
    id: uuid.UUID
    timestamp_checada: datetime
    tipo_registro: str
    dispositivo_sn: Optional[str]
    empleado_id: uuid.UUID
    tenant_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class RegistroUpdate(BaseModel):
    timestamp_checada: Optional[datetime] = None
    tipo_registro: Optional[str] = None

class RegistroDetailOut(BaseModel):
    id: uuid.UUID
    timestamp_checada: datetime
    tipo_registro: str
    dispositivo_sn: Optional[str]
    nombre_empleado: str
    id_reloj: str
    model_config = ConfigDict(from_attributes=True)

class UsuarioBase(BaseModel):
    email: str
    rol: str
    tenant_id: uuid.UUID
    area_id: Optional[uuid.UUID] = None

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioOut(UsuarioBase):
    id: uuid.UUID
    permisos: Optional[str] = None # JSON string
    model_config = ConfigDict(from_attributes=True)

class UsuarioUpdate(BaseModel):
    rol: Optional[str] = None
    area_id: Optional[uuid.UUID] = None
    permisos: Optional[str] = None # JSON string
    password: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    usuario: UsuarioOut

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class ComandoOut(BaseModel):
    id: int
    dispositivo_sn: str
    comando: str
    ejecutado: bool
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)
