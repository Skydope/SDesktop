import { useState, useCallback } from 'react';

interface UseDraggableOptions {
  initialPosition?: { x: number; y: number };
  boundary?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
}

interface UseDraggableReturn {
  position: { x: number; y: number };
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
}

export const useDraggable = (
  options: UseDraggableOptions = {}
): UseDraggableReturn => {
  const { initialPosition = { x: 100, y: 100 }, boundary } = options;

  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [position.x, position.y]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      if (boundary) {
        if (boundary.minX !== undefined) newX = Math.max(newX, boundary.minX);
        if (boundary.maxX !== undefined) newX = Math.min(newX, boundary.maxX);
        if (boundary.minY !== undefined) newY = Math.max(newY, boundary.minY);
        if (boundary.maxY !== undefined) newY = Math.min(newY, boundary.maxY);
      }

      setPosition({ x: newX, y: newY });
    },
    [isDragging, dragOffset, boundary]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    position,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  };
};
