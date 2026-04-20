import React from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useToastStore, Toast } from '../hooks/useToast'

const ToastIcon: React.FC<{ type: Toast['type'] }> = ({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircle style={{ color: 'rgba(34, 197, 94, 0.85)' }} />
    case 'error':
      return <AlertCircle style={{ color: 'rgba(239, 68, 68, 0.85)' }} />
    case 'warning':
      return <AlertTriangle style={{ color: 'rgba(234, 179, 8, 0.85)' }} />
    case 'info':
    default:
      return <Info style={{ color: 'rgba(59, 130, 246, 0.85)' }} />
  }
}

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const removeToast = useToastStore((s) => s.removeToast)

  return (
    <div className="os-toast">
      <ToastIcon type={toast.type} />
      <div className="os-toast__body">
        <p className="os-toast__title">{toast.title}</p>
        {toast.message && <p className="os-toast__message">{toast.message}</p>}
      </div>
      <button
        className="os-btn os-btn--icon os-toast__close"
        onClick={() => removeToast(toast.id)}
      >
        <X className="os-icon os-icon--sm" />
      </button>
    </div>
  )
}

const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="os-toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

export default ToastContainer