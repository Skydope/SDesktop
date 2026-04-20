import React, { useState, useEffect, useRef } from 'react'
import { useDesktopStore } from '../../store/desktopStore'
import { APP_REGISTRY, AppId } from '../../types/desktop'
import {
  Terminal,
  Folder,
  FileText,
  Settings,
  Calculator,
  Trash2,
} from 'lucide-react'

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  terminal: Terminal,
  'file-text': FileText,
  settings: Settings,
  calculator: Calculator,
  folder: Folder,
}

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

const DockSeparator: React.FC = () => (
  <div className="os-dock__separator" />
)

const SYSTEM_APPS: AppId[] = ['finder', 'terminal', 'textedit', 'preferences', 'calculator']

const Dock: React.FC = () => {
  const dockRef = useRef<HTMLDivElement>(null)
  const [magnifyIndex, setMagnifyIndex] = useState(-1)
  const [bouncingApp, setBouncingApp] = useState<AppId | null>(null)
  const [mouseX, setMouseX] = useState(-1)
  const openWindows = useDesktopStore(s => s.openWindows)
  const openApp = useDesktopStore(s => s.openApp)

  const runningApps = new Set<string>()
  openWindows.forEach(w => {
    if (w.appId) runningApps.add(w.appId)
  })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX)

      if (!dockRef.current) return

      const dockRect = dockRef.current.getBoundingClientRect()
      const dockCenterY = dockRect.top + dockRect.height / 2

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

  return (
    <div className="os-dock" ref={dockRef}>
      <div className="os-dock__inner">
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
        </div>

        <DockSeparator />

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

      <div className="os-dock__glow" />
    </div>
  )
}

export default Dock
