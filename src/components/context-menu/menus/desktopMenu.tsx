import type { ContextMenuItem } from '../types'
import { FolderPlus, FilePlus, Clipboard } from 'lucide-react'

export function getDesktopMenuItems(): ContextMenuItem[] {
  return [
    {
      id: 'new-folder',
      label: 'New Folder',
      icon: <FolderPlus className="os-icon os-icon--sm" />,
      shortcut: '⌘⇧N',
    },
    {
      id: 'new-file',
      label: 'New File',
      icon: <FilePlus className="os-icon os-icon--sm" />,
      shortcut: '⌘N',
    },
    {
      id: 'separator-1',
      separator: true,
    },
    {
      id: 'paste',
      label: 'Paste',
      icon: <Clipboard className="os-icon os-icon--sm" />,
      shortcut: '⌘V',
    },
  ]
}