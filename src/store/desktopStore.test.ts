import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDesktopStore } from '../store/desktopStore';

// clearAllData ahora limpia tambien el VFS, que vive en IndexedDB. jsdom no la
// trae, asi que se stubea la capa de storage.
vi.mock('../vfs/storage', () => ({
  vfsStorage: {
    init: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue(null),
    clear: vi.fn().mockResolvedValue(undefined),
  },
}));
import type { ShortcutItem, FolderItem } from '../types/desktop';

describe('desktopStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDesktopStore.setState({
      wallpaper: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=1920&q=80',
      theme: 'dark',
      items: [],
      openWindows: [],
      isStartMenuOpen: false,
      userProfile: { name: 'User', avatar: '' },
    });
  });

  describe('addItem', () => {
    it('should add a shortcut to items', () => {
      const shortcut: ShortcutItem = {
        id: '1',
        title: 'Google',
        url: 'https://google.com',
        icon: '',
        clickCount: 0,
      };

      useDesktopStore.getState().addItem(shortcut);

      expect(useDesktopStore.getState().items).toHaveLength(1);
      expect(useDesktopStore.getState().items[0]).toEqual(shortcut);
    });

    it('should add a folder to items', () => {
      const folder: FolderItem = {
        id: '1',
        title: 'My Folder',
        icon: '',
        items: [],
        clickCount: 0,
      };

      useDesktopStore.getState().addItem(folder);

      expect(useDesktopStore.getState().items).toHaveLength(1);
      expect(useDesktopStore.getState().items[0]).toEqual(folder);
    });

    it('should close start menu after adding item', () => {
      useDesktopStore.setState({ isStartMenuOpen: true });

      const shortcut: ShortcutItem = {
        id: '1',
        title: 'Google',
        url: 'https://google.com',
        icon: '',
        clickCount: 0,
      };

      useDesktopStore.getState().addItem(shortcut);

      expect(useDesktopStore.getState().isStartMenuOpen).toBe(false);
    });
  });

  describe('setWallpaper', () => {
    it('should update wallpaper', () => {
      const newWallpaper = 'https://example.com/wallpaper.jpg';

      useDesktopStore.getState().setWallpaper(newWallpaper);

      expect(useDesktopStore.getState().wallpaper).toBe(newWallpaper);
    });
  });

  describe('setTheme', () => {
    it('should update theme to light', () => {
      useDesktopStore.getState().setTheme('light');

      expect(useDesktopStore.getState().theme).toBe('light');
    });

    it('should update theme to dark', () => {
      useDesktopStore.setState({ theme: 'light' });

      useDesktopStore.getState().setTheme('dark');

      expect(useDesktopStore.getState().theme).toBe('dark');
    });
  });

  describe('toggleStartMenu', () => {
    it('should toggle start menu open', () => {
      useDesktopStore.setState({ isStartMenuOpen: false });

      useDesktopStore.getState().toggleStartMenu();

      expect(useDesktopStore.getState().isStartMenuOpen).toBe(true);
    });

    it('should toggle start menu closed', () => {
      useDesktopStore.setState({ isStartMenuOpen: true });

      useDesktopStore.getState().toggleStartMenu();

      expect(useDesktopStore.getState().isStartMenuOpen).toBe(false);
    });
  });

  describe('openWindow', () => {
    it('should add a new window and mark it as active', () => {
      const folder: FolderItem = {
        id: '1',
        title: 'My Folder',
        icon: '',
        items: [],
        clickCount: 0,
      };

      useDesktopStore.getState().openWindow({
        id: '1',
        title: 'My Folder',
        icon: '',
        type: 'folder',
        content: folder,
        isMinimized: false,
        isMaximized: false,
      });

      expect(useDesktopStore.getState().openWindows).toHaveLength(1);
      expect(useDesktopStore.getState().openWindows[0].isActive).toBe(true);
    });

    it('should mark existing windows as inactive', () => {
      const folder1: FolderItem = {
        id: '1',
        title: 'Folder 1',
        icon: '',
        items: [],
        clickCount: 0,
      };

      const folder2: FolderItem = {
        id: '2',
        title: 'Folder 2',
        icon: '',
        items: [],
        clickCount: 0,
      };

      useDesktopStore.getState().openWindow({
        id: '1',
        title: 'Folder 1',
        icon: '',
        type: 'folder',
        content: folder1,
        isMinimized: false,
        isMaximized: false,
      });

      useDesktopStore.getState().openWindow({
        id: '2',
        title: 'Folder 2',
        icon: '',
        type: 'folder',
        content: folder2,
        isMinimized: false,
        isMaximized: false,
      });

      const windows = useDesktopStore.getState().openWindows;
      expect(windows).toHaveLength(2);
      expect(windows[0].isActive).toBe(false);
      expect(windows[1].isActive).toBe(true);
    });
  });

  describe('closeWindow', () => {
    it('should remove a window by id', () => {
      const folder: FolderItem = {
        id: '1',
        title: 'My Folder',
        icon: '',
        items: [],
        clickCount: 0,
      };

      useDesktopStore.getState().openWindow({
        id: '1',
        title: 'My Folder',
        icon: '',
        type: 'folder',
        content: folder,
        isMinimized: false,
        isMaximized: false,
      });

      useDesktopStore.getState().closeWindow('1');

      expect(useDesktopStore.getState().openWindows).toHaveLength(0);
    });
  });

  describe('minimizeWindow / maximizeWindow', () => {
    it('should minimize a window', () => {
      const folder: FolderItem = {
        id: '1',
        title: 'My Folder',
        icon: '',
        items: [],
        clickCount: 0,
      };

      useDesktopStore.getState().openWindow({
        id: '1',
        title: 'My Folder',
        icon: '',
        type: 'folder',
        content: folder,
        isMinimized: false,
        isMaximized: false,
      });

      useDesktopStore.getState().minimizeWindow('1');

      expect(useDesktopStore.getState().openWindows[0].isMinimized).toBe(true);
    });

    it('should maximize a window', () => {
      const folder: FolderItem = {
        id: '1',
        title: 'My Folder',
        icon: '',
        items: [],
        clickCount: 0,
      };

      useDesktopStore.getState().openWindow({
        id: '1',
        title: 'My Folder',
        icon: '',
        type: 'folder',
        content: folder,
        isMinimized: true,
        isMaximized: false,
      });

      useDesktopStore.getState().maximizeWindow('1');

      expect(useDesktopStore.getState().openWindows[0].isMinimized).toBe(false);
    });
  });

  describe('clearAllData', () => {
    it('should reset all state to initial values', async () => {
      // Set some state
      useDesktopStore.setState({
        wallpaper: 'https://custom.com/wallpaper.jpg',
        theme: 'light',
        items: [{ id: '1', title: 'Test', icon: '', clickCount: 1 }] as (ShortcutItem | FolderItem)[],
        userProfile: { name: 'Custom User', avatar: 'https://avatar.com/img.jpg' },
      });

      await useDesktopStore.getState().clearAllData();

      const state = useDesktopStore.getState();
      expect(state.wallpaper).toBe('https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=1920&q=80');
      expect(state.theme).toBe('dark');
      expect(state.items).toHaveLength(0);
      expect(state.userProfile.name).toBe('User');
      expect(state.userProfile.avatar).toBe('');
    });
  });

  describe('findFolderById', () => {
    it('should find a folder by id in nested structure', () => {
      const nestedFolder: FolderItem = {
        id: 'nested',
        title: 'Nested Folder',
        icon: '',
        items: [],
        clickCount: 0,
      };

      const parentFolder: FolderItem = {
        id: 'parent',
        title: 'Parent Folder',
        icon: '',
        items: [nestedFolder],
        clickCount: 0,
      };

      useDesktopStore.setState({
        items: [parentFolder],
      });

      const found = useDesktopStore.getState().findFolderById('nested');

      expect(found).not.toBeNull();
      expect(found?.title).toBe('Nested Folder');
    });

    it('should return null for non-existent folder', () => {
      useDesktopStore.setState({
        items: [],
      });

      const found = useDesktopStore.getState().findFolderById('non-existent');

      expect(found).toBeNull();
    });
  });

  describe('getAllItems', () => {
    it('should return all items including nested ones', () => {
      const shortcut: ShortcutItem = {
        id: 'shortcut-1',
        title: 'Shortcut',
        url: 'https://example.com',
        icon: '',
        clickCount: 0,
      };

      const nestedFolder: FolderItem = {
        id: 'folder-1',
        title: 'Folder',
        icon: '',
        items: [shortcut],
        clickCount: 0,
      };

      useDesktopStore.setState({
        items: [nestedFolder],
      });

      const allItems = useDesktopStore.getState().getAllItems();

      expect(allItems).toHaveLength(2);
      expect(allItems[0].id).toBe('folder-1');
      expect(allItems[1].id).toBe('shortcut-1');
    });
  });
});
