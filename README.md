# SmartOps Time Attendance (Checador)

Sistema de gestión de asistencia multi-tenant diseñado para integrarse con dispositivos biométricos ZKTeco mediante el protocolo ADMS.

## 🚀 Inicio Rápido

### Requisitos
- Docker & Docker Compose
- Python 3.11+ (para scripts de prueba)

### Despliegue Local
1. Clonar el repositorio.
2. Iniciar contenedores:
   ```bash
   docker-compose up -d --build
   ```
3. Inicializar base de datos:
   ```bash
   docker-compose exec attendance-backend python seed.py
   ```

### Despliegue en Producción (VPS)
Utilizar el script de PowerShell proporcionado:
```powershell
./deploy.ps1
```

## 🛠️ Estructura del Proyecto
- `/backend`: API construida con FastAPI y SQLAlchemy (PostgreSQL).
- `/frontend`: Interfaz administrativa construida con React 19 y Tailwind CSS.
- `/docs`: Documentación técnica detallada (arquitectura, protocolo, memoria).
- `/scratch`: Scripts de utilidad y pruebas.

## 📊 Monitoreo y Pruebas
El sistema incluye un dashboard en vivo que se actualiza cada 10 segundos. Para simular una checada sin hardware, usa:
```bash
python scratch/test_zkteco_push.py
```

## 📄 Documentación Relacionada
- [Protocolo ZKTeco ADMS](docs/api_zkteco_protocol.md)
- [Arquitectura del Sistema](docs/architecture.md)
- [Manual de Despliegue](docs/deployment.md)
