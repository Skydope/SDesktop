import React, { useState, useRef } from 'react';
import { User, X, Upload, Camera, Trash2, Image, Settings } from 'lucide-react';

interface UserProfileModalProps {
  onClose: () => void;
  onSave: (profile: { name: string; avatar: string }) => void;
  userName?: string;
  userAvatar?: string;
  onWallpaperChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onWallpaperSelect?: (url: string) => void;
}

const predefinedWallpapers = [
  'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1920&q=80'
];

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  onClose,
  onSave,
  userName = 'Usuario',
  userAvatar = '',
  onWallpaperChange,
  onWallpaperSelect
}) => {
  const [name, setName] = useState(userName);
  const [avatar, setAvatar] = useState(userAvatar);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 'calc(50% - 250px)', y: 'calc(50% - 250px)' });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'profile' | 'wallpaper'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: `${e.clientX - dragOffset.x}px`,
        y: `${e.clientY - dragOffset.y}px`,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
  };

  const handleSave = () => {
    onSave({ name, avatar });
  };

  const handleWallpaperBrowseClick = () => {
    wallpaperInputRef.current?.click();
  };

  const renderProfileContent = () => {
    return (
      <>
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4 group">
            {avatar ? (
              <img 
                src={avatar} 
                alt="Avatar de Usuario" 
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-600"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <button 
                onClick={handleBrowseClick}
                className="text-white hover:text-blue-300 p-1"
                title="Cambiar avatar"
              >
                <Camera className="w-6 h-6" />
              </button>
              {avatar && (
                <button 
                  onClick={handleRemoveAvatar}
                  className="text-white hover:text-red-300 p-1"
                  title="Eliminar avatar"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />
          <div className="flex gap-2">
            <button 
              onClick={handleBrowseClick}
              className="bg-gray-800 hover:bg-gray-700 text-white text-sm rounded px-3 py-1.5 flex items-center"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Elegir imagen
            </button>
            {avatar && (
              <button 
                onClick={handleRemoveAvatar}
                className="bg-red-900/60 hover:bg-red-900 text-white text-sm rounded px-3 py-1.5 flex items-center"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Eliminar
              </button>
            )}
          </div>
        </div>

        {/* Nombre de usuario */}
        <div className="mb-6">
          <label className="block text-white text-sm font-medium mb-2">
            Nombre de Usuario
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingresa tu nombre"
          />
        </div>
      </>
    );
  };

  const renderWallpaperContent = () => {
    if (!onWallpaperChange || !onWallpaperSelect) return null;
    
    return (
      <>
        <h3 className="text-white font-medium mb-4 flex items-center text-sm">
          <Image className="w-4 h-4 mr-2" />
          Seleccionar Fondo de Pantalla
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {predefinedWallpapers.map((wallpaper, index) => (
            <button
              key={index}
              onClick={() => onWallpaperSelect(wallpaper)}
              className="h-28 rounded overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
            >
              <img
                src={wallpaper}
                alt={`Fondo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
        
        <label className="flex items-center gap-2 text-white cursor-pointer bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded w-full mb-4">
          <Upload className="w-4 h-4" />
          <span>Subir Fondo Personalizado</span>
          <input
            type="file"
            accept="image/*"
            ref={wallpaperInputRef}
            className="hidden"
            onChange={onWallpaperChange}
          />
        </label>
        
        <p className="text-gray-400 text-sm">
          Puedes seleccionar uno de los fondos predefinidos o subir tu propio archivo de imagen.
        </p>
      </>
    );
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div 
        className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-gray-700"
        style={{ 
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: '500px',
        }}
      >
        {/* Barra de título */}
        <div 
          className={`flex items-center justify-between px-4 py-2 bg-gray-800 ${isDragging ? 'cursor-grabbing' : 'cursor-move'}`} 
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center">
            <User className="w-4 h-4 text-white mr-2" />
            <h2 className="text-white text-sm font-medium">Configuración de Usuario</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-red-500 rounded p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'profile' 
                ? 'text-blue-400 border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              Perfil
            </div>
          </button>
          
          {onWallpaperChange && onWallpaperSelect && (
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'wallpaper' 
                  ? 'text-blue-400 border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('wallpaper')}
            >
              <div className="flex items-center">
                <Image className="w-4 h-4 mr-2" />
                Fondo de Pantalla
              </div>
            </button>
          )}
        </div>

        {/* Contenido del modal */}
        <div className="p-6">
          {activeTab === 'profile' ? renderProfileContent() : renderWallpaperContent()}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="bg-gray-800 hover:bg-gray-700 text-white rounded px-4 py-2"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;