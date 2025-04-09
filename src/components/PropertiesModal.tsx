import React, { useState } from 'react';
import { X, Calendar, FileIcon, Folder, Link2, User, Clock, FileCheck, MousePointer } from 'lucide-react';
import { ShortcutItem, FolderItem } from '../types/desktop';

interface PropertiesModalProps {
  item: ShortcutItem | FolderItem | null;
  onClose: () => void;
}

const PropertiesModal: React.FC<PropertiesModalProps> = ({ item, onClose }) => {
  if (!item) return null;
  
  const isShortcut = 'url' in item;
  const createdDate = new Date().toLocaleDateString();
  
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const getFolderStats = (folder: FolderItem) => {
    const countItems = folder.items.length;
    const countFolders = folder.items.filter(item => 'items' in item).length;
    const countShortcuts = countItems - countFolders;
    
    return { countItems, countFolders, countShortcuts };
  };
  
  const folderStats = !isShortcut ? getFolderStats(item as FolderItem) : null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg shadow-xl overflow-hidden w-96"
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y
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
          <h3 className="text-white font-medium">Propiedades: {item.title}</h3>
          <button onClick={onClose} className="text-white hover:bg-gray-700 rounded p-1">
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 mr-4 bg-gray-800 rounded-lg flex items-center justify-center">
              {item.icon ? (
                <img src={item.icon} alt={item.title} className="max-w-full max-h-full object-contain" />
              ) : (
                <Folder className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div>
              <h4 className="text-white font-medium">{item.title}</h4>
              <p className="text-gray-400 text-sm">{isShortcut ? 'Acceso directo' : 'Carpeta'}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="text-gray-300 space-y-2">
              <div className="flex items-center">
                <FileIcon className="w-4 h-4 mr-3 text-gray-400" />
                <span className="text-gray-400 mr-2">Tipo:</span>
                <span>{isShortcut ? 'Acceso directo' : 'Carpeta'}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                <span className="text-gray-400 mr-2">Creado:</span>
                <span>{createdDate}</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-3 text-gray-400" />
                <span className="text-gray-400 mr-2">Modificado:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              
              {/* Nuevo bloque para mostrar el contador de clics */}
              <div className="flex items-center">
                <MousePointer className="w-4 h-4 mr-3 text-gray-400" />
                <span className="text-gray-400 mr-2">Veces usado:</span>
                <span>{item.clickCount || 0}</span>
              </div>
              
              {isShortcut && (
                <div className="flex items-start">
                  <Link2 className="w-4 h-4 mr-3 mt-1 text-gray-400" />
                  <span className="text-gray-400 mr-2">URL:</span>
                  <span className="text-blue-400 break-all">{(item as ShortcutItem).url}</span>
                </div>
              )}
              
              {!isShortcut && folderStats && (
                <>
                  <div className="flex items-center">
                    <FileCheck className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="text-gray-400 mr-2">Contenido:</span>
                    <span>{folderStats.countItems} elementos</span>
                  </div>
                  
                  <div className="pl-7">
                    <div>{folderStats.countFolders} carpetas</div>
                    <div>{folderStats.countShortcuts} accesos directos</div>
                  </div>
                </>
              )}
              
              <div className="flex items-center">
                <User className="w-4 h-4 mr-3 text-gray-400" />
                <span className="text-gray-400 mr-2">ID:</span>
                <span className="text-xs">{item.id}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesModal;