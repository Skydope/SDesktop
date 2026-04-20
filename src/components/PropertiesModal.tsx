import React from 'react'
import { X, Calendar, FileIcon, Folder, Link2, User, Clock, FileCheck, MousePointer } from 'lucide-react'
import { ShortcutItem, FolderItem } from '../types/desktop'

interface PropertiesModalProps {
  item: ShortcutItem | FolderItem | null
  onClose: () => void
}

const PropertiesModal: React.FC<PropertiesModalProps> = ({ item, onClose }) => {
  if (!item) return null

  const isShortcut = 'url' in item
  const createdDate = new Date().toLocaleDateString()

  const getFolderStats = (folder: FolderItem) => {
    const countItems = folder.items.length
    const countFolders = folder.items.filter(item => 'items' in item).length
    const countShortcuts = countItems - countFolders
    return { countItems, countFolders, countShortcuts }
  }

  const folderStats = !isShortcut ? getFolderStats(item as FolderItem) : null

  return (
    <div className="os-modal-overlay" onClick={onClose}>
      <div className="os-modal os-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="os-modal__header">
          <h3 className="os-modal__title">Propiedades: {item.title}</h3>
          <button className="os-btn os-btn--icon" onClick={onClose}>
            <X className="os-icon" />
          </button>
        </div>

        <div className="os-properties-modal__content">
          <div className="os-properties-modal__icon-row">
            <div className="os-properties-modal__icon-box">
              {item.icon ? (
                <img src={item.icon} alt={item.title} />
              ) : (
                <Folder className="os-icon" />
              )}
            </div>
            <div className="os-properties-modal__info">
              <h4>{item.title}</h4>
              <p>{isShortcut ? 'Acceso directo' : 'Carpeta'}</p>
            </div>
          </div>

          <div className="os-properties-modal__details">
            <div className="os-properties-modal__row">
              <FileIcon className="os-icon os-icon--sm" />
              <span>Tipo:</span>
              <span>{isShortcut ? 'Acceso directo' : 'Carpeta'}</span>
            </div>
            <div className="os-properties-modal__row">
              <Calendar className="os-icon os-icon--sm" />
              <span>Creado:</span>
              <span>{createdDate}</span>
            </div>
            <div className="os-properties-modal__row">
              <Clock className="os-icon os-icon--sm" />
              <span>Modificado:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="os-properties-modal__row">
              <MousePointer className="os-icon os-icon--sm" />
              <span>Veces usado:</span>
              <span>{item.clickCount || 0}</span>
            </div>

            {isShortcut && (
              <div className="os-properties-modal__row os-properties-modal__row--url">
                <Link2 className="os-icon os-icon--sm" />
                <span>URL:</span>
                <span className="os-properties-modal__url">{(item as ShortcutItem).url}</span>
              </div>
            )}

            {!isShortcut && folderStats && (
              <>
                <div className="os-properties-modal__row">
                  <FileCheck className="os-icon os-icon--sm" />
                  <span>Contenido:</span>
                  <span>{folderStats.countItems} elementos</span>
                </div>
                <div className="os-properties-modal__row os-properties-modal__row--nested">
                  <span>{folderStats.countFolders} carpetas</span>
                  <span>{folderStats.countShortcuts} accesos directos</span>
                </div>
              </>
            )}

            <div className="os-properties-modal__row os-properties-modal__row--id">
              <User className="os-icon os-icon--sm" />
              <span>ID:</span>
              <span>{item.id}</span>
            </div>
          </div>
        </div>

        <div className="os-modal__actions">
          <button className="os-btn os-btn--primary" onClick={onClose}>Aceptar</button>
        </div>
      </div>
    </div>
  )
}

export default PropertiesModal