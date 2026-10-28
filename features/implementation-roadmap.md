# SDesktop — Fases de Implementación Futuras

## Visión General

SDesktop es un emulation layer de macOS en web. La experiencia debe ser indistinguible de un OS real para el usuario. Cada click, cada ventana, cada interacción se siente nativa.

Las fases están ordenadas por dependencia. Cada fase depende de la anterior.

---

## Fase 1: Core Desktop Experience ✅ COMPLETADA

### Lo implementado

- **Terminal**: xterm.js con CommandEngine y 25 comandos funcionales
- **Menu Bar**: 🍎 menu, app menus (File/Edit/View/Window/Help), clock en tiempo real
- **Dock**: magnification en hover, bounce animation, running indicators
- **Finder**: file browser VFS-backed con icon/list view, search, navegación
- **Window System**: polimórfico (folder/app), maximize/fullscreen, staggered positioning
- **VFS**: filesystem virtual con IndexedDB persistence
- **Process Manager**: PID table, spawn/kill, señales
- **Boot Sequence**: pantalla de booteo con stages, configurable (skip in settings)
- **CommandEngine**: shell bridge al store — `open`, `theme`, `windows`, `focus`, `inspect`

---

## Fase 2: System Apps Completas

### 2.1 — TextEdit

Editor de texto que lee/escribe del VFS real.

```
src/apps/textedit/
  TextEdit.tsx        # Window wrapper
  TextEditor.tsx      # textarea con line numbers
  useTextEdit.ts      # open/save via VFS
```

**Features:**
- Cmd+S → guardar archivo en VFS (`await vfs.write(path, content)`)
- Cmd+O → File dialog del VFS
- Cmd+N → nuevo archivo
- Line numbers
- Tip: empezar con `<textarea>` estilizado, evolucionar a editor completo

**Dependencias:** VFS (ya existe)

---

### 2.2 — System Preferences

Panel de configuración real que modifica el estado del OS.

```
src/apps/preferences/
  Preferences.tsx          # Window shell
  panes/
    General.tsx           # Appearance (light/dark/auto)
    Desktop.tsx           # Wallpaper picker
    Displays.tsx          # Resolution selector (mock)
    Sound.tsx             # Volume slider (mock)
    Users.tsx             # User profile
    About.tsx             # This Mac, versión del OS
```

**Features:**
- General: tema light/dark → `useDesktopStore.setTheme()`
- Desktop: wallpaper picker con predefined + upload
- About: mostrar versión del OS, specs mockeadas
- Persistencia: settings se guardan en Zustand (ya integrado via persist)

**Dependencias:** VFS, Zustand store (ya existen)

---

### 2.3 — Calculator

Calculator.app clone funcional.

```
src/apps/calculator/
  Calculator.tsx           # Window wrapper
  CalculatorDisplay.tsx    # Result display
  CalculatorPad.tsx        # Botones
  useCalculator.ts         # Lógica de evaluación de expresiones
```

**Features:**
- Evaluador de expresiones real (parsing manual o `math.js`)
- Botones: números, operaciones, %, ±, C, AC
- Display con formato de Calculator (puntos como miles)
- Animación de resultado al calcular
- Keyboard support (numpad)

**Dependencias:** Ninguna nueva

---

## Fase 3: System Integration

### 3.1 — Notification Center

Centro de notificaciones al estilo macOS.

```
src/components/notifications/
  NotificationCenter.tsx    # Panel deslizable desde la derecha
  NotificationItem.tsx     # Notificación individual
  useNotifications.ts      # Hook: notify(title, body, icon)
```

**Features:**
- Corner notification (estilo macOS) → aparecen en la esquina inferior derecha
- Se agrupan después de 3 segundos
- Acceso desde Dock o gesture
- Tipos: info, success, warning, error
- Animación de entrada/salida

**API:**
```ts
notify('Archivo guardado', 'readme.txt se guardó correctamente')
```

**Dependencias:** Ninguna nueva

---

### 3.2 — Spotlight (Búsqueda Global)

Búsqueda universal con Cmd+Space.

```
src/components/spotlight/
  Spotlight.tsx            # Overlay centrado
  SpotlightResults.tsx     # Resultados en tiempo real
  useSpotlight.ts          # Hook: fuzzy search en VFS + apps + commands
```

**Features:**
- Cmd+Space → abre spotlight
- Búsqueda fuzzy con Fuse.js en:
  - Nombres de archivos del VFS
  - Nombres de apps del APP_REGISTRY
  - Comandos del CommandEngine
- Resultados categorizados (Apps, Documents, Commands)
- Keyboard navigation (↑↓ Enter)
- Animación de apertura

**Dependencias:** Fuse.js (`npm install fuse.js`)

---

### 3.3 — Menu Bar Extras

Items del lado derecho de la Menu Bar.

