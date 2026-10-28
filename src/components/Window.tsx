import React, { useState } from 'react'
import {
  FolderPlus,
  Link,
  ChevronRight,
  Home,
  Folder,
  ChevronDown,
  Globe,
  Settings,
} from 'lucide-react'
import { FolderItem, ShortcutItem, WindowState, APP_REGISTRY } from '../types/desktop'
import DesktopItem from './DesktopItem'
import AddShortcutModal from './AddShortcutModal'
import { useWindowManagement } from '../hooks/useWindowManagement'
import TerminalComponent from './terminal/Terminal'
import FinderContent from './finder/FinderContent'
import { ICON_MAP } from './appIcons'
import { ErrorBoundary } from './ErrorBoundary'

interface WindowProps {
  window: WindowState
  index?: number
  onClose: (id: string) => void
  onMinimize: (id: string) => void
  onMaximize: (id: string) => void
  onAddItemToFolder?: (folderId: string, item: ShortcutItem | FolderItem) => void
  onItemClick?: (item: ShortcutItem | FolderItem, parentFolderId: string) => void
  onEditItem?: (item: ShortcutItem | FolderItem) => void
  onDeleteItem?: (itemId: string, parentFolderId: string) => void
  onViewProperties?: (item: ShortcutItem | FolderItem) => void
  onBringToFront?: () => void
}

interface PathItem {
  id: string
  title: string
}

const WindowContent: React.FC<{ appId?: string; type: string }> = ({ appId, type }) => {
  if (type === 'app' && appId) {
    if (appId === 'terminal') {
      return <TerminalComponent />
    }

    if (appId === 'finder') {
      return <FinderContent />
    }

    const appDef = APP_REGISTRY[appId as keyof typeof APP_REGISTRY]
    if (appDef) {
      const IconComponent = ICON_MAP[appDef.icon] || Settings
      return (
        <div className="os-window__app-content">
          <div className="os-window__app-icon-wrapper">
            <IconComponent className="os-window__app-icon" />
          </div>
          <span className="os-window__app-name">{appDef.name}</span>
          <p className="os-window__app-placeholder">
            {appId === 'textedit' && 'TextEdit coming soon'}
            {appId === 'preferences' && 'System Preferences coming soon'}
            {appId === 'calculator' && 'Calculator coming soon'}
          </p>
        </div>
      )
    }
  }
  return null
}

