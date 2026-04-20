import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ShortcutItem, FolderItem, WindowState } from '../types/desktop';

const defaultWallpaper = 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=1920&q=80';

interface UserProfile {
  name: string;
  avatar: string;
}

interface DesktopState {
  wallpaper: string;
  theme: 'light' | 'dark';
  items: (ShortcutItem | FolderItem)[];
  openWindows: WindowState[];
  isStartMenuOpen: boolean;
  userProfile: UserProfile;
}

interface DesktopActions {
  setWallpaper: (wallpaper: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addItem: (item: ShortcutItem | FolderItem) => void;
  addItemToFolder: (folderId: string, item: ShortcutItem | FolderItem) => void;
  updateItem: (id: string, updatedItem: ShortcutItem | FolderItem, parentId?: string) => void;
  deleteItem: (id: string, parentId?: string) => void;
  openWindow: (window: Omit<WindowState, 'isActive'>) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  setActiveWindow: (id: string) => void;
  toggleStartMenu: () => void;
  updateUserProfile: (profile: UserProfile) => void;
  clearAllData: () => void;
  findFolderById: (id: string) => FolderItem | null;
  getAllItems: () => (ShortcutItem | FolderItem)[];
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

// Helper: Update item in nested structure
const updateItemRecursive = (
  items: (ShortcutItem | FolderItem)[],
  id: string,
  updatedItem: ShortcutItem | FolderItem
): (ShortcutItem | FolderItem)[] => {
  return items.map(item => {
    if (item.id === id) {
      return {
        ...updatedItem,
        clickCount: item.clickCount || 0,
        ...('items' in item ? { items: (item as FolderItem).items } : {}),
      };
    }
    if ('items' in item) {
      return {
        ...item,
        items: updateItemRecursive(item.items, id, updatedItem),
      };
    }
    return item;
  });
};

// Helper: Delete item from nested structure
const deleteItemRecursive = (
  items: (ShortcutItem | FolderItem)[],
  id: string
): (ShortcutItem | FolderItem)[] => {
  return items
    .filter(item => item.id !== id)
    .map(item => {
      if ('items' in item) {
        return {
          ...item,
          items: deleteItemRecursive(item.items, id),
        };
      }
      return item;
    });
};

// Helper: Add item to folder recursively
const addItemToFolderRecursive = (
  items: (ShortcutItem | FolderItem)[],
  folderId: string,
  newItem: ShortcutItem | FolderItem
): (ShortcutItem | FolderItem)[] => {
  return items.map(item => {
    if (item.id === folderId && 'items' in item) {
      return { ...item, items: [...item.items, newItem] };
    }
    if ('items' in item) {
      return {
        ...item,
        items: addItemToFolderRecursive(item.items, folderId, newItem),
      };
    }
    return item;
  });
};

export const useDesktopStore = create<DesktopStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setWallpaper: (wallpaper) => set({ wallpaper }),

      setTheme: (theme) => set({ theme }),

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
          isStartMenuOpen: false,
        })),

      addItemToFolder: (folderId, newItem) =>
        set((state) => ({
          items: addItemToFolderRecursive(state.items, folderId, newItem),
        })),

      updateItem: (id, updatedItem, parentId) =>
        set((state) => {
          const newItems = updateItemRecursive(state.items, id, updatedItem);
          const newWindows = state.openWindows.map((w) => {
            if (w.id === id) {
              return {
                ...w,
                title: updatedItem.title,
                icon: updatedItem.icon,
                ...(w.type === 'folder'
                  ? {
                      content: {
                        ...w.content,
                        title: updatedItem.title,
                        icon: updatedItem.icon,
                      },
                    }
                  : {}),
              };
            }
            if (parentId && w.id === parentId) {
              const updatedFolder = findFolderByIdRecursive(newItems, parentId);
              if (updatedFolder) return { ...w, content: updatedFolder };
            }
            return w;
          });
          return { items: newItems, openWindows: newWindows };
        }),

      deleteItem: (id, parentId) =>
        set((state) => {
          if (parentId) {
            const properlyDeleted = deleteItemRecursive(state.items, id);
            const newWindows = state.openWindows
              .map((w) => {
                if (w.id === parentId) {
                  const updatedFolder = findFolderByIdRecursive(
                    properlyDeleted,
                    parentId
                  );
                  if (updatedFolder) return { ...w, content: updatedFolder };
                }
                return w;
              })
              .filter((w) => w.id !== id);
            return { items: properlyDeleted, openWindows: newWindows };
          }
          return {
            items: deleteItemRecursive(state.items, id),
            openWindows: state.openWindows.filter((w) => w.id !== id),
          };
        }),

      openWindow: (windowData) =>
        set((state) => ({
          openWindows: [
            ...state.openWindows.map((w) => ({ ...w, isActive: false })),
            { ...windowData, isActive: true },
          ],
        })),

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
            w.id === id ? { ...w, isMinimized: false } : w
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

      clearAllData: () => set(initialState),

      findFolderById: (id) => findFolderByIdRecursive(get().items, id),

      getAllItems: () => getAllItemsRecursive(get().items),
    }),
    {
      name: 'desktopState',
      partialize: (state) => ({
        wallpaper: state.wallpaper,
        theme: state.theme,
        items: state.items,
        userProfile: state.userProfile,
      }),
    }
  )
);

export { defaultWallpaper };
export type { UserProfile };
