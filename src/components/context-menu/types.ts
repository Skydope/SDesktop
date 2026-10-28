import type { ReactNode } from 'react'

export interface MenuItem {
  id: string
  label: string
  icon?: ReactNode
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  separator?: false
}

export interface MenuItemSeparator {
  id: string
  separator: true
}

export type ContextMenuItem = MenuItem | MenuItemSeparator

export interface ContextMenuPosition {
  x: number
  y: number
}
