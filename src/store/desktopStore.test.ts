import { describe, it, expect, beforeEach, vi } from 'vitest';

// jsdom no trae IndexedDB. El VFS opera siempre sobre su arbol en memoria, asi
// que basta con stubear la capa de storage.
vi.mock('../vfs/storage', () => ({
  vfsStorage: {
    init: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue(null),
    clear: vi.fn().mockResolvedValue(undefined),
  },
}));

import { useDesktopStore, defaultWallpaper } from '../store/desktopStore';
import { DESKTOP_PATH, migrateLegacyItems } from '../store/desktopItems';
import { vfs } from '../vfs';
import type { ShortcutItem, FolderItem } from '../types/desktop';

const shortcut = (title: string, url = 'https://ejemplo.com'): ShortcutItem => ({
  id: 'pendiente',
  title,
  url,
  icon: '',
  clickCount: 0,
});

const folder = (title: string): FolderItem => ({
  id: 'pendiente',
  title,
  icon: '',
  items: [],
  clickCount: 0,
});

describe('desktopStore', () => {
  beforeEach(async () => {
    localStorage.clear();
    await vfs.clear();
    await vfs.init();

    useDesktopStore.setState({
      wallpaper: defaultWallpaper,
      theme: 'dark',
      items: [],
      openWindows: [],
      isStartMenuOpen: false,
      userProfile: { name: 'User', avatar: '' },
    });

    await useDesktopStore.getState().initDesktop();
  });

  // El escritorio dejo de ser un arbol aparte en localStorage: ahora ES
  // /Users/guest/Desktop en el VFS. Estos tests cubren esa unificacion.
  describe('el escritorio es el VFS', () => {
    it('addItem escribe un acceso directo en el VFS', async () => {
      await useDesktopStore.getState().addItem(shortcut('Google', 'https://google.com'));

      expect(await vfs.exists(`${DESKTOP_PATH}/Google`)).toBe(true);
      expect(await vfs.read(`${DESKTOP_PATH}/Google`)).toBe('https://google.com');
    });

    it('addItem escribe una carpeta en el VFS', async () => {
      await useDesktopStore.getState().addItem(folder('Mi Carpeta'));

      const stat = await vfs.stat(`${DESKTOP_PATH}/Mi Carpeta`);
      expect(stat.type).toBe('folder');
    });

    it('el id de un item es su path en el VFS', async () => {
      await useDesktopStore.getState().addItem(folder('Mi Carpeta'));

      expect(useDesktopStore.getState().items[0].id).toBe(`${DESKTOP_PATH}/Mi Carpeta`);
    });

    it('lo que se crea en el VFS por fuera aparece en el escritorio', async () => {
      // Esto es exactamente lo que hace un `mkdir` desde la terminal.
      await vfs.mkdir(`${DESKTOP_PATH}/DesdeLaTerminal`);
      await useDesktopStore.getState().refreshItems();

      const titulos = useDesktopStore.getState().items.map((i) => i.title);
      expect(titulos).toContain('DesdeLaTerminal');
    });

    it('el escritorio se relee del VFS, no de localStorage', async () => {
      await useDesktopStore.getState().addItem(folder('Persistente'));

      // Simula un arranque nuevo: el store arranca vacio y se rehidrata del VFS.
      useDesktopStore.setState({ items: [] });
      await useDesktopStore.getState().refreshItems();

      expect(useDesktopStore.getState().items.map((i) => i.title)).toEqual(['Persistente']);
    });

    it('`items` no se persiste en localStorage', async () => {
      await useDesktopStore.getState().addItem(folder('Mi Carpeta'));

      const persisted = JSON.parse(localStorage.getItem('desktopState') ?? '{}');
      expect(persisted.state).not.toHaveProperty('items');
    });

    it('dos items con el mismo nombre no chocan', async () => {
      await useDesktopStore.getState().addItem(folder('New Folder'));
      await useDesktopStore.getState().addItem(folder('New Folder'));

      const titulos = useDesktopStore.getState().items.map((i) => i.title).sort();
      expect(titulos).toEqual(['New Folder', 'New Folder 2']);
    });

    it('addItemToFolder anida dentro de la carpeta', async () => {
      await useDesktopStore.getState().addItem(folder('Padre'));
      const padre = useDesktopStore.getState().items[0];

      await useDesktopStore.getState().addItemToFolder(padre.id, shortcut('Hijo'));

      const actualizado = useDesktopStore.getState().items[0] as FolderItem;
      expect(actualizado.items.map((i) => i.title)).toEqual(['Hijo']);
      expect(await vfs.exists(`${DESKTOP_PATH}/Padre/Hijo`)).toBe(true);
    });

    it('addItem cierra el menu de inicio', async () => {
      useDesktopStore.setState({ isStartMenuOpen: true });

      await useDesktopStore.getState().addItem(shortcut('Google'));

      expect(useDesktopStore.getState().isStartMenuOpen).toBe(false);
    });
  });

  describe('updateItem', () => {
    it('renombrar mueve el nodo y cambia el id', async () => {
      await useDesktopStore.getState().addItem(folder('Viejo'));
      const antes = useDesktopStore.getState().items[0];

      await useDesktopStore.getState().updateItem(antes.id, { ...antes, title: 'Nuevo' });

      expect(await vfs.exists(`${DESKTOP_PATH}/Viejo`)).toBe(false);
      expect(await vfs.exists(`${DESKTOP_PATH}/Nuevo`)).toBe(true);
      expect(useDesktopStore.getState().items[0].id).toBe(`${DESKTOP_PATH}/Nuevo`);
    });

    it('renombrar se lleva el contenido de la carpeta', async () => {
      await useDesktopStore.getState().addItem(folder('Viejo'));
      const padre = useDesktopStore.getState().items[0];
      await useDesktopStore.getState().addItemToFolder(padre.id, shortcut('Hijo'));

      await useDesktopStore.getState().updateItem(padre.id, { ...padre, title: 'Nuevo' });

      expect(await vfs.exists(`${DESKTOP_PATH}/Nuevo/Hijo`)).toBe(true);
    });

    it('la ventana abierta sigue al item renombrado', async () => {
      await useDesktopStore.getState().addItem(folder('Viejo'));
      const antes = useDesktopStore.getState().items[0] as FolderItem;
      useDesktopStore.getState().openWindow({
        id: antes.id,
        title: antes.title,
        icon: '',
        type: 'folder',
        content: antes,
        isMinimized: false,
        isMaximized: false,
      });

      await useDesktopStore.getState().updateItem(antes.id, { ...antes, title: 'Nuevo' });

      const win = useDesktopStore.getState().openWindows[0];
      expect(win.id).toBe(`${DESKTOP_PATH}/Nuevo`);
      expect(win.title).toBe('Nuevo');
    });

    it('cambiar la url reescribe el contenido del archivo', async () => {
      await useDesktopStore.getState().addItem(shortcut('Sitio', 'https://viejo.com'));
      const antes = useDesktopStore.getState().items[0] as ShortcutItem;

      await useDesktopStore
        .getState()
        .updateItem(antes.id, { ...antes, url: 'https://nuevo.com' });

      expect(await vfs.read(`${DESKTOP_PATH}/Sitio`)).toBe('https://nuevo.com');
    });
  });

  describe('deleteItem', () => {
    it('borra el nodo del VFS', async () => {
      await useDesktopStore.getState().addItem(shortcut('Google'));

      await useDesktopStore.getState().deleteItem(`${DESKTOP_PATH}/Google`);

      expect(await vfs.exists(`${DESKTOP_PATH}/Google`)).toBe(false);
      expect(useDesktopStore.getState().items).toHaveLength(0);
    });

    it('borra una carpeta con contenido', async () => {
      await useDesktopStore.getState().addItem(folder('Padre'));
      const padre = useDesktopStore.getState().items[0];
      await useDesktopStore.getState().addItemToFolder(padre.id, shortcut('Hijo'));

      await useDesktopStore.getState().deleteItem(padre.id);

      expect(await vfs.exists(`${DESKTOP_PATH}/Padre`)).toBe(false);
      expect(await vfs.exists(`${DESKTOP_PATH}/Padre/Hijo`)).toBe(false);
    });

    it('cierra las ventanas del item y de lo que colgaba de el', async () => {
      await useDesktopStore.getState().addItem(folder('Padre'));
      const padre = useDesktopStore.getState().items[0] as FolderItem;
      await useDesktopStore.getState().addItemToFolder(padre.id, folder('Hijo'));

      const abrir = (id: string) =>
        useDesktopStore.getState().openWindow({
          id,
          title: id,
          icon: '',
          type: 'folder',
          content: padre,
          isMinimized: false,
          isMaximized: false,
        });
      abrir(padre.id);
      abrir(`${padre.id}/Hijo`);

      await useDesktopStore.getState().deleteItem(padre.id);

      expect(useDesktopStore.getState().openWindows).toHaveLength(0);
    });
  });

  describe('migracion desde localStorage', () => {
    // El snapshot real se toma al cargar el modulo, antes de que `persist`
    // pueda pisar la clave; aca se le pasa el fixture directo.
    const legado: (ShortcutItem | FolderItem)[] = [
      { id: 'a', title: 'Legado', url: 'https://legado.com', icon: '', clickCount: 3 },
      {
        id: 'b',
        title: 'Carpeta Legada',
        icon: '',
        clickCount: 0,
        items: [
          { id: 'c', title: 'Anidado', url: 'https://anidado.com', icon: '', clickCount: 0 },
        ],
      },
    ];

    it('sube al VFS el escritorio que habia quedado en localStorage', async () => {
      const escritos = await migrateLegacyItems(legado);
      await useDesktopStore.getState().refreshItems();

      expect(escritos).toBe(3);
      expect(await vfs.read(`${DESKTOP_PATH}/Legado`)).toBe('https://legado.com');
      expect(await vfs.exists(`${DESKTOP_PATH}/Carpeta Legada/Anidado`)).toBe(true);
      expect(useDesktopStore.getState().items).toHaveLength(2);
    });

    it('no pisa un escritorio que ya tiene cosas', async () => {
      await useDesktopStore.getState().addItem(folder('Ya estaba'));

      const escritos = await migrateLegacyItems(legado);
      await useDesktopStore.getState().refreshItems();

      expect(escritos).toBe(0);
      expect(await vfs.exists(`${DESKTOP_PATH}/Legado`)).toBe(false);
      expect(useDesktopStore.getState().items.map((i) => i.title)).toEqual(['Ya estaba']);
    });

    it('no hace nada si no hay nada que migrar', async () => {
      expect(await migrateLegacyItems([])).toBe(0);
    });
  });

  describe('setWallpaper', () => {
    it('actualiza el wallpaper', () => {
      useDesktopStore.getState().setWallpaper('https://ejemplo.com/fondo.jpg');
      expect(useDesktopStore.getState().wallpaper).toBe('https://ejemplo.com/fondo.jpg');
    });
  });

  describe('setTheme', () => {
    it('cambia a light', () => {
      useDesktopStore.getState().setTheme('light');
      expect(useDesktopStore.getState().theme).toBe('light');
    });

    it('cambia a dark', () => {
      useDesktopStore.setState({ theme: 'light' });
      useDesktopStore.getState().setTheme('dark');
      expect(useDesktopStore.getState().theme).toBe('dark');
    });
  });

  describe('toggleStartMenu', () => {
    it('abre', () => {
      useDesktopStore.setState({ isStartMenuOpen: false });
      useDesktopStore.getState().toggleStartMenu();
      expect(useDesktopStore.getState().isStartMenuOpen).toBe(true);
    });

    it('cierra', () => {
      useDesktopStore.setState({ isStartMenuOpen: true });
      useDesktopStore.getState().toggleStartMenu();
      expect(useDesktopStore.getState().isStartMenuOpen).toBe(false);
    });
  });

  describe('ventanas', () => {
    const abrir = (id: string) =>
      useDesktopStore.getState().openWindow({
        id,
        title: `Ventana ${id}`,
        icon: '',
        type: 'folder',
        content: { ...folder(`Ventana ${id}`), id },
        isMinimized: false,
        isMaximized: false,
      });

    it('openWindow agrega la ventana y la marca activa', () => {
      abrir('1');

      const { openWindows } = useDesktopStore.getState();
      expect(openWindows).toHaveLength(1);
      expect(openWindows[0].isActive).toBe(true);
    });

    it('abrir una segunda desactiva la primera', () => {
      abrir('1');
      abrir('2');

      const { openWindows } = useDesktopStore.getState();
      expect(openWindows[0].isActive).toBe(false);
      expect(openWindows[1].isActive).toBe(true);
    });

    it('closeWindow la saca', () => {
      abrir('1');
      useDesktopStore.getState().closeWindow('1');
      expect(useDesktopStore.getState().openWindows).toHaveLength(0);
    });

    it('minimizeWindow la minimiza', () => {
      abrir('1');
      useDesktopStore.getState().minimizeWindow('1');
      expect(useDesktopStore.getState().openWindows[0].isMinimized).toBe(true);
    });

    it('maximizeWindow desminimiza', () => {
      abrir('1');
      useDesktopStore.getState().minimizeWindow('1');
      useDesktopStore.getState().maximizeWindow('1');
      expect(useDesktopStore.getState().openWindows[0].isMinimized).toBe(false);
    });

    it('setActiveWindow cambia el foco', () => {
      abrir('1');
      abrir('2');
      useDesktopStore.getState().setActiveWindow('1');

      const { openWindows } = useDesktopStore.getState();
      expect(openWindows[0].isActive).toBe(true);
      expect(openWindows[1].isActive).toBe(false);
    });
  });

  describe('clearAllData', () => {
    it('resetea el store y vacia el escritorio del VFS', async () => {
      await useDesktopStore.getState().addItem(folder('Mi Carpeta'));
      useDesktopStore.setState({
        wallpaper: 'https://custom.com/w.jpg',
        theme: 'light',
        userProfile: { name: 'Custom', avatar: 'https://a.com/i.jpg' },
      });

      await useDesktopStore.getState().clearAllData();

      const state = useDesktopStore.getState();
      expect(state.wallpaper).toBe(defaultWallpaper);
      expect(state.theme).toBe('dark');
      expect(state.userProfile.name).toBe('User');
      expect(state.items).toHaveLength(0);
      expect(await vfs.exists(`${DESKTOP_PATH}/Mi Carpeta`)).toBe(false);
    });
  });

  describe('findFolderById / getAllItems', () => {
    it('findFolderById encuentra una carpeta anidada por su path', async () => {
      await useDesktopStore.getState().addItem(folder('Padre'));
      const padre = useDesktopStore.getState().items[0];
      await useDesktopStore.getState().addItemToFolder(padre.id, folder('Hija'));

      const encontrada = useDesktopStore.getState().findFolderById(`${padre.id}/Hija`);
      expect(encontrada?.title).toBe('Hija');
    });

    it('findFolderById devuelve null si no existe', () => {
      expect(useDesktopStore.getState().findFolderById('/no/existe')).toBeNull();
    });

    it('getAllItems aplana el arbol', async () => {
      await useDesktopStore.getState().addItem(folder('Padre'));
      const padre = useDesktopStore.getState().items[0];
      await useDesktopStore.getState().addItemToFolder(padre.id, shortcut('Hijo'));

      const titulos = useDesktopStore.getState().getAllItems().map((i) => i.title);
      expect(titulos.sort()).toEqual(['Hijo', 'Padre']);
    });
  });
});
