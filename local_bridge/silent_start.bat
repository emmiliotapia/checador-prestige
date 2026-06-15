@echo off
cd /d "%~dp0"
:: Comprobar si existe el entorno virtual, si no crearlo (una sola vez)
if not exist "venv" (
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)
:: Ejecutar el puente en segundo plano
python bridge.py
