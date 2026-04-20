import type { ProcessInfo, ProcessStatus, ProcessUpdate } from './types';

export class ProcessManager {
  private processes: Map<number, ProcessInfo> = new Map();
  private nextPid = 1;
  private listeners: Set<(processes: ProcessInfo[]) => void> = new Set();

  spawn(
    name: string,
    appId: string,
    args: string[] = [],
    options: { ppid?: number; terminal?: string; env?: Record<string, string> } = {}
  ): number {
    const pid = this.nextPid++;
    const now = Date.now();

    const proc: ProcessInfo = {
      pid,
      ppid: options.ppid ?? 0,
      name,
      appId,
      args,
      status: 'running',
      cpu: 0,
      memory: Math.floor(Math.random() * 10) + 1,
      startTime: now,
      terminal: options.terminal,
      env: options.env ?? {},
    };

    this.processes.set(pid, proc);

    if (options.ppid && this.processes.has(options.ppid)) {
      const parent = this.processes.get(options.ppid)!;
    }

    this.notify();

    return pid;
  }

  kill(pid: number, signal: 'SIGTERM' | 'SIGKILL' = 'SIGTERM'): boolean {
    const proc = this.processes.get(pid);
    if (!proc) return false;

    if (signal === 'SIGKILL') {
      proc.status = 'defunct';
      this.processes.delete(pid);
    } else {
      proc.status = 'stopped';
      setTimeout(() => {
        if (this.processes.has(pid) && proc.status === 'stopped') {
          this.processes.delete(pid);
        }
      }, 1000);
    }

    this.notify();
    return true;
  }

  list(): ProcessInfo[] {
    return Array.from(this.processes.values()).sort((a, b) => b.pid - a.pid);
  }

  findByAppId(appId: string): ProcessInfo[] {
    return this.list().filter(p => p.appId === appId);
  }

  findByPid(pid: number): ProcessInfo | undefined {
    return this.processes.get(pid);
  }

  update(updates: ProcessUpdate[]): void {
    for (const u of updates) {
      const proc = this.processes.get(u.pid);
      if (proc) {
        if (u.status) proc.status = u.status;
        if (u.cpu !== undefined) proc.cpu = u.cpu;
        if (u.memory !== undefined) proc.memory = u.memory;
      }
    }
    this.notify();
  }

  getActiveWindowProcess(): ProcessInfo | null {
    const procs = this.list().filter(p => p.status === 'running');
    return procs[procs.length - 1] || null;
  }

  subscribe(listener: (processes: ProcessInfo[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const procs = this.list();
    for (const listener of this.listeners) {
      listener(procs);
    }
  }
}

export const processManager = new ProcessManager();
