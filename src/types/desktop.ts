export interface BaseItem {
  id: string;
  title: string;
  icon: string;
  clickCount: number; // Nuevo campo para rastrear los clics
}

export interface ShortcutItem extends BaseItem {
  url: string;
}

export interface FolderItem extends BaseItem {
  items: (ShortcutItem | FolderItem)[];
}

export interface WindowState {
  id: string;
  title: string;
  icon: string;
  isActive: boolean;
  type: 'folder' | 'shortcut';
  content: FolderItem;
  isMinimized: boolean;
}

export interface DesktopState {
  wallpaper: string;
  theme: 'light' | 'dark';
  items: (ShortcutItem | FolderItem)[];
  openWindows: WindowState[];
  isStartMenuOpen: boolean;
}