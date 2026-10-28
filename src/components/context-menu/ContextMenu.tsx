import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ContextMenuItem, ContextMenuPosition } from './types'

interface Props {
  isOpen: boolean
  position: ContextMenuPosition
  menuItems: ContextMenuItem[]
  onSelect: (itemId: string) => void
  onClose: () => void
}

export const ContextMenu: React.FC<Props> = ({
  isOpen,
  position,
  menuItems,
  onSelect,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const adjustedPosition = calculatePosition(position, 200, menuItems.length * 36)

  return createPortal(
    <div
      ref={containerRef}
      className="os-context-menu"
      role="menu"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {menuItems.map((item) =>
        item.separator === true ? (
          <div key={item.id} className="os-context-menu__separator" role="separator" />
        ) : (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={`os-context-menu__item${item.danger ? ' os-context-menu__item--danger' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            {item.icon && <span className="os-context-menu__item-icon">{item.icon}</span>}
            <span className="os-context-menu__item-label">{item.label}</span>
            {item.shortcut && <span className="os-context-menu__item-shortcut">{item.shortcut}</span>}
          </button>
        )
      )}
    </div>,
    document.body
  )
}

function calculatePosition(pos: ContextMenuPosition, menuWidth: number, menuHeight: number) {
  let x = pos.x
  let y = pos.y

  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 8
  }

  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight - 8
  }

  return { x, y }
}
