import React, { useEffect, useState } from 'react'
import { X, Folder, Maximize2, Minimize2 } from 'lucide-react'
import { WindowState } from '../types/desktop'

interface TaskbarProps {
  openWindows: WindowState[]
  isStartMenuOpen: boolean
  onStartMenuClick: () => void
  onWindowClick: (window: WindowState) => void
  onWindowClose: (windowId: string) => void
}

const Taskbar: React.FC<TaskbarProps> = ({
  openWindows,
  isStartMenuOpen,
  onStartMenuClick,
  onWindowClick,
  onWindowClose,
}) => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      month: 'short',
      day: '2-digit',
    })
  }

  return (
    <div className="os-taskbar">
      <button
        onClick={onStartMenuClick}
        className={`os-taskbar__start-btn ${isStartMenuOpen ? 'os-taskbar__start-btn--active' : ''}`}
        aria-label="Menú de inicio"
      >
        <svg
          width="22"
          height="14"
          viewBox="0 0 22 14"
          fill="currentColor"
        >
          <rect x="0" y="0" width="22" height="3" rx="1" />
          <rect x="0" y="5.5" width="22" height="3" rx="1" />
          <rect x="0" y="11" width="22" height="3" rx="1" />
        </svg>
      </button>

      <div className="os-taskbar__divider" />

      <div className="os-taskbar__windows">
        {openWindows.map((win) => (
          <button
            key={win.id}
            className={`os-taskbar__window ${win.isActive && !win.isMinimized ? 'os-taskbar__window--active' : ''}`}
            onClick={() => onWindowClick(win)}
            title={win.isMinimized ? 'Restaurar' : 'Minimizar'}
          >
            {win.icon ? (
              <img src={win.icon} alt="" className="os-taskbar__window-icon" />
            ) : (
              <Folder className="os-taskbar__window-icon" />
            )}

            <span className="os-taskbar__window-title">{win.title}</span>

            {win.isMinimized ? (
              <Maximize2 className="os-icon os-icon--xs" />
            ) : (
              <Minimize2 className="os-icon os-icon--xs" />
            )}

            <button
              onClick={(e) => {
                e.stopPropagation()
                onWindowClose(win.id)
              }}
              className="os-taskbar__window-close"
              aria-label="Cerrar"
            >
              <X className="os-icon os-icon--xs" />
            </button>
          </button>
        ))}
      </div>

      <div className="os-taskbar__clock">
        <span>{formatTime(time)}</span>
        <span>{formatDate(time)}</span>
      </div>
    </div>
  )
}

export default Taskbar