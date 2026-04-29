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

---
*Nota: Este archivo debe ser actualizado por la IA ante cada error crítico resuelto.*
