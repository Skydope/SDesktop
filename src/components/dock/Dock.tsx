import React, { useState, useEffect, useRef } from 'react'
import { useDesktopStore } from '../../store/desktopStore'
import { APP_REGISTRY, AppId, WindowState } from '../../types/desktop'
import {
  Folder,
  Trash2,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { ICON_MAP } from '../appIcons'

interface DockItemProps {
  appId: AppId | 'trash'
  name: string
  isRunning: boolean
  isBouncing: boolean
  onClick: () => void
  onMouseEnter: () => void
  magnifyLevel: number
}

const DockItem: React.FC<DockItemProps> = ({
  appId,
  name,
  isRunning,
  isBouncing,
  onClick,
  onMouseEnter,
  magnifyLevel,
}) => {
  const IconComponent = appId === 'trash' ? Trash2 : ICON_MAP[appId] || Folder

  const scale = 1 + magnifyLevel * 0.4
  const translateY = -magnifyLevel * 20

  return (
    <div
      className={`os-dock__item ${isBouncing ? 'os-dock__item--bouncing' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={{
        transform: `scale(${scale}) translateY(${translateY}px)`,
      }}
      title={name}
    >
      <div className="os-dock__icon-wrapper">
        <IconComponent className="os-dock__icon" />
      </div>
      {isRunning && <div className="os-dock__indicator" />}
    </div>
  )
}

const SYSTEM_APPS: AppId[] = ['finder', 'terminal', 'textedit', 'preferences', 'calculator']

const Dock: React.FC = () => {
  const dockRef = useRef<HTMLDivElement>(null)
  const [magnifyIndex, setMagnifyIndex] = useState(-1)
  const [bouncingApp, setBouncingApp] = useState<AppId | null>(null)
  const [time, setTime] = useState(new Date())
  const openWindows = useDesktopStore(s => s.openWindows)
  const openApp = useDesktopStore(s => s.openApp)
  const closeWindow = useDesktopStore(s => s.closeWindow)
  const maximizeWindow = useDesktopStore(s => s.maximizeWindow)
  const setActiveWindow = useDesktopStore(s => s.setActiveWindow)
  const toggleStartMenu = useDesktopStore(s => s.toggleStartMenu)
  const isStartMenuOpen = useDesktopStore(s => s.isStartMenuOpen)

  const runningApps = new Set<string>()
  openWindows.forEach(w => {
    if (w.appId) runningApps.add(w.appId)
  })

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dockRef.current) return

      const dockRect = dockRef.current.getBoundingClientRect()

      if (e.clientY >= dockRect.top && e.clientY <= dockRect.bottom) {
        const itemWidth = 52
        const gap = 8
        const totalItems = SYSTEM_APPS.length + 2
        const dockWidth = totalItems * itemWidth + (totalItems - 1) * gap
        const dockLeft = (window.innerWidth - dockWidth) / 2

        const relativeX = e.clientX - dockLeft
        const index = Math.floor(relativeX / (itemWidth + gap))

        if (index >= 0 && index < SYSTEM_APPS.length + 1) {
          setMagnifyIndex(index)
        } else {
          setMagnifyIndex(-1)
        }
      } else {
        setMagnifyIndex(-1)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleAppClick = (appId: AppId) => {
    setBouncingApp(appId)
    openApp(appId)
    setTimeout(() => setBouncingApp(null), 600)
  }

  const handleMouseEnterApp = (index: number) => {
    setMagnifyIndex(index)
  }

  const handleWindowClick = (win: WindowState) => {
    setActiveWindow(win.id)
    if (win.isMinimized) {
      maximizeWindow(win.id)
    }
  }

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (d: Date) => {
    return d.toLocaleDateString([], {
      month: 'short',
      day: '2-digit',
    })
  }

  return (
    <div className="os-dock" ref={dockRef}>
      <div className="os-dock__bar">
        <button
          onClick={toggleStartMenu}
          className={`os-dock__start-btn ${isStartMenuOpen ? 'os-dock__start-btn--active' : ''}`}
          aria-label="Menu"
        >
          <svg width="22" height="14" viewBox="0 0 22 14" fill="currentColor">
            <rect x="0" y="0" width="22" height="3" rx="1" />
            <rect x="0" y="5.5" width="22" height="3" rx="1" />
            <rect x="0" y="11" width="22" height="3" rx="1" />
          </svg>
        </button>

        <div className="os-dock__divider" />

        <div className="os-dock__windows">
          {openWindows.map((win) => (
            <div
              key={win.id}
              className={`os-dock__window ${win.isActive && !win.isMinimized ? 'os-dock__window--active' : ''}`}
            >
              <button
                type="button"
                className="os-dock__window-main"
                onClick={() => handleWindowClick(win)}
                title={win.isMinimized ? 'Restaurar' : win.title}
              >
                {win.icon ? (
                  <img src={win.icon} alt="" className="os-dock__window-icon" />
                ) : (
                  <Folder className="os-dock__window-icon" />
                )}
                <span className="os-dock__window-title">{win.title}</span>
                {win.isMinimized ? (
                  <Maximize2 className="os-dock__window-action" />
                ) : (
                  <Minimize2 className="os-dock__window-action" />
                )}
              </button>
              <button
                type="button"
                onClick={() => closeWindow(win.id)}
                className="os-dock__window-close"
                aria-label={`Cerrar ${win.title}`}
              >
                <X className="os-dock__window-close-icon" />
              </button>
            </div>
          ))}
        </div>

        <div className="os-dock__divider" />

        <div className="os-dock__apps">
          {SYSTEM_APPS.map((appId, index) => (
            <DockItem
              key={appId}
              appId={appId}
              name={APP_REGISTRY[appId].name}
              isRunning={runningApps.has(appId)}
              isBouncing={bouncingApp === appId}
              onClick={() => handleAppClick(appId)}
              onMouseEnter={() => handleMouseEnterApp(index)}
              magnifyLevel={magnifyIndex === index ? 1 : 0}
            />
          ))}

          <div className="os-dock__separator" />

          <DockItem
            appId="trash"
            name="Trash"
            isRunning={false}
            isBouncing={false}
            onClick={() => {}}
            onMouseEnter={() => {}}
            magnifyLevel={magnifyIndex === SYSTEM_APPS.length ? 1 : 0}
          />
        </div>

        <div className="os-dock__divider" />

        <div className="os-dock__clock">
          <span>{formatTime(time)}</span>
          <span>{formatDate(time)}</span>
        </div>
      </div>

      <div className="os-dock__glow" />
    </div>
  )
}

export default Dock
