import { vfs } from '../vfs'
import type { VFSNode } from '../vfs/types'
import type { ShortcutItem, FolderItem } from '../types/desktop'

/** El escritorio ES este directorio. No hay un arbol de items aparte. */
export const DESKTOP_PATH = '/Users/guest/Desktop'

/**
 * El nombre del nodo ES el titulo, igual que en un filesystem real: renombrar
 * un item es moverlo. Por eso hay que sacarle lo que no puede ir en un nombre.
 */
export const toFileName = (title: string): string => {
  const clean = title.replace(/[/\\]/g, '-').trim()
  return clean || 'Sin titulo'
}

/**
 * Busca un nombre libre dentro de `dir`, agregando " 2", " 3"… como hace el
 * Finder. Sin esto, crear dos "New Folder" seguidos tira "Path already exists".
 */
export const uniquePath = async (dir: string, title: string): Promise<string> => {
  const base = toFileName(title)
  let candidate = `${dir}/${base}`
  let n = 2

  while (await vfs.exists(candidate)) {
    candidate = `${dir}/${base} ${n}`
    n += 1
  }

  return candidate
}

/**
 * Proyecta un nodo del VFS a la forma que renderean los componentes. El arbol
 * `items` dejo de ser estado persistido: es una vista derivada del filesystem.
 */
const toItem = async (node: VFSNode): Promise<ShortcutItem | FolderItem> => {
  const base = {
    id: node.id,
    title: node.name,
    icon: node.metadata?.icon ?? '',
    clickCount: Number(node.metadata?.clickCount ?? 0),
  }

  if (node.type === 'folder') {
    const children = await vfs.readdir(node.id)
    return { ...base, items: await Promise.all(children.map(toItem)) }
  }

  // Un acceso directo es un archivo cuyo contenido es la URL, como un .webloc.
  return { ...base, url: node.content ?? '' }
}

/** Lee el escritorio del VFS. Devuelve [] si todavia no existe. */
export const readDesktopItems = async (): Promise<(ShortcutItem | FolderItem)[]> => {
  let children: VFSNode[]
  try {
    children = await vfs.readdir(DESKTOP_PATH)
  } catch {
    return []
  }

  const items = await Promise.all(children.map(toItem))
  return items.sort((a, b) => a.title.localeCompare(b.title))
}

/** Escribe un item nuevo en `dir`. Devuelve el path, que pasa a ser su id. */
export const writeItem = async (
  dir: string,
  item: ShortcutItem | FolderItem
): Promise<string> => {
  const path = await uniquePath(dir, item.title)

  if ('items' in item) {
    await vfs.mkdir(path)
  } else {
    await vfs.write(path, item.url)
  }

  if (item.icon) {
    await vfs.setMetadata(path, { icon: item.icon })
  }

  return path
}

/**
 * Aplica una edicion. Si cambio el titulo es un `move`, porque el nombre del
 * archivo es el titulo, asi que el path (y por lo tanto el id) cambia: por eso
 * devuelve el path nuevo y quien llama tiene que re-apuntar lo que lo referencie.
 */
export const updateItemAt = async (
  path: string,
  updated: ShortcutItem | FolderItem
): Promise<string> => {
  const dir = path.slice(0, path.lastIndexOf('/')) || '/'
  const nextName = toFileName(updated.title)
  let nextPath = path

  if (nextName !== path.slice(path.lastIndexOf('/') + 1)) {
    nextPath = await uniquePath(dir, nextName)
    await vfs.move(path, nextPath)
  }

  if (!('items' in updated)) {
    await vfs.write(nextPath, updated.url)
  }

  await vfs.setMetadata(nextPath, { icon: updated.icon })

  return nextPath
}

/**
 * Lee el escritorio que quedo guardado en localStorage por la version vieja.
 *
 * Se captura AL CARGAR EL MODULO, no cuando corre la migracion: el middleware
 * `persist` del store reescribe la clave `desktopState` en cuanto el estado
 * cambia, y como `items` ya no esta en `partialize`, esa primera escritura se
 * lleva puesto el escritorio viejo. Este modulo se importa antes de que el
 * store se cree, asi que aca todavia esta intacto.
 */
const snapshotLegacyDesktop = (): (ShortcutItem | FolderItem)[] => {
  try {
    const raw = localStorage.getItem('desktopState')
    if (!raw) return []
    return JSON.parse(raw)?.state?.items ?? []
  } catch {
    return []
  }
}

const legacySnapshot = snapshotLegacyDesktop()

/**
 * Sube al VFS el escritorio que vivia en localStorage. Antes de unificar, el
 * escritorio y el filesystem eran dos arboles incompatibles; sin esto, quien ya
 * uso la app perderia sus items en silencio. Devuelve cuantos nodos escribio.
 */
export const migrateLegacyItems = async (
  legacy: (ShortcutItem | FolderItem)[] = legacySnapshot
): Promise<number> => {
  if (legacy.length === 0) return 0

  // Solo si el escritorio del VFS esta vacio: nunca pisar lo que ya este ahi.
  const existing = await vfs.readdir(DESKTOP_PATH).catch(() => [])
  if (existing.length > 0) return 0

  const writeTree = async (
    dir: string,
    items: (ShortcutItem | FolderItem)[]
  ): Promise<number> => {
    let written = 0
    for (const item of items) {
      const path = await writeItem(dir, item)
      written += 1
      if ('items' in item) {
        written += await writeTree(path, item.items)
      }
    }
    return written
  }

  return writeTree(DESKTOP_PATH, legacy)
}
