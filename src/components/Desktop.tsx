import React, { useState } from 'react'
import { ShortcutItem, FolderItem, AppId } from '../types/desktop'
import { useDesktopStore } from '../store/desktopStore'
import { getFaviconUrl } from '../utils/favicon'
import DesktopItem from './DesktopItem'
import Taskbar from './Taskbar'
import StartMenu from './StartMenu'
import Window from './Window'
import EditModal from './EditModal'
import DeleteModal from './DeleteModal'
import PropertiesModal from './PropertiesModal'

const Desktop: React.FC = () => {
  const {
    items,
    wallpaper,
    openWindows,
    isStartMenuOpen,
    addItem,
    addItemToFolder,
    updateItem,
    deleteItem: removeItem,
    openWindow,
    openApp,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    setActiveWindow,
    toggleStartMenu,
    clearAllData,
    findFolderById,
    getAllItems,
  } = useDesktopStore()

  const [editItem, setEditItem] = useState<ShortcutItem | FolderItem | null>(null)
  const [propertiesItem, setPropertiesItem] = useState<ShortcutItem | FolderItem | null>(null)
  const [editParentId, setEditParentId] = useState<string | null>(null)
  const [deleteItem, setDeleteItem] = useState<ShortcutItem | FolderItem | null>(null)
  const [deleteParentId, setDeleteParentId] = useState<string | null>(null)

  const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        useDesktopStore.getState().setWallpaper(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleWallpaperSelect = (url: string) => {
    useDesktopStore.getState().setWallpaper(url)
  }

  const handleAddShortcut = async (shortcut: { title: string; url: string; icon: string }) => {
    const icon = shortcut.icon || await getFaviconUrl(shortcut.url)
    const newShortcut: ShortcutItem = {
      id: crypto.randomUUID(),
      ...shortcut,
      icon,
      clickCount: 0,
    }
    addItem(newShortcut)
  }

  const handleAddFolder = (folder: { title: string; icon: string }) => {
    const newFolder: FolderItem = {
      id: crypto.randomUUID(),
      ...folder,
      items: [],
      clickCount: 0,
    }
    addItem(newFolder)
  }

  const handleItemClick = (item: ShortcutItem | FolderItem) => {
    if ('url' in item) {
      window.open(item.url, '_blank')
      return
    }

    const existingWindow = openWindows.find((w) => w.id === item.id)

    if (existingWindow) {
      setActiveWindow(item.id)
      if (existingWindow.isMinimized) {
        maximizeWindow(item.id)
      }
    } else {
      openWindow({
        id: item.id,
        title: item.title,
        icon: item.icon,
        type: 'folder',
        content: item,
        isMinimized: false,
      })
    }
  }

  const handleItemEdit = (item: ShortcutItem | FolderItem, parentFolderId?: string) => {
    setEditItem(item)
    setEditParentId(parentFolderId || null)
  }

  const handleItemDelete = (itemId: string, parentFolderId?: string) => {
    const findItemById = (
      items: (ShortcutItem | FolderItem)[],
      id: string
    ): ShortcutItem | FolderItem | null => {
      for (const item of items) {
        if (item.id === id) return item
        if ('items' in item) {
          const found = findItemById(item.items, id)
          if (found) return found
        }
      }
      return null
    }

    const allItems = getAllItems()
    const itemToDelete = parentFolderId
      ? findItemById(findFolderById(parentFolderId)?.items || [], itemId)
      : findItemById(allItems, itemId)

    if (itemToDelete) {
      setDeleteItem(itemToDelete)
      setDeleteParentId(parentFolderId || null)
    }
  }

  const handleConfirmDelete = (itemId: string) => {
    removeItem(itemId, deleteParentId || undefined)
    setDeleteItem(null)
    setDeleteParentId(null)
  }

  const handleSaveEditedItem = (updatedItem: ShortcutItem | FolderItem) => {
    updateItem(updatedItem.id, updatedItem, editParentId || undefined)
    setEditItem(null)
    setEditParentId(null)
  }

  const handleWindowMinimize = (windowId: string) => {
    minimizeWindow(windowId)
  }

  const handleWindowMaximize = (windowId: string) => {
    maximizeWindow(windowId)
  }

  const handleBringWindowToFront = () => {
    setActiveWindow(openWindows[openWindows.length - 1]?.id)
  }

  return (
    <div
      className="os-desktop"
      style={{ backgroundImage: `url(${wallpaper})` }}
    >
      {/* Desktop items */}
      <div className="os-desktop-grid">
        <div className="os-desktop-grid__items">
          {items.map((item) => (
            <DesktopItem
              key={item.id}
              item={item}
              onClick={() => handleItemClick(item)}
              onEdit={() => handleItemEdit(item)}
              onDelete={() => handleItemDelete(item.id)}
              onViewProperties={(i) => setPropertiesItem(i)}
            />
          ))}
        </div>
      </div>

      {/* Windows */}
      {openWindows.map((win) => (
        <Window
          key={win.id}
          window={win}
          onClose={closeWindow}
          onMinimize={handleWindowMinimize}
          onMaximize={handleWindowMaximize}
          onAddItemToFolder={addItemToFolder}
          onItemClick={handleItemClick}
          onEditItem={(item) => handleItemEdit(item, win.id)}
          onDeleteItem={(itemId) => handleItemDelete(itemId, win.id)}
          onViewProperties={(i) => setPropertiesItem(i)}
          onBringToFront={handleBringWindowToFront}
        />
      ))}

      {/* Start Menu */}
      <StartMenu
        isOpen={isStartMenuOpen}
        onAddShortcut={handleAddShortcut}
        onAddFolder={handleAddFolder}
        onWallpaperChange={handleWallpaperChange}
        onWallpaperSelect={handleWallpaperSelect}
        onClearData={clearAllData}
        onOpenItem={handleItemClick}
        onOpenApp={openApp}
        allItems={getAllItems()}
      />

      {/* Taskbar */}
      <Taskbar
        openWindows={openWindows}
        isStartMenuOpen={isStartMenuOpen}
        onStartMenuClick={toggleStartMenu}
        onWindowClick={(w) => {
          setActiveWindow(w.id)
          if (w.isMinimized) maximizeWindow(w.id)
        }}
        onWindowClose={closeWindow}
      />

      {/* Modals */}
      {editItem && (
        <EditModal
          item={editItem}
          onClose={() => {
            setEditItem(null)
            setEditParentId(null)
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
            setDeleteItem(null)
            setDeleteParentId(null)
          }}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </div>
  )
}

export default Desktop