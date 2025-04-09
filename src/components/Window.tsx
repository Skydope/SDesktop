import React, { useState, useEffect } from 'react';
import { X, Minus, FolderPlus, Link, ChevronRight, Home, Folder, ChevronDown, ChevronUp, Globe, Maximize } from 'lucide-react';
import { FolderItem, ShortcutItem } from '../types/desktop';
import DesktopItem from './DesktopItem';
import AddShortcutModal from './AddShortcutModal';

interface WindowProps {
  window: {
    id: string;
    title: string;
    icon: string;
    content: FolderItem;
    isActive: boolean;
    isMinimized: boolean; // Nueva propiedad para controlar el estado de minimización
  };
  onClose: (id: string) => void;
  onMinimize: (id: string) => void; // Nueva función para minimizar
  onMaximize: (id: string) => void; // Nueva función para maximizar
  onAddItemToFolder?: (folderId: string, item: ShortcutItem | FolderItem) => void;
  onItemClick?: (item: ShortcutItem | FolderItem, parentFolderId: string) => void;
  onEditItem?: (item: ShortcutItem | FolderItem) => void;
  onDeleteItem?: (itemId: string, parentFolderId: string) => void;
  onViewProperties?: (item: ShortcutItem | FolderItem) => void;
}

interface PathItem {
  id: string;
  title: string;
}

