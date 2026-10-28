import React, { useState, useEffect } from 'react'
import {
  Folder,
  File,
  ChevronRight,
  Home,
  ArrowLeft,
  List,
  Grid3X3,
  Search,
  FileText,
  Image,
  Music,
  Video,
  Archive,
} from 'lucide-react'
import { vfs } from '../../vfs'
import type { VFSNode } from '../../vfs/types'

type ViewMode = 'icon' | 'list'

const getIcon = (node: VFSNode) => {
  if (node.type === 'folder') return Folder
  if (node.type === 'symlink') return ChevronRight

  const ext = node.name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'txt':
    case 'md':
    case 'json':
    case 'js':
    case 'ts':
    case 'css':
    case 'html':
      return FileText
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return Image
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
      return Music
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'mkv':
      return Video
    case 'zip':
    case 'tar':
    case 'gz':
    case 'rar':
    case '7z':
      return Archive
    default:
      return File
  }
}

interface FinderContentProps {
  initialPath?: string
}

const compareEntries = (a: VFSNode, b: VFSNode): number => {
  if (a.type === 'folder' && b.type !== 'folder') return -1
  if (a.type !== 'folder' && b.type === 'folder') return 1
  return a.name.localeCompare(b.name)
}

const FinderContent: React.FC<FinderContentProps> = ({ initialPath = '/Users/guest' }) => {
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [entries, setEntries] = useState<VFSNode[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('icon')
  const [searchQuery, setSearchQuery] = useState('')
  const [pathHistory, setPathHistory] = useState<string[]>([initialPath])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      let sorted: VFSNode[]
      try {
        sorted = (await vfs.readdir(currentPath)).sort(compareEntries)
      } catch {
        sorted = []
      }
      // Navegar rapido puede resolver dos readdir fuera de orden; el ultimo
      // path pedido es el que manda.
      if (cancelled) return
      setEntries(sorted)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [currentPath])

  const navigateTo = (path: string) => {
    setPathHistory(prev => [...prev, path])
    setCurrentPath(path)
    setSearchQuery('')
  }

  const goBack = () => {
    if (pathHistory.length <= 1) return
    const newHistory = pathHistory.slice(0, -1)
    setPathHistory(newHistory)
    setCurrentPath(newHistory[newHistory.length - 1])
  }

  const goHome = () => {
    navigateTo('/Users/guest')
  }

  const pathParts = currentPath.split('/').filter(Boolean)

  const filteredEntries = searchQuery
    ? entries.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : entries

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleItemClick = async (node: VFSNode) => {
    if (node.type === 'folder') {
      navigateTo(node.id)
    }
  }

  return (
    <div className="os-finder">
      <div className="os-finder__toolbar">
        <div className="os-finder__nav">
          <button
            className="os-finder__nav-btn"
            onClick={goBack}
            disabled={pathHistory.length <= 1}
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            className="os-finder__nav-btn"
            onClick={goHome}
            title="Home"
          >
            <Home size={16} />
          </button>
        </div>

        <div className="os-finder__path">
          {pathParts.map((part, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={12} className="os-finder__path-sep" />}
              <button
                className={`os-finder__path-part ${i === pathParts.length - 1 ? 'os-finder__path-part--active' : ''}`}
                onClick={() => navigateTo('/' + pathParts.slice(0, i + 1).join('/'))}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="os-finder__actions">
          <div className="os-finder__search">
            <Search size={14} className="os-finder__search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="os-finder__search-input"
            />
          </div>
          <button
            className={`os-finder__view-btn ${viewMode === 'icon' ? 'os-finder__view-btn--active' : ''}`}
            onClick={() => setViewMode('icon')}
            title="Icon view"
          >
            <Grid3X3 size={16} />
          </button>
          <button
            className={`os-finder__view-btn ${viewMode === 'list' ? 'os-finder__view-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      <div className="os-finder__content">
        {loading ? (
          <div className="os-finder__loading">Loading...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="os-finder__empty">
            {searchQuery ? 'No results found' : 'This folder is empty'}
          </div>
        ) : viewMode === 'icon' ? (
          <div className="os-finder__grid">
            {filteredEntries.map(entry => {
              const IconComponent = getIcon(entry)
              return (
                <div
                  key={entry.id}
                  className="os-finder__item"
                  onClick={() => handleItemClick(entry)}
                  title={`${entry.name}${entry.type === 'folder' ? '' : ` — ${formatSize(entry.size)}`}`}
                >
                  <div className="os-finder__item-icon">
                    <IconComponent size={48} />
                  </div>
                  <span className="os-finder__item-name">{entry.name}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="os-finder__list">
            <div className="os-finder__list-header">
              <span className="os-finder__list-col os-finder__list-col--name">Name</span>
              <span className="os-finder__list-col os-finder__list-col--date">Date Modified</span>
              <span className="os-finder__list-col os-finder__list-col--size">Size</span>
              <span className="os-finder__list-col os-finder__list-col--kind">Kind</span>
            </div>
            {filteredEntries.map(entry => {
              const IconComponent = getIcon(entry)
              return (
                <div
                  key={entry.id}
                  className="os-finder__list-row"
                  onClick={() => handleItemClick(entry)}
                >
                  <span className="os-finder__list-col os-finder__list-col--name">
                    <IconComponent size={16} />
                    <span>{entry.name}</span>
                  </span>
                  <span className="os-finder__list-col os-finder__list-col--date">
                    {formatDate(entry.modifiedAt)}
                  </span>
                  <span className="os-finder__list-col os-finder__list-col--size">
                    {entry.type === 'folder' ? '--' : formatSize(entry.size)}
                  </span>
                  <span className="os-finder__list-col os-finder__list-col--kind">
                    {entry.type === 'folder' ? 'Folder' : 'File'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="os-finder__status">
        {filteredEntries.length} item{filteredEntries.length !== 1 ? 's' : ''}
        {searchQuery ? ` matching "${searchQuery}"` : ''}
      </div>
    </div>
  )
}

export default FinderContent
