import React, { useState, useRef, useEffect } from 'react';
import { FolderItem, ShortcutItem } from '../types/desktop';
import { Folder, Link, MoreVertical, ExternalLink, Edit, Trash2, Settings } from 'lucide-react';

interface Props {
  item: ShortcutItem | FolderItem;
  onClick: () => void;
  onEdit?: (item: ShortcutItem | FolderItem) => void;
  onDelete?: (id: string) => void;
  onViewProperties?: (item: ShortcutItem | FolderItem) => void;
  className?: string;
}

const DesktopItem: React.FC<Props> = ({ 
  item, 
  onClick, 
  onEdit, 
  onDelete, 
  onViewProperties, 
  className = '' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isFolder = 'items' in item;

  // Cerrar el menú cuando se hace click fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el click llegue al DesktopItem
    setIsMenuOpen(prev => !prev);
  };

  const handleAction = (action: 'open' | 'edit' | 'delete' | 'properties', e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se propague el click
    setIsMenuOpen(false);

    switch (action) {
      case 'open':
        onClick();
        break;
      case 'edit':
        onEdit?.(item);
        break;
      case 'delete':
        onDelete?.(item.id);
        break;
      case 'properties':
        onViewProperties?.(item);
        break;
    }
  };

  return (
    <div
      className={`inline-block relative w-[100px] mx-1 my-1 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer 
                  hover:bg-white/20 active:scale-95 transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={onClick}
        role="button"
        tabIndex={0}
      >
        {isHovered && (
          <button
            ref={buttonRef}
            className="absolute top-0 right-0 p-1 bg-black/40 hover:bg-black/60 rounded-full transition-all"
            onClick={handleMenuToggle}
            aria-label="Opciones"
          >
            <MoreVertical className="w-4 h-4 text-white" />
          </button>
        )}

        <div className={`w-16 h-16 flex items-center justify-center rounded-lg ${
          isHovered ? 'scale-105' : ''
        }`}>
          {item.icon ? (
            <img src={item.icon} alt={item.title} className="w-12 h-12 object-contain" />
          ) : isFolder ? (
            <Folder className="w-12 h-12 text-yellow-400" />
          ) : (
            <Link className="w-12 h-12 text-blue-400" />
          )}
        </div>
        <span className="text-sm text-white text-center px-1 rounded max-w-full truncate text-shadow">
          {item.title}
        </span>
      </div>

      {/* Menú contextual */}
      {isMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute z-50 w-36 py-1 mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg"
          style={{ right: '-40px' }}
        >
          <button 
            onClick={(e) => handleAction('open', e)}
            className="flex items-center w-full px-3 py-2 text-sm text-white hover:bg-gray-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            <span>Abrir</span>
          </button>
          <button 
            onClick={(e) => handleAction('edit', e)}
            className="flex items-center w-full px-3 py-2 text-sm text-white hover:bg-gray-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            <span>Editar</span>
          </button>
          <button 
            onClick={(e) => handleAction('delete', e)}
            className="flex items-center w-full px-3 py-2 text-sm text-white hover:bg-gray-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            <span>Eliminar</span>
          </button>
          <button 
            onClick={(e) => handleAction('properties', e)}
            className="flex items-center w-full px-3 py-2 text-sm text-white hover:bg-gray-700"
          >
            <Settings className="w-4 h-4 mr-2" />
            <span>Propiedades</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DesktopItem;