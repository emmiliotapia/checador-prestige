import os
import threading
import time
import requests
from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

# URL del VPS en producción (A donde se enviarán finalmente los datos)
VPS_URL = "https://time-prestige.smartopsia.com"

# DB Config
DB_FILE = "bridge_cache.db"
engine = create_engine(f"sqlite:///{DB_FILE}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class PayloadCache(Base):
    __tablename__ = "payloads"
    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String)  # ej. /iclock/cdata
    query_string = Column(String)  # ej. SN=...&table=ATTLOG
    body = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartOps Local Bridge")

@app.get("/iclock/cdata")
async def handshake(request: Request):
    """Respuesta inmediata al reloj para que no se trabe"""
    response_text = (
        "Registry=OK\n"
        "GET OPTION FROM: 1\n"
        "ATTLOGStamp=0\n"
        "OPERLOGStamp=0\n"
        "ATTPHOTOStamp=0\n"
        "ErrorDelay=60\n"
        "Delay=30\n"
        "TransTimes=00:00;14:00\n"
        "TransInterval=1\n"
    )
    return PlainTextResponse(response_text)

@app.post("/iclock/cdata")
async def receive_data(request: Request):
    """Guarda la checada en local para liberar el reloj inmediatamente"""
    query_string = request.url.query
    body_bytes = await request.body()
    body_text = body_bytes.decode('utf-8', errors='ignore')
    
    # Guardar localmente
    db = SessionLocal()
    try:
        new_payload = PayloadCache(
            endpoint="/iclock/cdata",
            query_string=query_string,
            body=body_text
        )
        db.add(new_payload)
        db.commit()
    finally:
        db.close()
        
    return PlainTextResponse("OK\n")

@app.get("/iclock/getrequest")
async def get_request(request: Request):
    """Mock ADMS endpoint por si el reloj lo pide"""
    return PlainTextResponse("OK\n")

@app.post("/iclock/devicecmd")
async def device_cmd(request: Request):
    """Mock ADMS endpoint por si el reloj manda respuesta a comandos"""
    return PlainTextResponse("OK\n")

# Hilo asíncrono para enviar datos al VPS
def sync_worker():
    while True:
        try:
            db = SessionLocal()
            payloads = db.query(PayloadCache).order_by(PayloadCache.created_at.asc()).all()
            
            for p in payloads:
                url = f"{VPS_URL}{p.endpoint}?{p.query_string}"
                try:
                    # Enviar al VPS (time-prestige.smartopsia.com)
                    res = requests.post(url, data=p.body.encode('utf-8'), headers={'Content-Type': 'text/plain'}, timeout=10)
                    if res.status_code == 200:
                        # Si fue exitoso, borrar del caché local
                        db.delete(p)
                        db.commit()
                        print(f"[{datetime.now()}] Payload sincronizado al VPS: {p.query_string}")
                    else:
                        print(f"[{datetime.now()}] VPS devolvió error {res.status_code}. Reintentando en breve...")
                except requests.exceptions.RequestException as e:
                    print(f"[{datetime.now()}] Error de red al contactar al VPS. Esperando conexión...")
                    break # Detener este ciclo y esperar 5s
                    
            db.close()
        except Exception as e:
            print(f"[{datetime.now()}] Error en worker de sincronización: {e}")
            
        time.sleep(5) # Ciclo de revisión cada 5 segundos

# Iniciar el worker al arrancar
@app.on_event("startup")
def startup_event():
    thread = threading.Thread(target=sync_worker, daemon=True)
    thread.start()
    print("==================================================")
    print("🟢 SmartOps Local Bridge Iniciado 🟢")
    print("-> Listo para interceptar checadas localmente.")
    print("-> El ZKTeco no se trabará más.")
    print("==================================================")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
