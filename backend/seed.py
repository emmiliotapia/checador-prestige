import uuid
from sqlalchemy.orm import Session
from app import models, database

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

        # Create a test employee
        employee = db.query(models.Empleado).filter(models.Empleado.id_reloj == "1001").first()
        if not employee:
            employee = models.Empleado(
                tenant_id=tenant_id,
                area_id=area.id,
                id_reloj="1001",
                nombre_completo="Emilio Master"
            )
            db.add(employee)
            db.commit()
            print(f"Created employee: {employee.nombre_completo}")

        # Create the user's specific employee
        user_employee = db.query(models.Empleado).filter(models.Empleado.id_reloj == "1451").first()
        if not user_employee:
            user_employee = models.Empleado(
                tenant_id=tenant_id,
                area_id=area.id,
                id_reloj="1451",
                nombre_completo="Emilio (User)"
            )
            db.add(user_employee)
            db.commit()
            print(f"Created user employee: {user_employee.nombre_completo}")

    finally:
        db.close()

if __name__ == "__main__":
    # Create tables first
    models.Base.metadata.create_all(bind=database.engine)
    seed_db()
