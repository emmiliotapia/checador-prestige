# SmartOps Architecture: El Plano del Edificio

## Tech Stack
- **Backend**: FastAPI (Python 3.11), SQLAlchemy (ORM).
- **Frontend**: React 19, Vite, Tailwind CSS 3.
- **Base de Datos**: PostgreSQL 15.
- **Contenerización**: Docker & Docker Compose.

## Arquitectura Multi-tenant
El sistema utiliza una arquitectura de aislamiento de datos a nivel de fila (*Row-Level Isolation* simulada por consultas). Cada tabla core contiene una columna `tenant_id` (UUID) que debe ser filtrada en todas las peticiones del API.

### Esquema de Base de Datos

#### 1. Tenants
- `id` (UUID, PK): Identificador único del cliente SaaS.
- `nombre` (String): Nombre comercial del cliente.
- `activo` (Boolean): Estado de la licencia.

#### 2. Areas
- `id` (UUID, PK)
- `tenant_id` (FK -> Tenants.id)
- `nombre_area` (String)
- `correo_responsable` (String)

#### 3. Empleados
- `id` (UUID, PK)
- `tenant_id` (FK -> Tenants.id)
- `area_id` (FK -> Areas.id)
- `id_reloj` (String): ID único configurado en el dispositivo físico ZKTeco.
- `nombre_completo` (String)

#### 4. Registros
- `id` (UUID, PK)
- `tenant_id` (FK -> Tenants.id)
- `empleado_id` (FK -> Empleados.id)
- `timestamp_checada` (DateTime): Fecha y hora exacta de la marcación.
- `tipo_registro` (String): '0' para Entrada, '1' para Salida (según protocolo ZKTeco).
- `dispositivo_sn` (String): Número de serie del dispositivo que envió el dato.

## Restricciones de Desarrollo
- No se deben proponer cambios de stack sin aprobación previa.
- Todas las tablas deben usar UUIDs para llaves primarias.
- El filtrado por `tenant_id` es obligatorio en todas las capas del backend.
