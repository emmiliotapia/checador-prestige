# Documentación del VPS: Puertos y Configuración (Casino Prestige)

Acabo de revisar los puertos activos en tu VPS. Afortunadamente, no hay conflictos y todo está corriendo de maravilla.

## 📡 Puertos Asignados
Ver `secrets.md` para la lista completa de puertos.

---

## 🌐 Configuración en Nginx Proxy Manager

Para que tu dominio funcione correctamente y reciba el tráfico de los checadores, debes configurar **DOS Proxy Hosts** en tu panel (Puerto 81):

### 1. Para el Panel de Administración Web (El Frontend)
Esta es la ruta por la cual accederán los gerentes y tú para revisar la información y reportes.
- **Domain Names:** (Ver `secrets.md`)
- **Scheme:** `http`
- **Forward Hostname / IP:** `172.17.0.1` (IP interna del host de Docker).
- **Forward Port:** (Ver `secrets.md`)
- **SSL:**
  - `Request a new SSL Certificate` (Activado)
  - `Force SSL` (Activado)

### 2. Para el Checador Físico ZKTeco (El Backend)
El checador **NO soporta SSL ni redirecciones**, e intenta comunicarse a través del puerto 80 mandando la IP directamente. 
Para que NPM no bloquee las peticiones del checador, crea este Proxy Host:
- **Domain Names:** (Ver `secrets.md` para la IP Pública)
- **Scheme:** `http`
- **Forward Hostname / IP:** `172.17.0.1` (IP interna del host de Docker).
- **Forward Port:** (Ver `secrets.md`)
- **SSL:** **No actives SSL**. El checador solo habla por HTTP plano.

> [!IMPORTANT]
> **Atención con el Checador Físico:**
> La configuración física del checador en su pantalla táctil (Cloud Server Setting / ADMS) debe quedar así:
> - **Server Address:** (Ver `secrets.md` para la IP Pública)
> - **Server Port:** `80`
> Con el Proxy Host #2 que creaste arriba, NPM se encargará de tomar todo lo que llegue al puerto 80 buscando esa IP, y lo mandará mágicamente al backend en el puerto `8100`.
