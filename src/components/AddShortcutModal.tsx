import React, { useState } from 'react';
import { X } from 'lucide-react';
import { getFaviconUrl } from '../utils/favicon';

interface AddShortcutModalProps {
  onClose: () => void;
  onSave: (shortcut: { title: string; url: string; icon: string }) => void;
}

const AddShortcutModal: React.FC<AddShortcutModalProps> = ({ onClose, onSave }) => {
  const [shortcut, setShortcut] = useState({ title: '', url: '', icon: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setShortcut({ ...shortcut, url });
    
    // Auto-extract title from URL if title is empty
    if (!shortcut.title && url) {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        const capitalizedDomain = domain.charAt(0).toUpperCase() + domain.slice(1);
        setShortcut(prev => ({ ...prev, title: capitalizedDomain }));
      } catch (error) {
        // Invalid URL, do nothing
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Only fetch favicon if not already set
      if (!shortcut.icon && shortcut.url) {
        const favicon = await getFaviconUrl(shortcut.url);
        setShortcut(prev => ({ ...prev, icon: favicon }));
        await onSave({ ...shortcut, icon: favicon });
      } else {
        await onSave(shortcut);
      }
      onClose();
    } catch (error) {
      console.error('Error saving shortcut:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-96 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
          <h3 className="text-white font-medium">Add New Shortcut</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          <div>
            <label className="text-white text-sm mb-1 block">Title</label>
            <input
              type="text"
              value={shortcut.title}
              onChange={(e) => setShortcut({ ...shortcut, title: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              placeholder="Google"
              required
            />
          </div>
          
          <label className="text-white text-sm mb-1 block">URL</label>
  <div className="flex items-center gap-2">
    <input
      type="url"
      value={shortcut.url}
      onChange={handleUrlChange}
      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
      placeholder="https://google.com"
      required
    />
   <button
  type="button"
  onClick={async () => {
    try {
      const text = await navigator.clipboard.readText();
      // Validar si es una URL
      try {
        const url = new URL(text);
        handleUrlChange({ target: { value: url.toString() } });
      } catch {
        alert("El texto en el portapapeles no es una URL válida.");
      }
    } catch (err) {
      console.error("Error al leer el portapapeles:", err);
      alert("Hubo un error al acceder al portapapeles.");
    }
  }}
  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
>
  Pegar
</button>
  </div>
          
          <div>
            <label className="text-white text-sm mb-1 block">Icon URL (optional)</label>
            <input
              type="url"
              value={shortcut.icon}
              onChange={(e) => setShortcut({ ...shortcut, icon: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              placeholder="Leave empty to auto-detect"
            />
            {shortcut.url && !shortcut.icon && (
              <p className="text-gray-400 text-xs mt-1">
                Icon will be automatically fetched from the website
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white bg-gray-700 hover:bg-gray-600 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-500 rounded flex items-center gap-2"
            >
              {isLoading ? 'Adding...' : 'Add Shortcut'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddShortcutModal;