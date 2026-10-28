import { useMediaStore } from '../store/useMediaStore'
import { useMediaDrag } from '../hooks/useMediaDrag'
import { MediaViewer } from './MediaViewer'
import type { MediaWindow as IMediaWindow } from '../store/useMediaStore'

interface MediaWindowProps {
  window: IMediaWindow
}

export function MediaWindow({ window: win }: MediaWindowProps) {
  const { removeWindow, bringToFront, toggleMinimize } = useMediaStore()
  const { onDragStart, onResizeStart } = useMediaDrag(win.id)

  const isYt = win.type === 'youtube'

  return (
    <div
      className="media-window"
      style={{
        position: 'absolute',
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.minimized ? 'auto' : win.height,
        zIndex: win.zIndex,
      }}
      onMouseDown={() => bringToFront(win.id)}
    >
      {/* Title bar */}
      <div
        className="media-window__titlebar"
        onMouseDown={(e) => onDragStart(e, win.x, win.y)}
      >
        {/* Traffic lights */}
        <div className="media-window__dots">
          <button
            className="media-window__dot media-window__dot--red"
            onClick={() => removeWindow(win.id)}
            aria-label="Cerrar"
          />
          <button
            className="media-window__dot media-window__dot--yellow"
            onClick={() => toggleMinimize(win.id)}
            aria-label="Minimizar"
          />
          <button
            className="media-window__dot media-window__dot--green"
            aria-label="Maximizar"
          />
        </div>

        <span className="media-window__title">{win.title}</span>

        <span
          className={`media-window__badge ${isYt ? 'media-window__badge--yt' : 'media-window__badge--img'}`}
        >
          {isYt ? 'YT' : 'IMG'}
        </span>
      </div>

      {/* Content */}
      {!win.minimized && (
        <div className="media-window__content">
          <MediaViewer window={win} />
        </div>
      )}

      {/* Resize handle */}
      {!win.minimized && (
        <div
          className="media-window__resize"
          onMouseDown={(e) => onResizeStart(e, win.width, win.height)}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
          >
            <path
              d="M9 1L1 9M9 5L5 9M9 9"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  )
}
