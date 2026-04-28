import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, UUID
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String, nullable=False)
    activo = Column(Boolean, default=True)

    areas = relationship("Area", back_populates="tenant")
    empleados = relationship("Empleado", back_populates="tenant")
    registros = relationship("Registro", back_populates="tenant")

class Area(Base):
    __tablename__ = "areas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    nombre_area = Column(String, nullable=False)
    correo_responsable = Column(String)

    tenant = relationship("Tenant", back_populates="areas")
    empleados = relationship("Empleado", back_populates="area")
    usuarios = relationship("Usuario", back_populates="area")

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    rol = Column(String, nullable=False) # 'ADMIN' or 'MANAGER'
    area_id = Column(UUID(as_uuid=True), ForeignKey("areas.id"), nullable=True) # Only if role is MANAGER

    tenant = relationship("Tenant")
    area = relationship("Area", back_populates="usuarios")

class Empleado(Base):
    __tablename__ = "empleados"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    area_id = Column(UUID(as_uuid=True), ForeignKey("areas.id"), nullable=False)
    id_reloj = Column(String, nullable=False)  # ID in the physical device
    nombre_completo = Column(String, nullable=False)

    tenant = relationship("Tenant", back_populates="empleados")
    area = relationship("Area", back_populates="empleados")
    registros = relationship("Registro", back_populates="empleado")

class Registro(Base):
    __tablename__ = "registros"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    empleado_id = Column(UUID(as_uuid=True), ForeignKey("empleados.id"), nullable=False)
    timestamp_checada = Column(DateTime, nullable=False)
    tipo_registro = Column(String) # e.g., '0' for Check-In, '1' for Check-Out
    dispositivo_sn = Column(String)

    tenant = relationship("Tenant", back_populates="registros")
    empleado = relationship("Empleado", back_populates="registros")
