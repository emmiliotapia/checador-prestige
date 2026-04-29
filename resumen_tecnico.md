# 🧠 Contexto Técnico para Agentes IA - Checador Prestige

Este documento sirve como base de conocimiento técnica para cualquier agente de IA que trabaje en el proyecto **Checador Prestige**. Contiene la arquitectura, reglas críticas y estado actual del sistema.

## 🏗️ 1. Arquitectura del Sistema
El sistema es una plataforma de gestión de asistencia biométrica basada en el protocolo **ADMS (ZKTeco)**.

- **Backend**: FastAPI (Python 3.11). Corre en el puerto `8100`.
- **Frontend**: React + Vite + Tailwind CSS. Diseño "Gold & Obsidian". Corre en el puerto `3100`.
- **Base de Datos**: PostgreSQL 15 para producción. SQLite para el caché del bridge local.
- **Protocolo de Comunicación**: Webhook ADMS (HTTP/Plain Text).
- **Infraestructura**: VPS Ubuntu, Docker Compose, Nginx Proxy Manager (NPM).

## 📂 2. Estructura del Repositorio
- `/backend`: Lógica central, modelos SQLAlchemy, esquemas Pydantic y endpoints API/ADMS.
- `/frontend`: Dashboard administrativo, gestión de empleados, reportes y configuración.
- `/local_bridge`: Script `bridge.py` que actúa como proxy local entre el reloj físico y el VPS. Proporciona resiliencia ante fallos de internet.
- `/docs`: Documentación del protocolo ZKTeco y guías de infraestructura.

## 🛠️ 3. Módulos y Funcionalidades Core
### A. Protocolo ADMS (`backend/app/main.py`)
- `/iclock/cdata`: Recibe checadas en formato de texto plano desde los relojes.
- `/iclock/getrequest`: Los relojes consultan comandos pendientes (ej. `SET USERDATA`).
- `/iclock/devicecmd`: Los relojes confirman la ejecución de comandos.

### B. Gestión de Horarios e Incidencias
- CRUD completo de turnos con campos: `entrada`, `salida`, `tolerancia` e `inicio/fin_comida`.
- Los horarios se asignan a empleados para el cálculo de retardos (en desarrollo).

### C. Resiliencia (Local Bridge)
- El script en `/local_bridge` captura las peticiones del reloj.
- Si el VPS responde, las reenvía. Si no, las guarda en `bridge_cache.db` y reintenta cada 30 segundos.

## ⚠️ 4. Reglas Críticas y Errores Conocidos
- **Bcrypt**: NO actualizar `bcrypt`. Debe estar anclado a `==3.2.2` por incompatibilidad con `passlib`.
- **Pandas**: Al importar empleados de Excel, forzar `dtype={'id_reloj': str}` para evitar que se agreguen decimales (ej. `1001.0`).
- **SSL/Cloudflare**: El dominio `time-prestige.smartopsia.com` usa Cloudflare. Modo SSL debe ser **Full (Strict)**.

## 🔐 5. Roles y Seguridad (RBAC)
- **ROOT**: Acceso total. Puede resetear claves, editar checadas y ver logs de sistema.
- **ADMIN/RRHH**: Gestión general de áreas y empleados. No pueden alterar registros históricos de checadas.
- **MANAGER**: Limitado a ver empleados de su propia `area_id`.

## 🚀 6. Workflow de Despliegue
El despliegue se realiza mediante `.\deploy.ps1`. Este script:
1. Empaqueta el código en un `.tar.gz` (excluyendo `node_modules`).
2. Sube el paquete al VPS vía SCP.
3. Ejecuta `docker-compose up --build -d` remotamente.
4. (Opcional) Ejecuta `python migrate.py` para actualizar el esquema de la BD.

## 📋 7. Próximos Pasos (Work in Progress)
- [ ] Implementación de filtro por Área en el Directorio.
- [ ] Reporte CSV con separación de columnas `Fecha` y `Hora`.
- [ ] Dashboard con estadísticas reales (Asistencias hoy, Retardos, Faltas).
- [ ] Checklist granular de permisos por módulo para usuarios ADMIN/RRHH.
