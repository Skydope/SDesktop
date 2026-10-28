import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ShortcutItem, FolderItem, WindowState } from '../types/desktop';
import { vfs } from '../vfs';
import { APP_REGISTRY } from '../types/desktop';
import {
  DESKTOP_PATH,
  readDesktopItems,
  writeItem,
  updateItemAt,
  migrateLegacyItems,
} from './desktopItems';

const defaultWallpaper = 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=1920&q=80';

interface UserProfile {
  name: string;
  avatar: string;
}

interface DesktopState {
  wallpaper: string;
  theme: 'light' | 'dark';
  /**
   * Vista derivada de /Users/guest/Desktop. NO se persiste: la fuente de verdad
   * es el VFS, asi que un `mkdir` en la terminal aparece aca y viceversa.
   */
  items: (ShortcutItem | FolderItem)[];
  openWindows: WindowState[];
  isStartMenuOpen: boolean;
  userProfile: UserProfile;
  skipBoot: boolean;
}

interface DesktopActions {
  setWallpaper: (wallpaper: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  refreshItems: () => Promise<void>;
  initDesktop: () => Promise<void>;
  addItem: (item: ShortcutItem | FolderItem) => Promise<void>;
  addItemToFolder: (folderId: string, item: ShortcutItem | FolderItem) => Promise<void>;
  updateItem: (id: string, updatedItem: ShortcutItem | FolderItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  openWindow: (window: Omit<WindowState, 'isActive'>) => void;
  openApp: (appId: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  setActiveWindow: (id: string) => void;
  toggleStartMenu: () => void;
  updateUserProfile: (profile: UserProfile) => void;
  clearAllData: () => Promise<void>;
  findFolderById: (id: string) => FolderItem | null;
  getAllItems: () => (ShortcutItem | FolderItem)[];
  setSkipBoot: (skip: boolean) => void;
}

type DesktopStore = DesktopState & DesktopActions;

const initialState: DesktopState = {
  wallpaper: defaultWallpaper,
  theme: 'dark',
  items: [],
  openWindows: [],
  isStartMenuOpen: false,
  userProfile: {
    name: 'User',
    avatar: '',
  },
  skipBoot: false,
};

// Helper: Find a folder recursively by ID
const findFolderByIdRecursive = (
  items: (ShortcutItem | FolderItem)[],
  id: string
): FolderItem | null => {
  for (const item of items) {
    if (item.id === id && 'items' in item) return item as FolderItem;
    if ('items' in item) {
      const found = findFolderByIdRecursive(item.items, id);
      if (found) return found;
    }
  }
  return null;
};

// Helper: Get all items recursively (flattened)
const getAllItemsRecursive = (
  items: (ShortcutItem | FolderItem)[]
): (ShortcutItem | FolderItem)[] => {
  const result: (ShortcutItem | FolderItem)[] = [];
  for (const item of items) {
    result.push(item);
    if ('items' in item) {
      result.push(...getAllItemsRecursive(item.items));
    }
  }
  return result;
};

// StrictMode monta el efecto de arranque dos veces en dev; sin esto quedarian
// dos listeners del VFS y cada escritura refrescaria el escritorio dos veces.
let unsubscribeVfs: (() => void) | null = null;

export const useDesktopStore = create<DesktopStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setWallpaper: (wallpaper) => set({ wallpaper }),

      setTheme: (theme) => set({ theme }),

      /**
       * Relee el escritorio del VFS y re-apunta el contenido de las ventanas de
       * carpeta abiertas. Antes cada accion mutadora tenia su propio loop de
       * resync porque `items` era un arbol aparte; ahora hay un solo lugar.
       */
      refreshItems: async () => {
        const items = await readDesktopItems();
        set((state) => ({
          items,
          openWindows: state.openWindows.map((w) =>
            w.type === 'folder'
              ? { ...w, content: findFolderByIdRecursive(items, w.id) ?? w.content }
              : w
          ),
        }));
      },

      initDesktop: async () => {
        await vfs.mkdir(DESKTOP_PATH, true).catch(() => {});
        await migrateLegacyItems();
        await get().refreshItems();

        // Lo que mute el VFS por fuera del store (la terminal, el Finder) se
        // refleja solo en el escritorio. Sin esto, `mkdir` en la terminal no
        // aparecia, que era el techo de fidelidad del proyecto.
        if (!unsubscribeVfs) {
          unsubscribeVfs = vfs.subscribe(() => {
            void get().refreshItems();
          });
        }
      },

      addItem: async (item) => {
        await writeItem(DESKTOP_PATH, item);
        set({ isStartMenuOpen: false });
        await get().refreshItems();
      },

      addItemToFolder: async (folderId, newItem) => {
        await writeItem(folderId, newItem);
        await get().refreshItems();
      },

      updateItem: async (id, updatedItem) => {
        const nextId = await updateItemAt(id, updatedItem);

        // Renombrar es mover, asi que el path cambia y con el, el id. Las
        // ventanas abiertas de ese item y de lo que cuelga de el tienen que
        // seguirlo, o quedan apuntando a un path que ya no existe.
        if (nextId !== id) {
          set((state) => ({
            openWindows: state.openWindows.map((w) => {
              if (w.id === id) return { ...w, id: nextId, title: updatedItem.title };
              if (w.id.startsWith(id + '/')) {
                return { ...w, id: nextId + w.id.slice(id.length) };
              }
              return w;
            }),
          }));
        }

        await get().refreshItems();
      },

      deleteItem: async (id) => {
        await vfs.remove(id, true);
        // Cerrar la ventana del item y las de todo lo que colgaba de el.
        set((state) => ({
          openWindows: state.openWindows.filter(
            (w) => w.id !== id && !w.id.startsWith(id + '/')
          ),
        }));
        await get().refreshItems();
      },

      openWindow: (windowData) =>
        set((state) => ({
          openWindows: [
            ...state.openWindows.map((w) => ({ ...w, isActive: false })),
            { ...windowData, isActive: true },
          ],
        })),

      openApp: (appId) => {
        const app = APP_REGISTRY[appId as keyof typeof APP_REGISTRY];
        if (!app) return;
        const windowId = `${appId}-${Date.now()}`;
        set((state) => ({
          openWindows: [
            ...state.openWindows.map((w) => ({ ...w, isActive: false })),
            {
              id: windowId,
              title: app.name,
              icon: app.icon,
              type: 'app',
              appId,
              content: { id: windowId, title: app.name, icon: app.icon, items: [], clickCount: 0 },
              isMinimized: false,
              isMaximized: false,
              isActive: true,
            },
          ],
        }));
      },

      closeWindow: (id) =>
        set((state) => ({
          openWindows: state.openWindows.filter((w) => w.id !== id),
        })),

      minimizeWindow: (id) =>
        set((state) => ({
          openWindows: state.openWindows.map((w) =>
            w.id === id ? { ...w, isMinimized: true } : w
          ),
        })),

      maximizeWindow: (id) =>
        set((state) => ({
          openWindows: state.openWindows.map((w) =>
            w.id === id ? { ...w, isMaximized: !w.isMaximized, isMinimized: false } : w
          ),
        })),

      setActiveWindow: (id) =>
        set((state) => ({
          openWindows: state.openWindows.map((w) => ({
            ...w,
            isActive: w.id === id,
          })),
        })),

      toggleStartMenu: () =>
        set((state) => ({ isStartMenuOpen: !state.isStartMenuOpen })),

      updateUserProfile: (profile) => set({ userProfile: profile }),

      clearAllData: async () => {
        set(initialState);
        // El store vive en localStorage y el VFS en IndexedDB: resetear uno
        // solo dejaba el filesystem viejo. clear() marca el VFS como no
        // inicializado, asi que init() lo vuelve a sembrar por defecto.
        await vfs.clear();
        await vfs.init();
        await get().refreshItems();
      },

      findFolderById: (id) => findFolderByIdRecursive(get().items, id),

      getAllItems: () => getAllItemsRecursive(get().items),

      setSkipBoot: (skip: boolean) => set({ skipBoot: skip }),
    }),
    {
      name: 'desktopState',
      // `items` NO se persiste: el escritorio se lee del VFS en cada arranque.
      partialize: (state) => ({
        wallpaper: state.wallpaper,
        theme: state.theme,
        userProfile: state.userProfile,
        skipBoot: state.skipBoot,
      }),
    }
  )
);

export { defaultWallpaper };
export type { UserProfile };
