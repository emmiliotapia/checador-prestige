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

## 📡 Configuración del Hardware ZKTeco (ADMS)
Para enlazar un reloj checador al sistema en producción, configura los siguientes parámetros en el menú del dispositivo bajo **Configuración ADMS (o Cloud Server)**:
- **Server Address**: `164.92.110.179` (IP del VPS)
- **Server Port**: `80` (Nginx Proxy Manager redirige internamente al puerto 8100)
- **Enable Domain Name**: OFF (a menos que se asigne un dominio válido apuntando al VPS)

*Nota: Asegúrate de habilitar el DHCP en la configuración de Red del checador para que tenga salida a internet.*

## 🐛 Troubleshooting (Servidor Trampa)
Si el checador no sincroniza las checadas a pesar de mostrar el ícono de conexión ("mundito"), puedes interceptar sus peticiones localmente:
1. Cambia el `Server Address` del checador a la IP de tu computadora local.
2. Ejecuta el servidor trampa local: `python scratch/mock_server.py`
3. Observa en la consola los "saludos" HTTP y los payloads brutos enviados por el dispositivo para diagnosticar problemas de formato.
