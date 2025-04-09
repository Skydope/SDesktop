import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ShortcutItem, FolderItem } from '../types/desktop';
import { getFaviconUrl } from '../utils/favicon';

interface EditModalProps {
  item: ShortcutItem | FolderItem | null;
  onClose: () => void;
  onSave: (updatedItem: ShortcutItem | FolderItem) => void;
}

const EditModal: React.FC<EditModalProps> = ({ item, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('');
  const [customIcon, setCustomIcon] = useState(false);
  const [iconPreview, setIconPreview] = useState('');
  const isShortcut = item && 'url' in item;

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setIcon(item.icon);
      setIconPreview(item.icon);
      
      if (isShortcut) {
        setUrl((item as ShortcutItem).url);
      }
    }
  }, [item]);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setIcon(result);
        setIconPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFetchFavicon = async () => {
    if (!url) return;
    
    try {
      const favicon = await getFaviconUrl(url);
      setIcon(favicon);
      setIconPreview(favicon);
    } catch (error) {
      console.error('Error fetching favicon:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item) return;
    
    if (isShortcut) {
      onSave({
        ...item as ShortcutItem,
        title,
        url,
        icon,
        // Preservamos el contador de clics, si no existe, lo inicializamos en 0
        clickCount: (item as ShortcutItem).clickCount || 0
      });
    } else {
      onSave({
        ...item as FolderItem,
        title,
        icon,
        // Preservamos el contador de clics, si no existe, lo inicializamos en 0
        clickCount: (item as FolderItem).clickCount || 0
      });
    }
    
    onClose();
  };

  if (!item) return null;

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
          <h3 className="text-white font-medium">Editar {isShortcut ? 'Acceso directo' : 'Carpeta'}</h3>
          <button onClick={onClose} className="text-white hover:bg-gray-700 rounded p-1">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 flex items-center justify-center bg-gray-800 rounded-lg overflow-hidden">
              {iconPreview ? (
                <img src={iconPreview} alt="Icon preview" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="text-gray-400 text-xs text-center">Sin icono</div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              required
            />
          </div>
          
          {isShortcut && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">URL</label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  required
                />
                <button 
                  type="button" 
                  onClick={handleFetchFavicon}
                  className="px-3 py-2 bg-blue-600 rounded-md text-white text-sm hover:bg-blue-700"
                >
                  Obtener favicon
                </button>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Icono</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={customIcon}
                onChange={(e) => setCustomIcon(e.target.checked)}
                id="custom-icon"
                className="rounded bg-gray-800 border-gray-700 text-blue-600"
              />
              <label htmlFor="custom-icon" className="text-sm text-gray-300">Usar icono personalizado</label>
            </div>
            
            {customIcon && (
              <input
                type="file"
                accept="image/*"
                onChange={handleIconChange}
                className="mt-2 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
              />
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 rounded-md text-white hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;