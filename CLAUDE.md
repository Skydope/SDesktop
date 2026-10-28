# CLAUDE.md

Convenciones para trabajar en SDesktop. Contexto del proyecto en [README.md](README.md),
diseño interno en [ARCHITECTURE.md](ARCHITECTURE.md).

## La regla que importa

```bash
pnpm check   # typecheck + lint + tests
```

Antes de cualquier commit. El repo estuvo abandonado acumulando **46 errores de TypeScript y
35 de ESLint** sin que nada fallara nunca, porque `build` era un `vite build` pelado y esbuild
borra los tipos sin chequearlos. Ahora `build` corre `typecheck` primero y la CI corre
`check` + `build` en cada push y PR. No lo desarmes.

**No midas el typecheck con `tsc --noEmit` pelado:** devuelve 0 *falsamente*, porque el
`tsconfig.json` de la raíz es solo `files: []` + project references y no chequea nada. Usá
`pnpm typecheck` (`tsc -b`).

## Gestor de paquetes

**pnpm**, fijado en `packageManager`. Había dos lockfiles trackeados (npm y pnpm); se borró
el de npm. No generes `package-lock.json`.

## Estilos

**[SKILLS/UI/SKILL.md](SKILLS/UI/SKILL.md) manda sobre cualquier CSS nuevo.** Es el design
system "macOS Glass UI" y la consistencia visual es su regla número uno.

- CSS plano a mano, **nada de Tailwind**. Estaba instalado sin cablear y se quitó a propósito.
- Nomenclatura BEM con prefijo `os-`: `os-window__content`, `os-context-menu__item--danger`.
- Los colores y tamaños salen de los tokens de `src/styles/tokens.css` (`--text-primary`,
  `--text-xs`, `--font-mono`, `--z-menubar`…). **No hardcodees valores**: el WIP del context
  menu metió un `color: #0a0a12` en `.os-menubar__button` que dejaba el texto casi invisible
  sobre la menubar oscura.
- Los botones son `os-btn` con sus modificadores (`--primary`, `--secondary`, `--danger`,
  `--sm`, `--icon`). No inventes `os-button`.
- El orden de import en `src/index.css` es significativo: `tokens` → `base` → `animations` →
  `os-components`.

## Imports

No hay path aliases en `tsconfig.app.json`: todos los imports son relativos
(`../../types/desktop`). Si agregás aliases, actualizá también `vite.config.ts` y
`vitest.config.ts`.

Usá `import type` para lo que solo se usa como tipo — `isolatedModules` está activo.

## TypeScript

Fijado en **6** a propósito. TS 7 typechequea bien este proyecto pero `typescript-eslint`
todavía no lo soporta y rompe ESLint por completo
([issue #10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)).
No subas sin verificar eso primero.

`strict`, `noUnusedLocals` y `noUnusedParameters` están activos. Target ES2022 (necesario
para `new Error(msg, { cause })`).

## Dónde va el estado

Hay dos sistemas y **no** son intercambiables (ver
[ARCHITECTURE.md](ARCHITECTURE.md#los-dos-estados)):

- `src/store/desktopStore.ts` — estado de **UI** en Zustand + `localStorage`: ventanas, tema,
  perfil, wallpaper, el árbol `items` del escritorio.
- `src/vfs/` — el **filesystem** POSIX en IndexedDB: lo que ven el Finder y la Terminal.

Están desconectados, y unificarlos es la decisión pendiente número uno. Mientras tanto, si
tocás uno pensá si el otro también necesita el cambio. El caso que ya mordió:
`clearAllData()` reseteaba el store y dejaba el VFS entero adentro.

## Agregar un comando al shell

1. Exportá un `Command` desde el archivo que corresponda en `src/shell/commands/`
   (`fs.ts`, `proc.ts`, `system.ts`).
2. Registralo en `createShell()` en `src/shell/index.ts`.
3. **Todo path que venga del usuario pasa por `resolveArg(path, ctx.env.PWD)`.** El VFS solo
   acepta paths absolutos y tira `Path must be absolute` si no. Ese bloque estuvo copiado 9
   veces y `ls` era el único que no lo tenía, que es exactamente por qué un `ls` pelado
   estaba roto.
4. El cwd es `ctx.env.PWD` y nada más. No agregues una segunda fuente de verdad.

## Agregar una app

1. Sumá el id a `AppId` y la definición a `APP_REGISTRY` en `src/types/desktop.ts`.
2. Agregá el icono al `ICON_MAP` en `src/components/appIcons.ts` (uno solo, compartido por
   `Window` y `Dock`).
3. Despachá el componente en `WindowContent`, en `src/components/Window.tsx`.

Si la app no está implementada todavía, **decilo en el README**. Hay tres apps en el registry
(`textedit`, `preferences`, `calculator`) que caen a un placeholder, y eso tiene que estar
documentado y no descubrirse clickeando.

## Tests

Vitest + jsdom. `src/**/*.test.ts`.

- **jsdom no trae IndexedDB.** Cualquier test que llegue al VFS tiene que stubear
  `src/vfs/storage` con `vi.mock` — el VFS opera sobre su árbol en memoria, así que alcanza.
  Mirá `src/vfs/vfs.test.ts` o `src/store/desktopStore.test.ts`.
- Lógica nueva no trivial (una rama, un loop, un parser) deja al menos un test.
- **Verificá que el test falle contra el código roto** antes de darlo por bueno. Un test que
  pasa contra una implementación con bug es decoración.

## Cosas que la UI dice y no son ciertas

Si tocás algo de esto, o lo implementás o lo seguís documentando — no lo dejes mintiendo en
silencio:

- Todos los atajos ⌘ que muestran la menu bar y los context menus son **decorativos**: hay un
  solo handler de teclado en todo `src/`.
- `theme` se persiste pero **nada lo aplica al DOM**, y no hay tokens de tema claro. La app es
  dark-only.
- `clickCount` **nunca se incrementa**: los contadores de `PropertiesModal` y los "frequent
  items" del StartMenu siempre muestran 0.
- Abrir una app **no spawnea un proceso**: `ps` no refleja el dock ni las ventanas.
- Los permisos del VFS se guardan y se muestran, pero **ninguna operación los chequea**.
- Cut / Copy / Paste están en los context menus y no hacen nada: no hay clipboard.

## Errores

Cada ventana va envuelta en `<ErrorBoundary>` (`src/components/ErrorBoundary.tsx`), así una
app que explota se cae sola sin llevarse el escritorio. Los métodos del VFS tiran excepciones
con soltura, así que mantené eso.

Al re-lanzar un error, encadená el original: `new Error(msg, { cause: err })`. La regla
`preserve-caught-error` lo exige.
