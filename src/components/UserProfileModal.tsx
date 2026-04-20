import React, { useState, useRef } from 'react'
import { User, X, Upload, Camera, Trash2 } from 'lucide-react'

interface UserProfileModalProps {
  onClose: () => void
  onSave: (profile: { name: string; avatar: string }) => void
  userName?: string
  userAvatar?: string
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  onClose,
  onSave,
  userName = 'Usuario',
  userAvatar = '',
}) => {
  const [name, setName] = useState(userName)
  const [avatar, setAvatar] = useState(userAvatar)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatar('')
  }

  const handleSave = () => {
    onSave({ name, avatar })
  }

  return (
    <div className="os-modal-overlay" onClick={onClose}>
      <div className="os-modal os-modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="os-modal__header">
          <h3 className="os-modal__title">Configuración de Usuario</h3>
          <button className="os-btn os-btn--icon" onClick={onClose}>
            <X className="os-icon" />
          </button>
        </div>

        <div className="os-profile-modal__content">
          {/* Avatar section */}
          <div className="os-profile-modal__avatar-section">
            <div className="os-profile-modal__avatar-wrapper">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="os-profile-modal__avatar-img" />
              ) : (
                <div className="os-profile-modal__avatar-placeholder">
                  <User className="os-icon" style={{ width: 48, height: 48 }} />
                </div>
              )}
              <div className="os-profile-modal__avatar-overlay">
                <button onClick={() => fileInputRef.current?.click()} className="os-btn os-btn--icon os-btn--icon-overlay">
                  <Camera className="os-icon os-icon--sm" />
                </button>
                {avatar && (
                  <button onClick={handleRemoveAvatar} className="os-btn os-btn--icon os-btn--icon-overlay">
                    <Trash2 className="os-icon os-icon--sm" />
                  </button>
                )}
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <div className="os-profile-modal__avatar-btns">
              <button className="os-btn os-btn--secondary os-btn--sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="os-icon os-icon--sm" />
                Elegir imagen
              </button>
            </div>
          </div>

          {/* Form section */}
          <div className="os-form-group">
            <label className="os-form-label">Nombre de Usuario</label>
            <input
              type="text"
              className="os-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingresa tu nombre"
            />
          </div>
        </div>

        <div className="os-modal__actions">
          <button className="os-btn os-btn--secondary" onClick={onClose}>Cancelar</button>
          <button className="os-btn os-btn--primary" onClick={handleSave}>Guardar Cambios</button>
        </div>
      </div>
    </div>
  )
}

export default UserProfileModal