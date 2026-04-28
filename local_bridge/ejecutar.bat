@echo off
title SmartOps Local Bridge (Bypass Offline-First)
echo =======================================================
echo Iniciando SmartOps Local Bridge para ZKTeco
echo =======================================================
echo.

:: Comprobar si Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta instalado o no esta en el PATH.
    echo Por favor instala Python 3.10 o superior y marca la casilla "Add Python to PATH" durante la instalacion.
    pause
    exit /b
)

:: Crear entorno virtual si no existe
if not exist "venv" (
    echo Creando entorno virtual local...
    python -m venv venv
)

:: Activar entorno e instalar dependencias
echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo Instalando/Verificando dependencias...
pip install -r requirements.txt >nul 2>&1

:: Ejecutar el puente
echo.
echo =======================================================
echo [!] Para el ZKTeco, configura su ADMS apuntando a:
echo     IP del Servidor: (La IP local de esta computadora, ej. 192.168.1.XX)
echo     Puerto del Servidor: 8080
echo =======================================================
echo.

python bridge.py

pause
