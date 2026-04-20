import React, { useState, useEffect } from 'react'
import Desktop from './components/Desktop'
import ToastContainer from './components/ToastContainer'
import BootScreen from './components/boot/BootScreen'
import MenuBar from './components/menubar/MenuBar'
import Dock from './components/dock/Dock'
import { useDesktopStore } from './store/desktopStore'
import { vfs } from './vfs'
import { processManager } from './process'

function App() {
  const [booted, setBooted] = useState(false)
  const [bootLoaded, setBootLoaded] = useState(false)
  const skipBoot = useDesktopStore(s => s.skipBoot)

  useEffect(() => {
    const init = async () => {
      await vfs.init()
      processManager.spawn('launchd', 'launchd', [])
      setBootLoaded(true)
    }
    init()
  }, [])

  const handleBootComplete = () => {
    setBooted(true)
  }

  if (!bootLoaded) {
    return (
      <div className="os-boot">
        <div className="os-boot__content">
          <div className="os-boot__title" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Loading...
          </div>
        </div>
      </div>
    )
  }

  if (!booted && !skipBoot) {
    return <BootScreen onComplete={handleBootComplete} />
  }

  if (!booted && skipBoot) {
    setBooted(true)
  }

  return (
    <div className="os-app">
      <MenuBar />
      <div className="os-app__desktop-wrapper">
        <Desktop />
      </div>
      <Dock />
      <ToastContainer />
    </div>
  )
}

export default App
