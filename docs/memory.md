# 🧠 Memoria de Errores y Soluciones (SmartOps Checador)

Este documento registra los errores técnicos encontrados durante el desarrollo y su solución definitiva para evitar regresiones.

### 🔴 Error: `NameError: name 'CORSMiddleware' is not defined`
- **Contexto:** El backend fallaba al iniciar después de una actualización de dependencias/imports.
- **Causa:** Se eliminó accidentalmente el import de `CORSMiddleware` en `main.py` al reorganizar el código.
- **Solución:** Asegurar que `from fastapi.middleware.cors import CORSMiddleware` esté presente al inicio de `main.py`.

### 🔴 Error: Asistencias en Dashboard marcando 0 (Desfase de Zona Horaria)
- **Contexto:** El dashboard mostraba 0 asistencias a pesar de haber checadas recientes.
- **Causa:** El backend usaba `datetime.utcnow().date()`. Si el usuario está en una zona horaria atrasada (ej. -07:00) y es de noche, en UTC ya es el día siguiente, por lo que el filtro de "hoy" no encontraba nada.
- **Solución:** Se actualizó el endpoint `/api/dashboard/stats` para aceptar un parámetro opcional `fecha_hoy` enviado por el cliente (su fecha local). El frontend ahora envía su fecha actual para sincronizar las estadísticas.

### 🔴 Error: `Uncaught ReferenceError: Clock is not defined`
- **Contexto:** El frontend fallaba al renderizar el dashboard.
- **Causa:** Se intentó usar el componente `Clock` de `lucide-react` sin haberlo importado correctamente.
- **Solución:** Verificar siempre que los iconos de `lucide-react` estén en la lista de imports destructurados.

### 🔴 Error: `Unexpected token` en build de Vite (ConfiguracionView.jsx)
- **Contexto:** El build fallaba en el VPS.
- **Causa:** Un bloque condicional de JSX quedó con una llave de cierre extra `)}` después de borrar la lógica de apertura.
- **Solución:** Limpieza de sintaxis JSX. Se recomienda correr `npm run build` local antes de desplegar.
### 🔴 Error: IDs de Empleados con decimales (Ej. `1001.0`)
- **Contexto:** Al importar `bd_empleados.xlsx` usando pandas.
- **Causa:** Pandas lee automáticamente columnas numéricas vacías (o enteras) como `float`, agregando `.0`.
- **Solución:** Castear siempre el `id_reloj` eliminando decimales (ej. `str(row.iloc[0]).split('.')[0].strip()`) o usar `dtype={'id': str}` en `pd.read_excel`. Además, usar SQL `UPDATE empleados SET id_reloj = split_part(id_reloj, '.', 1);` para limpiar los datos corruptos.

### 🔴 Error: Registros "Pegados" arriba en el Dashboard (Fechas del Futuro)
- **Contexto:** Algunos registros antiguos aparecían siempre al principio, ignorando nuevas checadas.
- **Causa:** El dispositivo biométrico tenía mal el año (ej. 2027) en el momento de la checada. Al ordenar por fecha descendente, el futuro siempre gana al presente.
- **Solución:** Eliminar registros con fechas inválidas/futuras en la base de datos: `DELETE FROM registros WHERE timestamp_checada > '2026-12-31';` y corregir el reloj del hardware.
+
### 🔴 Error: Roles RRHH/ADMIN sin acceso a módulos (Modular Permissions)
- **Contexto:** Al crear usuarios con rol RRHH o ADMIN, no podían acceder a nada más que al Inicio.
- **Causa:** La lógica de `canAccess` en el frontend era demasiado restrictiva y no manejaba correctamente los casos donde el array de `permisos` estaba vacío o era nulo para roles administrativos.
- **Solución:** Se actualizó `App.jsx` y `DashboardLayout.jsx` para permitir acceso total a `ADMIN`/`RRHH` por defecto, a menos que se especifiquen permisos modulares explícitos. El rol `ROOT` ahora es el único con capacidad de edición de checadas.

### 🔴 Error: Partidas Dobles y Áreas Duplicadas (Casing)
- **Contexto:** Se generaban múltiples áreas (ej. "Sistemas" y "sistemas") y empleados duplicados por errores de dedo.
- **Causa:** Falta de normalización de texto y ausencia de restricciones de unicidad en `id_reloj` y `nombre_area`.
- **Solución:** Se implementó una normalización forzada a **MAYÚSCULAS** en el backend. Se agregaron validaciones de existencia previa antes de crear/editar empleados o áreas. Además, se habilitó el **Borrado Físico** para el usuario `ROOT` para permitir la limpieza manual de datos históricos corruptos.
### 🔴 Error: No se podían eliminar registros de asistencia
- **Contexto:** El usuario ROOT solo podía editar checadas, pero no eliminarlas cuando eran duplicadas o erróneas.
- **Solución:** Se creó el endpoint `DELETE /api/registros/{id}` restringido a ROOT y se añadió el botón correspondiente en la UI del Dashboard.

