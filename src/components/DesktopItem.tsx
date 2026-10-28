import React, { useState } from 'react'
import { FolderItem, ShortcutItem } from '../types/desktop'
import { Folder, Link } from 'lucide-react'
import { ContextMenu, getItemMenuItems } from './context-menu'
import type { ContextMenuItem, ContextMenuPosition } from './context-menu'

interface Props {
  item: ShortcutItem | FolderItem
  onClick: () => void
  onEdit?: (item: ShortcutItem | FolderItem) => void
  onDelete?: (id: string) => void
  onViewProperties?: (item: ShortcutItem | FolderItem) => void
}

const DesktopItem: React.FC<Props> = ({
  item,
  onClick,
  onEdit,
  onDelete,
  onViewProperties,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    position: ContextMenuPosition
    items: ContextMenuItem[]
  }>({ isOpen: false, position: { x: 0, y: 0 }, items: [] })
  const isFolder = 'items' in item

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      items: getItemMenuItems(isFolder),
    })
  }

  const handleContextMenuAction = (actionId: string) => {
    switch (actionId) {
      case 'open':
        onClick()
        break
      case 'get-info':
        onViewProperties?.(item)
        break
      case 'edit':
        onEdit?.(item)
        break
      case 'cut':
        break
      case 'copy':
        break
      case 'delete':
        onDelete?.(item.id)
        break
    }
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }

  return (
    <>
      <div className="os-desktop-item" onClick={onClick} onContextMenu={handleContextMenu}>
        <div className="os-desktop-item__icon">
          {item.icon ? (
            <img src={item.icon} alt={item.title} />
          ) : isFolder ? (
            <Folder className="os-icon" style={{ width: 40, height: 40 }} />
          ) : (
            <Link className="os-icon" style={{ width: 40, height: 40 }} />
          )}
        </div>

        <span className="os-desktop-item__label">{item.title}</span>
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        menuItems={contextMenu.items}
        onSelect={handleContextMenuAction}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  )
}

export default DesktopItem
