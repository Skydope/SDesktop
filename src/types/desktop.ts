export interface BaseItem {
  id: string;
  title: string;
  icon: string;
  clickCount: number;
}

export interface ShortcutItem extends BaseItem {
  url: string;
}

export interface FolderItem extends BaseItem {
  items: (ShortcutItem | FolderItem)[];
}

export type WindowType = 'folder' | 'app';

export interface WindowState {
  id: string;
  title: string;
  icon: string;
  isActive: boolean;
  type: WindowType;
  content: FolderItem;
  isMinimized: boolean;
  isMaximized: boolean;
  appId?: string;
}

export interface DesktopState {
  wallpaper: string;
  theme: 'light' | 'dark';
  items: (ShortcutItem | FolderItem)[];
  openWindows: WindowState[];
  isStartMenuOpen: boolean;
}

export type AppId = 'finder' | 'terminal' | 'textedit' | 'preferences' | 'calculator';

export interface AppDefinition {
  id: AppId;
  name: string;
  icon: string;
  windowWidth: number;
  windowHeight: number;
}

export const APP_REGISTRY: Record<AppId, AppDefinition> = {
  finder: {
    id: 'finder',
    name: 'Finder',
    icon: 'folder',
    windowWidth: 900,
    windowHeight: 560,
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    icon: 'terminal',
    windowWidth: 800,
    windowHeight: 500,
  },
  textedit: {
    id: 'textedit',
    name: 'TextEdit',
    icon: 'file-text',
    windowWidth: 700,
    windowHeight: 480,
  },
  preferences: {
    id: 'preferences',
    name: 'System Preferences',
    icon: 'settings',
    windowWidth: 780,
    windowHeight: 520,
  },
  calculator: {
    id: 'calculator',
    name: 'Calculator',
    icon: 'calculator',
    windowWidth: 240,
    windowHeight: 360,
  },
};
