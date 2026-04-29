import unicodedata
from sqlalchemy.orm import Session
from app import models, database

def normalize_string(s: str) -> str:
    if not s:
        return s
    normalized = unicodedata.normalize('NFD', s)
    result = ""
    for char in normalized:
        if unicodedata.category(char) != 'Mn' or char == '\u0303':
            result += char
    return unicodedata.normalize('NFC', result)

def clean_data():
    db = database.SessionLocal()
    try:
        print("Limpiando áreas...")
        areas = db.query(models.Area).all()
        for area in areas:
            normalized = normalize_string(area.nombre_area)
            if normalized != area.nombre_area:
                print(f"  Actualizando área: {area.nombre_area} -> {normalized}")
                area.nombre_area = normalized
        
        print("Limpiando empleados...")
        empleados = db.query(models.Empleado).all()
        for emp in empleados:
            nombre_norm = normalize_string(emp.nombre_completo)
            puesto_norm = normalize_string(emp.puesto) if emp.puesto else None
            
            changed = False
            if nombre_norm != emp.nombre_completo:
                print(f"  Actualizando empleado: {emp.nombre_completo} -> {nombre_norm}")
                emp.nombre_completo = nombre_norm
                changed = True
            
            if puesto_norm != emp.puesto:
                emp.puesto = puesto_norm
                changed = True
                
        db.commit()
        print("Limpieza finalizada.")
    except Exception as e:
        print(f"Error durante la limpieza: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clean_data()
