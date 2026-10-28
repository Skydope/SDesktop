import React, { useState } from 'react'
import { X, Link, Folder } from 'lucide-react'
import { ShortcutItem, FolderItem } from '../types/desktop'
import { getFaviconUrl } from '../utils/favicon'

interface EditModalProps {
  item: ShortcutItem | FolderItem | null
  onClose: () => void
  onSave: (updatedItem: ShortcutItem | FolderItem) => void
}

const EditModal: React.FC<EditModalProps> = ({ item, onClose, onSave }) => {
  const isShortcut = item && 'url' in item

  // El padre monta este modal con key={item.id}, asi que inicializar desde la
  // prop alcanza: no hace falta un effect que sincronice prop -> state.
  const [title, setTitle] = useState(item?.title ?? '')
  const [url, setUrl] = useState(isShortcut ? (item as ShortcutItem).url : '')
  const [icon, setIcon] = useState(item?.icon ?? '')
  const [customIcon, setCustomIcon] = useState(false)
  const [iconPreview, setIconPreview] = useState(item?.icon ?? '')

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setIcon(result)
        setIconPreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFetchFavicon = async () => {
    if (!url) return
    try {
      const favicon = await getFaviconUrl(url)
      setIcon(favicon)
      setIconPreview(favicon)
    } catch (err) {
      console.error('Error fetching favicon:', err)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return

    if (isShortcut) {
      onSave({
        ...(item as ShortcutItem),
        title,
        url,
        icon,
        clickCount: (item as ShortcutItem).clickCount || 0,
      })
    } else {
      onSave({
        ...(item as FolderItem),
        title,
        icon,
        clickCount: (item as FolderItem).clickCount || 0,
      })
    }
    onClose()
  }

  if (!item) return null

  return (
    <div className="os-modal-overlay" onClick={onClose}>
      <div className="os-modal" onClick={(e) => e.stopPropagation()}>
        <div className="os-modal__header">
          <h3 className="os-modal__title">Editar {isShortcut ? 'Acceso directo' : 'Carpeta'}</h3>
          <button className="os-btn os-btn--icon" onClick={onClose}>
            <X className="os-icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="os-modal__body">
          <div className="os-modal__icon-preview">
            {iconPreview ? (
              <img src={iconPreview} alt="Icon preview" className="os-modal__icon-img" />
            ) : isShortcut ? (
              <Link className="os-icon" style={{ width: 48, height: 48 }} />
            ) : (
              <Folder className="os-icon" style={{ width: 48, height: 48 }} />
            )}
          </div>

          <div className="os-form-group">
            <label className="os-form-label">Nombre</label>
            <input
              type="text"
              className="os-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {isShortcut && (
            <div className="os-form-group">
              <label className="os-form-label">URL</label>
              <div className="os-input-group">
                <input
                  type="url"
                  className="os-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="os-btn os-btn--secondary os-btn--sm"
                  onClick={handleFetchFavicon}
                >
                  Obtener
                </button>
              </div>
            </div>
          )}

          <div className="os-form-group">
            <label className="os-form-label">
              <input
                type="checkbox"
                checked={customIcon}
                onChange={(e) => setCustomIcon(e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>Usar icono personalizado</span>
            </label>
            {customIcon && (
              <input
                type="file"
                accept="image/*"
                onChange={handleIconChange}
                className="os-input"
              />
            )}
          </div>

          <div className="os-modal__actions">
            <button type="button" className="os-btn os-btn--secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="os-btn os-btn--primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditModal