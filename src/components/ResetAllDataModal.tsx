import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Folder,
  Globe,
  Trash2,
  Image,
  Settings,
  ChevronRight,
  ChevronDown,
  User,
  LayoutGrid,
} from 'lucide-react';
import { useDesktopStore } from '../store/desktopStore';
import type { ShortcutItem, FolderItem } from '../types/desktop';

interface ResetAllDataModalProps {
  onClose: () => void;
  onConfirmReset: () => void;
  isOpen: boolean;
}

const ResetAllDataModal: React.FC<ResetAllDataModalProps> = ({
  onClose,
  onConfirmReset,
  isOpen,
}) => {
  const { items, wallpaper, theme, userProfile } = useDesktopStore();

  const [position, setPosition] = useState({
    x: window.innerWidth / 2 - 250,
    y: window.innerHeight / 2 - 225,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['shortcuts', 'folders', 'settings'])
  );

  const countNestedStats = (
    items: (ShortcutItem | FolderItem)[]
  ): { folders: number; shortcuts: number } => {
    let folders = 0;
    let shortcuts = 0;

    for (const item of items) {
      if ('items' in item) {
        folders++;
        const subCounts = countNestedStats(item.items);
        folders += subCounts.folders;
        shortcuts += subCounts.shortcuts;
      } else {
        shortcuts++;
      }
    }

    return { folders, shortcuts };
  };

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const rootItems = items;
  const nestedStats = countNestedStats(items);
  const topLevelFolders = rootItems.filter((item) => 'items' in item) as FolderItem[];
  const topLevelShortcuts = rootItems.filter(
    (item) => 'url' in item
  ) as ShortcutItem[];

  const renderShortcut = (shortcut: ShortcutItem, depth = 0) => (
    <div
      key={shortcut.id}
      className="flex items-center py-1 text-white text-sm hover:bg-gray-700/50 rounded"
    >
      <div style={{ width: `${depth * 12}px` }} />
      <Globe className="w-4 h-4 mr-2 text-blue-400" />
      <span className="truncate flex-1">{shortcut.title}</span>
      <span className="text-gray-400 text-xs">
        {shortcut.url.substring(0, 25)}
        {shortcut.url.length > 25 ? '...' : ''}
      </span>
    </div>
  );

  const renderFolder = (folderItem: FolderItem, depth = 0) => {
    const isExpanded = expandedSections.has(`folder-${folderItem.id}`);

    return (
      <div key={folderItem.id} className="w-full">
        <div
          className="flex items-center py-1 text-white text-sm hover:bg-gray-700/50 rounded"
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          <button
            className="p-1 rounded hover:bg-gray-600/50"
            onClick={() => toggleSection(`folder-${folderItem.id}`)}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-300" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-300" />
            )}
          </button>
          <Folder className="w-4 h-4 mr-2 text-yellow-400" />
          <span className="truncate">{folderItem.title}</span>
          <span className="text-gray-400 text-xs ml-2">
            ({folderItem.items.length} elementos)
          </span>
        </div>

        {isExpanded &&
          folderItem.items.map((subItem) =>
            'items' in subItem ? (
              renderFolder(subItem as FolderItem, depth + 1)
            ) : (
              renderShortcut(subItem as ShortcutItem, depth + 1)
            )
          )}
      </div>
    );
  };

  const totalShortcuts = topLevelShortcuts.length + nestedStats.shortcuts;
  const totalFolders = topLevelFolders.length + nestedStats.folders;
  const wallpaperSet = wallpaper !== useDesktopStore.getState().wallpaper;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg shadow-xl overflow-hidden w-500"
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: '500px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="bg-gray-800 px-4 py-2 flex items-center justify-between cursor-move"
          onMouseDown={handleMouseDown}
        >
          <h3 className="text-white font-medium flex items-center">
            <Trash2 className="w-4 h-4 mr-2 text-red-500" />
            Restablecer Todos los Datos
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-gray-700 rounded p-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center mb-4">
            <AlertTriangle className="text-yellow-500 w-6 h-6 mr-3" />
            <h4 className="text-white font-medium text-lg">
              Restablecer Todos los Datos
            </h4>
          </div>

          <p className="text-gray-300 mb-4">
            Estás a punto de restablecer{' '}
            <span className="font-medium text-white">todos los datos</span>{' '}
            almacenados en esta aplicación. Esto incluye todos los accesos
            directos, carpetas, configuraciones y personalizaciones.
          </p>

          <div className="mb-6 bg-gray-800/50 p-4 rounded-lg">
            <h5 className="text-white font-medium mb-2">
              Resumen de datos que se eliminarán:
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center text-gray-300">
                <Globe className="w-4 h-4 mr-2 text-blue-400" />
                <span>Accesos directos: </span>
                <span className="font-medium text-white ml-1">
                  {totalShortcuts}
                </span>
              </div>
              <div className="flex items-center text-gray-300">
                <Folder className="w-4 h-4 mr-2 text-yellow-400" />
                <span>Carpetas: </span>
                <span className="font-medium text-white ml-1">
                  {totalFolders}
                </span>
              </div>
              <div className="flex items-center text-gray-300">
                <LayoutGrid className="w-4 h-4 mr-2 text-purple-400" />
                <span>Diseño del escritorio</span>
              </div>
              <div className="flex items-center text-gray-300">
                <User className="w-4 h-4 mr-2 text-green-400" />
                <span>Perfil de usuario: </span>
                <span className="font-medium text-white ml-1">
                  {userProfile.name}
                </span>
              </div>
              <div className="flex items-center text-gray-300">
                <Settings className="w-4 h-4 mr-2 text-gray-400" />
                <span>Tema: </span>
                <span className="font-medium text-white ml-1">{theme}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Image className="w-4 h-4 mr-2 text-pink-400" />
                <span>Fondo personalizado: </span>
                <span className="font-medium text-white ml-1">
                  {wallpaperSet ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="flex items-center text-gray-300">
                <User className="w-4 h-4 mr-2 text-blue-400" />
                <span>Avatar personalizado: </span>
                <span className="font-medium text-white ml-1">
                  {userProfile.avatar ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div
              className="flex items-center justify-between p-2 bg-gray-800 rounded-t cursor-pointer"
              onClick={() => toggleSection('shortcuts')}
            >
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-2 text-blue-400" />
                <span className="text-white">
                  Accesos Directos ({topLevelShortcuts.length})
                </span>
              </div>
              {expandedSections.has('shortcuts') ? (
                <ChevronDown className="w-4 h-4 text-gray-300" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-300" />
              )}
            </div>

            {expandedSections.has('shortcuts') && (
              <div className="p-2 bg-gray-800/30 rounded-b max-h-32 overflow-y-auto">
                {topLevelShortcuts.length > 0 ? (
                  topLevelShortcuts.map((shortcut) => renderShortcut(shortcut))
                ) : (
                  <div className="text-gray-400 text-sm py-1">
                    No se encontraron accesos directos
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-4">
            <div
              className="flex items-center justify-between p-2 bg-gray-800 rounded-t cursor-pointer"
              onClick={() => toggleSection('folders')}
            >
              <div className="flex items-center">
                <Folder className="w-4 h-4 mr-2 text-yellow-400" />
                <span className="text-white">
                  Carpetas ({topLevelFolders.length})
                </span>
              </div>
              {expandedSections.has('folders') ? (
                <ChevronDown className="w-4 h-4 text-gray-300" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-300" />
              )}
            </div>

            {expandedSections.has('folders') && (
              <div className="p-2 bg-gray-800/30 rounded-b max-h-48 overflow-y-auto">
                {topLevelFolders.length > 0 ? (
                  topLevelFolders.map((folder) => renderFolder(folder))
                ) : (
                  <div className="text-gray-400 text-sm py-1">
                    No se encontraron carpetas
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-4">
            <div
              className="flex items-center justify-between p-2 bg-gray-800 rounded-t cursor-pointer"
              onClick={() => toggleSection('settings')}
            >
              <div className="flex items-center">
                <Settings className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-white">
                  Configuración y Preferencias
                </span>
              </div>
              {expandedSections.has('settings') ? (
                <ChevronDown className="w-4 h-4 text-gray-300" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-300" />
              )}
            </div>

            {expandedSections.has('settings') && (
              <div className="p-2 bg-gray-800/30 rounded-b">
                <div className="flex items-center py-1 text-white text-sm">
                  <User className="w-4 h-4 mr-2 text-green-400" />
                  <span className="flex-1">Nombre de usuario:</span>
                  <span className="text-white">{userProfile.name}</span>
                </div>
                <div className="flex items-center py-1 text-white text-sm">
                  <Image className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="flex-1">Avatar personalizado:</span>
                  <span className="text-white">
                    {userProfile.avatar ? 'Configurado' : 'No configurado'}
                  </span>
                </div>
                <div className="flex items-center py-1 text-white text-sm">
                  <Image className="w-4 h-4 mr-2 text-pink-400" />
                  <span className="flex-1">Fondo de pantalla:</span>
                  <span className="text-white">
                    {wallpaperSet ? 'Personalizado' : 'Predeterminado'}
                  </span>
                </div>
                <div className="flex items-center py-1 text-white text-sm">
                  <Settings className="w-4 h-4 mr-2 text-purple-400" />
                  <span className="flex-1">Tema:</span>
                  <span className="text-white">{theme}</span>
                </div>
                <div className="flex items-center py-1 text-white text-sm">
                  <LayoutGrid className="w-4 h-4 mr-2 text-purple-400" />
                  <span className="flex-1">Diseño del escritorio:</span>
                  <span className="text-white">Configuración personalizada</span>
                </div>
              </div>
            )}
          </div>

          <div className="text-red-300 text-sm p-3 bg-red-900/40 rounded mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 mr-2 text-red-400 mt-0.5" />
              <div>
                <strong>Advertencia:</strong> Esta acción no se puede deshacer.
                Toda tu configuración de escritorio, accesos directos, carpetas y
                ajustes de personalización serán eliminados permanentemente y
                restablecidos a los valores predeterminados.
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 rounded-md text-white hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmReset}
              className="px-4 py-2 bg-red-600 rounded-md text-white hover:bg-red-700 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Restablecer Todos los Datos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetAllDataModal;
