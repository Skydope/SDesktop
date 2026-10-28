import { useState, useEffect } from 'react'
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
  const [initError, setInitError] = useState<Error | null>(null)
  const skipBoot = useDesktopStore(s => s.skipBoot)

  useEffect(() => {
    const init = async () => {
      try {
        await vfs.init()
      } catch (err) {
        // IndexedDB puede no estar disponible (ventana privada, storage
        // bloqueado). Sin este catch la app queda en "Loading..." para siempre.
        setInitError(err instanceof Error ? err : new Error(String(err)))
        return
      }
      processManager.spawn('launchd', 'launchd', [])
      // El escritorio ES /Users/guest/Desktop: hay que leerlo del VFS (y migrar
      // el que haya quedado en localStorage) antes de mostrarlo.
      await useDesktopStore.getState().initDesktop()
      setBootLoaded(true)
    }
    init()
  }, [])

  const handleBootComplete = () => {
    setBooted(true)
  }

  if (initError) {
    return (
      <div className="os-boot" role="alert">
        <div className="os-boot__content">
          <div className="os-boot__title">No se pudo montar el filesystem</div>
          <p className="os-boot__error">{initError.message}</p>
          <p className="os-boot__error">
            SDesktop guarda su filesystem en IndexedDB. Revisa que el navegador
            permita almacenamiento para este sitio.
          </p>
        </div>
      </div>
    )
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
