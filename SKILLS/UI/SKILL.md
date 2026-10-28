---
name: macos-glass-ui
description: |
  Design system y guía de implementación para la UI glassmorphism macOS-like del OS web.
  Usar SIEMPRE que se construya cualquier componente de UI para este proyecto: ventanas,
  modales, docks, menús, barras, iconos, formularios, notificaciones, tooltips, paneles,
  context menus, o cualquier elemento visual nuevo. También usar cuando se pida "agregar
  una feature", "crear un componente", "diseñar algo", o "mantener consistencia visual".
  Este skill define los tokens, patrones y reglas que garantizan coherencia en toda la UI.
---

# macOS Glass UI — Design System

Sistema de diseño para el OS web. Todo componente nuevo **debe** seguir estas reglas.
La consistencia visual es la prioridad número uno.

---

## 1. Filosofía de diseño

**Principios irrompibles:**
- **Glass sobre todo**: los elementos flotan, no están pegados al fondo.
- **Jerarquía por blur**: más blur = más prominencia en el z-stack.
- **Luz desde arriba**: el borde superior de los elementos es siempre más brillante.
- **Nada es opaco**: incluso el negro tiene transparencia.
- **Movimiento fluido**: cada interacción tiene una transición, sin excepciones.

**Anti-patterns — jamás hacer:**
- Fondos sólidos sin transparencia en paneles principales
- Bordes de 1px sin `rgba()` — siempre semitransparentes
- Colores planos sin relación con la paleta de acento
- Sombras duras (box-shadow sin blur extenso)
- Transiciones de 0ms o `transition: none`

---

## 2. Tokens de diseño

### 2.1 Capas de superficie (Surface layers)

Hay 5 capas. Cada elemento del OS vive en una de ellas.

| Layer | Uso | Background | Blur | Border |
|-------|-----|-----------|------|--------|
| `L0` | Wallpaper / fondo base | imagen o gradiente | — | — |
| `L1` | Elementos del desktop (iconos sueltos) | `rgba(255,255,255,0.04)` | `blur(8px)` | `rgba(255,255,255,0.08)` |
| `L2` | Dock, menubar, paneles secundarios | `rgba(255,255,255,0.07)` | `blur(20px) saturate(160%)` | `rgba(255,255,255,0.12)` |
| `L3` | Ventanas, cards principales | `rgba(255,255,255,0.08)` | `blur(24px) saturate(180%)` | `rgba(255,255,255,0.14)` |
| `L4` | Modales, popovers, context menus | `rgba(18,16,38,0.94)` | `blur(32px) saturate(200%)` | `rgba(255,255,255,0.16)` |

```css
/* Variables CSS del sistema */
:root {
  --glass-l1-bg:     rgba(255, 255, 255, 0.04);
  --glass-l2-bg:     rgba(255, 255, 255, 0.07);
  --glass-l3-bg:     rgba(255, 255, 255, 0.08);
  --glass-l4-bg:     rgba(18, 16, 38, 0.94);

  --glass-l1-blur:   blur(8px);
  --glass-l2-blur:   blur(20px) saturate(160%);
  --glass-l3-blur:   blur(24px) saturate(180%);
  --glass-l4-blur:   blur(32px) saturate(200%);

  --glass-l1-border: rgba(255, 255, 255, 0.08);
  --glass-l2-border: rgba(255, 255, 255, 0.12);
  --glass-l3-border: rgba(255, 255, 255, 0.14);
  --glass-l4-border: rgba(255, 255, 255, 0.16);

  /* Inset highlight — borde superior luminoso */
  --glass-inset-sm:  inset 0 1px 0 rgba(255, 255, 255, 0.16);
  --glass-inset-md:  inset 0 1px 0 rgba(255, 255, 255, 0.20);
  --glass-inset-lg:  inset 0 1px 0 rgba(255, 255, 255, 0.24);
}
```

### 2.2 Sombras

```css
:root {
  --shadow-sm:   0 8px 24px rgba(0, 0, 0, 0.25);
  --shadow-md:   0 16px 48px rgba(0, 0, 0, 0.30);
  --shadow-lg:   0 32px 80px rgba(0, 0, 0, 0.35);
  --shadow-xl:   0 48px 120px rgba(0, 0, 0, 0.45);
  --shadow-focus: 0 0 0 3px rgba(139, 92, 246, 0.30);
}
```

### 2.3 Border radius

