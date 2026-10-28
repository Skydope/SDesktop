import React, { useState } from 'react'
import {
  Clock,
  Plus,
  Settings,
  User,
  Image,
  Upload,
  Sun,
  Moon,
  Trash2,
  LogOut,
  Globe,
  Folder,
  Terminal,
  FileText,
  Calculator,
  SkipForward,
} from 'lucide-react'
import { useDesktopStore } from '../store/desktopStore'
import { useTheme } from '../hooks/useTheme'
import { toast } from '../hooks/useToast'
import UserProfileModal from './UserProfileModal'
import ResetAllDataModal from './ResetAllDataModal'
import type { ShortcutItem, FolderItem, AppId } from '../types/desktop'
import { APP_REGISTRY } from '../types/desktop'

interface StartMenuProps {
  onAddShortcut: (shortcut: { title: string; url: string; icon: string }) => void
  onAddFolder: (folder: { title: string; icon: string }) => void
  onWallpaperChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onWallpaperSelect: (url: string) => void
  onClearData?: () => void | Promise<void>
  isOpen: boolean
  allItems?: (ShortcutItem | FolderItem)[]
  onOpenItem?: (item: ShortcutItem | FolderItem) => void
  onOpenApp?: (appId: AppId) => void
}

const predefinedWallpapers = [
  'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1920&q=80',
]

type TabId = 'apps' | 'frecuentes' | 'nuevo' | 'configuracion'
type NewSection = 'acceso' | 'carpeta'

const SYSTEM_APPS: AppId[] = ['finder', 'terminal', 'textedit', 'preferences', 'calculator']

