import type { Command } from '../engine'
import { APP_REGISTRY } from '../../types/desktop'

export const openCommand: Command = {
  name: 'open',
  description: 'Open an application',
  usage: 'open [-a app] [file]',
  handler: async (args, ctx) => {
    const appIndex = args.indexOf('-a')
    if (appIndex !== -1 && args[appIndex + 1]) {
      const appName = args[appIndex + 1].toLowerCase()
      const appId = Object.keys(APP_REGISTRY).find(
        id => id.toLowerCase() === appName || APP_REGISTRY[id as keyof typeof APP_REGISTRY].name.toLowerCase() === appName
      ) as keyof typeof APP_REGISTRY | undefined

      if (!appId) {
        throw new Error(`open: ${appName}: application not found`)
      }

      ctx.openApp(appId)
      return ''
    }

    const filePath = args[0]
    if (!filePath) {
      throw new Error('open: missing file operand')
    }

    return ''
  },
}

export const closeCommand: Command = {
  name: 'close',
  description: 'Close a window',
  usage: 'close [window-id]',
  handler: async (args, ctx) => {
    if (args.length === 0) {
      const active = ctx.listWindows().find(w => w.isActive)
      if (active) {
        ctx.closeWindow(active.id)
        return ''
      }
      throw new Error('close: no active window to close')
    }

    const windowId = args[0]
    ctx.closeWindow(windowId)
    return ''
  },
}

export const themeCommand: Command = {
  name: 'theme',
  description: 'Change the system theme',
  usage: 'theme [light|dark]',
  handler: async (args, ctx) => {
    if (args.length === 0) {
      return 'Current theme: dark'
    }

    const theme = args[0].toLowerCase()
    if (theme !== 'light' && theme !== 'dark') {
      throw new Error(`theme: invalid theme '${theme}' (use light or dark)`)
    }

    ctx.setTheme(theme as 'light' | 'dark')
    return ''
  },
}

export const windowsCommand: Command = {
  name: 'windows',
  description: 'List open windows',
  usage: 'windows',
  handler: async (_, ctx) => {
    const wins = ctx.listWindows()

    if (wins.length === 0) {
      return 'No open windows'
    }

    const lines = ['ID                                    TITLE                     TYPE']
    for (const w of wins) {
      const id = w.id.substring(0, 36).padEnd(37)
      const title = w.title.substring(0, 25).padEnd(26)
      const type = w.type
      const marker = w.isActive ? ' *' : ''
      lines.push(`${id}${title}${type}${marker}`)
    }

    return lines.join('\n')
  },
}

export const focusCommand: Command = {
  name: 'focus',
  description: 'Focus a window by title',
  usage: 'focus <title>',
  handler: async (args, ctx) => {
    if (args.length === 0) {
      throw new Error('focus: missing window title')
    }

    const title = args.join(' ').toLowerCase()
    const wins = ctx.listWindows()
    const match = wins.find(w => w.title.toLowerCase().includes(title))

    if (!match) {
      throw new Error(`focus: no window matching '${title}'`)
    }

    ctx.focusWindow(match.id)
    return ''
  },
}

export const inspectCommand: Command = {
  name: 'inspect',
  description: 'Display system information',
  usage: 'inspect [windows|state|vfs|process]',
  handler: async (args, ctx) => {
    const target = args[0] || 'state'

    switch (target) {
      case 'windows':
        return JSON.stringify(ctx.listWindows(), null, 2)
      case 'state':
        return JSON.stringify({
          cwd: ctx.env.PWD,
          env: ctx.env,
        }, null, 2)
      case 'vfs':
        return JSON.stringify(ctx.vfs.getTree(), null, 2)
      case 'process':
        return JSON.stringify(ctx.processManager.list(), null, 2)
      default:
        throw new Error(`inspect: unknown target '${target}'`)
    }
  },
}

export const helpCommand: Command = {
  name: 'help',
  description: 'Show available commands',
  usage: 'help [command]',
  handler: async (args) => {
    if (args.length > 0) {
      const cmdName = args[0]
      return `Help for ${cmdName}: coming soon`
    }

    const commands = [
      'File Commands:',
      '  ls, cd, pwd, mkdir, rm, touch, cat, cp, mv',
      '',
      'Process Commands:',
      '  ps, kill',
      '',
      'System Commands:',
      '  echo, export, env, clear, whoami, hostname, uname, date, history',
      '',
      'OS Commands:',
      '  open, close, theme, windows, focus, inspect, help',
    ]

    return commands.join('\n')
  },
}
