import { describe, expect, it } from 'vitest'
import { ORDENACAO_PADRAO_API, paraSortApi } from './ordenacaoApi'

describe('tradução de ordenação', () => {
  it('traduz o campo do domínio para PascalCase', () => {
    expect(paraSortApi({ campo: 'nome', direcao: 'asc' })).toBe('FirstName')
  })

  it('prefixa hífen na ordem descendente', () => {
    expect(paraSortApi({ campo: 'nome', direcao: 'desc' })).toBe('-FirstName')
  })

  it('traduz o sobrenome', () => {
    expect(paraSortApi({ campo: 'sobrenome', direcao: 'desc' })).toBe('-LastName')
  })

  it.each([
    ['id', 'Id'],
    ['nome', 'FirstName'],
    ['sobrenome', 'LastName'],
    ['nascimento', 'DateBirth'],
    ['idade', 'Age'],
    ['ativo', 'Active'],
  ])('traduz %s para %s, ascendente', (campo, esperado) => {
    expect(paraSortApi({ campo, direcao: 'asc' })).toBe(esperado)
  })

  it.each([
    ['id', '-Id'],
    ['nome', '-FirstName'],
    ['sobrenome', '-LastName'],
    ['nascimento', '-DateBirth'],
    ['idade', '-Age'],
    ['ativo', '-Active'],
  ])('traduz %s para %s, descendente', (campo, esperado) => {
    expect(paraSortApi({ campo, direcao: 'desc' })).toBe(esperado)
  })

  it('campo desconhecido não lança: cai na tradução PascalCase mecânica', () => {
    expect(paraSortApi({ campo: 'emailCorporativo', direcao: 'asc' })).toBe('EmailCorporativo')
  })

  it('campo desconhecido descendente também cai no PascalCase mecânico', () => {
    expect(paraSortApi({ campo: 'emailCorporativo', direcao: 'desc' })).toBe('-EmailCorporativo')
  })

  it('o padrão de ordenação, sem escolha do usuário, é o mesmo com que o FilterDto nasce no back-end', () => {
    expect(ORDENACAO_PADRAO_API).toBe('Id')
  })
})
