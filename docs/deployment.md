# SmartOps Deployment: Manual de Operaciones

## Infraestructura VPS
- **Host**: `smartops` (Ubuntu 24.04 LTS).
- **Ruta del Proyecto**: `smartops-clients/casino-prestige/checador/`
- **Repositorio**: `https://github.com/emmiliotapia/checador-prestige`
- **Motor de Contenedores**: Docker Engine con Docker Compose.

## Orquestación (Docker Compose)
El sistema se despliega como un stack de tres servicios interconectados:

| **Attendance Backend** | `164.92.110.179` (NPM Host) | `172.17.0.1:8100` | Tráfico IP-to-IP validado |
| **Attendance Frontend** | `3100` | `80` | Interfaz web React |
| **Attendance DB** | `5436` | `5432` | PostgreSQL 15 dedicado |

## Configuración de Ruteo (Nginx Proxy Manager)
Para evitar bloqueos de firewall en la red del cliente (Casino), el tráfico se rutea así:
1. **Origen**: Dispositivo SilkBio apunta a `http://164.92.110.179:80`.
2. **NPM**: Captura la petición por IP directa.
3. **Forward**: Redirige a `172.17.0.1` (Docker Host IP) en el puerto `8100`.
4. **Resultado**: Tráfico limpio hacia FastAPI sin errores de Hairpin NAT.

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

## Verificación y Pruebas
Para asegurar que el despliegue es correcto, seguir estos pasos:

### 1. Prueba de Webhook (Simulación de Reloj)
Ejecutar el script de prueba desde una terminal con acceso a internet:
```bash
python scratch/test_zkteco_push.py
```
Si el resultado es `OK`, el backend está listo para recibir datos reales.

### 2. Monitoreo en Vivo
Acceder a `http://164.92.110.179:3100` y observar la tabla de "Actividad Reciente". La marca enviada en el paso anterior debería aparecer en menos de 10 segundos.

## Aislamiento de Datos
La base de datos utiliza un volumen persistente llamado `checador_postgres_attendance_data` para garantizar que los registros no se pierdan al reiniciar o actualizar los contenedores.
