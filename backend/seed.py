import uuid
from sqlalchemy.orm import Session
from app import models, database, auth

def seed_db():
    db = database.SessionLocal()
    try:
        # Create a test tenant
        tenant_id = uuid.UUID('00000000-0000-0000-0000-000000000001')
        tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
        if not tenant:
            tenant = models.Tenant(id=tenant_id, nombre="Casino Prestige", activo=True)
            db.add(tenant)
            db.commit()
            print(f"Created tenant: {tenant.nombre}")

        # Create a default schedule
        horario = db.query(models.Horario).filter(models.Horario.tenant_id == tenant_id).first()
        if not horario:
            horario = models.Horario(
                tenant_id=tenant_id,
                nombre="Turno General",
                hora_entrada="08:00",
                hora_salida="17:00",
                tolerancia_entrada=15,
                inicio_comida="13:00",
                fin_comida="14:00"
            )
            db.add(horario)
            db.commit()
            print("Created default schedule")

        # Create a test area
        area = db.query(models.Area).filter(models.Area.tenant_id == tenant_id).first()
        if not area:
            area = models.Area(
                tenant_id=tenant_id,
                nombre_area="Sistemas",
                correo_responsable="sistemas@casinoprestige.com"
            )
            db.add(area)
            db.commit()
            print(f"Created area: {area.nombre_area}")

        # Create ROOT User
        root_user = db.query(models.Usuario).filter(models.Usuario.email == "root").first()
        if not root_user:
            root_user = models.Usuario(
                tenant_id=tenant_id,
                email="root",
                hashed_password=auth.get_password_hash("F4nny8888!"),
                rol="ROOT"
            )
            db.add(root_user)
        else:
            root_user.hashed_password = auth.get_password_hash("F4nny8888!")
            
        # Create Admin User
        admin_user = db.query(models.Usuario).filter(models.Usuario.email == "admin").first()
        if not admin_user:
            admin_user = models.Usuario(
                tenant_id=tenant_id,
                email="admin",
                hashed_password=auth.get_password_hash("Prestige2026!"),
                rol="ADMIN"
            )
            db.add(admin_user)
        else:
            admin_user.hashed_password = auth.get_password_hash("Prestige2026!")

        # Create RRHH User
        rrhh_user = db.query(models.Usuario).filter(models.Usuario.email == "rrhh").first()
        if not rrhh_user:
            rrhh_user = models.Usuario(
                tenant_id=tenant_id,
                email="rrhh",
                hashed_password=auth.get_password_hash("Prestige2026!"),
                rol="RRHH"
            )
            db.add(rrhh_user)
        else:
            rrhh_user.hashed_password = auth.get_password_hash("Prestige2026!")

        db.commit()
        print("Users seeded/updated successfully")

    finally:
        db.close()

if __name__ == "__main__":
    # Create tables first
    models.Base.metadata.create_all(bind=database.engine)
    seed_db()