```
src/components/menubar/extras/
  WiFiIcon.tsx              # Indicador Wi-Fi (click → dropdown redes mock)
  BatteryIcon.tsx           # Indicador de batería (mock, siempre 100%)
  ControlCenterIcon.tsx     # Icono de control center
```

**Features:**
- WiFi: dropdown con redes mockeadas, opción de toggle
- Batería: icono con porcentaje (mock)
- Control Center: futuro panel de быстрых настроек

**Dependencias:** MenuBar (ya existe)

---

### 3.4 — Alert Dialogs y Sheets

Sistema de dialogs del sistema.

```
src/components/system-dialogs/
  Alert.tsx                # alert("title", "message", ["OK"])
  Confirm.tsx              # confirm("title", "message") → boolean
  FileSaveDialog.tsx       # Save dialog usando VFS
  FileOpenDialog.tsx       # Open dialog usando VFS
```

**Features:**
- Modal glass con backdrop blur
- Alert: título, mensaje, botón OK
- Confirm: título, mensaje, botones Cancel/OK
- File dialogs: Tree view del VFS para navegar y seleccionar
- Sonidos del sistema (opcional)

**Dependencias:** Ninguna nueva

---

## Fase 4: Drag & Drop + Archivos Reales

### 4.1 — Drag & Drop en Finder

Arrastrar archivos dentro del OS virtual.

```
src/hooks/useFinderDragDrop.ts    # Lógica de drag & drop
```

**Features:**
- Drag de archivos/carpetas dentro del Finder
- Drop en carpetas → move operation (`vfs.move()`)
- Drop con Alt → copy operation (`vfs.copy()`)
- Feedback visual durante el drag (carpeta destino se resalta)

**Dependencias:** Finder (ya existe), VFS (ya existe)

---

### 4.2 — File System Access API

Puente entre archivos reales del SO y el VFS.

```
src/hooks/useRealFiles.ts         # File System Access API
```

**Features:**
- "Import File" → abre file picker real → copia contenido al VFS
- "Export File" → guarda archivo del VFS al disco real
- Compatible con: Chrome, Edge (no Firefox)
- Fallback: download como blob para Firefox

**Dependencias:** Ninguna nueva

---

## Fase 5: Productividad

### 5.1 — TextEdit Avanzado

Evolución del editor básico.

```
src/apps/textedit/
  EditorCore.tsx           # Core editor (textarea + syntax highlighting)
  SyntaxHighlighting.ts    # highlighting para JS/TS/CSS/HTML/MD
  EditorTabs.tsx           # multi-tab support
  EditorMinimap.tsx        # minimap opcional
```

**Features:**
- Syntax highlighting (Prism.js o highlight.js)
- Multi-tab editing
- Find & Replace (Cmd+F, Cmd+Opt+F)
- Go to line (Cmd+G)
- Auto-save cada 30 segundos al VFS

**Dependencias:** Prism.js o highlight.js

---

### 5.2 — Terminal Multiplexer

Evolución de la terminal.

```
src/components/terminal/
  TerminalTabs.tsx          # Multi-tab terminal
  TerminalPane.tsx         # Split panes
  useTerminalSession.ts    # Una sesión por tab
```

**Features:**
- Multiple tabs (como macOS Terminal)
- Split panes (horizontal/vertical)
- Cada tab = nueva instancia de CommandEngine con su cwd

**Dependencias:** Terminal (ya existe)

---

## Fase 6: Desktop Management

### 6.1 — Spaces / Virtual Desktops

Múltiples espacios de trabajo.

```
src/stores/spacesStore.ts         # Estado de spaces
src/components/spaces/
  SpacesBar.tsx                  # Indicador de spaces
  useSpaces.ts                    # Hook para gestionar desktops
```

**Features:**
- 4 virtual desktops (swipe con 3 dedos o arrows)
- Cada desktop tiene su propio wallpaper
- Mission Control (F3) → preview de todos los spaces
- Apps pueden "pertenecer" a un space o ser en todos

**Dependencias:** Window Manager (ya existe)

---

### 6.2 — Window Exposé

Vista de todas las ventanas abiertas.

```
src/components/expose/
  ExposeView.tsx                 # Grid de ventanas
  useExpose.ts                   # Hook
```

**Features:**
- Activar con Ctrl+↑ o pinch con 3 dedos
- Grid de thumbnails de todas las ventanas
- Click → focus window
- Escape → cerrar expose

**Dependencias:** Ninguna nueva

---

## Fase 7: Detalles de Fidelidad

### 7.1 — Sound & Haptics

Sonidos del sistema.

```
src/hooks/useSystemSounds.ts      # Sound manager
public/sounds/                   # Archivos de audio
  window-open.mp3
  window-close.mp3
  dock-click.mp3
  boot.mp3
```

**Features:**
- Boot sound al iniciar la app
- Window open/close sounds (sutiles, 50-100ms)
- Dock click sound al hacer hover
- Bounce sound al abrir app
- Toggle en System Preferences para mutear

**Dependencias:** Ninguna nueva

---

### 7.2 — Context Menus Reales

Menús contextuales completos.

```
src/components/context-menu/
  ContextMenu.tsx                # Componente de context menu
  ContextMenuRegistry.ts          # Registro de menus por contexto
```

**Features:**
- Right-click en desktop → context menu (New Folder, New File, Paste, etc.)
- Right-click en archivo → (Open, Get Info, Cut, Copy, Delete, etc.)
- Right-click en Finder toolbar → customization
- Keyboard shortcuts mostrados en cada item

**Dependencias:** Ninguna nueva

---

### 7.3 — Clipboard Manager

Portapapeles con historia.

```
src/stores/clipboardStore.ts      # Zustand store
src/components/clipboard/
  ClipboardManager.tsx            # Popup con historial
```

**Features:**
- Copy → guarda en historial (últimos 20 items)
- Paste → pega el último
- Clipboard manager popup (opt+cmd+V)
- Soporte: text, images (como base64)

**Dependencias:** Ninguna nueva

---

## Fase 8: Persistencia & Sync

### 8.1 — Perfil de Usuario Persistent

Sistema de usuarios.

```
src/stores/usersStore.ts          # Usuarios y perfiles
src/vfs/users/                    # Directorio de usuarios
  admin/
  guest/
```

**Features:**
- Pantalla de login al boot (opcional, configurable)
- Múltiples usuarios con su propio VFS
- User switching desde Menu Bar (🍎 → Log Out)

**Dependencias:** VFS (ya existe)

---

### 8.2 — Workspace Export/Import

Exportar e importar workspaces.

```
src/hooks/useWorkspaceExport.ts   # Export workspace to JSON
src/hooks/useWorkspaceImport.ts    # Import workspace from JSON
```

**Features:**
- Export: VFS tree + Zustand state → JSON file
- Import: restore full state desde JSON
- Storage: IndexedDB + downloadable JSON

**Dependencias:** VFS, Zustand (ya existen)

---

## Dependencias Entre Fases

```
FASE 1 (completada)
│
├─ FASE 2: System Apps
│   ├─ 2.1 TextEdit        → depende de VFS ✅
│   ├─ 2.2 Preferences     → depende de VFS, Store ✅
│   └─ 2.3 Calculator      → independiente
│
├─ FASE 3: System Integration
│   ├─ 3.1 Notifications   → independiente
│   ├─ 3.2 Spotlight       → depende de Fuse.js
│   ├─ 3.3 Menu Extras     → depende de MenuBar ✅
│   └─ 3.4 Dialogs         → independiente
│
├─ FASE 4: Drag & Drop
│   ├─ 4.1 Finder DnD      → depende de Finder ✅
│   └─ 4.2 Real Files API  → independiente
│
├─ FASE 5: Productividad
│   ├─ 5.1 TextEdit Adv.   → depende de TextEdit 2.1
│   └─ 5.2 Terminal Multi → depende de Terminal ✅
│
├─ FASE 6: Desktop Management
│   ├─ 6.1 Spaces          → independiente
│   └─ 6.2 Exposé          → independiente
│
├─ FASE 7: Detalles
│   ├─ 7.1 Sounds          → independiente
│   ├─ 7.2 Context Menus    → independiente
│   └─ 7.3 Clipboard       → independiente
│
└─ FASE 8: Persistencia
    ├─ 8.1 User Profiles    → depende de VFS ✅
    └─ 8.2 Workspace Export → independiente
```

---

## Paquetes NPM a Instalar (Fases Futuras)

```bash
npm install fuse.js           # Spotlight fuzzy search (Fase 3.2)
npm install mathjs            # Calculator expressions (Fase 2.3)
npm install prismjs           # Syntax highlighting (Fase 5.1)
npm install @types/fuse.js   # TypeScript types
```

---

## Stack Técnico Consolidado

### Ya en uso
- React 19 + TypeScript
- Zustand (state management + persist)
- xterm.js + @xterm/addon-fit
- IndexedDB (via VFS storage)
- CSS custom properties + glass morphism

### Por agregar
- Fuse.js (spotlight search)
- mathjs (calculator)
- Prism.js (syntax highlighting)
- File System Access API (file imports — Chrome/Edge only)

---

## Notas de Implementación

1. **Cada fase debe compilar independently** — no agregar código de fases futuras que bloquee el build actual.

2. **VFS es el source of truth** — todas las apps de файловый manager deben pasar por el VFS, no por el Zustand store.

3. **El store es para UI state** — window positions, theme, wallpaper. No mezclar con data que pertenece al VFS.

4. **Sonidos son opcionales** — implementar sin audio primero, agregar después si el usuario lo pide.

5. **La magia está en los detalles** — los micro-interactions (hover states, transiciones, feedback visual) son lo que hace creíble un OS emulation.
