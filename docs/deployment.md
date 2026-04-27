# SmartOps Deployment: Manual de Operaciones

## Infraestructura VPS
- **Host**: `smartops` (Ubuntu 24.04 LTS).
- **Ruta del Proyecto**: `smartops-clients/casino-prestige/checador/`.
- **Motor de Contenedores**: Docker Engine con Docker Compose.

## Orquestación (Docker Compose)
El sistema se despliega como un stack de tres servicios interconectados:

| Servicio | Puerto Externo | Puerto Interno | Propósito |
| :--- | :--- | :--- | :--- |
| **Attendance Frontend** | `3100` | `80` | Interfaz web React (Nginx) |
| **Attendance Backend** | `8100` | `8100` | API FastAPI y Webhook ADMS |
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

## Aislamiento de Datos
La base de datos utiliza un volumen persistente llamado `checador_postgres_attendance_data` para garantizar que los registros no se pierdan al reiniciar o actualizar los contenedores.