```css
:root {
  --radius-xs:  6px;   /* inputs, tags pequeños */
  --radius-sm:  9px;   /* botones, inputs grandes */
  --radius-md:  12px;  /* cards internas, tooltips */
  --radius-lg:  14px;  /* ventanas, modales */
  --radius-xl:  20px;  /* dock, pill buttons */
  --radius-full: 9999px; /* badges, dots */
}
```

### 2.4 Paleta de acento

El OS tiene **un color primario** (purple/indigo) y colores semánticos.

```css
:root {
  /* Acento principal */
  --accent-500:  #7c3aed;
  --accent-600:  #6d28d9;
  --accent-gradient: linear-gradient(135deg, #7c3aed, #4f46e5);

  /* Semánticos */
  --color-danger:  rgba(239, 68,  68,  0.85);
  --color-warning: rgba(234, 179, 8,   0.85);
  --color-success: rgba(34,  197, 94,  0.85);
  --color-info:    rgba(59,  130, 246, 0.85);

  /* Texto sobre glass */
  --text-primary:   rgba(255, 255, 255, 0.90);
  --text-secondary: rgba(255, 255, 255, 0.60);
  --text-tertiary:  rgba(255, 255, 255, 0.35);
  --text-disabled:  rgba(255, 255, 255, 0.20);

  /* Traffic lights */
  --dot-red:    #ff5f57;
  --dot-yellow: #febc2e;
  --dot-green:  #28c840;
}
```

### 2.5 Tipografía

```css
:root {
  --font-system: -apple-system, BlinkMacSystemFont, 'SF Pro Display',
                 'SF Pro Text', 'Helvetica Neue', sans-serif;
  --font-mono:   'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;

  /* Escala */
  --text-xs:   10px;  /* badges, labels */
  --text-sm:   12px;  /* metadata, hints */
  --text-base: 13px;  /* UI general */
  --text-md:   15px;  /* títulos de sección */
  --text-lg:   17px;  /* títulos de ventana */
  --text-xl:   22px;  /* headings de modal */
}
```

### 2.6 Transiciones

```css
:root {
  --ease-glass:  cubic-bezier(0.34, 1.56, 0.64, 1); /* spring — modales, slides */
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);       /* general */
  --ease-out:    cubic-bezier(0, 0, 0.2, 1);          /* exit animations */

  --duration-fast:   120ms;
  --duration-normal: 200ms;
  --duration-slow:   320ms;
}
```

---

## 3. Componentes base

### 3.1 Ventana flotante (Window)

Todo panel que flota en el desktop sigue este patrón exacto.

```tsx
// Estructura obligatoria de una ventana
<div className="os-window">
  <div className="os-window__titlebar">
    <div className="os-window__dots">
      <button className="os-dot os-dot--red" />
      <button className="os-dot os-dot--yellow" />
      <button className="os-dot os-dot--green" />
    </div>
    <span className="os-window__title">{title}</span>
    <span className="os-window__badge">{badgeLabel}</span>
  </div>
  <div className="os-window__content">
    {children}
  </div>
  {resizable && <div className="os-window__resize-handle" />}
</div>
```

```css
.os-window {
  border-radius: var(--radius-lg);
  backdrop-filter: var(--glass-l3-blur);
  -webkit-backdrop-filter: var(--glass-l3-blur);
  background: var(--glass-l3-bg);
  border: 1px solid var(--glass-l3-border);
  box-shadow: var(--shadow-lg), var(--glass-inset-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  will-change: transform;  /* GPU acceleration para drag */
  transition: box-shadow var(--duration-normal) var(--ease-smooth);
}
.os-window:hover {
  box-shadow: var(--shadow-xl), var(--glass-inset-lg);
}

.os-window__titlebar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
}
.os-window__titlebar:active { cursor: grabbing; }

.os-window__title {
  flex: 1;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.015em;
}

.os-window__content {
  flex: 1;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.15);
  position: relative;
}
```

### 3.2 Traffic lights (dots)

```css
.os-window__dots {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.os-dot {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  border: none;
  padding: 0;
  cursor: pointer;
  transition:
    filter var(--duration-fast) var(--ease-smooth),
    transform var(--duration-fast) var(--ease-smooth);
}
.os-dot:hover {
  filter: brightness(1.2);
  transform: scale(1.15);
}
.os-dot--red    { background: var(--dot-red); }
.os-dot--yellow { background: var(--dot-yellow); }
.os-dot--green  { background: var(--dot-green); }
```

### 3.3 Modal / Dialog

Los modales usan `L4` — más oscuros y con más blur que las ventanas.

