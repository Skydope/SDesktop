import React, { useState, useEffect } from 'react';
import { 
  Link, 
  Folder, 
  Settings, 
  Sun, 
  Moon, 
  Trash2, 
  Plus, 
  Globe, 
  Image, 
  Upload, 
  Layout, 
  FileVideo,
  FolderPlus, 
  RefreshCw, 
  LogOut, 
  User,
  PenTool,
  Clock,
  Clipboard // Icono Clipboard añadido
} from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import ResetAllDataModal from './ResetAllDataModal';
import { ShortcutItem, FolderItem } from './desktop';

interface StartMenuProps {
  onAddShortcut: (shortcut: { title: string; url: string; icon: string }) => void;
  onAddFolder: (folder: { title: string; icon: string }) => void;
  onWallpaperChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onWallpaperSelect: (url: string) => void;
  onThemeChange: (theme: 'light' | 'dark') => void;
  onClearData?: () => void;
  currentTheme: 'light' | 'dark';
  isOpen: boolean;
  userName?: string;
  userAvatar?: string;
  onUpdateProfile?: (profile: { name: string; avatar: string }) => void;
  allItems?: (ShortcutItem | FolderItem)[]; // Para acceder a todos los elementos
  onOpenItem?: (item: ShortcutItem | FolderItem) => void; // Para abrir los elementos al hacer clic
}

const predefinedWallpapers = [
  'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1920&q=80'
];

