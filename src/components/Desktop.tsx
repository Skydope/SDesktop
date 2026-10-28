import React, { useState } from 'react'
import { ShortcutItem, FolderItem } from '../types/desktop'
import { useDesktopStore } from '../store/desktopStore'
import { getFaviconUrl } from '../utils/favicon'
import DesktopItem from './DesktopItem'
import StartMenu from './StartMenu'
import Window from './Window'
import EditModal from './EditModal'
import DeleteModal from './DeleteModal'
import PropertiesModal from './PropertiesModal'
import { ContextMenu, getDesktopMenuItems } from './context-menu'
import type { ContextMenuItem, ContextMenuPosition } from './context-menu'

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
    clearAllData,
    getAllItems,
  } = useDesktopStore()

  const [editItem, setEditItem] = useState<ShortcutItem | FolderItem | null>(null)
  const [propertiesItem, setPropertiesItem] = useState<ShortcutItem | FolderItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<ShortcutItem | FolderItem | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    position: ContextMenuPosition
    items: ContextMenuItem[]
  }>({ isOpen: false, position: { x: 0, y: 0 }, items: [] })

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
        isMaximized: false,
      })
    }
  }

  const handleItemEdit = (item: ShortcutItem | FolderItem) => {
    setEditItem(item)
  }

  const handleItemDelete = (itemId: string) => {
    const itemToDelete = getAllItems().find((i) => i.id === itemId)
    if (itemToDelete) {
      setDeleteItem(itemToDelete)
    }
  }

  const handleConfirmDelete = (itemId: string) => {
    removeItem(itemId)
    setDeleteItem(null)
  }

  const handleSaveEditedItem = (updatedItem: ShortcutItem | FolderItem) => {
    updateItem(updatedItem.id, updatedItem)
    setEditItem(null)
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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      items: getDesktopMenuItems(),
    })
  }

  const handleContextMenuAction = (actionId: string) => {
    switch (actionId) {
      case 'new-folder':
        handleAddFolder({ title: 'New Folder', icon: '' })
        break
      case 'new-file':
        handleAddShortcut({ title: 'New File', url: '', icon: '' })
        break
      case 'paste':
        break
    }
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }

  return (
    <div
      className="os-desktop"
      style={{ backgroundImage: `url(${wallpaper})` }}
      onContextMenu={handleContextMenu}
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
      {openWindows.map((win, index) => (
        <Window
          key={win.id}
          window={win}
          index={index}
          onClose={closeWindow}
          onMinimize={handleWindowMinimize}
          onMaximize={handleWindowMaximize}
          onAddItemToFolder={addItemToFolder}
          onItemClick={handleItemClick}
          onEditItem={handleItemEdit}
          onDeleteItem={handleItemDelete}
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

      {/* Modals */}
      {editItem && (
        <EditModal
          key={editItem.id}
          item={editItem}
          onClose={() => setEditItem(null)}
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
          onClose={() => setDeleteItem(null)}
          onConfirmDelete={handleConfirmDelete}
        />
      )}

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        menuItems={contextMenu.items}
        onSelect={handleContextMenuAction}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

export default Desktop