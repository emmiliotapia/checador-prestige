import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, UUID, Integer, Text
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

# Modelo para Multitenancy (Empresas/Casinos)
class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String, nullable=False)
    activo = Column(Boolean, default=True)
    areas = relationship("Area", back_populates="tenant")
    empleados = relationship("Empleado", back_populates="tenant")
    registros = relationship("Registro", back_populates="tenant")

# Modelo para Áreas/Departamentos
class Area(Base):
    __tablename__ = "areas"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    nombre_area = Column(String, nullable=False)
    correo_responsable = Column(String) # Email para notificaciones de reportes
    encargado_id = Column(UUID(as_uuid=True), ForeignKey("empleados.id"), nullable=True) # Jefe de área

    tenant = relationship("Tenant", back_populates="areas")
    empleados = relationship("Empleado", back_populates="area", foreign_keys="[Empleado.area_id]")
    usuarios = relationship("Usuario", back_populates="area")
    encargado = relationship("Empleado", foreign_keys=[encargado_id])

# Modelo para Usuarios del Panel Web
class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    rol = Column(String, nullable=False) # 'ROOT', 'ADMIN', 'RRHH', 'MANAGER'
    area_id = Column(UUID(as_uuid=True), ForeignKey("areas.id"), nullable=True) # Para rol MANAGER
    permisos = Column(Text, nullable=True) # JSON string con los módulos permitidos: ["empleados", "reportes", ...]

    tenant = relationship("Tenant")
    area = relationship("Area", back_populates="usuarios")

# Modelo para Horarios y Turnos
class Horario(Base):
    __tablename__ = "horarios"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    nombre = Column(String, nullable=False) # ej. "Matutino"
    hora_entrada = Column(String, nullable=False) # "08:00"
    hora_salida = Column(String, nullable=False) # "17:00"
    tolerancia_entrada = Column(Integer, default=15) # minutos de tolerancia
    inicio_comida = Column(String, nullable=True) # "13:00"
    fin_comida = Column(String, nullable=True) # "14:00"

# Modelo para Empleados (Personal que checa)
class Empleado(Base):
    __tablename__ = "empleados"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    area_id = Column(UUID(as_uuid=True), ForeignKey("areas.id"), nullable=False)
    horario_id = Column(UUID(as_uuid=True), ForeignKey("horarios.id"), nullable=True)
    id_reloj = Column(String, nullable=False) # ID físico en el dispositivo ZKTeco
    nombre_completo = Column(String, nullable=False)
    puesto = Column(String, nullable=True)
    activo = Column(Boolean, default=True) # Si es False, el sistema ignora sus checadas (Baja lógica)

    tenant = relationship("Tenant", back_populates="empleados")
    area = relationship("Area", back_populates="empleados", foreign_keys=[area_id])
    horario = relationship("Horario")
    registros = relationship("Registro", back_populates="empleado")

# Modelo para Checadas (Asistencias)
class Registro(Base):
    __tablename__ = "registros"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    empleado_id = Column(UUID(as_uuid=True), ForeignKey("empleados.id"), nullable=False)
    timestamp_checada = Column(DateTime, nullable=False)
    tipo_registro = Column(String) # '0': Entrada, '1': Salida, '2': Inicio Comida, '3': Fin Comida
    dispositivo_sn = Column(String) # Serial Number del reloj que capturó la checada

    tenant = relationship("Tenant", back_populates="registros")
    empleado = relationship("Empleado", back_populates="registros")

# Modelo para Comandos ADMS (Sincronización Web -> Reloj)
class Comando(Base):
    __tablename__ = "comandos"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dispositivo_sn = Column(String, nullable=False, index=True)
    comando = Column(String, nullable=False) # ej. "DATA USER PIN=101\tName=Juan"
    ejecutado = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
