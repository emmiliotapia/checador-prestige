# SmartOps Deployment: Manual de Operaciones

## Infraestructura VPS
- **Host**: `smartops` (Ubuntu 24.04 LTS).
- **Ruta del Proyecto**: `smartops-clients/casino-prestige/checador/`
- **Repositorio**: `https://github.com/emmiliotapia/checador-prestige`
- **Motor de Contenedores**: Docker Engine con Docker Compose.

## Orquestación (Docker Compose)
El sistema se despliega como un stack de tres servicios interconectados:

| Servicio | Puerto Externo | Puerto Interno | Propósito |
| :--- | :--- | :--- | :--- |
| **Attendance Frontend** | `3100` | `80` | Interfaz web React (Nginx) |
| **Attendance Backend** | `164.92.110.179` (vía NPM Default Site) | `8100` | API FastAPI y Webhook ADMS |
| **Attendance DB** | `5436` | `5432` | PostgreSQL 15 dedicado |

## Scripts de Operación
- **`deploy.ps1`**: Script local para subir cambios vía SCP y reconstruir los contenedores remotamente vía SSH.
- **`backend/seed.py`**: Script de inicialización de base de datos para cargar tenants y datos de prueba iniciales.

## Configuración del Firewall (UFW)
Para el correcto funcionamiento, los siguientes puertos deben estar abiertos:
```bash
sudo ufw allow 8100/tcp  # Webhook ADMS
sudo ufw allow 3100/tcp  # Interfaz Web
```

### Endpoint: `POST /iclock/cdata`
Debido a limitaciones de firmware del SilkBio TC 100 (no soporta DNS), la conexión es por IP directa:
`http://164.92.110.179/iclock/cdata` (Puerto 80).

## Aislamiento de Datos
La base de datos utiliza un volumen persistente llamado `checador_postgres_attendance_data` para garantizar que los registros no se pierdan al reiniciar o actualizar los contenedores.
