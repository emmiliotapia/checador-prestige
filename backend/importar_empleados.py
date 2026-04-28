import pandas as pd
import uuid
import sys
from app.database import SessionLocal, engine
from app import models
from sqlalchemy import text

# Configure database
models.Base.metadata.create_all(bind=engine)

def importar_datos():
    db = SessionLocal()
    try:
        # Check if Empleado table has 'puesto' column. If not, alter it manually (PostgreSQL)
        try:
            db.execute(text("ALTER TABLE empleados ADD COLUMN puesto VARCHAR;"))
            db.commit()
            print("Columna 'puesto' añadida a la tabla empleados.")
        except Exception as e:
            db.rollback()
            # If it already exists, it will throw an error, which we can safely ignore
            pass

        # Limpiar datos corruptos (ids con decimales)
        try:
            db.execute(text("UPDATE empleados SET id_reloj = split_part(id_reloj, '.', 1) WHERE id_reloj LIKE '%.0';"))
            db.commit()
            print("Se limpiaron los decimales de la base de datos.")
        except Exception as e:
            db.rollback()
            print(f"Error limpiando decimales: {e}")

        # Load Excel
        try:
            df = pd.read_excel('/app/bd_empleados.xlsx') # the file will be mapped here
        except Exception as e:
            print(f"Error al leer excel: {e}")
            return
            
        # Get or create tenant (Using the ROOT user's tenant)
        root_user = db.query(models.Usuario).filter(models.Usuario.email == "root").first()
        if not root_user:
            print("No se encontró usuario ROOT. Por favor corre seed.py primero.")
            return
            
        tenant_id = root_user.tenant_id
        
        areas_creadas = 0
        empleados_creados = 0
        empleados_actualizados = 0

        # Iterate rows
        # Assumed columns: id, nombre, area, puesto
        for index, row in df.iterrows():
            raw_id = str(row.iloc[0]).strip()
            if raw_id == 'nan': continue
            
            # Remover .0 si se leyó como float (ej. 1001.0 -> 1001)
            id_reloj = raw_id.split('.')[0]
                
            nombre = str(row.iloc[1]).strip()
            nombre_area = str(row.iloc[2]).strip()
            puesto = str(row.iloc[3]).strip() if len(row) > 3 else None
            
            # Find or create area
            area = db.query(models.Area).filter(models.Area.nombre_area == nombre_area, models.Area.tenant_id == tenant_id).first()
            if not area:
                area = models.Area(tenant_id=tenant_id, nombre_area=nombre_area, correo_responsable="")
                db.add(area)
                db.flush()
                areas_creadas += 1
                
            # Find or create employee
            empleado = db.query(models.Empleado).filter(models.Empleado.id_reloj == id_reloj, models.Empleado.tenant_id == tenant_id).first()
            if not empleado:
                empleado = models.Empleado(
                    tenant_id=tenant_id,
                    area_id=area.id,
                    id_reloj=id_reloj,
                    nombre_completo=nombre,
                    puesto=puesto
                )
                db.add(empleado)
                empleados_creados += 1
            else:
                empleado.nombre_completo = nombre
                empleado.area_id = area.id
                empleado.puesto = puesto
                empleados_actualizados += 1
                
        db.commit()
        print(f"Éxito! Se crearon {areas_creadas} áreas.")
        print(f"Se crearon {empleados_creados} nuevos empleados.")
        print(f"Se actualizaron {empleados_actualizados} empleados existentes.")
        
    finally:
        db.close()

if __name__ == "__main__":
    importar_datos()
