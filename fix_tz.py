from app.database import SessionLocal
from app.models import Registro
from datetime import datetime, timedelta

def fix():
    db = SessionLocal()
    print("Conectado a la BD.")

    target_date = datetime(2026, 6, 17, 12, 0, 0)
    # Seleccionar registros afectados
    registros = db.query(Registro).filter(Registro.timestamp_checada > target_date).all()
    count = 0
    for reg in registros:
        old_time = reg.timestamp_checada
        new_time = old_time - timedelta(hours=15)
        print(f"Modificando ID {reg.id}: {old_time} -> {new_time}")
        reg.timestamp_checada = new_time
        count += 1
    
    db.commit()
    db.close()
    print(f"Listo. {count} registros actualizados restando 15 horas.")

if __name__ == "__main__":
    fix()
