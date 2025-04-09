import React, { useState } from 'react';
import { X, AlertTriangle, Folder, Globe, ChevronRight, ChevronDown } from 'lucide-react';
import { ShortcutItem, FolderItem } from '../types/desktop';

interface DeleteModalProps {
  item: ShortcutItem | FolderItem | null;
  onClose: () => void;
  onConfirmDelete: (itemId: string) => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ item, onClose, onConfirmDelete }) => {
  const [position, setPosition] = useState({ x: 200, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  if (!item) return null;
  
  const isFolder = 'items' in item;
  const hasItems = isFolder && (item as FolderItem).items.length > 0;
  
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
  
  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };
  
  const countContents = (folder: FolderItem): { folders: number, shortcuts: number } => {
    let folders = 0;
    let shortcuts = 0;
    
    for (const item of folder.items) {
      if ('items' in item) {
        folders++;
        const subCounts = countContents(item as FolderItem);
        folders += subCounts.folders;
        shortcuts += subCounts.shortcuts;
      } else {
        shortcuts++;
      }
    }
    
    return { folders, shortcuts };
  };
  
  const renderFolderTree = (folderItem: FolderItem, depth = 0) => {
    const isExpanded = expandedFolders.has(folderItem.id);
    
    return (
      <div key={folderItem.id} className="w-full">
        <div 
          className="flex items-center py-1 text-white text-sm hover:bg-gray-700/50 rounded"
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          {folderItem.items.length > 0 ? (
            <button
              className="p-1 rounded hover:bg-gray-600/50"
              onClick={(e) => toggleFolder(folderItem.id, e)}
            >
              {isExpanded ? 
                <ChevronDown className="w-3 h-3 text-gray-300" /> : 
                <ChevronRight className="w-3 h-3 text-gray-300" />
              }
            </button>
          ) : (
            <span className="w-5"></span>
          )}
          
          <Folder className="w-4 h-4 mr-2 text-yellow-400" />
          <span className="truncate">{folderItem.title}</span>
          <span className="text-gray-400 text-xs ml-2">({folderItem.items.length} elementos)</span>
        </div>
        
        {isExpanded && folderItem.items.map(subItem => (
          'items' in subItem ? 
            renderFolderTree(subItem as FolderItem, depth + 1) :
            <div 
              key={subItem.id} 
              className="flex items-center py-1 text-white text-sm hover:bg-gray-700/50 rounded"
              style={{ paddingLeft: `${(depth + 1) * 12 + 5}px` }}
            >
              <Globe className="w-4 h-4 mr-2 text-blue-400" />
              <span className="truncate">{subItem.title} ({subItem.url})</span>
            </div>
        ))}
      </div>
    );
  };
  
  let contentCount;
  if (hasItems) {
    contentCount = countContents(item as FolderItem);
  }

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
          <h3 className="text-white font-medium">Confirmar eliminación</h3>
          <button onClick={onClose} className="text-white hover:bg-gray-700 rounded p-1">
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="text-yellow-500 w-6 h-6 mr-3" />
            <h4 className="text-white font-medium text-lg">¿Estás seguro?</h4>
          </div>
          
          <div className="mb-4">
            {isFolder ? (
              hasItems ? (
                <p className="text-gray-300">
                  Estás a punto de eliminar la carpeta <span className="font-medium text-white">{item.title}</span> y todo su contenido:
                </p>
              ) : (
                <p className="text-gray-300">
                  Estás a punto de eliminar la carpeta vacía <span className="font-medium text-white">{item.title}</span>.
                </p>
              )
            ) : (
              <p className="text-gray-300">
                Estás a punto de eliminar el acceso directo <span className="font-medium text-white">{item.title}</span>.
                Con su URL de destino: <span className="font-medium text-blue-400">{item.url}</span>.
                <br />
              </p>
              
            )}
          </div>
          
          {hasItems && (
            <div className="mb-4">
              <div className="mb-2 text-gray-300 text-sm">
                Esta carpeta contiene:
                <ul className="list-disc ml-5 mt-1">
                  <li>{contentCount.folders} carpetas</li>
                  <li>{contentCount.shortcuts} accesos directos</li>
                </ul>
              </div>
              
              <div className="mt-3 bg-gray-800 rounded p-2 max-h-48 overflow-y-auto">
                {renderFolderTree(item as FolderItem)}
              </div>
            </div>
          )}
          
          <div className="text-gray-300 text-sm mb-4">
            Esta acción no se puede deshacer.
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
              onClick={() => {
                onConfirmDelete(item.id);
                onClose();
              }}
              className="px-4 py-2 bg-red-600 rounded-md text-white hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;