const StartMenu: React.FC<StartMenuProps> = ({
  onAddShortcut,
  onAddFolder,
  onWallpaperChange,
  onWallpaperSelect,
  onClearData,
  isOpen,
  allItems = [],
  onOpenItem,
  onOpenApp,
}) => {
  const { theme, setTheme } = useTheme()
  const { userProfile, updateUserProfile, clearAllData, skipBoot, setSkipBoot } = useDesktopStore()

  const [activeTab, setActiveTab] = useState<TabId>('apps')
  const [newSection, setNewSection] = useState<NewSection>('acceso')
  const [newShortcut, setNewShortcut] = useState({ title: '', url: '', icon: '' })
  const [newFolder, setNewFolder] = useState({ title: '', icon: '' })
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showResetDataModal, setShowResetDataModal] = useState(false)

  const getAllNestedItems = (
    items: (ShortcutItem | FolderItem)[]
  ): (ShortcutItem | FolderItem)[] => {
    let allNestedItems: (ShortcutItem | FolderItem)[] = []
    items.forEach((item) => {
      allNestedItems.push(item)
      if ('items' in item && item.items) {
        allNestedItems = [...allNestedItems, ...getAllNestedItems(item.items)]
      }
    })
    return allNestedItems
  }

  const frequentItems = getAllNestedItems(allItems)
    .map((item) => ({ ...item, clickCount: item.clickCount || 0 }))
    .sort((a, b) => b.clickCount - a.clickCount)
    .slice(0, 12)

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      setNewShortcut({ ...newShortcut, url: clipboardText })
    } catch (err) {
      console.error('Error al leer el portapapeles: ', err)
    }
  }

  if (!isOpen) return null

  const handleClearData = () => {
    setShowResetDataModal(true)
  }

  const executeDataReset = async () => {
    try {
      await (onClearData ? onClearData() : clearAllData())
    } catch (err) {
      // Si el wipe del VFS falla el reset quedo a medias; no recargar, porque
      // eso lo dejaria pareciendo exitoso.
      toast.error(
        'No se pudo borrar todo',
        err instanceof Error ? err.message : String(err)
      )
      setShowResetDataModal(false)
      return
    }
    setShowResetDataModal(false)
    // Resetear un OS es rebootearlo: recargar garantiza que ninguna ventana
    // abierta siga mostrando el filesystem viejo.
    window.location.reload()
  }

  const handleProfileUpdate = (profile: { name: string; avatar: string }) => {
    updateUserProfile(profile)
    setShowProfileModal(false)
  }

  const handleItemClick = (item: ShortcutItem | FolderItem) => {
    if (onOpenItem) {
      onOpenItem(item)
    }
  }

  const handleAppClick = (appId: AppId) => {
    if (onOpenApp) {
      onOpenApp(appId)
    }
  }

  const renderApps = () => (
    <div className="os-start-menu__content">
      <h3 className="os-start-menu__section-title">
        <Folder className="os-icon" />
        Aplicaciones
      </h3>
      <div className="os-start-menu__grid">
        {SYSTEM_APPS.map((appId) => {
          const app = APP_REGISTRY[appId]
          const IconComponent = {
            terminal: Terminal,
            'file-text': FileText,
            settings: Settings,
            calculator: Calculator,
            folder: Folder,
          }[app.icon] || Settings

          return (
            <button
              key={appId}
              className="os-start-menu__frequent-item"
              onClick={() => handleAppClick(appId)}
            >
              <div className="os-start-menu__app-icon-wrapper">
                <IconComponent className="os-start-menu__item-icon" />
              </div>
              <span className="os-start-menu__item-title">{app.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderFrequentItems = () => {
    if (frequentItems.length === 0) {
      return (
        <div className="os-start-menu__empty">
          <Clock className="os-icon" style={{ width: 32, height: 32 }} />
          <p className="os-start-menu__empty-title">Sin elementos frecuentes</p>
          <p className="os-start-menu__empty-subtitle">Los más usados aparecerán aquí</p>
        </div>
      )
    }

    return (
      <div className="os-start-menu__grid">
        {frequentItems.map((item) => (
          <button
            key={item.id}
            className="os-start-menu__frequent-item"
            onClick={() => handleItemClick(item)}
          >
            {item.icon ? (
              <img src={item.icon} alt={item.title} className="os-start-menu__item-icon" />
            ) : 'items' in item ? (
              <Folder className="os-start-menu__item-icon os-icon--folder" />
            ) : (
              <Globe className="os-start-menu__item-icon" />
            )}
            <span className="os-start-menu__item-title">{item.title}</span>
            <span className="os-start-menu__item-count">{item.clickCount || 0}</span>
          </button>
        ))}
      </div>
    )
  }

  const renderNewContent = () => {
    if (newSection === 'acceso') {
      return (
        <form
          className="os-start-menu__form"
          onSubmit={(e) => {
            e.preventDefault()
            onAddShortcut(newShortcut)
            setNewShortcut({ title: '', url: '', icon: '' })
          }}
        >
          <div className="os-form-group">
            <label className="os-form-label">Título</label>
            <input
              type="text"
              className="os-input"
              value={newShortcut.title}
              onChange={(e) => setNewShortcut({ ...newShortcut, title: e.target.value })}
              placeholder="Google"
            />
          </div>
          <div className="os-form-group">
            <label className="os-form-label">URL</label>
            <div className="os-input-group">
              <input
                type="url"
                className="os-input"
                value={newShortcut.url}
                onChange={(e) => setNewShortcut({ ...newShortcut, url: e.target.value })}
                placeholder="https://google.com"
              />
              <button
                type="button"
                className="os-btn os-btn--secondary os-btn--sm"
                onClick={handlePasteFromClipboard}
              >
                Pegar
              </button>
            </div>
          </div>
          <div className="os-form-group">
            <label className="os-form-label">URL del Icono (opcional)</label>
            <input
              type="url"
              className="os-input"
              value={newShortcut.icon}
              onChange={(e) => setNewShortcut({ ...newShortcut, icon: e.target.value })}
              placeholder="https://ejemplo.com/icono.png"
            />
          </div>
          <button type="submit" className="os-btn os-btn--primary">
            <Plus className="os-icon os-icon--sm" />
            Añadir Acceso Directo
          </button>
        </form>
      )
    }

    return (
      <form
        className="os-start-menu__form"
        onSubmit={(e) => {
          e.preventDefault()
          onAddFolder(newFolder)
          setNewFolder({ title: '', icon: '' })
        }}
      >
        <div className="os-form-group">
          <label className="os-form-label">Nombre de la Carpeta</label>
          <input
            type="text"
            className="os-input"
            value={newFolder.title}
            onChange={(e) => setNewFolder({ ...newFolder, title: e.target.value })}
            placeholder="Mi Carpeta"
          />
        </div>
        <div className="os-form-group">
          <label className="os-form-label">URL del Icono (opcional)</label>
          <input
            type="url"
            className="os-input"
            value={newFolder.icon}
            onChange={(e) => setNewFolder({ ...newFolder, icon: e.target.value })}
            placeholder="https://ejemplo.com/icono.png"
          />
        </div>
        <button type="submit" className="os-btn os-btn--primary">
          <Folder className="os-icon os-icon--sm" />
          Añadir Carpeta
        </button>
      </form>
    )
  }

  const renderConfigContent = () => (
    <div className="os-start-menu__config">
      <div className="os-start-menu__config-section">
        <h4 className="os-start-menu__config-title">
          <User className="os-icon os-icon--sm" />
          Perfil de Usuario
        </h4>
        <div className="os-start-menu__user-card">
          {userProfile.avatar ? (
            <img src={userProfile.avatar} alt="Avatar" className="os-start-menu__avatar-img" />
          ) : (
            <div className="os-start-menu__avatar-placeholder">
              <User className="os-icon" />
            </div>
          )}
          <div className="os-start-menu__user-info">
            <p className="os-start-menu__user-name">{userProfile.name}</p>
            <p className="os-start-menu__user-role">Cuenta Local</p>
          </div>
          <button
            className="os-btn os-btn--secondary os-btn--sm"
            onClick={() => setShowProfileModal(true)}
          >
            Editar
          </button>
        </div>
      </div>

      <div className="os-start-menu__config-section">
        <h4 className="os-start-menu__config-title">
          <Sun className="os-icon os-icon--sm" />
          Tema
        </h4>
        <div className="os-start-menu__theme-btns">
          <button
            className={`os-btn ${theme === 'light' ? 'os-btn--primary' : 'os-btn--secondary'}`}
            onClick={() => setTheme('light')}
          >
            <Sun className="os-icon os-icon--sm" />
            Claro
          </button>
          <button
            className={`os-btn ${theme === 'dark' ? 'os-btn--primary' : 'os-btn--secondary'}`}
            onClick={() => setTheme('dark')}
          >
            <Moon className="os-icon os-icon--sm" />
            Oscuro
          </button>
        </div>
      </div>

      <div className="os-start-menu__config-section">
        <h4 className="os-start-menu__config-title">
          <Image className="os-icon os-icon--sm" />
          Fondo de Pantalla
        </h4>
        <div className="os-start-menu__wallpapers">
          {predefinedWallpapers.map((wp, index) => (
            <button
              key={index}
              className="os-start-menu__wallpaper-btn"
              onClick={() => onWallpaperSelect(wp)}
            >
              <img src={wp} alt={`Fondo ${index + 1}`} />
            </button>
          ))}
        </div>
        <label className="os-start-menu__upload-label">
          <Upload className="os-icon os-icon--sm" />
          <span>Subir Fondo Personalizado</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onWallpaperChange}
          />
        </label>
      </div>

      <div className="os-start-menu__config-section">
        <h4 className="os-start-menu__config-title">
          <SkipForward className="os-icon os-icon--sm" />
          Secuencia de Arranque
        </h4>
        <label className="os-start-menu__toggle">
          <input
            type="checkbox"
            checked={skipBoot}
            onChange={(e) => setSkipBoot(e.target.checked)}
          />
          <span>Omitir pantalla de inicio</span>
        </label>
      </div>

      <div className="os-start-menu__config-section">
        <button className="os-btn os-btn--danger" onClick={handleClearData}>
          <Trash2 className="os-icon os-icon--sm" />
          Reiniciar Todos los Datos
        </button>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'frecuentes':
        return (
          <div className="os-start-menu__content">
            <h3 className="os-start-menu__section-title">
              <Clock className="os-icon" />
              Elementos Frecuentes
            </h3>
            {renderFrequentItems()}
          </div>
        )
      case 'apps':
        return renderApps()
      case 'nuevo':
        return (
          <div className="os-start-menu__content">
            <h3 className="os-start-menu__section-title">
              <Plus className="os-icon" />
              Nuevo
            </h3>
            <div className="os-tabs">
              <button
                className={`os-tab ${newSection === 'acceso' ? 'os-tab--active' : ''}`}
                onClick={() => setNewSection('acceso')}
              >
                <Globe className="os-icon os-icon--sm" />
                Acceso Directo
              </button>
              <button
                className={`os-tab ${newSection === 'carpeta' ? 'os-tab--active' : ''}`}
                onClick={() => setNewSection('carpeta')}
              >
                <Folder className="os-icon os-icon--sm" />
                Carpeta
              </button>
            </div>
            <div className="os-start-menu__form-wrapper">{renderNewContent()}</div>
          </div>
        )
      case 'configuracion':
        return (
          <div className="os-start-menu__content">
            <h3 className="os-start-menu__section-title">
              <Settings className="os-icon" />
              Configuración
            </h3>
            {renderConfigContent()}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="os-start-menu">
        <div className="os-start-menu__header">
          {userProfile.avatar ? (
            <img src={userProfile.avatar} alt="Avatar" className="os-start-menu__avatar" />
          ) : (
            <div className="os-start-menu__avatar">
              <User className="os-icon" />
            </div>
          )}
          <div className="os-start-menu__user">
            <p className="os-start-menu__user-name">{userProfile.name}</p>
            <p className="os-start-menu__user-role">Cuenta Local</p>
          </div>
          <button
            className="os-start-menu__logout"
            onClick={() => setShowProfileModal(true)}
            aria-label="Cerrar sesión"
          >
            <LogOut className="os-icon" />
          </button>
        </div>

        <div className="os-start-menu__body">
          <div className="os-start-menu__sidebar">
            <button
              className={`os-start-menu__sidebar-btn ${activeTab === 'apps' ? 'os-start-menu__sidebar-btn--active' : ''}`}
              onClick={() => setActiveTab('apps')}
            >
              <Folder />
              <span>Apps</span>
            </button>
            <button
              className={`os-start-menu__sidebar-btn ${activeTab === 'frecuentes' ? 'os-start-menu__sidebar-btn--active' : ''}`}
              onClick={() => setActiveTab('frecuentes')}
            >
              <Clock />
              <span>Frecuentes</span>
            </button>
            <button
              className={`os-start-menu__sidebar-btn ${activeTab === 'nuevo' ? 'os-start-menu__sidebar-btn--active' : ''}`}
              onClick={() => setActiveTab('nuevo')}
            >
              <Plus />
              <span>Nuevo</span>
            </button>
            <button
              className={`os-start-menu__sidebar-btn ${activeTab === 'configuracion' ? 'os-start-menu__sidebar-btn--active' : ''}`}
              onClick={() => setActiveTab('configuracion')}
            >
              <Settings />
              <span>Config</span>
            </button>
          </div>

          {renderContent()}
        </div>
      </div>

      {showProfileModal && (
        <UserProfileModal
          onClose={() => setShowProfileModal(false)}
          onSave={handleProfileUpdate}
          userName={userProfile.name}
          userAvatar={userProfile.avatar}
        />
      )}
      {showResetDataModal && (
        <ResetAllDataModal
          isOpen={showResetDataModal}
          onClose={() => setShowResetDataModal(false)}
          onConfirmReset={executeDataReset}
        />
      )}
    </>
  )
}

export default StartMenu