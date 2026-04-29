import os
import threading
import time
import requests
from fastapi import FastAPI, Request, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

# --- CONFIGURACIÓN DEL PUENTE LOCAL (BRIDGE) ---
# Este script actúa como un proxy inteligente entre el reloj físico (ZKTeco) y el VPS.
# Permite capturar checadas instantáneamente aunque no haya internet, guardándolas
# en una base de datos SQLite local para su posterior sincronización.

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
    query_string = Column(String)
    body = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class CommandCache(Base):
    __tablename__ = "commands"
    id = Column(String, primary_key=True) # ID del comando del VPS
    dispositivo_sn = Column(String)
    comando = Column(String)
    ejecutado = Column(Integer, default=0) # 0: Pendiente, 1: Ejecutado, 2: Sincronizado al VPS

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
async def get_request(sn: str, db = Depends(lambda: SessionLocal())):
    """El reloj pide comandos. Servimos lo que tengamos en el cache local."""
    comandos = db.query(CommandCache).filter(
        CommandCache.dispositivo_sn == sn,
        CommandCache.ejecutado == 0
    ).all()
    
    if not comandos:
        return PlainTextResponse("OK\n")
    
    response = ""
    for cmd in comandos:
        response += f"C:{cmd.id}:{cmd.comando}\n"
    
    return PlainTextResponse(response)

@app.post("/iclock/devicecmd")
async def device_cmd(request: Request, db = Depends(lambda: SessionLocal())):
    """Confirmación del reloj. Marcamos como ejecutado para que el worker lo avise al VPS."""
    body = await request.body()
    body_text = body.decode("utf-8")
    lines = body_text.strip().split("\n")
    for line in lines:
        if "ID=" in line:
            parts = line.split("&")
            cmd_id = parts[0].split("=")[1]
            ret_code = parts[1].split("=")[1]
            
            if ret_code == "0":
                comando = db.query(CommandCache).filter(CommandCache.id == cmd_id).first()
                if comando:
                    comando.ejecutado = 1
    db.commit()
    return PlainTextResponse("OK\n")

# Hilo asíncrono para enviar datos al VPS y traer comandos
def sync_worker():
    while True:
        try:
            db = SessionLocal()
            
            # 1. ENVIAR CHECADAS AL VPS
            payloads = db.query(PayloadCache).order_by(PayloadCache.created_at.asc()).all()
            for p in payloads:
                url = f"{VPS_URL}{p.endpoint}?{p.query_string}"
                try:
                    res = requests.post(url, data=p.body.encode('utf-8'), headers={'Content-Type': 'text/plain'}, timeout=10)
                    if res.status_code == 200:
                        db.delete(p)
                        db.commit()
                except: break

            # 2. TRAER COMANDOS DEL VPS (Sync de "TODOS" los dispositivos)
            # Nota: El bridge debe saber qué SNs tiene conectados. Por ahora simplificamos.
            try:
                # Aquí asumimos un endpoint o simplemente pedimos comandos para SNs comunes
                # En un entorno real, el bridge podría reportar qué SNs ve localmente.
                pass
            except: pass

            # 3. REPORTAR COMANDOS EJECUTADOS AL VPS
            ejecutados = db.query(CommandCache).filter(CommandCache.ejecutado == 1).all()
            for cmd in ejecutados:
                try:
                    # Avisamos al VPS que el comando ya se hizo
                    res = requests.post(f"{VPS_URL}/iclock/devicecmd", data=f"ID={cmd.id}&Return=0", timeout=10)
                    if res.status_code == 200:
                        cmd.ejecutado = 2 # Sincronizado
                        db.commit()
                except: break
                
            db.close()
        except Exception as e:
            print(f"Error en sync: {e}")
            
        time.sleep(10)

@app.on_event("startup")
def startup_event():
    thread = threading.Thread(target=sync_worker, daemon=True)
    thread.start()
    print("🟢 Bridge Local en modo Proxy/Caché Activo 🟢")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
