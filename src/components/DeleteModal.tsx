import React, { useState } from 'react'
import { X, AlertTriangle, Folder, Globe, ChevronRight, ChevronDown } from 'lucide-react'
import { ShortcutItem, FolderItem } from '../types/desktop'

interface DeleteModalProps {
  item: ShortcutItem | FolderItem | null
  onClose: () => void
  onConfirmDelete: (itemId: string) => void
}

const DeleteModal: React.FC<DeleteModalProps> = ({ item, onClose, onConfirmDelete }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  if (!item) return null

  const isFolder = 'items' in item
  const hasItems = isFolder && (item as FolderItem).items.length > 0

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
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

  const countContents = (folder: FolderItem): { folders: number; shortcuts: number } => {
    let folders = 0
    let shortcuts = 0
    for (const item of folder.items) {
      if ('items' in item) {
        folders++
        const subCounts = countContents(item as FolderItem)
        folders += subCounts.folders
        shortcuts += subCounts.shortcuts
      } else {
        shortcuts++
      }
    }
    return { folders, shortcuts }
  }

  const renderFolderTree = (folderItem: FolderItem, depth = 0) => {
    const isExpanded = expandedFolders.has(folderItem.id)

    return (
      <div key={folderItem.id} className="w-full">
        <div
          className="os-tree-item"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {folderItem.items.length > 0 && (
            <button className="os-tree-item__expand" onClick={(e) => toggleFolder(folderItem.id, e)}>
              {isExpanded ? <ChevronDown className="os-icon os-icon--xs" /> : <ChevronRight className="os-icon os-icon--xs" />}
            </button>
          )}
          <Folder className="os-icon os-icon--sm os-icon--folder" />
          <span className="os-tree-item__label">{folderItem.title}</span>
          <span className="os-delete-modal__count">({folderItem.items.length})</span>
        </div>

        {isExpanded && folderItem.items.map(subItem =>
          'items' in subItem
            ? renderFolderTree(subItem as FolderItem, depth + 1)
            : <div key={subItem.id} className="os-tree-item" style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}>
                <Globe className="os-icon os-icon--sm" style={{ color: 'rgba(59, 130, 246, 0.85)' }} />
                <span className="os-tree-item__label">{subItem.title}</span>
              </div>
        )}
      </div>
    )
  }

  let contentCount
  if (hasItems) {
    contentCount = countContents(item as FolderItem)
  }

  return (
    <div className="os-modal-overlay" onClick={onClose}>
      <div className="os-modal os-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="os-modal__header">
          <h3 className="os-modal__title">Confirmar eliminación</h3>
          <button className="os-btn os-btn--icon" onClick={onClose}>
            <X className="os-icon" />
          </button>
        </div>

        <div className="os-modal__body">
          <div className="os-delete-modal__warning">
            <AlertTriangle className="os-icon" style={{ color: 'rgba(234, 179, 8, 0.85)' }} />
            <h4>¿Estás seguro?</h4>
          </div>

          <div className="os-delete-modal__message">
            {isFolder ? (
              hasItems ? (
                <p>Estás a punto de eliminar la carpeta <strong>{item.title}</strong> y todo su contenido:</p>
              ) : (
                <p>Estás a punto de eliminar la carpeta vacía <strong>{item.title}</strong>.</p>
              )
            ) : (
              <p>Estás a punto de eliminar el acceso directo <strong>{item.title}</strong>.</p>
            )}
          </div>

          {hasItems && (
            <div className="os-delete-modal__contents">
              <p>Esta carpeta contiene:</p>
              <ul>
                <li>{contentCount.folders} carpetas</li>
                <li>{contentCount.shortcuts} accesos directos</li>
              </ul>
              <div className="os-delete-modal__tree">
                {renderFolderTree(item as FolderItem)}
              </div>
            </div>
          )}

          <p className="os-delete-modal__warning-text">Esta acción no se puede deshacer.</p>

          <div className="os-modal__actions">
            <button className="os-btn os-btn--secondary" onClick={onClose}>Cancelar</button>
            <button
              className="os-btn os-btn--danger"
              onClick={() => { onConfirmDelete(item.id); onClose() }}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteModal