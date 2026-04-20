export type VFSNodeType = 'file' | 'folder' | 'symlink' | 'device';

export interface VFSPermissions {
  owner: { read: boolean; write: boolean; execute: boolean };
  group: { read: boolean; write: boolean; execute: boolean };
  other: { read: boolean; write: boolean; execute: boolean };
}

export interface VFSNode {
  id: string;
  name: string;
  type: VFSNodeType;
  permissions: VFSPermissions;
  owner: string;
  group: string;
  size: number;
  createdAt: number;
  modifiedAt: number;
  accessedAt: number;
  children?: string[];
  target?: string;
  content?: string;
  metadata?: Record<string, string>;
}

export interface VFSTree {
  [nodeId: string]: VFSNode;
}

export interface VFSStats {
  totalNodes: number;
  totalSize: number;
  files: number;
  folders: number;
}

export const DEFAULT_PERMISSIONS: VFSPermissions = {
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: false, execute: false },
  other: { read: true, write: false, execute: false },
};

export const FOLDER_PERMISSIONS: VFSPermissions = {
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: false, execute: true },
  other: { read: true, write: false, execute: true },
};

export function createFileNode(
  name: string,
  content = '',
  owner = 'guest',
  group = 'staff'
): VFSNode {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    type: 'file',
    permissions: DEFAULT_PERMISSIONS,
    owner,
    group,
    size: new Blob([content]).size,
    createdAt: now,
    modifiedAt: now,
    accessedAt: now,
    content,
  };
}

export function createFolderNode(
  name: string,
  owner = 'guest',
  group = 'staff'
): VFSNode {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    type: 'folder',
    permissions: FOLDER_PERMISSIONS,
    owner,
    group,
    size: 0,
    createdAt: now,
    modifiedAt: now,
    accessedAt: now,
    children: [],
  };
}

export function createSymlinkNode(
  name: string,
  target: string,
  owner = 'guest',
  group = 'staff'
): VFSNode {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    type: 'symlink',
    permissions: { ...DEFAULT_PERMISSIONS, owner: { ...DEFAULT_PERMISSIONS.owner, execute: true } },
    owner,
    group,
    size: 0,
    createdAt: now,
    modifiedAt: now,
    accessedAt: now,
    target,
  };
}

export function formatPermissions(perms: VFSPermissions): string {
  const octal = (r: boolean, w: boolean, x: boolean) =>
    (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0);
  return `${octal(perms.owner.read, perms.owner.write, perms.owner.execute)}${octal(perms.group.read, perms.group.write, perms.group.execute)}${octal(perms.other.read, perms.other.write, perms.other.execute)}`;
}
