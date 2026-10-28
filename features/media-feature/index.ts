// Barrel exports — import what you need
export { MediaDesktop } from './components/MediaDesktop'
export { MediaWindow } from './components/MediaWindow'
export { AddMediaModal } from './components/AddMediaModal'
export { MediaViewer } from './components/MediaViewer'
export { useMediaStore, getYouTubeId } from './store/useMediaStore'
export { useMediaDrag } from './hooks/useMediaDrag'
export type { MediaWindow as IMediaWindow, MediaType } from './store/useMediaStore'

// Don't forget to import the CSS in your app entry point:
// import './media-feature/media-feature.css'
