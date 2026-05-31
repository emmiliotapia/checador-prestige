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

### 🔴 Error: Falta de Segundos al Modificar Checada Manualmente (Solo ROOT)
- **Contexto:** El usuario ROOT puede modificar registros de asistencia, pero el input de tiempo de la interfaz web no permitía ingresar segundos, afectando la precisión del cálculo de incidencias.
- **Causa:** El input HTML para la hora en la interfaz web no tenía especificado el atributo `step="1"`, por lo que el navegador ocultaba el selector de segundos y limitaba la precisión a horas/minutos.
- **Solución:** Agregar `step="1"` a los inputs de tipo `datetime-local` o `time` para forzar la visualización y envío de segundos en el dashboard.

---
*Nota: Este archivo debe ser actualizado por la IA ante cada error crítico resuelto.*
