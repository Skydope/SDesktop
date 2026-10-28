import { useState } from 'react'
import type { MediaWindow } from '../store/useMediaStore'

interface MediaViewerProps {
  window: MediaWindow
}

export function MediaViewer({ window: win }: MediaViewerProps) {
  const [imgError, setImgError] = useState(false)

  if (win.type === 'youtube') {
    return (
      <iframe
        className="media-viewer__youtube"
        src={`https://www.youtube.com/embed/${win.url}?controls=1&modestbranding=1&rel=0`}
        title={win.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
      />
    )
  }

  if (imgError) {
    return (
      <div className="media-viewer__error">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <span>No se pudo cargar la imagen</span>
        <code>{win.url}</code>
      </div>
    )
  }

  return (
    <img
      src={win.url}
      alt={win.title}
      draggable={false}
      onError={() => setImgError(true)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  )
}