const FolderContent: React.FC<{
  win: WindowState
  onAddItemToFolder?: (folderId: string, item: ShortcutItem | FolderItem) => void
  onItemClick?: (item: ShortcutItem | FolderItem, parentFolderId: string) => void
  onEditItem?: (item: ShortcutItem | FolderItem) => void
  onDeleteItem?: (itemId: string, parentFolderId: string) => void
  onViewProperties?: (item: ShortcutItem | FolderItem) => void
}> = ({ win, onAddItemToFolder, onItemClick, onEditItem, onDeleteItem, onViewProperties }) => {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([win.id]))
  const [showAddShortcutModal, setShowAddShortcutModal] = useState(false)
  const [navigationPath, setNavigationPath] = useState<PathItem[]>([
    { id: win.id, title: win.title },
  ])

  const findFolderByPath = (rootFolder: FolderItem, path: PathItem[]): FolderItem => {
    if (path.length === 1) return rootFolder
    let currentFolder = rootFolder
    for (let i = 1; i < path.length; i++) {
      const targetId = path[i].id
      const foundFolder = currentFolder.items.find(
        item => item.id === targetId && 'items' in item
      ) as FolderItem
      if (foundFolder) {
        currentFolder = foundFolder
      } else {
        return currentFolder
      }
    }
    return currentFolder
  }

  const currentFolder = findFolderByPath(win.content, navigationPath)

  const handleAddFolder = () => {
    if (onAddItemToFolder) {
      const newFolder: FolderItem = {
        id: crypto.randomUUID(),
        title: 'Nueva Carpeta',
        icon: '',
        items: [],
        clickCount: 0,
      }
      onAddItemToFolder(currentFolder.id, newFolder)
      setShowAddMenu(false)
    }
  }

  const handleAddShortcut = () => {
    setShowAddShortcutModal(true)
    setShowAddMenu(false)
  }

  const handleSaveShortcut = (shortcut: { title: string; url: string; icon: string }) => {
    if (onAddItemToFolder) {
      const newShortcut: ShortcutItem = {
        id: crypto.randomUUID(),
        ...shortcut,
        clickCount: 0,
      }
      onAddItemToFolder(currentFolder.id, newShortcut)
    }
  }

  const handleItemClick = (item: ShortcutItem | FolderItem) => {
    if ('url' in item) {
      const browserWindow = document.defaultView || window
      browserWindow.open(item.url, '_blank')
      if (onItemClick) {
        onItemClick(item, currentFolder.id)
      }
      return
    }
    if ('items' in item) {
      const folderItem = item as FolderItem
      setNavigationPath(prev => [...prev, { id: folderItem.id, title: folderItem.title }])
      setExpandedFolders(prev => {
        const next = new Set(prev)
        next.add(folderItem.id)
        return next
      })
      if (onItemClick) {
        onItemClick(item, currentFolder.id)
      }
    }
  }

  const navigateToFolder = (index: number) => {
    if (index >= navigationPath.length) return
    setNavigationPath(navigationPath.slice(0, index + 1))
  }

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const renderTreeItem = (
    item: ShortcutItem | FolderItem,
    depth = 0,
    currentPath: PathItem[] = []
  ) => {
    const isFolder = 'items' in item
    const isExpanded = isFolder && expandedFolders.has(item.id)
    const isActive = currentFolder.id === item.id
    const itemPath = [...currentPath, { id: item.id, title: item.title }]

    return (
      <div key={item.id}>
        <div
          className={`os-tree-item ${isActive ? 'os-tree-item--active' : ''}`}
          style={{ paddingLeft: `${(depth * 12) + 8}px` }}
          onClick={() => {
            if (isFolder) {
              setNavigationPath(itemPath)
            } else if ('url' in item) {
              const browserWindow = document.defaultView || window
              browserWindow.open(item.url, '_blank')
            }
          }}
        >
          {isFolder && (
            <button
              className="os-tree-item__expand"
              onClick={(e) => toggleFolderExpand(item.id, e)}
            >
              {isExpanded ? (
                <ChevronDown className="os-icon os-icon--sm" />
              ) : (
                <ChevronRight className="os-icon os-icon--sm" />
              )}
            </button>
          )}

          {isFolder ? (
            <Folder className="os-icon os-icon--sm os-icon--folder" />
          ) : (
            <Globe className="os-icon os-icon--sm os-icon--shortcut" />
          )}

          <span className="os-tree-item__label">{item.title}</span>
        </div>

        {isFolder && isExpanded && (item as FolderItem).items.map(childItem =>
          renderTreeItem(childItem, depth + 1, itemPath)
        )}
      </div>
    )
  }

  return (
    <>
      <div className="os-window__breadcrumb">
        <button
          className="os-window__breadcrumb-home"
          onClick={() => navigateToFolder(0)}
        >
          <Home className="os-icon os-icon--sm" />
        </button>
        <div className="os-window__breadcrumb-path">
          {navigationPath.map((pathItem, index) => (
            <React.Fragment key={pathItem.id}>
              {index > 0 && (
                <ChevronRight className="os-icon os-icon--xs" />
              )}
              <button
                className={`os-window__breadcrumb-item ${
                  index === navigationPath.length - 1
                    ? 'os-window__breadcrumb-item--active'
                    : ''
                }`}
                onClick={() => navigateToFolder(index)}
              >
                {pathItem.title}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="os-window__content">
        {showSidebar && (
          <div className="os-window__sidebar">
            {renderTreeItem(win.content, 0, [{ id: win.id, title: win.title }])}
          </div>
        )}

        <div className={`os-window__main ${showSidebar ? '' : 'os-window__main--full'}`}>
          <div className="os-window__grid">
            {currentFolder.items.map(item => (
              <DesktopItem
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
                onEdit={onEditItem ? () => onEditItem(item) : undefined}
                onDelete={onDeleteItem ? () => onDeleteItem(item.id, currentFolder.id) : undefined}
                onViewProperties={onViewProperties ? () => onViewProperties(item) : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {showAddShortcutModal && (
        <AddShortcutModal
          onClose={() => setShowAddShortcutModal(false)}
          onSave={handleSaveShortcut}
        />
      )}

      <div
        className="os-window__add-wrapper"
        style={{ position: 'absolute', top: '6px', right: '80px' }}
      >
        <button
          className="os-btn os-btn--icon"
          onClick={() => setShowSidebar(!showSidebar)}
          aria-label="Toggle sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <rect x="1" y="1" width="12" height="12" rx="2" />
            <line x1="5" y1="1" x2="5" y2="13" />
          </svg>
        </button>

        <button
          className="os-btn os-btn--icon"
          onClick={() => setShowAddMenu(!showAddMenu)}
          aria-label="Add"
        >
          <FolderPlus className="os-icon" />
        </button>
        {showAddMenu && (
          <div className="os-context-menu os-context-menu--sm">
            <button
              className="os-context-menu__item"
              onClick={handleAddFolder}
            >
              <FolderPlus className="os-icon os-icon--sm" />
              <span>Nueva Carpeta</span>
            </button>
            <button
              className="os-context-menu__item"
              onClick={handleAddShortcut}
            >
              <Link className="os-icon os-icon--sm" />
              <span>Nuevo Acceso</span>
            </button>
          </div>
        )}
      </div>
    </>
  )
}

const Window: React.FC<WindowProps> = ({
  window: win,
  index = 0,
  onClose,
  onMinimize,
  onMaximize,
  onAddItemToFolder,
  onItemClick,
  onEditItem,
  onDeleteItem,
  onViewProperties,
  onBringToFront,
}) => {
  const staggerOffset = index * 24

  const { position, size, isDragging, onDragStart, onResizeStart } = useWindowManagement({
    id: win.id,
    initialPosition: { x: 100 + staggerOffset, y: 60 + staggerOffset },
    initialSize: { width: win.type === 'app' ? 700 : 780, height: win.type === 'app' ? 480 : 520 },
    minSize: { width: 320, height: 240 },
    onBringToFront,
  })

  const isFullscreen = win.isMaximized

  const getWindowStyle = (): React.CSSProperties => {
    if (isFullscreen) {
      return {
        left: 0,
        top: 0,
        width: '100vw',
        height: 'calc(100vh - 48px)',
        zIndex: win.isActive ? 20 : 10,
        borderRadius: 0,
      }
    }
    return {
      left: position.x,
      top: position.y,
      width: size.width,
      height: size.height,
      zIndex: win.isActive ? 20 : 10,
    }
  }

  if (win.isMinimized) return null

  return (
    <div
      className={`os-window ${isFullscreen ? 'os-window--maximized' : ''}`}
      style={getWindowStyle()}
    >
      <div
        className={`os-window__titlebar ${isDragging ? 'os-window__titlebar--dragging' : ''}`}
        onMouseDown={(e) => !isFullscreen && onDragStart(e, position.x, position.y)}
      >
        <div className="os-window__dots">
          <button
            className="os-dot os-dot--red"
            onClick={() => onClose(win.id)}
            aria-label="Cerrar"
          />
          <button
            className="os-dot os-dot--yellow"
            onClick={() => onMinimize(win.id)}
            aria-label="Minimizar"
          />
          <button
            className={`os-dot os-dot--green ${isFullscreen ? 'os-dot--green-active' : ''}`}
            onClick={() => onMaximize(win.id)}
            aria-label="Maximizar"
          />
        </div>

        <span className="os-window__title">{win.title}</span>

        <div className="os-window__actions" />
      </div>

      {win.type === 'folder' ? (
        <FolderContent
          win={win}
          onAddItemToFolder={onAddItemToFolder}
          onItemClick={onItemClick}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
          onViewProperties={onViewProperties}
        />
      ) : (
        <ErrorBoundary label={win.title}>
          <WindowContent appId={win.appId} type={win.type} />
        </ErrorBoundary>
      )}

      {!isFullscreen && (
        <div
          className="os-window__resize-handle"
          onMouseDown={(e) => onResizeStart(e, size.width, size.height)}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M9 1L1 9M9 5L5 9M9 9"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  )
}

export default Window
