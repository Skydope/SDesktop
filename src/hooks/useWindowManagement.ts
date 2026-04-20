import { useState, useCallback, useEffect } from 'react'

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

interface UseWindowManagementOptions {
  id: string
  initialPosition?: Position
  initialSize?: Size
  minSize?: Size
  maxSize?: Size
  onPositionChange?: (pos: Position) => void
  onSizeChange?: (size: Size) => void
  onBringToFront?: () => void
}

interface UseWindowManagementReturn {
  position: Position
  size: Size
  isDragging: boolean
  isResizing: boolean
  onDragStart: (e: React.MouseEvent, currentX: number, currentY: number) => void
  onResizeStart: (e: React.MouseEvent, currentWidth: number, currentHeight: number) => void
  onDragEnd: () => void
  onResizeEnd: () => void
}

export const useWindowManagement = (
  options: UseWindowManagementOptions
): UseWindowManagementReturn => {
  const {
    initialPosition = { x: 100, y: 100 },
    initialSize = { width: 700, height: 500 },
    minSize = { width: 320, height: 240 },
    onPositionChange,
    onSizeChange,
    onBringToFront,
  } = options

  const [position, setPosition] = useState<Position>(initialPosition)
  const [size, setSize] = useState<Size>(initialSize)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 })

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x
        const newY = e.clientY - dragOffset.y
        setPosition({ x: newX, y: newY })
        onPositionChange?.({ x: newX, y: newY })
      }
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        const newWidth = Math.max(minSize.width, resizeStart.w + deltaX)
        const newHeight = Math.max(minSize.height, resizeStart.h + deltaY)
        setSize({ width: newWidth, height: newHeight })
        onSizeChange?.({ width: newWidth, height: newHeight })
      }
    },
    [isDragging, isResizing, dragOffset, resizeStart, minSize, onPositionChange, onSizeChange]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  const onDragStart = useCallback(
    (e: React.MouseEvent, currentX: number, currentY: number) => {
      e.preventDefault()
      onBringToFront?.()
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - currentX,
        y: e.clientY - currentY,
      })
    },
    [onBringToFront]
  )

  const onResizeStart = useCallback(
    (e: React.MouseEvent, currentWidth: number, currentHeight: number) => {
      e.preventDefault()
      e.stopPropagation()
      onBringToFront?.()
      setIsResizing(true)
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        w: currentWidth,
        h: currentHeight,
      })
    },
    [onBringToFront]
  )

  const onDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const onResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  return {
    position,
    size,
    isDragging,
    isResizing,
    onDragStart,
    onResizeStart,
    onDragEnd,
    onResizeEnd,
  }
}