const Window: React.FC<WindowProps> = ({
  window,
  onClose,
  onMinimize,
  onMaximize,
  onAddItemToFolder,
  onItemClick,
  onEditItem,
  onDeleteItem,
  onViewProperties,
}) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([window.id]));
  const [showAddShortcutModal, setShowAddShortcutModal] = useState(false);

  // Store only IDs and titles in the path
  const [navigationPath, setNavigationPath] = useState<PathItem[]>([
    { id: window.id, title: window.title },
  ]);

  // Find the current folder based on the path and window.content
  const findFolderByPath = (rootFolder: FolderItem, path: PathItem[]): FolderItem => {
    if (path.length === 1) return rootFolder;
    
    let currentFolder = rootFolder;
    // Start from index 1 because index 0 is the root folder
    for (let i = 1; i < path.length; i++) {
      const targetId = path[i].id;
      const foundFolder = currentFolder.items.find(
        item => item.id === targetId && 'items' in item
      ) as FolderItem;
      
      if (foundFolder) {
        currentFolder = foundFolder;
      } else {
        // If folder not found, return the last valid folder
        console.warn(`Folder with id ${targetId} not found`);
        return currentFolder;
      }
    }
    
    return currentFolder;
  };

  // Get current folder dynamically based on the path
  const currentFolder = findFolderByPath(window.content, navigationPath);

  useEffect(() => {
    // Reset navigation when window changes, but keep expanded state
    if (navigationPath[0]?.id !== window.id) {
      setNavigationPath([
        { id: window.id, title: window.title },
      ]);
      setExpandedFolders(new Set([window.id]));
    }
  }, [window.id, window.title]);

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

  const handleAddFolder = () => {
    if (onAddItemToFolder) {
      const newFolder: FolderItem = {
        id: crypto.randomUUID(),
        title: 'Nueva Carpeta',
        icon: '',
        items: [],
        clickCount: 0,
      };
      onAddItemToFolder(currentFolder.id, newFolder);
      setShowAddMenu(false);
    }
  };

  const handleAddShortcut = () => {
    setShowAddShortcutModal(true);
    setShowAddMenu(false);
  };

  const handleSaveShortcut = (shortcut: { title: string; url: string; icon: string }) => {
    if (onAddItemToFolder) {
      const newShortcut: ShortcutItem = {
        id: crypto.randomUUID(),
        ...shortcut,
        clickCount: 0,
      };
      onAddItemToFolder(currentFolder.id, newShortcut);
    }
  };

  const handleItemClick = (item: ShortcutItem | FolderItem) => {
    // If it's a shortcut (has URL), open in new tab
    if ('url' in item) {
      // Use document.defaultView to get the window object
      const browserWindow = document.defaultView || window;
      browserWindow.open(item.url, '_blank');
      
      // Also call onItemClick to increment click count if needed
      if (onItemClick) {
        onItemClick(item, currentFolder.id);
      }
      return;
    }
    
    // If it's a folder, navigate to it
    if ('items' in item) {
      const folderItem = item as FolderItem;
      setNavigationPath(prev => [
        ...prev,
        { id: folderItem.id, title: folderItem.title },
      ]);
      
      // Auto-expand the folder in the tree view
      setExpandedFolders(prev => {
        const next = new Set(prev);
        next.add(folderItem.id);
        return next;
      });
      
      // Call onItemClick to register the click in parent component
      if (onItemClick) {
        onItemClick(item, currentFolder.id);
      }
    }
  };

  const navigateToFolder = (index: number) => {
    if (index >= navigationPath.length) return;
    setNavigationPath(navigationPath.slice(0, index + 1));
  };

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking expand/collapse
    
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

  // Build folder tree recursively with expanded/collapsed state
  const renderTreeItem = (
    item: ShortcutItem | FolderItem,
    depth = 0,
    currentPath: PathItem[] = []
  ) => {
    const isFolder = 'items' in item;
    const isExpanded = isFolder && expandedFolders.has(item.id);
    const isActive = currentFolder.id === item.id;
    const itemPath = [...currentPath, { id: item.id, title: item.title }];
    
    return (
      <div key={item.id} className="w-full">
        <div
          className={`flex items-center px-2 py-1 text-sm ${
            isActive ? 'bg-blue-600/30 text-blue-200' : 'hover:bg-gray-700/50'
          } cursor-pointer rounded`}
          style={{ paddingLeft: `${(depth * 12) + 8}px` }}
          onClick={() => {
            if (isFolder) {
              setNavigationPath(itemPath);
            } else if ('url' in item) {
              const browserWindow = document.defaultView || window;
              browserWindow.open(item.url, '_blank');
            }
          }}
        >
          {isFolder && (
            <button 
              className="mr-1 p-1 rounded hover:bg-gray-600/50"
              onClick={(e) => toggleFolderExpand(item.id, e)}
            >
              {isExpanded ? 
                <ChevronDown className="w-3 h-3 text-gray-300" /> : 
                <ChevronRight className="w-3 h-3 text-gray-300" />
              }
            </button>
          )}
          
          {isFolder ? (
            <Folder className="w-4 h-4 mr-1 flex-shrink-0 text-white" />
          ) : (
            <Globe className="w-3.5 h-3.5 mr-1 flex-shrink-0 text-blue-300" />
          )}
          
          <span className="truncate text-white">{item.title}</span>
        </div>
        
        {isFolder && isExpanded && (item as FolderItem).items.map(childItem => 
          renderTreeItem(childItem, depth + 1, itemPath)
        )}
      </div>
    );
  };

  // No renderizar la ventana si está minimizada
  if (window.isMinimized) return null;

  return (
    <div
      className="absolute bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden z-10"
      style={{
        left: position.x,
        top: position.y,
        width: '700px',
        height: '500px',
        zIndex: window.isActive ? 20 : 10,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className={`flex items-center justify-between px-4 py-2 bg-gray-800/50 ${isDragging ? 'cursor-grabbing' : 'cursor-move'}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <img src={window.icon || ''} alt="" className="w-4 h-4" />
          <span className="text-white text-sm">{window.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSidebar(!showSidebar)} className="p-1 hover:bg-white/10 rounded">
            <span className="text-xs text-white">&#9776;</span>
          </button>
          <div className="relative">
            <button onClick={() => setShowAddMenu(!showAddMenu)} className="p-1 hover:bg-white/10 rounded">
              <FolderPlus className="w-4 h-4 text-white" />
            </button>
            {showAddMenu && (
              <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 w-36">
                <button onClick={handleAddFolder} className="flex items-center w-full px-3 py-2 text-sm text-white hover:bg-gray-700">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  <span>Nueva Carpeta</span>
                </button>
                <button onClick={handleAddShortcut} className="flex items-center w-full px-3 py-2 text-sm text-white hover:bg-gray-700">
                  <Link className="w-4 h-4 mr-2" />
                  <span>Nuevo Acceso</span>
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={() => onMinimize(window.id)} 
            className="p-1 hover:bg-white/10 rounded"
            title="Minimizar"
          >
            <Minus className="w-4 h-4 text-white" />
          </button>
          <button 
            onClick={() => onClose(window.id)} 
            className="p-1 hover:bg-white/10 rounded"
            title="Cerrar"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="flex items-center px-4 py-2 bg-gray-800/30 border-b border-gray-700">
        <button className="p-1 hover:bg-gray-700/50 rounded mr-1" onClick={() => navigateToFolder(0)}>
          <Home className="w-4 h-4 text-gray-300" />
        </button>
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          {navigationPath.map((pathItem, index) => (
            <React.Fragment key={pathItem.id}>
              {index > 0 && (
                <ChevronRight className="w-3 h-3 text-gray-400 mx-1 flex-shrink-0" />
              )}
              <button
                className={`px-2 py-1 rounded text-sm whitespace-nowrap ${
                  index === navigationPath.length - 1
                    ? 'text-blue-300 font-medium'
                    : 'text-gray-300 hover:bg-gray-700/50'
                }`}
                onClick={() => navigateToFolder(index)}
              >
                {pathItem.title}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex h-[calc(100%-80px)]">
        {showSidebar && (
          <div className="w-56 border-r border-gray-700 overflow-y-auto p-2 bg-gray-800/30">
            {renderTreeItem(window.content, 0, [{ id: window.id, title: window.title }])}
          </div>
        )}

        <div className={`${showSidebar ? 'w-[calc(100%-224px)]' : 'w-full'} overflow-y-auto`}>
          <div className="p-4 grid grid-cols-5 gap-2">
            {currentFolder.items.map(item => (
              <DesktopItem
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
                onEdit={onEditItem ? () => onEditItem(item) : undefined}
                onDelete={onDeleteItem ? () => onDeleteItem(item.id, currentFolder.id) : undefined}
                onViewProperties={onViewProperties ? () => onViewProperties(item) : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {showAddShortcutModal && (
        <AddShortcutModal
          onClose={() => setShowAddShortcutModal(false)}
          onSave={handleSaveShortcut}
        />
      )}
    </div>
  );
};

export default Window;