```css
.os-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: os-fadeIn var(--duration-fast) var(--ease-smooth);
}

.os-modal {
  background: var(--glass-l4-bg);
  border: 1px solid var(--glass-l4-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-xl), var(--glass-inset-md);
  animation: os-slideUp var(--duration-normal) var(--ease-glass);
  width: 360px;
  max-width: calc(100vw - 32px);
}

.os-modal__title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

@keyframes os-fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes os-slideUp {
  from { opacity: 0; transform: translateY(14px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
```

### 3.4 Botones

Tres variantes: primario (acento), secundario (glass), destructivo.

```css
/* Base */
.os-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition:
    opacity       var(--duration-fast) var(--ease-smooth),
    transform     var(--duration-fast) var(--ease-smooth),
    background    var(--duration-fast) var(--ease-smooth);
  font-family: var(--font-system);
}
.os-btn:active { transform: scale(0.97); }

/* Primario */
.os-btn--primary {
  background: var(--accent-gradient);
  color: #fff;
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.35);
}
.os-btn--primary:hover { opacity: 0.88; transform: translateY(-1px); }

/* Secundario (ghost glass) */
.os-btn--secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-secondary);
}
.os-btn--secondary:hover {
  background: rgba(255, 255, 255, 0.14);
  color: var(--text-primary);
}

/* Destructivo */
.os-btn--danger {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}
.os-btn--danger:hover { background: rgba(239, 68, 68, 0.3); }

/* Pill (dock, toolbar) */
.os-btn--pill {
  border-radius: var(--radius-xl);
  padding: 9px 20px;
  backdrop-filter: blur(12px);
}
```

### 3.5 Inputs y formularios

```css
.os-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: var(--radius-sm);
  padding: 9px 14px;
  font-size: var(--text-base);
  color: var(--text-primary);
  outline: none;
  transition:
    border-color var(--duration-fast) var(--ease-smooth),
    box-shadow   var(--duration-fast) var(--ease-smooth);
  font-family: var(--font-system);
}
.os-input::placeholder { color: var(--text-tertiary); }
.os-input:focus {
  border-color: rgba(124, 58, 237, 0.55);
  box-shadow: var(--shadow-focus);
}
```

### 3.6 Tabs (dentro de modales/paneles)

```css
.os-tabs {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-xs);
  padding: 4px;
}

.os-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: calc(var(--radius-xs) - 1px);
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-smooth);
  font-family: var(--font-system);
}
.os-tab--active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
}
```

### 3.7 Badge / Chip

```css
.os-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Variantes por tipo de contenido */
.os-badge--purple { background: rgba(99,  102, 241, 0.25); color: #a5b4fc; }
.os-badge--red    { background: rgba(239, 68,  68,  0.25); color: #fca5a5; }
.os-badge--green  { background: rgba(34,  197, 94,  0.25); color: #86efac; }
.os-badge--blue   { background: rgba(59,  130, 246, 0.25); color: #93c5fd; }
.os-badge--amber  { background: rgba(234, 179, 8,   0.25); color: #fde68a; }
```

### 3.8 Context Menu

```css
.os-context-menu {
  position: fixed;
  background: var(--glass-l4-bg);
  border: 1px solid var(--glass-l4-border);
  border-radius: var(--radius-md);
  padding: 6px;
  min-width: 180px;
  box-shadow: var(--shadow-xl);
  backdrop-filter: var(--glass-l4-blur);
  animation: os-slideUp var(--duration-fast) var(--ease-glass);
  z-index: 99999;
}

.os-context-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-xs);
  font-size: var(--text-base);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-smooth),
              color    var(--duration-fast) var(--ease-smooth);
}
.os-context-menu__item:hover {
  background: rgba(255, 255, 255, 0.10);
  color: var(--text-primary);
}
.os-context-menu__item--danger:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
}
.os-context-menu__separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 4px 0;
}
```

### 3.9 Tooltip

```css
.os-tooltip {
  position: absolute;
  background: rgba(20, 18, 40, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-xs);
  padding: 5px 10px;
  font-size: var(--text-sm);
  color: var(--text-primary);
  white-space: nowrap;
  pointer-events: none;
  box-shadow: var(--shadow-md);
  animation: os-fadeIn var(--duration-fast) var(--ease-smooth);
  z-index: 99998;
}
```

### 3.10 Notification / Toast

```css
.os-toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--glass-l4-bg);
  border: 1px solid var(--glass-l3-border);
  box-shadow: var(--shadow-lg), var(--glass-inset-sm);
  backdrop-filter: var(--glass-l3-blur);
  min-width: 280px;
  max-width: 360px;
  animation: os-slideUp var(--duration-normal) var(--ease-glass);
}
.os-toast__icon { flex-shrink: 0; margin-top: 1px; }
.os-toast__title   { font-size: var(--text-base); font-weight: 500; color: var(--text-primary); }
.os-toast__message { font-size: var(--text-sm); color: var(--text-secondary); margin-top: 2px; }
```

