---
name: human-ui-design
description: >-
  Use this skill whenever designing, creating, modifying, or reviewing UI/UX
  components, views, layouts, or styles in the SmartOps (Casino Prestige) frontend.
  Enforces the "Gold & Obsidian" luxury aesthetic and prevents generic AI-generated
  interfaces.
---

# Human UI Design — SmartOps (Gold & Obsidian)

Esta skill define los estándares de diseño visual e interacción para la interfaz de **SmartOps Casino Prestige**. Su objetivo es erradicar la estética genérica de IA y garantizar una experiencia de software empresarial de lujo, sobria, precisa y humana.

## 1. Paleta Estricta "Gold & Obsidian" (`tailwind.config.js`)

**PROHIBIDO** utilizar colores por defecto de Tailwind (`blue-*`, `indigo-*`, `purple-*`, `gray-*`, `slate-*`, `zinc-*`) para la estructura o identidad visual. Todo componente debe construirse exclusivamente sobre las escalas definidas en `frontend/tailwind.config.js`:

- **Superficies y Fondos (Obsidian):**
  - Fondo base de aplicación / lienzo profundo: `bg-obsidian-950` (`#0f0f11` - True Obsidian).
  - Contenedores, tarjetas y paneles elevados: `bg-obsidian-900` con bordes sutiles `border-obsidian-800`.
  - Inputs, selectores y áreas empotradas: `bg-obsidian-950` con `border-obsidian-700` o `border-obsidian-800`.
- **Acentos y Jerarquía (Gold):**
  - Acciones primarias, indicadores activos y acentos clave: `bg-gold-500` (`#eab308`) con texto de alto contraste `text-obsidian-950`, hover en `hover:bg-gold-400`.
  - Texto principal claro: `text-obsidian-50` o `text-gold-50`.
  - Texto secundario / etiquetas: `text-obsidian-300` o `text-obsidian-400`.
- **Semántica de Estado (Uso puntual y sobrio):**
  - Éxito / Entrada: tonos esmeralda/verde oscuros con bordes translúcidos (`bg-emerald-950/40 text-emerald-400 border-emerald-800/50`).
  - Alerta / Retardo / Comida: tonos ámbar/dorado (`bg-amber-950/40 text-amber-400 border-amber-800/50`).
  - Peligro / Baja / Eliminar (ROOT): tonos rojos sobrios (`text-red-500`, `hover:bg-red-500 hover:text-white`).

## 2. Reglas Anti-IA Genérica (Human-Crafted UI)

1. **Cero Gradientes Arcoíris o Neón:** No uses sombras brillantes exageradas ni gradientes multicolor. Si se requiere profundidad, usa sombras oscuras (`shadow-xl`, `shadow-2xl`) o un brillo dorado muy contenido (`shadow-gold-900/20`).
2. **Tipografía con Intención y Contraste:**
   - Títulos de sección: combinación de pesos ligeros y fuertes (ej. `font-light tracking-wide uppercase` con palabras clave en `font-bold text-gold-500`).
   - Etiquetas de formularios y cabeceras de tabla: `text-xs font-bold uppercase tracking-widest text-obsidian-400`.
   - Datos numéricos, horas (`HH:mm:ss`), fechas y códigos (`id_reloj`, `SN`): usa fuente monoespaciada (`font-mono`) para alineación tabular impecable.
3. **Densidad de Información Operativa:**
   - Los usuarios (RRHH, Gerentes, ROOT) necesitan escanear decenas de registros rápidamente. Evita tarjetas gigantescas con espacio vacío innecesario; prioriza tablas limpias (`divide-y divide-obsidian-800`), filtros en línea bien alineados y modales compactos (`max-w-md` o `max-w-lg`).
4. **Controles Nativos Oscuros:**
   - Todo input de fecha o tiempo (`date`, `datetime-local`, `time`) debe incluir `style={{ colorScheme: 'dark' }}` para que el selector nativo del navegador respete el tema oscuro.
   - Si el input edita checadas (rol `ROOT`), debe incluir `step="1"` para preservar la precisión de segundos.

## 3. Checklist antes de entregar cambios en Frontend

- [ ] ¿Se evitó por completo el uso de `gray-*`, `blue-*` o `indigo-*`?
- [ ] ¿Se verificaron todos los imports de `lucide-react` para evitar `ReferenceError` en producción?
- [ ] ¿El diseño es responsivo tanto en escritorio (Sidebar) como en móvil (Bottom Nav)?
- [ ] ¿La sintaxis JSX compila limpiamente con `npm run build` antes de empaquetar para el VPS?

