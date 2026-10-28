# Arquitectura

Cómo está armado SDesktop **hoy**, no cómo debería estar. Lo que está mal está marcado como tal.

## Arranque

`src/main.tsx` monta `<ErrorBoundary label="SDesktop">` → `<StrictMode>` → `App`.

`src/App.tsx`:

1. Un `useEffect` espera `vfs.init()` y después spawnea `launchd` en el process manager. Si `vfs.init()` falla (IndexedDB bloqueada, ventana privada) se muestra una pantalla de error — antes quedaba colgado en "Loading..." para siempre.
2. Muestra `BootScreen`, salvo que `skipBoot` esté persistido.
3. Monta `<MenuBar /> <Desktop /> <Dock /> <ToastContainer />`.

## Los dos estados

Esta es la decisión estructural más importante del proyecto, y es la que hay que revertir.

### `src/store/desktopStore.ts` — estado de UI

Zustand con middleware `persist` sobre `localStorage`, clave `desktopState`.

```ts
{
  wallpaper: string
  theme: 'light' | 'dark'                // se persiste pero NADA lo aplica al DOM
  items: (ShortcutItem | FolderItem)[]   // árbol recursivo
  openWindows: WindowState[]
  isStartMenuOpen: boolean
  userProfile: { name, avatar }
  skipBoot: boolean
}
```

`partialize` guarda todo **menos `openWindows` e `isStartMenuOpen`**: las ventanas no sobreviven un reload, a propósito.

> **No tiene `version` ni `migrate`.** El próximo cambio de shape del store va a corromper en silencio el estado guardado de cualquiera que ya haya usado la app. Pendiente.

**El acoplamiento caro:** `WindowState.content` es una **copia completa** del `FolderItem`. Por eso `addItemToFolder`, `updateItem` y `deleteItem` tienen cada uno un loop que recorre `openWindows` resincronizando copias. Es la mayor fuente de complejidad del store, y desaparece sola si se unifica con el VFS.

### `src/vfs/` — el filesystem

`VirtualFilesystem` singleton. El árbol es **plano, indexado por path absoluto**:

```ts
type VFSTree = { [path: string]: VFSNode }   // children: string[] guarda paths hijos
```

Cada `VFSNode` tiene metadata POSIX completa: owner, group, permisos rwx, size, ctime/mtime/atime. `formatPermissions` los imprime en octal para `ls -l`.

Persistencia: `src/vfs/storage.ts` sobre **IndexedDB** (`sdesktop-vfs` v1, store `vfs-tree`, un solo registro `key:'tree'`). El árbol entero se serializa en cada mutación.

Las lecturas (`read`, `readdir`) actualizan `accessedAt` **solo en memoria** y no persisten: reescribir el árbol completo en cada `cat` costaba una escritura O(árbol). Es el mismo trade-off que `noatime` en un filesystem real.

Árbol sembrado en el primer arranque:

```
/
/Users/guest/{Desktop,Documents,Downloads,Pictures,Music,Movies,.config,.local}
/System   /Applications   /bin   /var/log
```

`move` y `copy` comparten `remapSubtree(fromRoot, toRoot, mode)`, que recorre **todo** el árbol filtrando por prefijo de path. Tiene que ser así y no por `node.children`: los paths son las claves, así que los nietos —y los arrays `children` que los apuntan— también hay que reescribirlos. Iterar solo los hijos directos dejaba los nietos huérfanos en su path viejo. Era el bug más serio del módulo; `src/vfs/vfs.test.ts` lo pincha.

> **Los permisos se guardan pero no se aplican.** Ninguna operación del VFS mira `node.permissions`.

## Ventanas

