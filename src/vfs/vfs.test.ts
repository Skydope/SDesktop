import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VirtualFilesystem } from './vfs'

// jsdom no trae IndexedDB. El VFS opera siempre sobre su arbol en memoria y
// solo usa storage para persistir, asi que basta con stubear el modulo.
vi.mock('./storage', () => ({
  vfsStorage: {
    init: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue(null),
    clear: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('VirtualFilesystem', () => {
  let vfs: VirtualFilesystem

  beforeEach(async () => {
    vfs = new VirtualFilesystem()
    await vfs.init()
  })

  it('siembra el arbol por defecto', async () => {
    expect(await vfs.exists('/Users/guest/Desktop')).toBe(true)
    expect(await vfs.exists('/Applications')).toBe(true)
  })

  describe('move / copy recursivos', () => {
    // El bug original: ambos iteraban `node.children` (solo hijos DIRECTOS)
    // cuando los paths son las claves del arbol. Los nietos quedaban huerfanos
    // en su path viejo y los arrays `children` seguian apuntando ahi.
    beforeEach(async () => {
      await vfs.mkdir('/Users/guest/a')
      await vfs.mkdir('/Users/guest/a/b')
      await vfs.mkdir('/Users/guest/a/b/c')
      await vfs.write('/Users/guest/a/b/c/hondo.txt', 'hola')
    })

    it('move reubica a los nietos, no solo a los hijos directos', async () => {
      await vfs.move('/Users/guest/a', '/Users/guest/z')

      expect(await vfs.exists('/Users/guest/z/b/c/hondo.txt')).toBe(true)
      expect(await vfs.read('/Users/guest/z/b/c/hondo.txt')).toBe('hola')

      // y nada queda atras
      expect(await vfs.exists('/Users/guest/a')).toBe(false)
      expect(await vfs.exists('/Users/guest/a/b')).toBe(false)
      expect(await vfs.exists('/Users/guest/a/b/c/hondo.txt')).toBe(false)
    })

    it('move reescribe los children de los nodos movidos', async () => {
      await vfs.move('/Users/guest/a', '/Users/guest/z')

      // si `children` quedara con los paths viejos, readdir devolveria vacio
      const entries = await vfs.readdir('/Users/guest/z/b')
      expect(entries.map(e => e.name)).toEqual(['c'])
    })

    it('copy duplica el subarbol completo y deja el original', async () => {
      await vfs.copy('/Users/guest/a', '/Users/guest/z')

      expect(await vfs.read('/Users/guest/z/b/c/hondo.txt')).toBe('hola')
      expect(await vfs.read('/Users/guest/a/b/c/hondo.txt')).toBe('hola')
    })

    it('copy produce una copia independiente', async () => {
      await vfs.copy('/Users/guest/a', '/Users/guest/z')
      await vfs.write('/Users/guest/z/b/c/hondo.txt', 'cambiado')

      expect(await vfs.read('/Users/guest/a/b/c/hondo.txt')).toBe('hola')
    })

    it('rechaza mover un directorio dentro de si mismo', async () => {
      await expect(vfs.move('/Users/guest/a', '/Users/guest/a/b/dentro')).rejects.toThrow(
        /subdirectory of itself/
      )
    })

    it('rechaza un destino que ya existe', async () => {
      await vfs.mkdir('/Users/guest/ocupado')
      await expect(vfs.move('/Users/guest/a', '/Users/guest/ocupado')).rejects.toThrow(
        /already exists/
      )
    })
  })

  describe('mkdir', () => {
    it('-p crea los padres que falten', async () => {
      await vfs.mkdir('/Users/guest/x/y/z', true)
      expect(await vfs.exists('/Users/guest/x/y/z')).toBe(true)
      expect(await vfs.exists('/Users/guest/x/y')).toBe(true)
    })

    it('sin -p falla si falta el padre', async () => {
      await expect(vfs.mkdir('/Users/guest/x/y/z')).rejects.toThrow()
    })

    it('rechaza paths relativos', async () => {
      await expect(vfs.mkdir('relativo')).rejects.toThrow(/must be absolute/)
    })
  })
})
