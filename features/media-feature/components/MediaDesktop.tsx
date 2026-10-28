import { useState } from 'react'
import { useMediaStore } from '../store/useMediaStore'
import { MediaWindow } from './MediaWindow'
import { AddMediaModal } from './AddMediaModal'

/**
 * MediaDesktop — drop this anywhere inside your OS desktop area.
 *
 * It renders all floating media windows and the "Add media" trigger button.
 * The button can be replaced by calling `addWindow` from the store directly
 * (e.g., from a dock icon or context menu).
 */
export function MediaDesktop() {
  const windows = useMediaStore((s) => s.windows)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      {/* Floating windows */}
      {windows.map((win) => (
        <MediaWindow key={win.id} window={win} />
      ))}

      {/* Trigger — replace/move this to your dock or context menu */}
      <button
        className="media-add-trigger"
        onClick={() => setModalOpen(true)}
        aria-label="Agregar imagen o video"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <path d="M8 1v14M1 8h14" />
        </svg>
        Agregar media
      </button>

      <AddMediaModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
