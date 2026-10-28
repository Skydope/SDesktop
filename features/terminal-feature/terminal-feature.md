# 🧠 SDesktop — Command Runtime Implementation

Este documento define la arquitectura e implementación del sistema de terminal/command layer para SDesktop.

No es una terminal real. Es un **runtime de comandos para controlar el OS simulado**.

---

# 🧩 1. Concepto base

La terminal no ejecuta comandos del sistema operativo.

👉 Ejecuta **acciones sobre el estado del SDesktop**.

Ejemplo mental:

```
open chrome
```

No significa abrir Chrome real.
Significa:

> “crear una ventana/app Chrome dentro del estado del desktop”

---

# 🧠 2. Arquitectura general

Separación en 3 capas:

## 1. Command Engine (core puro)
- No depende de React
- No conoce UI
- Solo interpreta comandos

## 2. System Context (Zustand store)
- Estado global del OS simulado
- Windows, apps, theme, workspace

## 3. UI Terminal
- Input/output visual
- Historial de comandos
- Hook directo al engine

---

# ⚙️ 3. Command Engine (Kernel)

```ts
export type CommandContext = {
  windows: any[];
  openWindow: (app: string) => void;
  closeWindow: (id: string) => void;
  setTheme: (theme: string) => void;
  focusWindow: (id: string) => void;
};

type Command = (args: string[], ctx: CommandContext) => string | void | Promise<string | void>;

export class CommandEngine {
  private commands: Record<string, Command> = {};

  register(name: string, handler: Command) {
    this.commands[name] = handler;
  }

  async execute(input: string, ctx: CommandContext): Promise<string> {
    const [cmd, ...args] = input.trim().split(" ");

    const command = this.commands[cmd];

    if (!command) {
      return `❌ Command not found: ${cmd}`;
    }

    const result = await command(args, ctx);

    return typeof result === "string" ? result : "OK";
  }
}
```

---

# 🧩 4. System State (Zustand)

```ts
import { create } from "zustand";

export const useDesktopStore = create((set) => ({
  windows: [],

  openWindow: (app: string) =>
    set((state) => ({
      windows: [...state.windows, { id: crypto.randomUUID(), app }],
    })),

  closeWindow: (id: string) =>
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
    })),

  theme: "dark",

  setTheme: (theme: string) => set({ theme }),
}));
```

---

# 🔌 5. Command Registry (plugin-like system)

```ts
import { CommandEngine } from "./commandEngine";

export function registerCommands(engine: CommandEngine, store: any) {
  engine.register("open", (args, ctx) => {
    ctx.openWindow(args[0]);
  });

  engine.register("close", (args, ctx) => {
    ctx.closeWindow(args[0]);
  });

  engine.register("theme", (args, ctx) => {
    ctx.setTheme(args[0]);
  });

  engine.register("help", () => {
    return "open, close, theme, workspace, focus";
  });
}
```

---

# 🖥️ 6. Terminal UI (React layer)

Responsabilidad mínima:

- Capturar input
- Mostrar output
- Llamar engine

```tsx
const [history, setHistory] = useState<string[]>([]);
const [input, setInput] = useState("");

const store = useDesktopStore();

const run = async () => {
  const output = await engine.execute(input, {
    windows: store.windows,
    openWindow: store.openWindow,
    closeWindow: store.closeWindow,
    setTheme: store.setTheme,
    focusWindow: () => {},
  });

  setHistory((h) => [...h, `$ ${input}`, output]);
  setInput("");
};
```

---

# 🧪 7. Diseño de comandos (IMPORTANT)

## ❌ No hacer
- Simular bash real
- Emular filesystem real
- Copiar Linux CLI

## ✅ Sí hacer
- Comandos de control del OS simulado
- Acciones sobre UI state
- Automatización del desktop

---

# 🎯 8. Command categories (recomendado)

## 🪟 Window control
```
open chrome
close window-123
focus notes
```

## 🎛️ System control
```
theme dark
workspace dev
```

## 🧠 Introspection
```
inspect windows
dump state
help
```

## 🤖 Automation (fase avanzada)
```
wait 2000
open chrome
open notes
```

---

# 🚀 9. Evolución futura

## Fase 1
- Command engine básico
- Window control

## Fase 2
- Workspaces
- Introspection

## Fase 3
- Macros / scripting

## Fase 4
- Plugin system
- “SDesktop SDK”

---

# 🧨 Idea clave final

Esto NO es una terminal.

Es un:

> 🧠 **Command runtime para un sistema operativo simulado en React**

La terminal es solo una interfaz de control.
El valor real está en el sistema que controla.

