import React, { useEffect, useState } from 'react';
import { Cat, X, Folder, Maximize, Minimize } from 'lucide-react';
import { WindowState } from '../types/desktop';

interface TaskbarProps {
  openWindows: WindowState[];
  isStartMenuOpen: boolean;
  onStartMenuClick: () => void;
  onWindowClick: (window: WindowState) => void;
  onWindowClose: (windowId: string) => void;
  onWindowMinimize: (windowId: string) => void;
  onWindowMaximize: (windowId: string) => void;
}

const Taskbar: React.FC<TaskbarProps> = ({
  openWindows,
  isStartMenuOpen,
  onStartMenuClick,
  onWindowClick,
  onWindowClose,
  onWindowMinimize,
  onWindowMaximize,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      month: 'short',
      day: '2-digit',
    });
  };

  // Manejador para alternar entre minimizar y maximizar al hacer clic en la ventana
  const handleWindowClick = (window: WindowState) => {
    if (window.isMinimized) {
      onWindowMaximize(window.id);
    } else {
      onWindowMinimize(window.id);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gray-900/80 backdrop-blur-md flex items-center px-2 gap-2">
      <button
        onClick={onStartMenuClick}
        className={`p-2 rounded-lg transition-colors ${
          isStartMenuOpen ? 'bg-white/20' : 'hover:bg-white/10'
        }`}
      >
        <Cat className="w-10 h-6 text-white hover:text-red-500 hover:fill-yellow-500 transition-colors duration-200" />
      </button>

      <div className="h-full w-px bg-white/20" />

      <div className="flex-1 flex items-center gap-1 overflow-x-auto">
        {openWindows.map((window) => (
          <div
            key={window.id}
            onClick={() => handleWindowClick(window)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
              window.isActive && !window.isMinimized ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
            title={window.isMinimized ? "Restaurar" : "Minimizar"}
          >
            {window.icon ? (
              <img
                src={window.icon}
                alt={window.title}
                className="w-5 h-5 object-contain"
              />
            ) : (
              <Folder className="w-5 h-5 text-white" />
            )}

            <span className="text-white text-sm">{window.title}</span>
            
            {/* Indicador visual de minimizado/maximizado */}
            {window.isMinimized ? (
              <Maximize className="w-3 h-3 text-gray-400" />
            ) : (
              <Minimize className="w-3 h-3 text-gray-400" />
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWindowClose(window.id);
              }}
              className="p-1 rounded-full hover:bg-white/20"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ))}
      </div>

      {/* Fecha y hora */}
      <div className="flex flex-col items-end text-white text-xs ml-auto px-2 select-none">
        <span>{formatTime(time)}</span>
        <span>{formatDate(time)}</span>
      </div>
    </div>
  );
};

export default Taskbar;