const StartMenu: React.FC<StartMenuProps> = ({
  onAddShortcut,
  onAddFolder,
  onWallpaperChange,
  onWallpaperSelect,
  onThemeChange,
  onClearData,
  currentTheme,
  isOpen,
  userName = "Usuario",
  userAvatar,
  onUpdateProfile,
  allItems = [],
  onOpenItem
}) => {
  // Cambiado para incluir 'frecuentes' como opción de pestaña principal
  const [activeTab, setActiveTab] = useState<'frecuentes' | 'nuevo' | 'configuracion'>('frecuentes');
  const [newSection, setNewSection] = useState<'acceso' | 'carpeta'>('acceso');
  const [newShortcut, setNewShortcut] = useState({ title: '', url: '', icon: '' });
  const [newFolder, setNewFolder] = useState({ title: '', icon: '' });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showResetDataModal, setShowResetDataModal] = useState(false);
  const [frequentItems, setFrequentItems] = useState<(ShortcutItem | FolderItem)[]>([]);

  // Función mejorada para obtener todos los elementos anidados recursivamente
  const getAllNestedItems = (items: (ShortcutItem | FolderItem)[]): (ShortcutItem | FolderItem)[] => {
    let allNestedItems: (ShortcutItem | FolderItem)[] = [];
    
    items.forEach(item => {
      allNestedItems.push(item);
      if ('items' in item && item.items) {
        allNestedItems = [...allNestedItems, ...getAllNestedItems(item.items)];
      }
    });
    
    return allNestedItems;
  };

  // Actualizar los elementos frecuentes cada vez que cambia allItems
  useEffect(() => {
    if (allItems.length > 0) {
      updateFrequentItems();
    }
  }, [allItems]);

  // Función mejorada para actualizar los elementos frecuentes
  const updateFrequentItems = () => {
    // Obtener todos los elementos, incluyendo los anidados
    const allNestedItems = getAllNestedItems(allItems);
    
    // Asegurar que todos los elementos tengan un clickCount definido
    const itemsWithClickCount = allNestedItems.map(item => ({
      ...item,
      clickCount: item.clickCount || 0
    }));
    
    // Ordenar por número de clics (de mayor a menor)
    const sortedItems = itemsWithClickCount.sort((a, b) => b.clickCount - a.clickCount);
    
    // Tomar los primeros 12 o menos si no hay suficientes
    setFrequentItems(sortedItems.slice(0, 12));
  };

  // Nueva función para manejar pegar desde el portapapeles
  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setNewShortcut({ ...newShortcut, url: clipboardText });
    } catch (err) {
      console.error('Error al leer el contenido del portapapeles: ', err);
      // Podrías añadir una notificación toast aquí si tienes un sistema de notificaciones
    }
  };

  if (!isOpen) return null;

  const handleClearData = () => {
    setShowResetDataModal(true);
  };
  
  const executeDataReset = () => {
    if (onClearData) {
      onClearData();
    } else {
      const keysToDelete = [
        'shortcuts', 
        'folders', 
        'wallpaper', 
        'theme',
        'desktopState',
        'userName',
        'userAvatar'
      ];
      
      keysToDelete.forEach(key => {
        localStorage.removeItem(key);
      });
      
      window.location.reload();
    }
    setShowResetDataModal(false);
  };

  const handleProfileUpdate = (profile: { name: string; avatar: string }) => {
    if (onUpdateProfile) {
      onUpdateProfile(profile);
    }
    setShowProfileModal(false);
  };

  const handleItemClick = (item: ShortcutItem | FolderItem) => {
    if (onOpenItem) {
      onOpenItem(item);
    }
  };

  const renderFrequentItems = () => {
    if (frequentItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Clock className="w-12 h-12 mb-3" />
          <p className="text-center">No hay elementos utilizados frecuentemente</p>
          <p className="text-center text-sm">Los elementos más usados aparecerán aquí</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-4 gap-3">
        {frequentItems.map((item, index) => (
          <button
            key={`${item.id}-${index}`}
            onClick={() => handleItemClick(item)}
            className="flex flex-col items-center justify-center p-3 rounded transition-colors bg-gray-800 hover:bg-gray-700 text-white"
          >
            {item.icon ? (
              <img src={item.icon} alt={item.title} className="w-8 h-8 mb-2" />
            ) : 'items' in item ? (
              <Folder className="w-8 h-8 mb-2" />
            ) : (
              <Globe className="w-8 h-8 mb-2" />
            )}
            <span className="text-sm text-center truncate w-full">{item.title}</span>
            <span className="text-xs text-gray-400">{item.clickCount || 0} usos</span>
          </button>
        ))}
      </div>
    );
  };

  const renderNewContent = () => {
    switch (newSection) {
      case 'acceso':
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAddShortcut(newShortcut);
              setNewShortcut({ title: '', url: '', icon: '' });
            }}
            className="flex flex-col gap-3"
          >
            <div>
              <label className="text-white text-sm mb-1 block">Título</label>
              <div className="relative">
                <input
                  type="text"
                  value={newShortcut.title}
                  onChange={(e) => setNewShortcut({ ...newShortcut, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white pl-9"
                  placeholder="Google"
                />
                <div className="absolute left-2 top-2.5">
                  <Layout className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-white text-sm mb-1 block">URL</label>
              <div className="relative flex">
                <div className="relative flex-grow">
                  <input
                    type="url"
                    value={newShortcut.url}
                    onChange={(e) => setNewShortcut({ ...newShortcut, url: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-l px-3 py-2 text-white pl-9"
                    placeholder="https://google.com"
                  />
                  <div className="absolute left-2 top-2.5">
                    <Link className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-r border-l-0 border border-gray-700 flex items-center justify-center"
                  title="Pegar desde el portapapeles"
                >
                  <Clipboard className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-white text-sm mb-1 block">URL del Icono (opcional)</label>
              <div className="relative">
                <input
                  type="url"
                  value={newShortcut.icon}
                  onChange={(e) => setNewShortcut({ ...newShortcut, icon: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white pl-9"
                  placeholder="https://ejemplo.com/icono.png"
                />
                <div className="absolute left-2 top-2.5">
                  <Image className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mt-2 flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir Acceso Directo
            </button>
          </form>
        );
      case 'carpeta':
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAddFolder(newFolder);
              setNewFolder({ title: '', icon: '' });
            }}
            className="flex flex-col gap-3"
          >
            <div>
              <label className="text-white text-sm mb-1 block">Nombre de la Carpeta</label>
              <div className="relative">
                <input
                  type="text"
                  value={newFolder.title}
                  onChange={(e) => setNewFolder({ ...newFolder, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white pl-9"
                  placeholder="Mi Carpeta"
                />
                <div className="absolute left-2 top-2.5">
                  <Folder className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-white text-sm mb-1 block">URL del Icono (opcional)</label>
              <div className="relative">
                <input
                  type="url"
                  value={newFolder.icon}
                  onChange={(e) => setNewFolder({ ...newFolder, icon: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white pl-9"
                  placeholder="https://ejemplo.com/icono-carpeta.png"
                />
                <div className="absolute left-2 top-2.5">
                  <Image className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mt-2 flex items-center justify-center"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Añadir Carpeta
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'frecuentes':
        return (
          <div className="p-4 flex-1 overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Elementos Frecuentes
            </h2>
            {renderFrequentItems()}
          </div>
        );
      case 'nuevo':
        return (
          <div className="p-4 flex-1 overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Nuevo
            </h2>
            
            <div className="grid grid-cols-4 gap-3 mb-4">
              <button
                onClick={() => setNewSection('acceso')}
                className={`flex flex-col items-center justify-center p-3 rounded transition-colors ${
                  newSection === 'acceso' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                <Globe className="w-6 h-6 mb-2" />
                <span className="text-sm">Acceso Directo</span>
              </button>
              <button
                onClick={() => setNewSection('carpeta')}
                className={`flex flex-col items-center justify-center p-3 rounded transition-colors ${
                  newSection === 'carpeta' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                <Folder className="w-6 h-6 mb-2" />
                <span className="text-sm">Carpeta</span>
              </button>
              <button
                className="flex flex-col items-center justify-center p-3 rounded transition-colors bg-gray-800 hover:bg-gray-700 text-white"
                disabled
              >
                <Image className="w-6 h-6 mb-2" />
                <span className="text-sm">Imágen</span>
              </button>
              <button
                className="flex flex-col items-center justify-center p-3 rounded transition-colors bg-gray-800 hover:bg-gray-700 text-white"
                disabled
              >
                <FileVideo className="w-6 h-6 mb-2" />
                <span className="text-sm">Vídeo</span>
              </button>
            </div>
            
            <div className="mt-4">
              {renderNewContent()}
            </div>
          </div>
        );
      case 'configuracion':
        return (
          <div className="p-4 flex-1 overflow-y-auto grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center text-sm">
                <User className="w-4 h-4 mr-2" />
                Perfil de Usuario
              </h3>
              <div className="flex items-center gap-3 mb-3 bg-gray-800 rounded-lg p-3">
                <div className="relative">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="Avatar de Usuario"
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{userName}</p>
                  <p className="text-gray-400 text-xs">Cuenta Local</p>
                </div>
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-1.5 text-sm flex items-center"
                  onClick={() => setShowProfileModal(true)}
                >
                  <PenTool className="w-3.5 h-3.5 mr-1.5" />
                  Editar
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center text-sm">
                <Sun className="w-4 h-4 mr-2" />
                Tema
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onThemeChange('light')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded ${
                    currentTheme === 'light' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Claro</span>
                </button>
                <button
                  onClick={() => onThemeChange('dark')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded ${
                    currentTheme === 'dark' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Oscuro</span>
                </button>
              </div>
            </div>

            <div className="col-span-2">
              <h3 className="text-white font-medium mb-3 flex items-center text-sm">
                <Image className="w-4 h-4 mr-2" />
                Fondo de Pantalla
              </h3>
              <div className="grid grid-cols-4 gap-3 mb-3">
                {predefinedWallpapers.map((wallpaper, index) => (
                  <button
                    key={index}
                    onClick={() => onWallpaperSelect(wallpaper)}
                    className="h-16 rounded overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                  >
                    <img
                      src={wallpaper}
                      alt={`Fondo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-white cursor-pointer bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded w-full mt-2">
                <Upload className="w-4 h-4" />
                <span>Subir Fondo Personalizado</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onWallpaperChange}
                />
              </label>
            </div>

            <div className="col-span-2">
              <h3 className="text-white font-medium mb-3 flex items-center text-sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Gestión de Datos
              </h3>
              <button
                onClick={handleClearData}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded w-full"
              >
                <Trash2 className="w-4 h-4" />
                Reiniciar Todos los Datos
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute bottom-12 left-2 w-2/3 max-w-4xl bg-gray-900 shadow-2xl rounded-t-lg overflow-hidden border border-gray-800 border-b-0">
      {/* Barra superior con nombre de usuario */}
      <div className="flex items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
        <button 
          className="bg-blue-600 rounded-full p-1.5 mr-3 cursor-pointer hover:bg-blue-700"
          onClick={() => setShowProfileModal(true)}
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt="Avatar de Usuario"
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <User className="h-5 w-5 text-white" />
          )}
        </button>
        <div>
          <p className="text-white font-medium">{userName}</p>
          <p className="text-gray-400 text-xs">Cuenta Local</p>
        </div>
        <button className="ml-auto text-white hover:bg-gray-700 rounded-full p-1.5">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex h-96">
        {/* Barra lateral de navegación - Mantenemos el ancho similar al original */}
        <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center pt-4">
          <button
            onClick={() => setActiveTab('frecuentes')}
            className={`p-2 mb-4 rounded-md w-12 h-12 flex flex-col items-center justify-center ${
              activeTab === 'frecuentes' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
            title="Frecuentes"
          >
            <Clock className="h-5 w-5 text-white" />
            <span className="text-white text-xs mt-1">Frecuentes</span>
          </button>
          
          <button
            onClick={() => setActiveTab('nuevo')}
            className={`p-2 mb-4 rounded-md w-12 h-12 flex flex-col items-center justify-center ${
              activeTab === 'nuevo' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
            title="Nuevo"
          >
            <Plus className="h-5 w-5 text-white" />
            <span className="text-white text-xs mt-1">Nuevo</span>
          </button>
          
          <button
            onClick={() => setActiveTab('configuracion')}
            className={`p-2 mb-4 rounded-md w-12 h-12 flex flex-col items-center justify-center ${
              activeTab === 'configuracion' ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
            title="Configuración"
          >
            <Settings className="h-5 w-5 text-white" />
            <span className="text-white text-xs mt-1">Config</span>
          </button>
        </div>
        
        {/* Contenido principal */}
        {renderContent()}
      </div>

      {/* Modal de perfil de usuario */}
      {showProfileModal && (
        <UserProfileModal
          onClose={() => setShowProfileModal(false)}
          onSave={handleProfileUpdate}
          userName={userName}
          userAvatar={userAvatar}
        />
      )}
      {showResetDataModal && (
        <ResetAllDataModal
          isOpen={showResetDataModal}
          onClose={() => setShowResetDataModal(false)}
          onConfirmReset={executeDataReset}
        />
      )}
    </div>
  );
};

export default StartMenu;