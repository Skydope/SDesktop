import { describe, it, expect } from 'vitest'
import { resolveArg } from './fs'

// Antes de este helper cada comando tenia su propia copia de la resolucion de
// paths (9 en total) y `ls` no tenia ninguna, asi que un `ls` pelado tiraba
// "Path must be absolute: .".
describe('resolveArg', () => {
  const PWD = '/Users/guest'

  it('deja los paths absolutos como estan', () => {
    expect(resolveArg('/System', PWD)).toBe('/System')
  })

  it('resuelve paths relativos contra el PWD', () => {
    expect(resolveArg('Documents', PWD)).toBe('/Users/guest/Documents')
  })

  it("resuelve '.' al PWD", () => {
    expect(resolveArg('.', PWD)).toBe('/Users/guest')
  })

  it("'..' sube un nivel", () => {
    expect(resolveArg('..', PWD)).toBe('/Users')
    expect(resolveArg('../..', PWD)).toBe('/')
  })

  it("'..' no se pasa de la raiz", () => {
    expect(resolveArg('../../../../..', PWD)).toBe('/')
  })

  it('mezcla segmentos relativos en el medio', () => {
    expect(resolveArg('Documents/../Pictures', PWD)).toBe('/Users/guest/Pictures')
  })

  it('expande ~', () => {
    expect(resolveArg('~', '/tmp')).toBe('/Users/guest')
    expect(resolveArg('~/Downloads', '/tmp')).toBe('/Users/guest/Downloads')
  })

  it('colapsa barras repetidas y quita la final', () => {
    expect(resolveArg('/Users//guest/', PWD)).toBe('/Users/guest')
  })

  it('resuelve la raiz', () => {
    expect(resolveArg('/', PWD)).toBe('/')
  })
})
