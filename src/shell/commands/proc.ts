import type { Command, CommandContext } from '../engine'

export const psCommand: Command = {
  name: 'ps',
  description: 'List running processes',
  usage: 'ps [aux]',
  handler: async (_, ctx) => {
    const processes = ctx.processManager.list()

    const lines = ['PID    NAME                      STATUS     CPU    MEM']
    for (const proc of processes) {
      const pid = proc.pid.toString().padStart(5)
      const name = proc.name.padEnd(24)
      const status = proc.status.padEnd(10)
      const cpu = `${proc.cpu}%`.padStart(5)
      const mem = `${proc.memory}MB`.padStart(5)
      lines.push(`${pid}${name}${status}${cpu}${mem}`)
    }

    return lines.join('\n')
  },
}

export const killCommand: Command = {
  name: 'kill',
  description: 'Terminate a process',
  usage: 'kill [-9] pid...',
  handler: async (args, ctx) => {
    const force = args.includes('-9') || args.includes('-KILL')
    const pids = args.filter(a => !a.startsWith('-')).map(Number)

    if (pids.length === 0) {
      throw new Error('kill: missing operand')
    }

    for (const pid of pids) {
      const result = ctx.processManager.kill(pid, force ? 'SIGKILL' : 'SIGTERM')
      if (!result) {
        throw new Error(`kill: ${pid}: process not found`)
      }
    }

    return ''
  },
}
