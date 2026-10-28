import { vfs } from '../vfs'
import { processManager } from '../process'
import { useDesktopStore } from '../store/desktopStore'

export interface CommandContext {
  env: Record<string, string>
  vfs: typeof vfs
  processManager: typeof processManager
  openApp: (appId: string) => void
  closeWindow: (id: string) => void
  setTheme: (theme: 'light' | 'dark') => void
  focusWindow: (id: string) => void
  listWindows: () => Array<{ id: string; title: string; type: string; isActive: boolean }>
}

export type CommandHandler = (args: string[], ctx: CommandContext) => Promise<string>

export interface Command {
  name: string
  description: string
  usage: string
  handler: CommandHandler
}

export class CommandEngine {
  private commands: Map<string, Command> = new Map()
  private aliases: Map<string, string> = new Map()

  register(cmd: Command): void {
    this.commands.set(cmd.name, cmd)
  }

  alias(alias: string, command: string): void {
    this.aliases.set(alias, command)
  }

  async execute(input: string, ctx: CommandContext): Promise<string> {
    const trimmed = input.trim()
    if (!trimmed) return ''

    const tokens = this.tokenize(trimmed)
    if (tokens.length === 0) return ''

    let cmdName = tokens[0]
    const args = tokens.slice(1)

    if (this.aliases.has(cmdName)) {
      cmdName = this.aliases.get(cmdName)!
    }

    const cmd = this.commands.get(cmdName)
    if (!cmd) {
      return `sdesktop: ${cmdName}: command not found`
    }

    try {
      return await cmd.handler(args, ctx)
    } catch (err) {
      if (err instanceof Error) {
        return `sdesktop: ${cmdName}: ${err.message}`
      }
      return `sdesktop: ${cmdName}: unknown error`
    }
  }

  private tokenize(input: string): string[] {
    const tokens: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''
    let escaped = false

    for (let i = 0; i < input.length; i++) {
      const char = input[i]

      if (escaped) {
        current += char
        escaped = false
        continue
      }

      if (char === '\\') {
        escaped = true
        continue
      }

      if (inQuotes) {
        if (char === quoteChar) {
          inQuotes = false
        } else {
          current += char
        }
        continue
      }

      if (char === '"' || char === "'") {
        inQuotes = true
        quoteChar = char
        continue
      }

      if (char === ' ' || char === '\t') {
        if (current.length > 0) {
          tokens.push(current)
          current = ''
        }
        continue
      }

      current += char
    }

    if (current.length > 0) {
      tokens.push(current)
    }

    return tokens
  }

  listCommands(): string[] {
    return Array.from(this.commands.keys()).sort()
  }

  getCommand(name: string): Command | undefined {
    return this.commands.get(name)
  }
}

export const createCommandContext = (): CommandContext => {
  const store = useDesktopStore.getState()

  return {
    env: {
      HOME: '/Users/guest',
      USER: 'guest',
      SHELL: '/bin/sdesktop',
      PATH: '/bin:/usr/bin',
      PWD: '/Users/guest',
    },
    vfs,
    processManager,
    openApp: (appId: string) => store.openApp(appId),
    closeWindow: (id: string) => store.closeWindow(id),
    setTheme: (theme) => store.setTheme(theme),
    focusWindow: (id: string) => store.setActiveWindow(id),
    listWindows: () =>
      store.openWindows.map((w) => ({
        id: w.id,
        title: w.title,
        type: w.type,
        isActive: w.isActive,
      })),
  }
}
