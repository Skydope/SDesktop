import { useState, useEffect } from 'react'
import { useMediaStore, getYouTubeId } from '../store/useMediaStore'
import type { MediaType } from '../store/useMediaStore'

interface AddMediaModalProps {
  open: boolean
  onClose: () => void
}

function isValidImageUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const ext = u.pathname.split('.').pop()?.toLowerCase() ?? ''
    const validExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp']
    // Allow URLs without extension (CDNs, APIs, etc.)
    return u.protocol.startsWith('http') && (validExts.includes(ext) || !ext || ext.length > 5)
  } catch {
    return false
  }
}

function isValidYouTubeUrl(url: string): boolean {
  return getYouTubeId(url) !== null
}

export function AddMediaModal({ open, onClose }: AddMediaModalProps) {
  const addWindow = useMediaStore((s) => s.addWindow)
  const [mode, setMode] = useState<MediaType>('image')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  // Reset on open
  useEffect(() => {
    if (open) {
      setUrl('')
      setError('')
      setMode('image')
    }
  }, [open])

  const validate = (): boolean => {
    if (!url.trim()) {
      setError('Ingresá una URL')
      return false
    }
    if (mode === 'youtube' && !isValidYouTubeUrl(url)) {
      setError('URL de YouTube no válida. Ejemplo: https://youtu.be/dQw4w9WgXcQ')
      return false
    }
    if (mode === 'image' && !isValidImageUrl(url)) {
      setError('URL de imagen no válida. Debe comenzar con http:// o https://')
      return false
    }
    return true
  }

  const handleAdd = () => {
    if (!validate()) return
    addWindow(mode, url.trim())
    onClose()
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKey}>
        <h2 className="modal__title">Agregar media</h2>

        {/* Tabs */}
        <div className="modal__tabs">
          <button
            className={`modal__tab ${mode === 'image' ? 'modal__tab--active' : ''}`}
            onClick={() => { setMode('image'); setError(''); setUrl('') }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
            Imagen
          </button>
          <button
            className={`modal__tab ${mode === 'youtube' ? 'modal__tab--active' : ''}`}
            onClick={() => { setMode('youtube'); setError(''); setUrl('') }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.5a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
              <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
            </svg>
            YouTube
          </button>
        </div>

        {/* Input */}
        <input
          className="modal__input"
          type="url"
          autoFocus
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError('') }}
          placeholder={
            mode === 'image'
              ? 'https://example.com/foto.jpg'
              : 'https://youtu.be/dQw4w9WgXcQ'
          }
        />

        {error && <p className="modal__error">{error}</p>}

        <p className="modal__hint">
          {mode === 'image'
            ? 'Soporta .png .jpg .gif .webp .svg .avif'
            : 'Soporta youtu.be/… y youtube.com/watch?v=…'}
        </p>

        {/* Actions */}
        <div className="modal__actions">
          <button className="modal__btn modal__btn--cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="modal__btn modal__btn--add" onClick={handleAdd}>
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
