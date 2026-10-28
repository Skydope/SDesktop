import type { ContextMenuItem } from '../types'
import { ExternalLink, Info, Pencil, Scissors, Copy, Trash2, Folder } from 'lucide-react'

export function getItemMenuItems(isFolder: boolean): ContextMenuItem[] {
  return [
    {
      id: 'open',
      label: 'Open',
      icon: isFolder ? <Folder className="os-icon os-icon--sm" /> : <ExternalLink className="os-icon os-icon--sm" />,
    },
    {
      id: 'separator-1',
      separator: true,
    },
    {
      id: 'get-info',
      label: 'Get Info',
      icon: <Info className="os-icon os-icon--sm" />,
      shortcut: '⌘I',
    },
    {
      id: 'edit',
      label: 'Edit…',
      icon: <Pencil className="os-icon os-icon--sm" />,
      shortcut: '⌘E',
    },
    {
      id: 'separator-2',
      separator: true,
    },
    {
      id: 'cut',
      label: 'Cut',
      icon: <Scissors className="os-icon os-icon--sm" />,
      shortcut: '⌘X',
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: <Copy className="os-icon os-icon--sm" />,
      shortcut: '⌘C',
    },
    {
      id: 'separator-3',
      separator: true,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="os-icon os-icon--sm" />,
      shortcut: '⌘⌫',
      danger: true,
    },
  ]
}
