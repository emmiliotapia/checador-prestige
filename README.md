# SmartOps Time Attendance (Checador Prestige)

Sistema de gestión de asistencia multi-tenant moderno, diseñado para el sector de casinos (Prestige), con soporte para dispositivos biométricos ZKTeco y resiliencia local mediante un bridge inteligente.

## 🏗️ Arquitectura del Sistema
El sistema se compone de tres capas principales:
1.  **Backend (FastAPI)**: Servidor central en la nube (VPS) que gestiona la lógica de negocio, multitenancy y comandos ADMS.
2.  **Frontend (React + Tailwind)**: Panel de administración premium "Gold & Obsidian" para la gestión de empleados, áreas, horarios y visualización de checadas en tiempo real.
3.  **Local Bridge (FastAPI/SQLite)**: Proxy local que se instala en el casino para garantizar que ninguna checada se pierda si falla el internet, actuando como caché persistente.

## 🚀 Módulos Principales
-   **Dashboard en Vivo**: Visualización instantánea de las últimas checadas.
-   **Directorio Inteligente**: Gestión de personal con búsqueda en tiempo real y paginación optimizada (25 registros/página).
-   **Gestión de Horarios**: Configuración flexible de turnos, tolerancias de entrada y tiempos de comida.
-   **Control de Áreas**: Estructura departamental con asignación de encargados y correos para reportes automáticos.
-   **Sincronización ADMS**: Comunicación bidireccional que permite dar de alta empleados en el reloj físico directamente desde la web.

## 📡 Configuración del Hardware (ZKTeco ADMS)
Para enlazar un reloj checador al sistema en producción (`time-prestige.smartopsia.com`):
-   **Server Address**: `164.92.110.179` (IP del VPS) o la IP del **Local Bridge** si se está usando el proxy.
-   **Server Port**: `80` (VPS) o `8080` (Bridge Local).
-   **Enable Proxy Server**: OFF.

## 🛠️ Desarrollo y Despliegue

### Requisitos
- Docker & Docker Compose
- Python 3.11+
- Node.js 20+

### Despliegue Local (Simulación)
1.  `docker-compose up -d --build`
2.  `docker-compose exec attendance-backend python seed.py` (Crea usuario root: `root` / `F4nny8888!`)

### Despliegue a Producción (VPS)
Utilizar el script automatizado para Windows (Powershell):
```powershell
./deploy.ps1
```
*Este script empaqueta, sube y despliega automáticamente evitando el envío de `node_modules` y archivos pesados.*

## 📄 Documentación Técnica
- [Protocolo ZKTeco ADMS](docs/api_zkteco_protocol.md)
- [Reglas de VPS y Dominio](docs/vps.md)
- [Guía del Desarrollador (GEMINI.md)](GEMINI.md)

---
*Desarrollado por SmartOps IA para Casino Prestige.*
