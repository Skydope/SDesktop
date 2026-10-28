import type React from 'react'
import {
  Terminal,
  FileText,
  Settings,
  Calculator,
  Folder,
  Globe,
} from 'lucide-react'

/**
 * Mapea los `icon` string del APP_REGISTRY (y de los items del escritorio)
 * al componente de lucide que los dibuja.
 */
export const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  terminal: Terminal,
  'file-text': FileText,
  settings: Settings,
  calculator: Calculator,
  folder: Folder,
  globe: Globe,
}
