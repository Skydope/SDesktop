import { CommandEngine, createCommandContext } from './engine'
import { lsCommand, cdCommand, pwdCommand, mkdirCommand, rmCommand, catCommand, echoCommand, touchCommand, cpCommand, mvCommand, whoamiCommand, dateCommand, envCommand, exportCommand, clearCommand, unameCommand, hostnameCommand, historyCommand } from './commands/fs'
import { psCommand, killCommand } from './commands/proc'
import { openCommand, closeCommand, themeCommand, windowsCommand, focusCommand, inspectCommand, helpCommand } from './commands/system'

export { CommandEngine, createCommandContext } from './engine'
export type { Command, CommandContext } from './engine'

export function createShell(): CommandEngine {
  const engine = new CommandEngine()

  engine.register(lsCommand)
  engine.register(cdCommand)
  engine.register(pwdCommand)
  engine.register(mkdirCommand)
  engine.register(rmCommand)
  engine.register(catCommand)
  engine.register(echoCommand)
  engine.register(touchCommand)
  engine.register(cpCommand)
  engine.register(mvCommand)
  engine.register(psCommand)
  engine.register(killCommand)
  engine.register(whoamiCommand)
  engine.register(dateCommand)
  engine.register(envCommand)
  engine.register(exportCommand)
  engine.register(clearCommand)
  engine.register(unameCommand)
  engine.register(hostnameCommand)
  engine.register(historyCommand)
  engine.register(openCommand)
  engine.register(closeCommand)
  engine.register(themeCommand)
  engine.register(windowsCommand)
  engine.register(focusCommand)
  engine.register(inspectCommand)
  engine.register(helpCommand)

  engine.alias('ll', 'ls')
  engine.alias('la', 'ls')
  engine.alias('l', 'ls')

  return engine
}
