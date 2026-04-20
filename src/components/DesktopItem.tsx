import React, { useState, useRef, useEffect } from 'react'
import { FolderItem, ShortcutItem } from '../types/desktop'
import { MoreVertical, ExternalLink, Edit, Trash2, Settings, Folder, Link } from 'lucide-react'

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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isFolder = 'items' in item

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(prev => !prev)
  }

  const handleAction = (action: 'open' | 'edit' | 'delete' | 'properties', e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(false)

    switch (action) {
      case 'open':
        onClick()
        break
      case 'edit':
        onEdit?.(item)
        break
      case 'delete':
        onDelete?.(item.id)
        break
      case 'properties':
        onViewProperties?.(item)
        break
    }
  }

  return (
    <div className="os-desktop-item" onClick={onClick}>
      {isMenuOpen && (
        <button
          ref={buttonRef}
          className="os-desktop-item__menu-btn"
          onClick={handleMenuToggle}
          aria-label="Opciones"
        >
          <MoreVertical className="os-icon os-icon--xs" />
        </button>
      )}

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

      {isMenuOpen && (
        <div
          ref={menuRef}
          className="os-context-menu os-context-menu--sm"
          style={{ top: '100%', left: '50%', transform: 'translateX(-50%)' }}
        >
          <button
            className="os-context-menu__item"
            onClick={(e) => handleAction('open', e)}
          >
            <ExternalLink className="os-icon os-icon--sm" />
            <span>Abrir</span>
          </button>
          <button
            className="os-context-menu__item"
            onClick={(e) => handleAction('edit', e)}
          >
            <Edit className="os-icon os-icon--sm" />
            <span>Editar</span>
          </button>
          <button
            className="os-context-menu__item"
            onClick={(e) => handleAction('delete', e)}
          >
            <Trash2 className="os-icon os-icon--sm" />
            <span>Eliminar</span>
          </button>
          <button
            className="os-context-menu__item"
            onClick={(e) => handleAction('properties', e)}
          >
            <Settings className="os-icon os-icon--sm" />
            <span>Propiedades</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default DesktopItem