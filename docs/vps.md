# Documentación del VPS: Puertos y Configuración (Casino Prestige)

Acabo de revisar los puertos activos en tu VPS. Afortunadamente, no hay conflictos y todo está corriendo de maravilla.

## 📡 Puertos Asignados
- **Puerto 80 / 443:** Ocupados por tu NGINX Proxy Manager (NPM). Él se encarga de recibir todas las peticiones de internet.
- **Puerto 81:** Panel de administración de NPM.
- **Puerto 8100:** Backend del Checador (API y recepción de checadas ADMS).
- **Puerto 3100:** Frontend (Panel Web / Interfaz Gráfica).
- **Puerto 5436:** Base de datos PostgreSQL (dedicada a este sistema).

---

## 🌐 Configuración en Nginx Proxy Manager

Para que tu dominio funcione correctamente y reciba el tráfico de los checadores, debes configurar **DOS Proxy Hosts** en tu panel (Puerto 81):

### 1. Para el Panel de Administración Web (El Frontend)
Esta es la ruta por la cual accederán los gerentes y tú para revisar la información y reportes.
- **Domain Names:** `time.prestige.smartopsia.com`
- **Scheme:** `http`
- **Forward Hostname / IP:** `172.17.0.1` (IP interna del host de Docker).
- **Forward Port:** `3100`
- **SSL:**
  - `Request a new SSL Certificate` (Activado)
  - `Force SSL` (Activado)

### 2. Para el Checador Físico ZKTeco (El Backend)
El checador **NO soporta SSL ni redirecciones**, e intenta comunicarse a través del puerto 80 mandando la IP directamente. 
Para que NPM no bloquee las peticiones del checador, crea este Proxy Host:
- **Domain Names:** `164.92.110.179` (Sí, escribe la IP pública literal aquí).
- **Scheme:** `http`
- **Forward Hostname / IP:** `172.17.0.1` (IP interna del host de Docker).
- **Forward Port:** `8100`
- **SSL:** **No actives SSL**. El checador solo habla por HTTP plano.

> [!IMPORTANT]
> **Atención con el Checador Físico:**
> La configuración física del checador en su pantalla táctil (Cloud Server Setting / ADMS) debe quedar así:
> - **Server Address:** `164.92.110.179`
> - **Server Port:** `80`
> Con el Proxy Host #2 que creaste arriba, NPM se encargará de tomar todo lo que llegue al puerto 80 buscando esa IP, y lo mandará mágicamente al backend en el puerto `8100`.
