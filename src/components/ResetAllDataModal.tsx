import React, { useState } from 'react'
import {
  X,
  AlertTriangle,
  Folder,
  Globe,
  Trash2,
  Image,
  Settings,
  ChevronRight,
  ChevronDown,
  User,
  LayoutGrid,
} from 'lucide-react'
import { useDesktopStore } from '../store/desktopStore'
import type { ShortcutItem, FolderItem } from '../types/desktop'

interface ResetAllDataModalProps {
  onClose: () => void
  onConfirmReset: () => void
  isOpen: boolean
}

const ResetAllDataModal: React.FC<ResetAllDataModalProps> = ({
  onClose,
  onConfirmReset,
  isOpen,
}) => {
  const { items, wallpaper, theme, userProfile } = useDesktopStore()

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['shortcuts', 'folders', 'settings'])
  )

  if (!isOpen) return null

  const countNestedStats = (
    items: (ShortcutItem | FolderItem)[]
  ): { folders: number; shortcuts: number } => {
    let folders = 0
    let shortcuts = 0
    for (const item of items) {
      if ('items' in item) {
        folders++
        const subCounts = countNestedStats(item.items)
        folders += subCounts.folders
        shortcuts += subCounts.shortcuts
      } else {
        shortcuts++
      }
    }
    return { folders, shortcuts }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const topLevelFolders = items.filter(item => 'items' in item) as FolderItem[]
  const topLevelShortcuts = items.filter(item => 'url' in item) as ShortcutItem[]
  const nestedStats = countNestedStats(items)
  const totalShortcuts = topLevelShortcuts.length + nestedStats.shortcuts
  const totalFolders = topLevelFolders.length + nestedStats.folders
  const wallpaperSet = wallpaper !== useDesktopStore.getState().wallpaper

  const renderShortcut = (shortcut: ShortcutItem, depth = 0) => (
    <div
      key={shortcut.id}
      className="os-reset-modal__item"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      <Globe className="os-icon os-icon--sm" style={{ color: 'rgba(59, 130, 246, 0.85)' }} />
      <span className="os-reset-modal__item-title">{shortcut.title}</span>
      <span className="os-reset-modal__item-url">{shortcut.url.substring(0, 20)}...</span>
    </div>
  )

  const renderFolder = (folderItem: FolderItem, depth = 0) => {
    const isExpanded = expandedSections.has(`folder-${folderItem.id}`)
    return (
      <div key={folderItem.id}>
        <div
          className="os-reset-modal__item"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <button
            className="os-reset-modal__expand-btn"
            onClick={() => toggleSection(`folder-${folderItem.id}`)}
          >
            {isExpanded ? <ChevronDown className="os-icon os-icon--xs" /> : <ChevronRight className="os-icon os-icon--xs" />}
          </button>
          <Folder className="os-icon os-icon--sm os-icon--folder" />
          <span className="os-reset-modal__item-title">{folderItem.title}</span>
          <span className="os-reset-modal__item-count">({folderItem.items.length})</span>
        </div>
        {isExpanded && folderItem.items.map(subItem =>
          'items' in subItem
            ? renderFolder(subItem as FolderItem, depth + 1)
            : renderShortcut(subItem as ShortcutItem, depth + 1)
        )}
      </div>
    )
  }

  return (
    <div className="os-modal-overlay" onClick={onClose}>
      <div className="os-modal os-modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="os-modal__header">
          <h3 className="os-modal__title">
            <Trash2 className="os-icon" style={{ color: 'rgba(239, 68, 68, 0.85)' }} />
            Restablecer Todos los Datos
          </h3>
          <button className="os-btn os-btn--icon" onClick={onClose}>
            <X className="os-icon" />
          </button>
        </div>

        <div className="os-reset-modal__content">
          <div className="os-reset-modal__warning-box">
            <AlertTriangle className="os-icon" style={{ color: 'rgba(234, 179, 8, 0.85)' }} />
            <div>
              <h4>¿Estás seguro?</h4>
              <p>Estás a punto de restablecer <strong>todos los datos</strong> almacenados.</p>
            </div>
          </div>

          <div className="os-reset-modal__summary">
            <h5>Resumen de datos que se eliminarán:</h5>
            <div className="os-reset-modal__summary-grid">
              <div className="os-reset-modal__summary-item">
                <Globe className="os-icon os-icon--sm" style={{ color: 'rgba(59, 130, 246, 0.85)' }} />
                <span>Accesos directos:</span>
                <strong>{totalShortcuts}</strong>
              </div>
              <div className="os-reset-modal__summary-item">
                <Folder className="os-icon os-icon--sm os-icon--folder" />
                <span>Carpetas:</span>
                <strong>{totalFolders}</strong>
              </div>
              <div className="os-reset-modal__summary-item">
                <LayoutGrid className="os-icon os-icon--sm" />
                <span>Diseño del escritorio</span>
              </div>
              <div className="os-reset-modal__summary-item">
                <User className="os-icon os-icon--sm" style={{ color: 'rgba(34, 197, 94, 0.85)' }} />
                <span>Perfil de usuario:</span>
                <strong>{userProfile.name}</strong>
              </div>
              <div className="os-reset-modal__summary-item">
                <Settings className="os-icon os-icon--sm" />
                <span>Tema:</span>
                <strong>{theme}</strong>
              </div>
              <div className="os-reset-modal__summary-item">
                <Image className="os-icon os-icon--sm" />
                <span>Fondo personalizado:</span>
                <strong>{wallpaperSet ? 'Sí' : 'No'}</strong>
              </div>
            </div>
          </div>

          <div className="os-reset-modal__sections">
            <div className="os-reset-modal__section">
              <div className="os-reset-modal__section-header" onClick={() => toggleSection('shortcuts')}>
                <Globe className="os-icon os-icon--sm" style={{ color: 'rgba(59, 130, 246, 0.85)' }} />
                <span>Accesos Directos ({topLevelShortcuts.length})</span>
                {expandedSections.has('shortcuts') ? <ChevronDown className="os-icon os-icon--xs" /> : <ChevronRight className="os-icon os-icon--xs" />}
              </div>
              {expandedSections.has('shortcuts') && (
                <div className="os-reset-modal__section-body">
                  {topLevelShortcuts.length > 0
                    ? topLevelShortcuts.map(s => renderShortcut(s))
                    : <p className="os-reset-modal__empty">No se encontraron accesos directos</p>
                  }
                </div>
              )}
            </div>

            <div className="os-reset-modal__section">
              <div className="os-reset-modal__section-header" onClick={() => toggleSection('folders')}>
                <Folder className="os-icon os-icon--sm os-icon--folder" />
                <span>Carpetas ({topLevelFolders.length})</span>
                {expandedSections.has('folders') ? <ChevronDown className="os-icon os-icon--xs" /> : <ChevronRight className="os-icon os-icon--xs" />}
              </div>
              {expandedSections.has('folders') && (
                <div className="os-reset-modal__section-body">
                  {topLevelFolders.length > 0
                    ? topLevelFolders.map(f => renderFolder(f))
                    : <p className="os-reset-modal__empty">No se encontraron carpetas</p>
                  }
                </div>
              )}
            </div>
          </div>

          <div className="os-reset-modal__danger-warning">
            <AlertTriangle className="os-icon os-icon--sm" />
            <p><strong>Advertencia:</strong> Esta acción no se puede deshacer.</p>
          </div>

          <div className="os-modal__actions">
            <button className="os-btn os-btn--secondary" onClick={onClose}>Cancelar</button>
            <button className="os-btn os-btn--danger" onClick={onConfirmReset}>
              <Trash2 className="os-icon os-icon--sm" />
              Restablecer Todos los Datos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetAllDataModal