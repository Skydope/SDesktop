import React, { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { createShell, createCommandContext } from '../../shell'

interface TerminalProps {
  onData?: (data: string) => void
}

const Terminal: React.FC<TerminalProps> = () => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)
  const currentInputRef = useRef('')
  const contextRef = useRef(createCommandContext())
  const shellRef = useRef(createShell())

  const writeOutput = useCallback((text: string) => {
    const xterm = xtermRef.current
    if (!xterm) return

    xterm.write(text.replace(/\n/g, '\r\n'))
  }, [])

  const handleInput = useCallback(async (data: string) => {
    const xterm = xtermRef.current
    const shell = shellRef.current
    const ctx = contextRef.current
    if (!xterm || !shell) return

    const char = data

    if (char === '\r' || char === '\n') {
      const input = currentInputRef.current
      xterm.write('\r\n')

      if (input.trim()) {
        historyRef.current = [input, ...historyRef.current.filter(h => h !== input)].slice(0, 50)
        historyIndexRef.current = -1
      }

      if (input.trim()) {
        const output = await shell.execute(input, ctx)
        if (output) {
          writeOutput(output + '\r\n')
        }
      } else {
        writeOutput('\r\n')
      }

      writePrompt()
      currentInputRef.current = ''
    } else if (char === '\x7f') {
      if (currentInputRef.current.length > 0) {
        currentInputRef.current = currentInputRef.current.slice(0, -1)
        xterm.write('\b \b')
      }
    } else if (char === '\x03') {
      xterm.write('^C\r\n')
      currentInputRef.current = ''
      writePrompt()
    } else if (char === '\x0c') {
      xterm.clear()
      writePrompt()
      if (currentInputRef.current) {
        xterm.write(currentInputRef.current)
      }
    } else if (char === '\x1b[A') {
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyIndexRef.current++
        const cmd = historyRef.current[historyIndexRef.current]
        for (let i = 0; i < currentInputRef.current.length; i++) {
          xterm.write('\b \b')
        }
        currentInputRef.current = cmd
        xterm.write(cmd)
      }
    } else if (char === '\x1b[B') {
      if (historyIndexRef.current > 0) {
        historyIndexRef.current--
        const cmd = historyRef.current[historyIndexRef.current]
        for (let i = 0; i < currentInputRef.current.length; i++) {
          xterm.write('\b \b')
        }
        currentInputRef.current = cmd
        xterm.write(cmd)
      } else if (historyIndexRef.current === 0) {
        historyIndexRef.current = -1
        for (let i = 0; i < currentInputRef.current.length; i++) {
          xterm.write('\b \b')
        }
        currentInputRef.current = ''
      }
    } else if (char === '\t') {
      const input = currentInputRef.current
      const parts = input.split(' ')
      if (parts.length === 1 && input) {
        const completions = shellRef.current.listCommands().filter(c => c.startsWith(input))
        if (completions.length === 1) {
          const completion = completions[0].slice(input.length)
          currentInputRef.current += completion
          xterm.write(completion)
        } else if (completions.length > 1) {
          xterm.write('\r\n')
          writeOutput(completions.join('  ') + '\r\n')
          writePrompt()
          xterm.write(currentInputRef.current)
        }
      }
    } else {
      currentInputRef.current += char
      xterm.write(char)
    }
  }, [writeOutput])

  const writePrompt = useCallback(() => {
    const xterm = xtermRef.current
    const ctx = contextRef.current
    if (!xterm) return

    const prompt = `\x1b[1;34mguest@sdesktop\x1b[0m:\x1b[1;32m${ctx.env.PWD}\x1b[0m$ `
    xterm.write(prompt)
  }, [])

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return

    const xterm = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
      theme: {
        background: 'transparent',
        foreground: '#e0e0e0',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: 'rgba(120, 120, 255, 0.3)',
        black: '#000000',
        red: '#ff5544',
        green: '#98c379',
        yellow: '#e5c07b',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#abb2bf',
        brightBlack: '#5c6370',
        brightRed: '#e06c75',
        brightGreen: '#98c379',
        brightYellow: '#e5c07b',
        brightBlue: '#61afef',
        brightMagenta: '#c678dd',
        brightCyan: '#56b6c2',
        brightWhite: '#ffffff',
      },
      scrollback: 1000,
      allowTransparency: true,
    })

    const fitAddon = new FitAddon()
    xterm.loadAddon(fitAddon)
    xterm.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = xterm
    fitAddonRef.current = fitAddon

    xterm.write('\x1b[1;36m╔════════════════════════════════════════╗\x1b[0m\r\n')
    xterm.write('\x1b[1;36m║\x1b[0m  \x1b[1;37mSDesktop Terminal\x1b[0m  \x1b[1;36m                   ║\x1b[0m\r\n')
    xterm.write('\x1b[1;36m║\x1b[0m  Type \x1b[33m\'help\'\x1b[0m for available commands  \x1b[36m║\x1b[0m\r\n')
    xterm.write('\x1b[1;36m╚════════════════════════════════════════╝\x1b[0m\r\n')
    writePrompt()

    xterm.onData(handleInput)

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
    })
    resizeObserver.observe(terminalRef.current)

    return () => {
      resizeObserver.disconnect()
      xterm.dispose()
      xtermRef.current = null
    }
  }, [handleInput, writePrompt])

  return (
    <div className="os-terminal">
      <div ref={terminalRef} className="os-terminal__container" />
    </div>
  )
}

export default Terminal
