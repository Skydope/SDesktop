import React, { useState } from 'react'
import { X, Clipboard } from 'lucide-react'
import { getFaviconUrl } from '../utils/favicon'

interface AddShortcutModalProps {
  onClose: () => void
  onSave: (shortcut: { title: string; url: string; icon: string }) => void
}

const AddShortcutModal: React.FC<AddShortcutModalProps> = ({ onClose, onSave }) => {
  const [shortcut, setShortcut] = useState({ title: '', url: '', icon: '' })
  const [isLoading, setIsLoading] = useState(false)

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setShortcut(prev => ({ ...prev, url }))

    if (!shortcut.title && url) {
      try {
        const urlObj = new URL(url)
        const domain = urlObj.hostname.replace('www.', '')
        const capitalizedDomain = domain.charAt(0).toUpperCase() + domain.slice(1)
        setShortcut(prev => ({ ...prev, title: capitalizedDomain }))
      } catch {
        // Invalid URL
      }
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      try {
        const url = new URL(text)
        setShortcut(prev => ({ ...prev, url }))
        if (!shortcut.title) {
          const domain = url.hostname.replace('www.', '')
          const capitalizedDomain = domain.charAt(0).toUpperCase() + domain.slice(1)
          setShortcut(prev => ({ ...prev, title: capitalizedDomain }))
        }
      } catch {
        alert('El texto en el portapapeles no es una URL válida.')
      }
    } catch (err) {
      console.error('Error al leer el portapapeles:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!shortcut.icon && shortcut.url) {
        const favicon = await getFaviconUrl(shortcut.url)
        setShortcut(prev => ({ ...prev, icon: favicon }))
        await onSave({ ...shortcut, icon: favicon })
      } else {
        await onSave(shortcut)
      }
      onClose()
    } catch (error) {
      console.error('Error saving shortcut:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="os-modal-overlay" onClick={onClose}>
      <div className="os-modal" onClick={(e) => e.stopPropagation()}>
        <div className="os-modal__header">
          <h3 className="os-modal__title">Añadir Acceso Directo</h3>
          <button className="os-btn os-btn--icon" onClick={onClose}>
            <X className="os-icon" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="os-modal__body">
          <div className="os-form-group">
            <label className="os-form-label">Título</label>
            <input
              type="text"
              className="os-input"
              value={shortcut.title}
              onChange={(e) => setShortcut({ ...shortcut, title: e.target.value })}
              placeholder="Google"
              required
            />
          </div>

          <div className="os-form-group">
            <label className="os-form-label">URL</label>
            <div className="os-input-group">
              <input
                type="url"
                className="os-input"
                value={shortcut.url}
                onChange={handleUrlChange}
                placeholder="https://google.com"
                required
              />
              <button
                type="button"
                className="os-btn os-btn--secondary os-btn--sm"
                onClick={handlePasteFromClipboard}
              >
                <Clipboard className="os-icon os-icon--sm" />
              </button>
            </div>
          </div>

          <div className="os-form-group">
            <label className="os-form-label">URL del Icono (opcional)</label>
            <input
              type="url"
              className="os-input"
              value={shortcut.icon}
              onChange={(e) => setShortcut({ ...shortcut, icon: e.target.value })}
              placeholder="Se detectará automáticamente"
            />
            {shortcut.url && !shortcut.icon && (
              <p className="os-form-hint">El icono se obtendrá automáticamente del sitio web</p>
            )}
          </div>

          <div className="os-modal__actions">
            <button type="button" className="os-btn os-btn--secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="os-btn os-btn--primary" disabled={isLoading}>
              {isLoading ? 'Añadiendo...' : 'Añadir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddShortcutModal