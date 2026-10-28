# SDesktop

Un emulador de sistema operativo que corre entero en el navegador: escritorio, ventanas
arrastrables, dock con magnificación, menu bar, un Finder sobre un filesystem virtual POSIX
y una terminal con 27 comandos.

No es una metáfora de escritorio sobre una web app. La idea del proyecto es que el usuario
haga lo que espera de un OS y la app se comporte como un OS: `mkdir` en la terminal crea un
directorio de verdad en el filesystem, `ps` lista una tabla de procesos, los permisos se
guardan en octal. Hasta dónde llega esa fidelidad hoy está abajo, sin maquillaje.

```bash
pnpm install && pnpm dev
```

## Stack

| | |
|---|---|
| UI | React 19.3 |
| Build | Vite 8.3 |
| Lenguaje | TypeScript 6 (ver nota abajo) |
| Estado | Zustand 5 + middleware `persist` |
| Terminal | xterm.js 6 + addon-fit |
| Iconos | lucide-react |
| Estilos | CSS propio con tokens + BEM `os-*` (sin Tailwind, a propósito) |
| Tests | Vitest 5 + jsdom + Testing Library |

**TypeScript queda en 6 deliberadamente.** TS 7 (el reescrito nativo en Go) typechequea bien
este proyecto, pero `typescript-eslint` todavía no lo soporta y rompe ESLint por completo.
Revisar [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)
antes de subir.

## Scripts

```bash
pnpm dev           # servidor de desarrollo
pnpm build         # typecheck + build (el typecheck NO es opcional, ver más abajo)
pnpm check         # typecheck + lint + tests, lo que corre la CI
pnpm typecheck     # tsc -b --noEmit
pnpm lint          # eslint
pnpm test          # vitest en watch
pnpm test:run      # vitest una vez
pnpm format        # prettier --write
```

> **Ojo con medir el typecheck a mano.** `tsc --noEmit` pelado devuelve 0 _falsamente_: el
> `tsconfig.json` de la raíz es solo `files: []` + project references, así que no chequea
> nada. Usá `pnpm typecheck` (`tsc -b`), que es lo que corre la CI.

## Estado real por módulo

### Funciona

| Módulo | Qué hace |
|---|---|
| **VFS** (`src/vfs/`) | Filesystem virtual POSIX sobre IndexedDB. Árbol plano indexado por path absoluto, con metadata completa (owner/group, permisos rwx, size, ctime/mtime/atime). `mkdir -p`, `readdir`, `read`, `write`, `unlink`, `rmdir`, `stat`, `move`, `copy`, `chmod`, `touch`. |
| **Shell** (`src/shell/`) | `CommandEngine` con 27 comandos, 3 aliases (`ll`/`la`/`l`) y tokenizer propio con quotes y escapes. |
| **Terminal** (`src/components/terminal/`) | xterm.js con historial, autocompletado con Tab, Ctrl+C, Ctrl+L. Conectada al shell. |
| **Finder** (`src/components/finder/`) | Navegador real del VFS, vista de iconos y de lista, búsqueda, breadcrumbs. |
| **Ventanas** (`src/components/Window.tsx`) | Arrastrar, redimensionar, minimizar, maximizar, cerrar, escalonado en cascada, semáforos. |
| **Dock** (`src/components/dock/`) | Magnificación al hover, bounce al abrir, indicadores de app corriendo, reloj. |
| **Boot** (`src/components/boot/`) | Secuencia de arranque, salteable con `skipBoot` (persistido). |
| **Escritorio** (`src/store/desktopItems.ts`) | Proyecta `/Users/guest/Desktop` del VFS a los iconos del escritorio, y traduce crear/renombrar/borrar al filesystem. |
| **Context menus** | Click derecho en el escritorio y sobre items, con clamping contra los bordes y cierre con Escape. |

### No funciona todavía (y la UI no siempre lo admite)

