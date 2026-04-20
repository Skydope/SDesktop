export type ProcessStatus = 'running' | 'sleeping' | 'stopped' | 'zombie' | 'defunct';

export interface ProcessInfo {
  pid: number;
  ppid: number;
  name: string;
  appId: string;
  args: string[];
  status: ProcessStatus;
  cpu: number;
  memory: number;
  startTime: number;
  terminal?: string;
  env: Record<string, string>;
}

export interface ProcessUpdate {
  pid: number;
  status?: ProcessStatus;
  cpu?: number;
  memory?: number;
}
