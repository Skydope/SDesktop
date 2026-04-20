import {
  VFSNode,
  VFSTree,
  VFSNodeType,
  VFSStats,
  createFileNode,
  createFolderNode,
  createSymlinkNode,
  VFSPermissions,
} from './types';
import { vfsStorage } from './storage';

export class VirtualFilesystem {
  private tree: VFSTree = {};
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    let saved: VFSTree | null = null;
    try {
      saved = await vfsStorage.load();
    } catch {
      // First run, no saved data
    }

    if (saved && Object.keys(saved).length > 0) {
      this.tree = saved;
    } else {
      await this._createDefaultStructure();
    }

    this.initialized = true;
  }

  private async _createDefaultStructure(): Promise<void> {
    const root = createFolderNode('');
    root.name = '/';
    root.id = '/';
    this.tree['/'] = root;

    const guestHome = createFolderNode('Users');
    guestHome.id = '/Users';
    this.tree['/Users'] = guestHome;

    const guest = createFolderNode('guest');
    guest.id = '/Users/guest';
    this.tree['/Users/guest'] = guest;

    const folders = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Music', 'Movies', '.config', '.local'];
    for (const name of folders) {
      const node = createFolderNode(name);
      const path = `/Users/guest/${name}`;
      node.id = path;
      this.tree[path] = node;
      (this.tree['/Users/guest'].children || []).push(path);
    }

    const system = createFolderNode('System');
    system.id = '/System';
    this.tree['/System'] = system;

    const apps = createFolderNode('Applications');
    apps.id = '/Applications';
    this.tree['/Applications'] = apps;

    const bin = createFolderNode('bin');
    bin.id = '/bin';
    this.tree['/bin'] = bin;

    const varFolder = createFolderNode('var');
    varFolder.id = '/var';
    this.tree['/var'] = varFolder;

    const log = createFolderNode('log');
    log.id = '/var/log';
    this.tree['/var/log'] = log;
    (this.tree['/var'].children || []).push('/var/log');

    await this._persist();
  }

  private async _persist(): Promise<void> {
    try {
      await vfsStorage.save(this.tree);
    } catch (err) {
      console.error('[VFS] Failed to persist:', err);
    }
  }

  private resolvePath(path: string): string {
    if (!path.startsWith('/')) {
      throw new Error(`Path must be absolute: ${path}`);
    }
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  }

  private getParentPath(path: string): string {
    const resolved = this.resolvePath(path);
    const lastSlash = resolved.lastIndexOf('/');
    if (lastSlash === 0) return '/';
    return resolved.substring(0, lastSlash);
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('VFS not initialized. Call init() first.');
    }
  }

  async mkdir(path: string, recursive = false): Promise<void> {
    this.ensureInitialized();
    const resolved = this.resolvePath(path);

    if (this.tree[resolved]) {
      throw new Error(`Path already exists: ${path}`);
    }

    const parentPath = this.getParentPath(resolved);
    const parent = this.tree[parentPath];

    if (!parent) {
      if (recursive) {
        await this.mkdir(parentPath, true);
        await this.mkdir(path, false);
        return;
      }
      throw new Error(`Parent directory does not exist: ${parentPath}`);
    }

    if (parent.type !== 'folder') {
      throw new Error(`Not a directory: ${parentPath}`);
    }

    const folder = createFolderNode(path.split('/').pop()!);
    folder.id = resolved;
    this.tree[resolved] = folder;
    parent.children = parent.children || [];
    parent.children.push(resolved);

    await this._persist();
  }

  async readdir(path: string): Promise<VFSNode[]> {
    this.ensureInitialized();
    const resolved = this.resolvePath(path);
    const node = this.tree[resolved];

    if (!node) {
      throw new Error(`No such directory: ${path}`);
    }

    if (node.type !== 'folder') {
      throw new Error(`Not a directory: ${path}`);
    }

    node.accessedAt = Date.now();

    if (!node.children) {
      return [];
    }

    return node.children
      .map(id => this.tree[id])
      .filter((n): n is VFSNode => n !== undefined);
  }

  async write(path: string, content: string): Promise<void> {
    this.ensureInitialized();
    const resolved = this.resolvePath(path);
    const node = this.tree[resolved];
    const now = Date.now();

    if (node) {
      if (node.type === 'folder') {
        throw new Error(`Is a directory: ${path}`);
      }
      node.content = content;
      node.size = new Blob([content]).size;
      node.modifiedAt = now;
      node.accessedAt = now;
    } else {
      const parentPath = this.getParentPath(resolved);
      const parent = this.tree[parentPath];

      if (!parent) {
        throw new Error(`Parent directory does not exist: ${parentPath}`);
      }

      const file = createFileNode(path.split('/').pop()!);
      file.id = resolved;
      file.content = content;
      file.size = new Blob([content]).size;
      this.tree[resolved] = file;
      parent.children = parent.children || [];
      parent.children.push(resolved);
    }

    await this._persist();
  }

  async read(path: string): Promise<string> {
    this.ensureInitialized();
    const resolved = this.resolvePath(path);
    const node = this.tree[resolved];

    if (!node) {
      throw new Error(`No such file: ${path}`);
    }

    if (node.type === 'folder') {
      throw new Error(`Is a directory: ${path}`);
    }

    node.accessedAt = Date.now();
    await this._persist();

    return node.content || '';
  }

  async unlink(path: string): Promise<void> {
    this.ensureInitialized();
    const resolved = this.resolvePath(path);
    const node = this.tree[resolved];

    if (!node) {
      throw new Error(`No such file: ${path}`);
    }

    if (node.type === 'folder' && (node.children?.length || 0) > 0) {
      throw new Error(`Directory not empty: ${path}`);
    }

    const parentPath = this.getParentPath(resolved);
    const parent = this.tree[parentPath];
    if (parent) {
      parent.children = parent.children?.filter(id => id !== resolved) || [];
    }

    delete this.tree[resolved];
    await this._persist();
  }

  async rmdir(path: string): Promise<void> {
    this.ensureInitialized();
    const resolved = this.resolvePath(path);
    const node = this.tree[resolved];

    if (!node) {
      throw new Error(`No such directory: ${path}`);
    }

    if (node.type !== 'folder') {
      throw new Error(`Not a directory: ${path}`);
    }

    if ((node.children?.length || 0) > 0) {
      throw new Error(`Directory not empty: ${path}`);
    }

    const parentPath = this.getParentPath(resolved);
    const parent = this.tree[parentPath];
    if (parent) {
      parent.children = parent.children?.filter(id => id !== resolved) || [];
    }

    delete this.tree[resolved];
    await this._persist();
  }

  async stat(path: string): Promise<VFSNode> {
    this.ensureInitialized();
    const resolved = this.resolvePath(path);
    const node = this.tree[resolved];

    if (!node) {
      throw new Error(`No such path: ${path}`);
    }

    return { ...node };
  }

  async exists(path: string): Promise<boolean> {
    this.ensureInitialized();
    try {
      const resolved = this.resolvePath(path);
      return this.tree[resolved] !== undefined;
    } catch {
      return false;
    }
  }

  async move(src: string, dst: string): Promise<void> {
    this.ensureInitialized();
    const srcResolved = this.resolvePath(src);
    const dstResolved = this.resolvePath(dst);

    const node = this.tree[srcResolved];
    if (!node) {
      throw new Error(`No such path: ${src}`);
    }

    if (this.tree[dstResolved]) {
      throw new Error(`Destination already exists: ${dst}`);
    }

    const srcParent = this.getParentPath(srcResolved);
    const srcParentNode = this.tree[srcParent];
    if (srcParentNode) {
      srcParentNode.children = srcParentNode.children?.filter(id => id !== srcResolved) || [];
    }

    const dstParent = this.getParentPath(dstResolved);
    const dstParentNode = this.tree[dstParent];
    if (!dstParentNode) {
      throw new Error(`Destination parent does not exist: ${dstParent}`);
    }

    const newNode = { ...node, id: dstResolved, name: dst.split('/').pop()! };
    this.tree[dstResolved] = newNode;
    dstParentNode.children = dstParentNode.children || [];
    dstParentNode.children.push(dstResolved);

    if (node.type === 'folder' && node.children) {
      const prefix = srcResolved + '/';
      for (const childId of node.children) {
        if (childId.startsWith(prefix)) {
          const newChildId = childId.replace(prefix, dstResolved + '/');
          const childNode = this.tree[childId];
          if (childNode) {
            delete this.tree[childId];
            const movedChild = { ...childNode, id: newChildId };
            this.tree[newChildId] = movedChild;
          }
        }
      }
    }

    delete this.tree[srcResolved];
    await this._persist();
  }

  async copy(src: string, dst: string): Promise<void> {
    this.ensureInitialized();
    const srcResolved = this.resolvePath(src);
    const node = this.tree[srcResolved];

    if (!node) {
      throw new Error(`No such path: ${src}`);
    }

    if (this.tree[dst]) {
      throw new Error(`Destination already exists: ${dst}`);
    }

    const dstParent = this.getParentPath(dst);
    const dstParentNode = this.tree[dstParent];
    if (!dstParentNode) {
      throw new Error(`Destination parent does not exist: ${dstParent}`);
    }

    const copy = (n: VFSNode, newId: string, newName: string): VFSNode => ({
      ...n,
      id: newId,
      name: newName,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      accessedAt: Date.now(),
      children: n.children ? [...n.children] : undefined,
    });

    this.tree[dst] = copy(node, dst, dst.split('/').pop()!);
    dstParentNode.children = dstParentNode.children || [];
    dstParentNode.children.push(dst);

    if (node.type === 'folder' && node.children) {
      for (const childId of node.children) {
        const childNode = this.tree[childId];
        if (childNode) {
          const suffix = childId.replace(srcResolved, '');
          const newChildId = dst + suffix;
          this.tree[newChildId] = copy(childNode, newChildId, childNode.name);
        }
      }
    }

    await this._persist();
  }

  async chmod(path: string, permissions: VFSPermissions): Promise<void> {
    this.ensureInitialized();
    const resolved = this.resolvePath(path);
    const node = this.tree[resolved];

    if (!node) {
      throw new Error(`No such path: ${path}`);
    }

    node.permissions = permissions;
    node.modifiedAt = Date.now();
    await this._persist();
  }

  async touch(path: string): Promise<void> {
    this.ensureInitialized();
    const resolved = this.resolvePath(path);

    if (this.tree[resolved]) {
      const node = this.tree[resolved];
      node.accessedAt = Date.now();
      node.modifiedAt = Date.now();
    } else {
      await this.write(path, '');
    }

    await this._persist();
  }

  async getStats(path = '/'): Promise<VFSStats> {
    this.ensureInitialized();
    const stats: VFSStats = { totalNodes: 0, totalSize: 0, files: 0, folders: 0 };

    const traverse = (nodeId: string) => {
      const node = this.tree[nodeId];
      if (!node) return;

      stats.totalNodes++;
      stats.totalSize += node.size;

      if (node.type === 'file') {
        stats.files++;
      } else if (node.type === 'folder') {
        stats.folders++;
        node.children?.forEach(traverse);
      }
    };

    const resolved = this.resolvePath(path);
    traverse(resolved);

    return stats;
  }

  async clear(): Promise<void> {
    this.tree = {};
    this.initialized = false;
    this.initPromise = null;
    await vfsStorage.clear();
  }

  getTree(): VFSTree {
    return { ...this.tree };
  }
}

export const vfs = new VirtualFilesystem();
