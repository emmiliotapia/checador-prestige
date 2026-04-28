# 🧠 Base de Conocimiento y Enrutador de Desarrollo (SmartOps Casino Prestige)

> **INSTRUCCIÓN CRÍTICA PARA LA IA:** Antes de escribir código o proponer soluciones en este repositorio, **DEBES** leer este documento para entender la arquitectura, reglas estéticas y evitar repetir errores pasados.

## 🏢 1. Arquitectura del Proyecto
Este es el sistema **Checador Prestige**, un webhook ADMS para dispositivos biométricos ZKTeco y un panel web de administración.
- **Backend:** FastAPI (Python) + PostgreSQL. (Corre en el puerto `8100` en producción).
- **Frontend:** React + Vite + Tailwind CSS. (Corre en el puerto `3100` en producción).
- **Servidor (VPS):** Ubuntu Server con Docker Compose y Nginx Proxy Manager (NPM).

## 🗺️ 2. Enrutador de Documentación (¿Qué vas a hacer?)

Dependiendo de la tarea que el humano (Emilio/Aldo) te pida, revisa los siguientes archivos antes de actuar:

| Si la tarea es sobre... | Revisa este archivo primero |
| :--- | :--- |
| **Configuración de Dominio, SSL, Cloudflare o Nginx** | `docs/vps.md` (Contiene las reglas de Proxy Hosts y puertos exactos). |
| **Diseño, Colores, UI/UX o Frontend** | `frontend/tailwind.config.js` (La marca usa colores "Gold & Obsidian". **Prohibido** usar colores por defecto de Tailwind). |
| **Conexión Biométrica (ADMS) o Parseo de Checadas** | `backend/app/main.py` (Ruta `/iclock/cdata`). |
| **Base de Datos, Migraciones o Usuarios** | `backend/app/models.py` y `backend/seed.py` |

## ⚠️ 3. Registro de Errores Conocidos y Soluciones (Memory)

Para evitar romper el sistema de nuevo, ten en cuenta estos antecedentes históricos:

### 🔴 Error: `AttributeError: module 'bcrypt' has no attribute '__about__'`
- **Contexto:** Al intentar hashear contraseñas o hacer login.
- **Causa:** La librería `passlib` está abandonada y se rompe con `bcrypt >= 4.0.0`.
- **Solución:** En `backend/requirements.txt` el paquete `bcrypt` DEBE estar anclado a la versión `==3.2.2`. Nunca lo actualices a la 4.x.

### 🔴 Error: `vite: Permission denied` (Al hacer deploy en Docker)
- **Contexto:** El contenedor `attendance-frontend` fallaba al hacer `npm run build` en el VPS.
- **Causa:** El script de despliegue copiaba la carpeta `node_modules` de Windows hacia Linux, corrompiendo los binarios.
- **Solución:** Nunca uses `scp -r` directo. El script `deploy.ps1` debe empaquetar usando `tar --exclude="node_modules"` y mandar el `.tar.gz`.

### 🔴 Error: `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`
- **Contexto:** Chrome rechaza cargar la web al usar `time.prestige.smartopsia.com`.
- **Causa:** Cloudflare Universal SSL (gratuito) NO soporta subdominios de segundo nivel (dos puntos).
- **Solución:** Se debe cambiar a un subdominio de primer nivel (ej. `time-prestige.smartopsia.com`) o deshabilitar el proxy de Cloudflare (Nube gris) y dejar que Nginx Proxy Manager negocie el SSL.

### 🔴 Error: Ciclo infinito de redirecciones (Too Many Redirects)
- **Contexto:** Nginx Proxy Manager marca error 502 o error de redirección.
- **Causa:** Cloudflare en modo "Flexible" enviando tráfico por HTTP a un Nginx Proxy Manager que tiene activado "Force SSL".
- **Solución:** Cloudflare debe estar estrictamente configurado en modo SSL/TLS: **"Full" o "Full (Strict)"**.

### 🔴 Error: IDs de Empleados con decimales (Ej. `1001.0`)
- **Contexto:** Al importar `bd_empleados.xlsx` usando pandas.
- **Causa:** Pandas lee automáticamente columnas numéricas vacías (o enteras) como `float`, agregando `.0`.
- **Solución:** Castear siempre el `id_reloj` eliminando decimales (ej. `str(row.iloc[0]).split('.')[0].strip()`) o usar `dtype={'id': str}` en `pd.read_excel`. Además, usar SQL `UPDATE empleados SET id_reloj = split_part(id_reloj, '.', 1);` para limpiar los datos corruptos.

## 🛑 4. Reglas de Despliegue y Desarrollo (OPTIMIZACIÓN)

1. **Despliegues Empaquetados:** **NUNCA** ejecutes reconstrucciones del VPS por cada pequeño cambio. Agrupa todas tus modificaciones en Backend, Frontend y scripts, y realiza un **único despliegue final** llamando a `deploy.ps1`. El tiempo y los tokens del usuario son valiosos.
2. **Sincronización de Base de Datos:** Si alteras un modelo en `models.py` (ej. agregar `puesto`), recuerda que `Base.metadata.create_all` no altera tablas existentes. Debes inyectar sentencias SQL directas (Ej. `ALTER TABLE`) en los scripts de migración o en tu propio script de inyección (como `importar_empleados.py`).
3. **Módulos Frontend:** Cualquier nueva vista (Ej. Gestión de Áreas) debe respetar fielmente el diseño "Gold & Obsidian" y las paletas definidas en Tailwind. 

---
*Nota para la IA: Actúa siempre como un desarrollador Senior. Eres "Dios" en este repositorio, pero respeta estrictamente estas reglas.*