---

## 4. Z-index system

Orden de capas en el stacking context del OS.

```css
:root {
  --z-desktop:       0;      /* wallpaper, iconos */
  --z-windows:       10;     /* ventanas flotantes (dinámico +1 por focus) */
  --z-dock:          1000;   /* dock permanente */
  --z-menubar:       1001;   /* barra de menú */
  --z-context-menu:  9000;   /* context menus */
  --z-modal-overlay: 9500;   /* overlay de modales */
  --z-modal:         9999;   /* modal en sí */
  --z-toast:         10000;  /* notificaciones */
  --z-tooltip:       10001;  /* tooltips */
}
```

---

## 5. Patrones de interacción

### Drag & drop de ventanas

- Siempre usar `will-change: transform` antes del drag, quitarlo después
- Event listeners en `window`, no en el elemento (evita perder el drag fuera del área)
- `user-select: none` en el titlebar
- Al hacer mousedown → `bringToFront()` incrementando z-index
- Mínimos de tamaño al hacer resize (nunca menos de 200×140px)

### Apertura de ventanas

Siempre animar con `os-slideUp` + fade. Ejemplo con React:

```tsx
// En el store: agregar con posición escalonada
const offset = windows.length * 24
addWindow({ x: 80 + offset, y: 60 + offset, ... })
```

### Cierre de ventanas

Añadir clase `os-window--closing` y remover del DOM después de la transición:

```css
.os-window--closing {
  animation: os-fadeOut var(--duration-normal) var(--ease-out) forwards;
}
@keyframes os-fadeOut {
  to { opacity: 0; transform: scale(0.96); }
}
```

---

## 6. Performance

- `backdrop-filter` es costoso. Usar `will-change: backdrop-filter` **solo** en elementos que cambian frecuentemente.
- En elementos draggables: usar `transform: translate(x, y)` en lugar de `left/top` — no provoca layout.
- Limitar el número de elementos con `backdrop-filter` activo simultáneamente a ≤8.
- Para listas largas dentro de ventanas: `overflow-y: auto` con `contain: paint`.

```css
/* Optimización para ventanas con mucho contenido */
.os-window__content {
  contain: paint;
  overflow: hidden;
}
```

---

## 7. Checklist antes de mergear un componente nuevo

Antes de considerar completo cualquier componente, verificar:

- [ ] Usa tokens CSS (`var(--...)`) — ningún valor hardcodeado de color, blur o radius
- [ ] Tiene la capa correcta (L1–L4) según su prominencia en el z-stack
- [ ] Los textos usan `var(--text-primary/secondary/tertiary)` — no `#fff` directo
- [ ] Todas las interacciones tienen transición (`var(--duration-*)`)
- [ ] Los elementos draggables tienen `will-change: transform`
- [ ] El resize/drag usa event listeners en `window`, no en el elemento
- [ ] Los modales/overlays usan `position: fixed` con el z-index correcto del sistema
- [ ] Los botones de acción usan `var(--accent-gradient)` — no colores planos
- [ ] Los bordes son siempre `rgba(255,255,255,N)` semitransparentes
- [ ] El `inset` (highlight superior) está presente en cards y ventanas
- [ ] Hay un `box-shadow` con blur generoso (nunca sombras duras)

---

## 8. Cómo agregar un nuevo componente

1. **Identificar la capa** (L1–L4) según dónde vive en el OS
2. **Copiar el snippet base** de la sección 3 más cercana al componente nuevo
3. **Usar solo tokens** de la sección 2 — nunca valores hardcodeados
4. **Agregar al CSS global** del proyecto (o al CSS module del componente)
5. **Documentar aquí** en la sección 3 si el componente es reutilizable

---

## 9. Archivos relacionados en el proyecto

```
src/
├── styles/
│   ├── tokens.css          ← Variables de la sección 2 (fuente de verdad)
│   ├── base.css            ← Reset + body + font
│   └── animations.css      ← Keyframes globales (os-fadeIn, os-slideUp, etc.)
├── features/
│   └── media-feature/
│       └── media-feature.css  ← Implementación de referencia de ventanas
└── components/
    └── (nuevos componentes van aquí, importando tokens.css)
```

Cuando se cree un nuevo feature, importar `tokens.css` y **no redefinir** ningún token.
