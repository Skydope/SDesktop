# media-feature

Ventanas flotantes draggables estilo macOS para imágenes y videos de YouTube.

## Estructura

```
media-feature/
├── store/
│   └── useMediaStore.ts     # Zustand store (windows, z-index, drag state)
├── hooks/
│   └── useMediaDrag.ts      # Drag & resize logic
├── components/
│   ├── MediaDesktop.tsx     # Orchestrador principal
│   ├── MediaWindow.tsx      # Ventana draggable
│   ├── MediaViewer.tsx      # Imagen vs YouTube
│   └── AddMediaModal.tsx    # Modal de alta por URL
├── media-feature.css        # Todos los estilos glassmorphism
└── index.ts                 # Barrel exports
```

## Integración rápida

**1. Copiar la carpeta** a `src/features/media-feature/`

**2. Importar el CSS** en tu `main.tsx` o App entry:
```tsx
import './features/media-feature/media-feature.css'
```

**3. Renderizar `MediaDesktop` dentro del área del escritorio:**
```tsx
import { MediaDesktop } from './features/media-feature'

function Desktop() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* ...otros componentes del OS... */}
      <MediaDesktop />
    </div>
  )
}
```

El contenedor padre debe tener `position: relative` (o `absolute/fixed`).

## Uso desde el store (dock, context menu, etc.)

```tsx
import { useMediaStore } from './features/media-feature'

function DockIcon() {
  const addWindow = useMediaStore(s => s.addWindow)

  return (
    <button onClick={() => addWindow('youtube', 'https://youtu.be/dQw4w9WgXcQ')}>
      Abrir video
    </button>
  )
}
```

## API del store

| Acción | Firma |
|--------|-------|
| Agregar ventana | `addWindow(type: 'image' \| 'youtube', url: string)` |
| Cerrar ventana | `removeWindow(id: string)` |
| Traer al frente | `bringToFront(id: string)` |
| Minimizar/restaurar | `toggleMinimize(id: string)` |
| Mover | `updatePosition(id, x, y)` |
| Redimensionar | `updateSize(id, width, height)` |

## Personalización del CSS

Las variables clave a sobreescribir:

```css
.media-window {
  /* Cambiá el blur y opacidad del glass */
  backdrop-filter: blur(24px) saturate(180%);
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.modal__btn--add {
  /* Cambiá el color del botón principal */
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
}
```