| Qué | Estado |
|---|---|
| **TextEdit, System Preferences, Calculator** | Están en `APP_REGISTRY` y en el Dock, pero caen a un placeholder "coming soon". De las 5 apps registradas, 2 están implementadas. |
| **Atajos de teclado** | **Todos los ⌘ que muestra la UI son decorativos.** La menu bar anuncia ⌘Q, ⌃⌘Q, ⇧⌘Q; los context menus anuncian ⌘N, ⌘V, ⌘I, ⌘E, ⌘X, ⌘C, ⌘⌫. Ninguno está bindeado. El único handler de teclado de la app es el Escape del context menu. El propio hint del boot screen ("Hold Shift to skip") tampoco tiene listener. |
| **Tema claro** | `theme` se guarda y se persiste, pero **nada lo aplica al DOM** y `tokens.css` no tiene ninguna variante de tema. La app es dark-only; el toggle y el comando `theme light` cambian un valor y nada más. |
| **Cut / Copy / Paste** | Las entradas existen en los context menus y no hacen nada: no hay clipboard. |
| **`clickCount`** | Se persiste y se muestra en PropertiesModal y en los "frequent items" del StartMenu, pero **nada lo incrementa nunca**. Esos contadores siempre muestran 0, y los "frecuentes" son en realidad los primeros 12 items en orden de árbol. |
| **Procesos de apps** | `ProcessManager` funciona, pero **abrir una app no spawnea un proceso**: solo `launchd` existe. Así que `ps` nunca refleja el dock ni las ventanas. `memory` es `Math.random()`. |
| **Permisos del VFS** | Se guardan y se muestran en `ls -l`, pero **ninguna operación los chequea**. |
| **Geometría de ventanas** | La posición y el tamaño viven en estado local del componente, no en el store, así que se pierden al cerrar. `openWindows` tampoco se persiste: las ventanas no sobreviven un reload (es a propósito, por ahora). |
| **Cortar / pegar entre carpetas** | El VFS ya tiene `move` y `copy` recursivos, pero el escritorio todavía no expone arrastrar items entre carpetas. |
| **Accesibilidad** | Mínima. Cero `role=` fuera del context menu y el error boundary, cero focus trap en los 6 modales, drag solo con mouse. |

### Un solo filesystem

El escritorio **es** `/Users/guest/Desktop`. No hay un árbol de items aparte: el escritorio,
el Finder y la Terminal son tres vistas en vivo del mismo VFS.

```
$ cd Desktop && mkdir Proyectos      # aparece en el escritorio al instante
$ rm -r Proyectos                    # y desaparece
```

Crear, renombrar o borrar desde el escritorio se ve en `ls` y en el Finder, y al revés, sin
recargar. Renombrar un item es literalmente un `move` en el filesystem, porque el nombre del
archivo es el título.

Hasta octubre de 2026 esto no era así: el escritorio vivía en un árbol de Zustand en
`localStorage` y el Finder y la Terminal en el VFS en IndexedDB, dos modelos incompatibles de
la misma cosa. El detalle está en [ARCHITECTURE.md](ARCHITECTURE.md#una-sola-fuente-de-verdad).

## Estructura

```
src/
├── vfs/            filesystem virtual POSIX sobre IndexedDB
├── shell/          CommandEngine + los 27 comandos
├── process/        tabla de procesos (simulada)
├── store/          estado de UI en Zustand + la proyeccion VFS <-> escritorio
├── components/     escritorio, ventanas, dock, menubar, finder, terminal, modales
├── hooks/          useWindowManagement, useToast, useTheme
├── types/          APP_REGISTRY y los tipos del escritorio
└── styles/         tokens.css → base.css → animations.css → os-components.css
```

- [ARCHITECTURE.md](ARCHITECTURE.md) — cómo está armado por dentro y qué decisiones quedan pendientes
- [CLAUDE.md](CLAUDE.md) — convenciones para trabajar en el repo
- [SKILLS/UI/SKILL.md](SKILLS/UI/SKILL.md) — el design system "macOS Glass UI". **Manda sobre cualquier CSS nuevo.**
- [features/implementation-roadmap.md](features/implementation-roadmap.md) — roadmap por fases
- [features/terminal-feature/](features/terminal-feature/terminal-feature.md) — la spec del runtime de comandos
- [features/media-feature/](features/media-feature/README.md) — feature drop-in **sin integrar**: 8 archivos que nada en `src/` importa

## Contribuir

```bash
pnpm check   # typecheck + lint + tests, antes de cualquier commit
```

La CI corre exactamente eso más el build. El repo estuvo abandonado con 46 errores de
TypeScript y 35 de ESLint acumulados precisamente porque nada de esto estaba cableado.
