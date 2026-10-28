import type { Command } from '../engine'
import { formatPermissions } from '../../vfs/types'

const HOME = '/Users/guest'

/**
 * Resuelve un path que escribio el usuario a absoluto, contra el PWD del
 * contexto. El VFS solo acepta absolutos, asi que TODO comando que reciba un
 * path tiene que pasar por aca. Soporta '.', '..' y '~'.
 */
export const resolveArg = (path: string, pwd: string): string => {
  const expanded =
    path === '~' || path.startsWith('~/') ? HOME + path.slice(1) : path
  const absolute = expanded.startsWith('/') ? expanded : pwd + '/' + expanded

  const parts: string[] = []
  for (const segment of absolute.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') {
      parts.pop()
      continue
    }
    parts.push(segment)
  }

  return '/' + parts.join('/')
}

export const lsCommand: Command = {
  name: 'ls',
  description: 'List directory contents',
  usage: 'ls [-la] [path...]',
  handler: async (args, ctx) => {
    let showHidden = false
    let longFormat = false
    let paths = ['.']

    for (const arg of args) {
      if (arg === '-l') {
        longFormat = true
      } else if (arg === '-a') {
        showHidden = true
      } else if (arg === '-la' || arg === '-al') {
        longFormat = true
        showHidden = true
      } else if (!arg.startsWith('-')) {
        paths = [arg]
      }
    }

    const entries = await ctx.vfs.readdir(resolveArg(paths[0], ctx.env.PWD))

    if (longFormat) {
      const lines = entries
        .filter(e => showHidden || !e.name.startsWith('.'))
        .map(e => {
          const perms = formatPermissions(e.permissions)
          const type = e.type === 'folder' ? 'd' : '-'
          const size = e.size.toString().padStart(8)
          const date = new Date(e.modifiedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
          return `${type}${perms}  1 ${e.owner}  ${e.group}  ${size}  ${date}  ${e.name}${e.type === 'folder' ? '/' : ''}`
        })
      return lines.join('\n')
    }

    const names = entries
      .filter(e => showHidden || !e.name.startsWith('.'))
      .map(e => e.type === 'folder' ? `\x1b[1;34m${e.name}/\x1b[0m` : e.name)
      .join('  ')

    return names || ''
  },
}

export const cdCommand: Command = {
  name: 'cd',
  description: 'Change the current working directory',
  usage: 'cd [directory]',
  handler: async (args, ctx) => {
    if (args.length === 0 || args[0] === '~') {
      ctx.env.PWD = '/Users/guest'
      ctx.env.HOME = '/Users/guest'
      return ''
    }

    if (args[0] === '-') {
      ctx.env.PWD = ctx.env.OLDPWD || '/Users/guest'
      return ''
    }

    const targetPath = resolveArg(args[0], ctx.env.PWD)

    const exists = await ctx.vfs.exists(targetPath)
    if (!exists) {
      throw new Error(`cd: ${args[0]}: No such file or directory`)
    }

    const stat = await ctx.vfs.stat(targetPath)
    if (stat.type !== 'folder') {
      throw new Error(`cd: ${args[0]}: Not a directory`)
    }

    ctx.env.OLDPWD = ctx.env.PWD
    ctx.env.PWD = targetPath
    return ''
  },
}

export const pwdCommand: Command = {
  name: 'pwd',
  description: 'Print working directory',
  usage: 'pwd',
  handler: async (_, ctx) => ctx.env.PWD,
}

export const mkdirCommand: Command = {
  name: 'mkdir',
  description: 'Create directories',
  usage: 'mkdir [-p] directory...',
  handler: async (args, ctx) => {
    const parents = args.includes('-p')
    const paths = args.filter(a => !a.startsWith('-'))

    for (const path of paths) {
      const targetPath = resolveArg(path, ctx.env.PWD)

      try {
        await ctx.vfs.mkdir(targetPath, parents)
      } catch (err) {
        if (err instanceof Error) {
          throw new Error(`mkdir: cannot create directory '${path}': ${err.message}`, {
            cause: err,
          })
        }
      }
    }

    return ''
  },
}

export const rmCommand: Command = {
  name: 'rm',
  description: 'Remove files or directories',
  usage: 'rm [-rf] file...',
  handler: async (args, ctx) => {
    const recursive = args.includes('-r') || args.includes('-rf')
    const paths = args.filter(a => !a.startsWith('-'))

    for (const path of paths) {
      const targetPath = resolveArg(path, ctx.env.PWD)

      const exists = await ctx.vfs.exists(targetPath)
      if (!exists) {
        throw new Error(`rm: ${path}: No such file or directory`)
      }

      const stat = await ctx.vfs.stat(targetPath)
      if (stat.type === 'folder' && !recursive) {
        throw new Error(`rm: ${path}: Is a directory (use -r to remove)`)
      }

      if (stat.type === 'folder') {
        await ctx.vfs.rmdir(targetPath)
      } else {
        await ctx.vfs.unlink(targetPath)
      }
    }

    return ''
  },
}

export const catCommand: Command = {
  name: 'cat',
  description: 'Display file contents',
  usage: 'cat file...',
  handler: async (args, ctx) => {
    if (args.length === 0) {
      throw new Error('cat: missing file operand')
    }

    const outputs: string[] = []
    for (const path of args) {
      const targetPath = resolveArg(path, ctx.env.PWD)

      const exists = await ctx.vfs.exists(targetPath)
      if (!exists) {
        throw new Error(`cat: ${path}: No such file or directory`)
      }

      const stat = await ctx.vfs.stat(targetPath)
      if (stat.type === 'folder') {
        throw new Error(`cat: ${path}: Is a directory`)
      }

      const content = await ctx.vfs.read(targetPath)
      outputs.push(content)
    }

    return outputs.join('\n')
  },
}

export const echoCommand: Command = {
  name: 'echo',
  description: 'Display a line of text',
  usage: 'echo [-n] [string...]',
  handler: async (args, ctx) => {
    const noNewline = args[0] === '-n'
    if (noNewline) args.shift()

    const text = args
      .map(arg => {
        if (arg.startsWith('$')) {
          const varName = arg.slice(1)
          return ctx.env[varName] || ''
        }
        return arg
      })
      .join(' ')

    return text
  },
}

export const touchCommand: Command = {
  name: 'touch',
  description: 'Change file timestamps or create empty file',
  usage: 'touch file...',
  handler: async (args, ctx) => {
    if (args.length === 0) {
      throw new Error('touch: missing file operand')
    }

    for (const path of args) {
      const targetPath = resolveArg(path, ctx.env.PWD)

      await ctx.vfs.touch(targetPath)
    }

    return ''
  },
}

export const cpCommand: Command = {
  name: 'cp',
  description: 'Copy files or directories',
  usage: 'cp [-r] source... dest',
  handler: async (args, ctx) => {
    const recursive = args.includes('-r')
    const paths = args.filter(a => !a.startsWith('-'))

    if (paths.length < 2) {
      throw new Error('cp: missing destination file operand')
    }

    const srcs = paths.slice(0, -1)
    const dest = paths[paths.length - 1]

    for (const src of srcs) {
      const srcPath = resolveArg(src, ctx.env.PWD)
      const destPath = resolveArg(dest, ctx.env.PWD)

      const exists = await ctx.vfs.exists(srcPath)
      if (!exists) {
        throw new Error(`cp: ${src}: No such file or directory`)
      }

      const srcStat = await ctx.vfs.stat(srcPath)
      if (srcStat.type === 'folder' && !recursive) {
        throw new Error(`cp: ${src}: is a directory (not copied)`)
      }

      await ctx.vfs.copy(srcPath, destPath)
    }

    return ''
  },
}

export const mvCommand: Command = {
  name: 'mv',
  description: 'Move or rename files',
  usage: 'mv source... dest',
  handler: async (args, ctx) => {
    if (args.length < 2) {
      throw new Error('mv: missing destination file operand')
    }

    const srcs = args.slice(0, -1)
    const dest = args[args.length - 1]

    for (const src of srcs) {
      const srcPath = resolveArg(src, ctx.env.PWD)
      const destPath = resolveArg(dest, ctx.env.PWD)

      const exists = await ctx.vfs.exists(srcPath)
      if (!exists) {
        throw new Error(`mv: ${src}: No such file or directory`)
      }

      await ctx.vfs.move(srcPath, destPath)
    }

    return ''
  },
}

export const whoamiCommand: Command = {
  name: 'whoami',
  description: 'Print current user name',
  usage: 'whoami',
  handler: async () => 'guest',
}

export const dateCommand: Command = {
  name: 'date',
  description: 'Print or set the date',
  usage: 'date [+format]',
  handler: async (args) => {
    const now = new Date()
    const fmt = args[0]

    if (fmt?.startsWith('+')) {
      const tokens: Record<string, string> = {
        '%Y': String(now.getFullYear()),
        '%m': String(now.getMonth() + 1).padStart(2, '0'),
        '%d': String(now.getDate()).padStart(2, '0'),
        '%H': String(now.getHours()).padStart(2, '0'),
        '%M': String(now.getMinutes()).padStart(2, '0'),
        '%S': String(now.getSeconds()).padStart(2, '0'),
      }
      return fmt.slice(1).replace(/%[YmdHMS]/g, t => tokens[t])
    }

    return now.toLocaleString()
  },
}

export const envCommand: Command = {
  name: 'env',
  description: 'Print environment variables',
  usage: 'env',
  handler: async (_, ctx) => {
    return Object.entries(ctx.env)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')
  },
}

export const exportCommand: Command = {
  name: 'export',
  description: 'Set environment variables',
  usage: 'export [name=value...]',
  handler: async (args, ctx) => {
    if (args.length === 0) {
      return envCommand.handler([], ctx)
    }

    for (const arg of args) {
      const eqIndex = arg.indexOf('=')
      if (eqIndex === -1) {
        throw new Error(`export: '${arg}': not a valid identifier`)
      }
      const name = arg.slice(0, eqIndex)
      const value = arg.slice(eqIndex + 1)
      ctx.env[name] = value
    }

    return ''
  },
}

export const clearCommand: Command = {
  name: 'clear',
  description: 'Clear the terminal screen',
  usage: 'clear',
  handler: async () => '\x1b[2J\x1b[H',
}

export const unameCommand: Command = {
  name: 'uname',
  description: 'Print system information',
  usage: 'uname [-a]',
  handler: async (args) => {
    if (args.includes('-a')) {
      return 'SDesktop 1.0.0 Darwin Kernel Version 24.0.0: Mon Jan 1 00:00:00 UTC 2026; x86_64'
    }
    return 'SDesktop'
  },
}

export const hostnameCommand: Command = {
  name: 'hostname',
  description: 'Set or print the hostname',
  usage: 'hostname [name]',
  handler: async (args) => {
    if (args.length > 0) {
      return ''
    }
    return 'sdesktop.local'
  },
}

export const historyCommand: Command = {
  name: 'history',
  description: 'Display command history',
  usage: 'history',
  handler: async () => '',
}
