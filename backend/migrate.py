from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:attendance_secret@attendance-db:5432/smartops_attendance")

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Iniciando migración manual...")
        
        # Agregar columnas a areas si no existen
        try:
            conn.execute(text("ALTER TABLE areas ADD COLUMN IF NOT EXISTS correo_responsable VARCHAR"))
            conn.execute(text("ALTER TABLE areas ADD COLUMN IF NOT EXISTS encargado_id UUID REFERENCES empleados(id)"))
            print("Columnas añadidas a 'areas'.")
        except Exception as e:
            print(f"Error migrando 'areas': {e}")

        # Agregar columnas a empleados
        try:
            conn.execute(text("ALTER TABLE empleados ADD COLUMN IF NOT EXISTS horario_id UUID REFERENCES horarios(id)"))
            print("Columna 'horario_id' añadida a 'empleados'.")
        except Exception as e:
            print(f"Error migrando 'empleados': {e}")
        
        print("Migración finalizada.")
        conn.commit()

if __name__ == "__main__":
    migrate()
