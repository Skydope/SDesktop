import type { ShortcutItem, FolderItem } from '../types/desktop';

// Find a folder by ID in a nested structure
export const findFolderById = (
  items: (ShortcutItem | FolderItem)[],
  id: string
): FolderItem | null => {
  for (const item of items) {
    if (item.id === id && 'items' in item) return item as FolderItem;
    if ('items' in item) {
      const found = findFolderById(item.items, id);
      if (found) return found;
    }
  }
  return null;
};

// Get all items flattened (including nested ones)
export const getAllItems = (
  items: (ShortcutItem | FolderItem)[]
): (ShortcutItem | FolderItem)[] => {
  const result: (ShortcutItem | FolderItem)[] = [];
  for (const item of items) {
    result.push(item);
    if ('items' in item) {
      result.push(...getAllItems(item.items));
    }
  }
  return result;
};

// Count statistics for items
export const countItemStats = (
  items: (ShortcutItem | FolderItem)[]
): { shortcuts: number; folders: number; total: number } => {
  let shortcuts = 0;
  let folders = 0;

  const traverse = (items: (ShortcutItem | FolderItem)[]) => {
    for (const item of items) {
      if ('items' in item) {
        folders++;
        traverse(item.items);
      } else {
        shortcuts++;
      }
    }
  };

  traverse(items);
  return { shortcuts, folders, total: shortcuts + folders };
};

// Update an item in nested structure
export const updateItemInTree = (
  items: (ShortcutItem | FolderItem)[],
  id: string,
  updatedItem: ShortcutItem | FolderItem
): (ShortcutItem | FolderItem)[] => {
  return items.map((item) => {
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
        items: updateItemInTree(item.items, id, updatedItem),
      };
    }
    return item;
  });
};

// Delete an item from nested structure
export const deleteItemFromTree = (
  items: (ShortcutItem | FolderItem)[],
  id: string
): (ShortcutItem | FolderItem)[] => {
  return items
    .filter((item) => item.id !== id)
    .map((item) => {
      if ('items' in item) {
        return {
          ...item,
          items: deleteItemFromTree(item.items, id),
        };
      }
      return item;
    });
};

// Add item to a specific folder
export const addItemToFolderInTree = (
  items: (ShortcutItem | FolderItem)[],
  folderId: string,
  newItem: ShortcutItem | FolderItem
): (ShortcutItem | FolderItem)[] => {
  return items.map((item) => {
    if (item.id === folderId && 'items' in item) {
      return { ...item, items: [...item.items, newItem] };
    }
    if ('items' in item) {
      return {
        ...item,
        items: addItemToFolderInTree(item.items, folderId, newItem),
      };
    }
    return item;
  });
};

// Increment click count for an item
export const incrementClickCountInTree = (
  items: (ShortcutItem | FolderItem)[],
  id: string
): (ShortcutItem | FolderItem)[] => {
  return items.map((item) => {
    if (item.id === id) {
      return { ...item, clickCount: (item.clickCount || 0) + 1 };
    }
    if ('items' in item) {
      return {
        ...item,
        items: incrementClickCountInTree(item.items, id),
      };
    }
    return item;
  });
};