### 🔴 Error: Reloj ZKTeco ignora comandos de usuarios nuevos (Sincronización ADMS)
- **Contexto:** Los usuarios creados/editados en el panel web no aparecían en la pantalla del checador. El sistema generaba los comandos en la base de datos pero el reloj los descartaba.
- **Causa 1 (Sintaxis y Formato):** El reloj biométrico esperaba el comando limpio `DATA UPDATE USERINFO PIN=XX Name=YY Pri=0`. El sistema enviaba campos vacíos `Pass=\tCard=` que rompían el parseo interno del equipo.
- **Causa 2 (Protocolo de ID estricto):** La base de datos generaba IDs de tipo `UUID` (`c9ab3be3...`) para encolar los comandos, pero el firmware ADMS antiguo del reloj solo es capaz de leer números enteros (ej. `C:1:DATA...`). El reloj recibía el comando pero no lo entendía ni lo reportaba.
- **Solución:** Se cambió la columna `id` de la tabla `comandos` a un `Integer` auto-incremental. Se limpió la sintaxis omitiendo campos vacíos. Se configuró `/iclock/devicecmd` para marcar como ejecutados los comandos defectuvosos y evitar un bucle de envíos. Adicionalmente, se forzó `CmdInterval=15` en el handshake de `/iclock/cdata` para asegurar que el reloj consulte pendientes frecuentemente.

### 🔴 Error: Falta de Segundos al Modificar Checada Manualmente (Solo ROOT)
- **Contexto:** El usuario ROOT puede modificar registros de asistencia, pero el input de tiempo de la interfaz web no permitía ingresar segundos, afectando la precisión del cálculo de incidencias.
- **Causa:** El input HTML para la hora en la interfaz web no tenía especificado el atributo `step="1"`, por lo que el navegador ocultaba el selector de segundos y limitaba la precisión a horas/minutos.
- **Solución:** Agregar `step="1"` a los inputs de tipo `datetime-local` o `time` para forzar la visualización y envío de segundos en el dashboard.

### 🔴 Error: Turnos Nocturnos Agrupados Incorrectamente (Jornadas de 16+ hrs)
- **Contexto:** Al generar el reporte de asistencia agrupado por día, los empleados con turno nocturno (ej. salida a las 02:00 AM) veían su checada de salida agrupada como la "Entrada" del nuevo día, rompiendo el cálculo de horas.
- **Causa:** El sistema agrupaba estrictamente por la fecha calendario (`reg.timestamp_checada.date()`), provocando que la salida de madrugada cayera en un bloque distinto al de su entrada.
- **Solución:** Se implementó una lógica de "Día Operativo" en `backend/app/main.py`. Si la hora de la checada es menor a las 06:00 AM, se le asigna operativamente a la fecha del día anterior (`fecha - 1 día`), cerrando correctamente los turnos nocturnos.

### 🔴 Error: Reloj ZKTeco no descarga usuarios nuevos (Error 422 Unprocessable Entity)
- **Contexto:** Al crear usuarios en el portal, los comandos se encolaban correctamente en la base de datos, pero el reloj checador nunca los sincronizaba ni descargaba.
- **Causa:** El firmware del dispositivo ADMS envía las peticiones GET con los parámetros en mayúsculas: `?SN=XXX&INFO=YYY`. Sin embargo, el backend de FastAPI definía el parámetro estrictamente en minúsculas en su firma: `async def get_request(sn: str)`. Al no encontrar `sn` (minúscula), FastAPI rechazaba la petición de inmediato con un error "422 Unprocessable Entity", por lo que el reloj nunca recibía respuesta ni los comandos pendientes.
- **Solución:** Se modificó la firma de la ruta `/iclock/getrequest` para usar el objeto `Request` genérico (`async def get_request(request: Request)`) y se leyó el parámetro con tolerancia a mayúsculas y minúsculas: `sn = request.query_params.get("SN") or request.query_params.get("sn")`. Esto evita el rechazo automático de FastAPI.

---
*Nota: Este archivo debe ser actualizado por la IA ante cada error crítico resuelto.*
