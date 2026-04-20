import React, { useState, useEffect, useRef } from 'react'
import { useDesktopStore } from '../../store/desktopStore'

interface MenuItem {
  label: string
  action?: () => void
  shortcut?: string
  divider?: boolean
  disabled?: boolean
  checked?: boolean
}

interface Menu {
  id: string
  label: string
  items: MenuItem[]
}

const AppleMenuItems: MenuItem[] = [
  { label: 'About SDesktop', action: () => {} },
  { label: '', divider: true },
  { label: 'System Preferences...', action: () => useDesktopStore.getState().openApp('preferences') },
  { label: 'System Settings...', action: () => useDesktopStore.getState().openApp('preferences') },
  { label: '', divider: true },
  { label: 'Sleep' },
  { label: 'Restart...' },
  { label: 'Shut Down...' },
  { label: '', divider: true },
  { label: 'Lock Screen', shortcut: '⌃⌘Q' },
  { label: 'Log Out...', shortcut: '⇧⌘Q' },
]

const FinderMenuItems: MenuItem[] = [
  { label: 'About Finder', action: () => {} },
  { label: '', divider: true },
  { label: 'Settings...', action: () => useDesktopStore.getState().openApp('preferences') },
  { label: '', divider: true },
  { label: 'Empty Trash...' },
  { label: '', divider: true },
  { label: 'Hide Finder', shortcut: '⌘H' },
  { label: 'Hide Others', shortcut: '⌥⌘H' },
]

const FileMenuItems: MenuItem[] = [
  { label: 'New Folder', shortcut: '⌘N' },
  { label: 'New File', shortcut: '⌘T' },
  { label: '', divider: true },
  { label: 'Open...', shortcut: '⌘O' },
  { label: 'Open With...', shortcut: '⌥⌘O' },
  { label: '', divider: true },
  { label: 'Close Window', shortcut: '⌘W' },
]

const EditMenuItems: MenuItem[] = [
  { label: 'Undo', shortcut: '⌘Z' },
  { label: 'Redo', shortcut: '⇧⌘Z' },
  { label: '', divider: true },
  { label: 'Cut', shortcut: '⌘X' },
  { label: 'Copy', shortcut: '⌘C' },
  { label: 'Paste', shortcut: '⌘V' },
  { label: 'Select All', shortcut: '⌘A' },
]

const ViewMenuItems: MenuItem[] = [
  { label: 'as Icons', checked: true },
  { label: 'as List' },
  { label: 'as Columns' },
  { label: '', divider: true },
  { label: 'Show Path Bar' },
  { label: 'Show Status Bar' },
]

const WindowMenuItems: MenuItem[] = [
  { label: 'Minimize', shortcut: '⌘M' },
  { label: 'Zoom' },
  { label: '', divider: true },
  { label: 'Bring All to Front' },
]

const HelpMenuItems: MenuItem[] = [
  { label: 'SDesktop Help' },
  { label: '' },
  { label: 'Terminal Help' },
]

const MenuBar: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [time, setTime] = useState(new Date())
  const menuRef = useRef<HTMLDivElement>(null)
  const activeWindow = useDesktopStore(s => s.openWindows.find(w => w.isActive))
  const appMenus: Menu[] = [
    { id: 'apple', label: '🍎', items: AppleMenuItems },
    { id: 'file', label: 'File', items: FileMenuItems },
    { id: 'edit', label: 'Edit', items: EditMenuItems },
    { id: 'view', label: 'View', items: ViewMenuItems },
    { id: 'window', label: 'Window', items: WindowMenuItems },
    { id: 'help', label: 'Help', items: HelpMenuItems },
  ]

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleMenuClick = (menuId: string) => {
    setOpenMenu(openMenu === menuId ? null : menuId)
  }

  const handleItemClick = (item: MenuItem) => {
    if (!item.disabled && item.action) {
      item.action()
    }
    setOpenMenu(null)
  }

  const renderMenuItems = (items: MenuItem[]) => (
    <div className="os-menubar__dropdown">
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="os-menubar__divider" />
        ) : (
          <button
            key={i}
            className={`os-menubar__item ${item.disabled ? 'os-menubar__item--disabled' : ''}`}
            onClick={() => handleItemClick(item)}
          >
            <span>{item.label}</span>
            {item.shortcut && <span className="os-menubar__shortcut">{item.shortcut}</span>}
          </button>
        )
      )}
    </div>
  )

  return (
    <div className="os-menubar" ref={menuRef}>
      <div className="os-menubar__left">
        {appMenus.map(menu => (
          <div key={menu.id} className="os-menubar__menu">
            <button
              className={`os-menubar__button ${openMenu === menu.id ? 'os-menubar__button--active' : ''}`}
              onClick={() => handleMenuClick(menu.id)}
            >
              {menu.label}
            </button>
            {openMenu === menu.id && (
              <div className="os-menubar__dropdown-wrapper">
                {renderMenuItems(menu.items)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="os-menubar__right">
        <div className="os-menubar__icon-group">
          <svg className="os-menubar__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle cx="12" cy="20" r="1" fill="currentColor" />
          </svg>
          <svg className="os-menubar__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="18" height="10" rx="2" />
            <path d="M22 11v2" />
          </svg>
          <span className="os-menubar__clock">{formatTime(time)}</span>
        </div>
      </div>
    </div>
  )
}

export default MenuBar
