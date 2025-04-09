import React, { useState, useEffect } from 'react';
import { DesktopState, ShortcutItem, FolderItem, WindowState } from '../types/desktop';
import DesktopItem from './DesktopItem';
import Taskbar from './Taskbar';
import StartMenu from './StartMenu';
import Window from './Window';
import EditModal from './EditModal';
import DeleteModal from './DeleteModal';
import PropertiesModal from './PropertiesModal';
import { saveToLocalStorage, loadFromLocalStorage } from '../utils/storage';
import { getFaviconUrl } from '../utils/favicon';

const defaultWallpaper = 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=1920&q=80';

const Desktop: React.FC = () => {
  const [state, setState] = useState<DesktopState>(() => {
    const savedState = loadFromLocalStorage('desktopState');
    return savedState || {
      wallpaper: defaultWallpaper,
      theme: 'dark',
      items: [],
      openWindows: [],
      isStartMenuOpen: false
    };
  });

  const [editItem, setEditItem] = useState<ShortcutItem | FolderItem | null>(null);
  const [propertiesItem, setPropertiesItem] = useState<ShortcutItem | FolderItem | null>(null);
  const [editParentId, setEditParentId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<ShortcutItem | FolderItem | null>(null);
  const [deleteParentId, setDeleteParentId] = useState<string | null>(null);
  
  // Add user profile state
  const [userProfile, setUserProfile] = useState(() => {
    return {
      name: loadFromLocalStorage('userName') || 'User',
      avatar: loadFromLocalStorage('userAvatar') || ''
    };
  });

  useEffect(() => {
    saveToLocalStorage('desktopState', state);
  }, [state]);

  // Save user profile to localStorage when it changes
  useEffect(() => {
    saveToLocalStorage('userName', userProfile.name);
    saveToLocalStorage('userAvatar', userProfile.avatar);
  }, [userProfile]);

  const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, wallpaper: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWallpaperSelect = (url: string) => {
    setState(prev => ({ ...prev, wallpaper: url }));
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setState(prev => ({ ...prev, theme }));
  };

  const handleUpdateProfile = (profile: { name: string; avatar: string }) => {
    setUserProfile(profile);
  };

  const handleAddShortcut = async (shortcut: { title: string; url: string; icon: string }) => {
    const icon = shortcut.icon || await getFaviconUrl(shortcut.url);
    const newShortcut: ShortcutItem = {
      id: crypto.randomUUID(),
      ...shortcut,
      icon,
      clickCount: 0
    };
    setState(prev => ({ ...prev, items: [...prev.items, newShortcut], isStartMenuOpen: false }));
  };

  const handleAddFolder = (folder: { title: string; icon: string }) => {
    const newFolder: FolderItem = {
      id: crypto.randomUUID(),
      ...folder,
      items: [],
      clickCount: 0
    };
    setState(prev => ({ ...prev, items: [...prev.items, newFolder], isStartMenuOpen: false }));
  };

  const handleAddItemToFolder = (folderId: string, item: ShortcutItem | FolderItem) => {
    const updateFolderItems = (items: (ShortcutItem | FolderItem)[]): (ShortcutItem | FolderItem)[] => {
      return items.map(currentItem => {
        if (currentItem.id === folderId && 'items' in currentItem) {
          return { ...currentItem, items: [...currentItem.items, item] };
        } else if ('items' in currentItem) {
          return { ...currentItem, items: updateFolderItems(currentItem.items) };
        }
        return currentItem;
      });
    };

    setState(prev => {
      const updatedItems = updateFolderItems(prev.items);
      const updatedWindows = prev.openWindows.map(window => {
        if (window.id === folderId) {
          const updatedFolder = updatedItems.find(item => item.id === folderId) as FolderItem || 
                                findFolderInItems(updatedItems, folderId);
          if (updatedFolder) {
            return { ...window, content: updatedFolder };
          }
        }
        return window;
      });

      return { ...prev, items: updatedItems, openWindows: updatedWindows };
    });
  };

  const findFolderInItems = (items: (ShortcutItem | FolderItem)[], folderId: string): FolderItem | null => {
    for (const item of items) {
      if (item.id === folderId && 'items' in item) return item as FolderItem;
      if ('items' in item) {
        const found = findFolderInItems(item.items, folderId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleItemClick = (item: ShortcutItem | FolderItem) => {
    const incrementClickCount = (items: (ShortcutItem | FolderItem)[]): (ShortcutItem | FolderItem)[] => {
      return items.map(stateItem => {
        if (stateItem.id === item.id) {
          return { ...stateItem, clickCount: (stateItem.clickCount || 0) + 1 };
        } else if ('items' in stateItem) {
          return { ...stateItem, items: incrementClickCount(stateItem.items) };
        }
        return stateItem;
      });
    };

    setState(prev => ({ ...prev, items: incrementClickCount(prev.items) }));

    if ('url' in item) {
      window.open(item.url, '_blank');
      return;
    }

    const folderItem = item as FolderItem;
    const existingWindow = state.openWindows.find(w => w.id === item.id);

    if (existingWindow) {
      setState(prev => ({
        ...prev,
        openWindows: prev.openWindows.map(w => ({ ...w, isActive: w.id === item.id }))
      }));
    } else {
      const updatedItems = incrementClickCount(state.items);

      const getUpdatedItem = (items: (ShortcutItem | FolderItem)[], id: string): FolderItem | null => {
        for (const i of items) {
          if (i.id === id && 'items' in i) return i as FolderItem;
          if ('items' in i) {
            const found = getUpdatedItem(i.items, id);
            if (found) return found;
          }
        }
        return null;
      };

      const updatedItem = getUpdatedItem(updatedItems, item.id) || folderItem;

      setState(prev => ({
        ...prev,
        openWindows: [
          ...prev.openWindows.map(w => ({ ...w, isActive: false })),
          {
            id: item.id,
            title: item.title,
            icon: item.icon,
            isActive: true,
            type: 'folder',
            content: updatedItem,
            isMinimized: false  // Make sure to include isMinimized property
          }
        ]
      }));
    }
  };

  const handleNestedItemClick = (item: ShortcutItem | FolderItem, parentFolderId: string) => {
    handleItemClick(item);
  };

  const handleItemEdit = (item: ShortcutItem | FolderItem, parentFolderId?: string) => {
    setEditItem(item);
    setEditParentId(parentFolderId || null);
  };

  const handleItemDelete = (itemId: string, parentFolderId?: string) => {
    const findItemById = (items: (ShortcutItem | FolderItem)[], id: string): ShortcutItem | FolderItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if ('items' in item) {
          const found = findItemById(item.items, id);
          if (found) return found;
        }
      }
      return null;
    };

    const itemToDelete = parentFolderId
      ? findItemById(
          (findFolderInItems(state.items, parentFolderId)?.items || []),
          itemId
        )
      : findItemById(state.items, itemId);

    if (itemToDelete) {
      setDeleteItem(itemToDelete);
      setDeleteParentId(parentFolderId || null);
    }
  };

  const handleConfirmDelete = (itemId: string) => {
    const parentFolderId = deleteParentId;

    if (parentFolderId) {
      setState(prev => {
        const updateFolderItems = (items: (ShortcutItem | FolderItem)[]): (ShortcutItem | FolderItem)[] => {
          return items.map(item => {
            if (item.id === parentFolderId && 'items' in item) {
              return { ...item, items: item.items.filter(i => i.id !== itemId) };
            } else if ('items' in item) {
              return { ...item, items: updateFolderItems(item.items) };
            }
            return item;
          });
        };

        const updatedItems = updateFolderItems(prev.items);
        const updatedWindows = prev.openWindows.map(window => {
          if (window.id === parentFolderId) {
            const updatedFolder = updatedItems.find(i => i.id === parentFolderId) as FolderItem ||
                                  findFolderInItems(updatedItems, parentFolderId);
            if (updatedFolder) return { ...window, content: updatedFolder };
          }
          return window;
        }).filter(window => window.id !== itemId);

        return { ...prev, items: updatedItems, openWindows: updatedWindows };
      });
    } else {
      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
        openWindows: prev.openWindows.filter(window => window.id !== itemId)
      }));
    }
  };

  const handleItemProperties = (item: ShortcutItem | FolderItem) => {
    const findCurrentItem = (items: (ShortcutItem | FolderItem)[], id: string): ShortcutItem | FolderItem | null => {
      for (const i of items) {
        if (i.id === id) return i;
        if ('items' in i) {
          const found = findCurrentItem(i.items, id);
          if (found) return found;
        }
      }
      return null;
    };

    const currentItem = findCurrentItem(state.items, item.id);
    setPropertiesItem(currentItem || item);
  };

  const handleWindowClick = (window: WindowState) => {
    setState(prev => ({
      ...prev,
      openWindows: prev.openWindows.map(w => ({ ...w, isActive: w.id === window.id }))
    }));
  };

  const handleWindowClose = (windowId: string) => {
    setState(prev => ({
      ...prev,
      openWindows: prev.openWindows.filter(w => w.id !== windowId)
    }));
  };

  const handleSaveEditedItem = (updatedItem: ShortcutItem | FolderItem) => {
    setState(prev => {
      const updateItemInStructure = (
        items: (ShortcutItem | FolderItem)[],
        itemId: string,
        newItem: ShortcutItem | FolderItem
      ): (ShortcutItem | FolderItem)[] => {
        return items.map(item => {
          if (item.id === itemId) {
            return {
              ...newItem,
              clickCount: item.clickCount || 0,
              ...('items' in item ? { items: (item as FolderItem).items } : {})
            };
          } else if ('items' in item) {
            return {
              ...item,
              items: updateItemInStructure(item.items, itemId, newItem)
            };
          }
          return item;
        });
      };

      const updatedItems = updateItemInStructure(prev.items, updatedItem.id, updatedItem);

      const updatedWindows = prev.openWindows.map(w => {
        if (w.id === updatedItem.id) {
          return {
            ...w,
            title: updatedItem.title,
            icon: updatedItem.icon,
            ...(w.type === 'folder' ? { content: { ...w.content, title: updatedItem.title, icon: updatedItem.icon } } : {})
          };
        }
        if (editParentId && w.id === editParentId) {
          const updatedParent = findFolderInItems(updatedItems, editParentId);
          if (updatedParent) return { ...w, content: updatedParent };
        }
        return w;
      });

      return { ...prev, items: updatedItems, openWindows: updatedWindows };
    });

    setEditItem(null);
    setEditParentId(null);
  };

  // Recursive function to get all items including those in folders
  const getAllItems = (): (ShortcutItem | FolderItem)[] => {
    const result: (ShortcutItem | FolderItem)[] = [];
    
    const extractItems = (items: (ShortcutItem | FolderItem)[]) => {
      items.forEach(item => {
        result.push(item);
        if ('items' in item) {
          extractItems(item.items);
        }
      });
    };
    
    extractItems(state.items);
    return result;
  };

  // Handle clearing all data
  const handleClearAllData = () => {
    const keysToDelete = [
      'shortcuts', 
      'folders', 
      'wallpaper', 
      'theme',
      'desktopState',
      'userName',
      'userAvatar'
    ];
    
    keysToDelete.forEach(key => {
      localStorage.removeItem(key);
    });
    
    setState({
      wallpaper: defaultWallpaper,
      theme: 'dark',
      items: [],
      openWindows: [],
      isStartMenuOpen: false
    });
    
    setUserProfile({
      name: 'User',
      avatar: ''
    });
  };

  return (
    <div 
      className={`relative w-full h-screen overflow-hidden bg-cover bg-center ${
        state.theme === 'light' ? 'bg-white' : 'bg-gray-900'
      }`}
      style={{ backgroundImage: `url(${state.wallpaper})` }}
    >
      <div className="absolute inset-0 grid grid-cols-12 gap-4 p-4 pb-16">
        {state.items.map((item) => (
          <DesktopItem
            key={item.id}
            item={item}
            onClick={() => handleItemClick(item)}
            onEdit={() => handleItemEdit(item)}
            onDelete={() => handleItemDelete(item.id)}
            onViewProperties={() => handleItemProperties(item)}
          />
        ))}
      </div>

      {state.openWindows.map((window) => (
        <Window
          key={window.id}
          window={window}
          onClose={handleWindowClose}
          onAddItemToFolder={handleAddItemToFolder}
          onItemClick={handleNestedItemClick}
          onEditItem={(item) => handleItemEdit(item, window.id)}
          onDeleteItem={(itemId) => handleItemDelete(itemId, window.id)}
          onViewProperties={handleItemProperties}
        />
      ))}

      <StartMenu
        isOpen={state.isStartMenuOpen}
        onAddShortcut={handleAddShortcut}
        onAddFolder={handleAddFolder}
        onThemeChange={handleThemeChange}
        currentTheme={state.theme}
        userName={userProfile.name}
        userAvatar={userProfile.avatar}
        onUpdateProfile={handleUpdateProfile}
        onWallpaperChange={handleWallpaperChange}
        onWallpaperSelect={handleWallpaperSelect}
        onClearData={handleClearAllData}
        allItems={state.items} // Pass all items to StartMenu
        onOpenItem={handleItemClick} // Pass the handler for opening items
      />

      <Taskbar
        openWindows={state.openWindows}
        isStartMenuOpen={state.isStartMenuOpen}
        onStartMenuClick={() => setState(prev => ({ ...prev, isStartMenuOpen: !prev.isStartMenuOpen }))}
        onWindowClick={handleWindowClick}
        onWindowClose={handleWindowClose}
      />

      {editItem && (
        <EditModal 
          item={editItem} 
          onClose={() => {
            setEditItem(null);
            setEditParentId(null);
          }} 
          onSave={handleSaveEditedItem}
        />
      )}

      {propertiesItem && (
        <PropertiesModal 
          item={propertiesItem} 
          onClose={() => setPropertiesItem(null)} 
        />
      )}

      {deleteItem && (
        <DeleteModal
          item={deleteItem}
          onClose={() => {
            setDeleteItem(null);
            setDeleteParentId(null);
          }}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default Desktop;
