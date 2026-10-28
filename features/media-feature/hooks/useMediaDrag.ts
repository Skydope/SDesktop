import { useCallback, useRef } from 'react'
import { useMediaStore } from '../store/useMediaStore'

interface DragState {
  startX: number
  startY: number
  originX: number
  originY: number
}

interface ResizeState {
  startX: number
  startY: number
  originW: number
  originH: number
}

export function useMediaDrag(id: string) {
  const updatePosition = useMediaStore((s) => s.updatePosition)
  const updateSize = useMediaStore((s) => s.updateSize)
  const bringToFront = useMediaStore((s) => s.bringToFront)

  const drag = useRef<DragState | null>(null)
  const resize = useRef<ResizeState | null>(null)

  const onDragStart = useCallback(
    (e: React.MouseEvent, currentX: number, currentY: number) => {
      e.preventDefault()
      bringToFront(id)
      drag.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: currentX,
        originY: currentY,
      }

      const onMove = (ev: MouseEvent) => {
        if (!drag.current) return
        const dx = ev.clientX - drag.current.startX
        const dy = ev.clientY - drag.current.startY
        updatePosition(
          id,
          Math.max(0, drag.current.originX + dx),
          Math.max(0, drag.current.originY + dy)
        )
      }

      const onUp = () => {
        drag.current = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [id, updatePosition, bringToFront]
  )

  const onResizeStart = useCallback(
    (
      e: React.MouseEvent,
      currentW: number,
      currentH: number
    ) => {
      e.preventDefault()
      e.stopPropagation()
      resize.current = {
        startX: e.clientX,
        startY: e.clientY,
        originW: currentW,
        originH: currentH,
      }

      const onMove = (ev: MouseEvent) => {
        if (!resize.current) return
        const dx = ev.clientX - resize.current.startX
        const dy = ev.clientY - resize.current.startY
        updateSize(
          id,
          Math.max(260, resize.current.originW + dx),
          Math.max(180, resize.current.originH + dy)
        )
      }

      const onUp = () => {
        resize.current = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [id, updateSize]
  )

  return { onDragStart, onResizeStart }
}