- **El z-order es el orden del array** `openWindows`. `openWindow`/`openApp` pushean al final y ponen `isActive: false` en todos los demás.
- `setActiveWindow` solo da vuelta el flag `isActive`, **no reordena**, así que el foco y el orden de pintado pueden discrepar. Pendiente.
- La posición y el tamaño viven en estado local vía `src/hooks/useWindowManagement.ts` (drag + resize desde la esquina, `minSize` 320×240, listeners de `mousemove` a nivel `window`). **No están en el store**, así que la geometría se pierde al cerrar.
- El escalonado en cascada llega como prop `index` desde `Desktop.tsx`, que ya mapea `openWindows`. Antes se leía `(win as any)._windowIndex`, una propiedad que no existía en ningún lado, así que el offset siempre era 0.
- Cada ventana va envuelta en `<ErrorBoundary>`: una app que explota se cae sola y no se lleva el escritorio.

## Registro de apps

`APP_REGISTRY` en `src/types/desktop.ts`, un `Record<AppId, AppDefinition>` estático de 5 apps: `finder`, `terminal`, `textedit`, `preferences`, `calculator`.

`store.openApp(appId)` lee el registry, arma un id `${appId}-${Date.now()}` y pushea una ventana. El render despacha por `appId` en `WindowContent` (`src/components/Window.tsx`): solo `terminal` y `finder` tienen implementación real; las otras tres caen a un placeholder.

> **`openApp` ignora `windowWidth`/`windowHeight` del registry.** La Calculadora abre a 700×480 en vez de 240×360. Pendiente.

Los strings de `icon` se mapean a componentes de lucide en `src/components/appIcons.ts` (`ICON_MAP`), compartido por `Window` y `Dock` — antes estaba duplicado en los dos.

## Shell

`src/shell/engine.ts` — `CommandEngine` con un `Map` de comandos, un mapa de aliases, un `tokenize()` propio (quotes + escapes con backslash) y un `execute()` que atrapa lo que tiren los handlers y lo formatea como `sdesktop: <cmd>: <mensaje>`.

`createCommandContext()` arma el contexto: `env` (HOME, USER, SHELL, PATH, PWD), `vfs`, `processManager` y los bridges al store (`openApp`, `closeWindow`, `setTheme`, `focusWindow`, `listWindows`).

**El cwd es `ctx.env.PWD`, y solo eso.** `cd` lo muta, y como `Terminal.tsx` guarda el contexto en un `useRef` estable, la mutación persiste durante la sesión. Antes existía también un campo `ctx.cwd` congelado en `/Users/guest` que solo leía `ls`: dos fuentes de verdad. Se eliminó.

`src/shell/index.ts` registra 27 comandos y 3 aliases:

| Grupo | Comandos |
|---|---|
| Filesystem | `ls` `cd` `pwd` `mkdir` `rm` `cat` `echo` `touch` `cp` `mv` |
| Entorno | `whoami` `date` `env` `export` `clear` `uname` `hostname` `history` |
| Procesos | `ps` `kill` |
| OS | `open` `close` `theme` `windows` `focus` `inspect` `help` |
| Aliases | `ll` `la` `l` → `ls` |

Todo comando que recibe un path del usuario pasa por `resolveArg(path, pwd)` en `src/shell/commands/fs.ts`, que lo resuelve a absoluto y soporta `.`, `..` y `~`. Antes ese bloque estaba copiado 9 veces y `ls` era el único que no lo tenía — por eso un `ls` pelado tiraba `Path must be absolute: .`. Está cubierto en `src/shell/commands/fs.test.ts`.

> El shell es el puente diseñado terminal → store: `open` llama `openApp`, `theme` llama `setTheme`, `windows`/`focus`/`inspect` leen y enfocan ventanas. Ese puente funciona.

## Procesos

`src/process/processManager.ts` — singleton con un `Map<pid, ProcessInfo>`, `nextPid` incremental, `spawn`/`kill`/`list`/`findByAppId`/`findByPid`/`update`, y un `Set` de listeners para `subscribe`.

Es una tabla **simulada**: `memory` es `Math.random()`. `SIGTERM` marca `stopped` y borra después de 1s; `SIGKILL` borra al instante.

> **Abrir una app no spawnea un proceso.** Solo `launchd` existe, spawneado desde `App.tsx`, así que `ps` nunca refleja el dock ni las ventanas. Es el gap de fidelidad más visible después del de los dos filesystems.

## Estilos

CSS plano escrito a mano, importado en orden desde `src/index.css`:

```
tokens.css  →  base.css  →  animations.css  →  os-components.css
```

`os-components.css` son ~2.650 líneas — el archivo más grande del repo por 5×. Nomenclatura BEM `os-*` (`os-window__content`, `os-context-menu__item--danger`, `os-btn--danger`).

**No hay Tailwind, a propósito.** Estaba instalado y 100% sin cablear (sin plugin en `vite.config.ts`, sin `@import "tailwindcss"`, cero clases de utilidad usadas) y se quitó. Las reglas del design system están en [SKILLS/UI/SKILL.md](SKILLS/UI/SKILL.md).

## Decisiones pendientes

### 1. Unificar los dos filesystems

El cambio más grande, y el que más fidelidad compra.

**Propuesta:** el VFS pasa a ser la única fuente de verdad. `/Users/guest/Desktop` *es* el escritorio, y `Desktop.tsx` lo lee con `vfs.readdir()`. El store queda solo para UI: ventanas, tema, perfil, wallpaper.

Qué arregla de un saque:

- `mkdir` en la terminal aparece en el escritorio, y al revés.
- Desaparecen los loops de resincronización de `WindowState.content`.
- Desaparece el árbol recursivo `items` y sus 5 helpers.

Qué cuesta: toca `Desktop`, `DesktopItem`, `StartMenu`, `Dock`, los 6 modales y el store. Necesita una ruta de migración para el `localStorage` que los usuarios ya tengan.

### 2. Atajos de teclado reales

Hoy hay **un solo** handler de teclado en todo `src/` (el Escape del context menu) y todos los ⌘ que muestra la UI son decorativos. Un OS sin teclado no es un OS. Hace falta un `useKeyboardShortcuts` global: ⌘W, ⌘Q, ⌘Tab, Escape, y el Shift del boot screen.

### 3. Accesibilidad

Cero `role=` fuera del context menu y el error boundary. Los 6 modales no tienen `role="dialog"`, ni focus trap, ni restauración de foco. Los items del escritorio son `<div>`s clickeables. El drag es mouse-only (`mousemove`), sin teclado ni pointer events.

### 4. Tema claro

`theme` se persiste y nada lo aplica. `tokens.css` no tiene variantes de tema: no hay `[data-theme]` ni `prefers-color-scheme`. Hacerlo funcionar significa escribir una paleta clara completa para ~2.650 líneas de CSS. Mientras no exista, el toggle y `theme light` son no-ops, y el README lo dice.

### 5. `version` / `migrate` en el middleware `persist`

Sin esto, el próximo cambio de shape del store corrompe el estado de los usuarios en silencio.

### 6. `clickCount` no se incrementa nunca

Se persiste, se muestra en `PropertiesModal` y ordena los "frequent items" del StartMenu, pero nada lo sube: esos contadores siempre dicen 0, y los "frecuentes" son en realidad los primeros 12 items en orden de árbol. El incrementador existía en `src/utils/traversal.ts`, un archivo que nadie importaba y que se borró. Son ~3 líneas en el store más una llamada en `handleItemClick`.

### 7. `openApp` ignora el tamaño del registry

`windowWidth` / `windowHeight` de `APP_REGISTRY` no se aplican a la ventana creada.

### 8. `setActiveWindow` no reordena

El foco y el orden de pintado pueden discrepar, porque el z-order es el orden del array.

### 9. Reparentar huérfanos al matar un proceso

`kill` borra el padre y deja a los hijos con un `ppid` colgado. Nada lee `ppid` todavía, así que no se nota.

### 10. `features/media-feature/` sin integrar

8 archivos fuente (store propio, hook de drag, 4 componentes, CSS) que nada en `src/` importa. O se integra, o se borra.
