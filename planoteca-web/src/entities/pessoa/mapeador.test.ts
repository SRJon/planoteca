import { describe, expect, it } from 'vitest'
import { deApi } from '@/shared/lib/data'
import { paraDominio } from './mapeador'
import type { PessoaApi } from './mapeador'

function dtoCompleto(): PessoaApi {
  return {
    id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    firstName: 'Ana',
    lastName: 'Souza',
    dateBirth: '1990-04-12T00:00:00',
    type: 'FEMALE',
    active: true,
    age: 36,
  }
}

describe('mapeador de pessoa', () => {
  it('converte o DTO completo para o domínio', () => {
    expect(paraDominio(dtoCompleto())).toEqual({
      id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
      nome: 'Ana',
      sobrenome: 'Souza',
      nomeCompleto: 'Ana Souza',
      // `dateBirth` chega sem offset — o mapeador delega para
      // `shared/lib/data.deApi`, que trata texto sem fuso como horário de
      // Brasília. `new Date('1990-04-12T00:00:00')` seria o horário LOCAL
      // DA MÁQUINA que roda o teste, não necessariamente São Paulo — por
      // isso a expectativa usa `deApi` também, não um `new Date` direto.
      nascimento: deApi('1990-04-12T00:00:00'),
      tipo: 'feminino',
      ativo: true,
      idade: 36,
    })
  })

  it('tolera sobrenome ausente do corpo (WhenWritingNull)', () => {
    const dto: PessoaApi = {
      id: '5f2504e0-4f89-11d3-9a0c-0305e82c3302',
      firstName: 'Bia',
      dateBirth: '1988-01-03T00:00:00',
      type: 'FEMALE',
      active: false,
      age: 38,
    }
    const pessoa = paraDominio(dto)
    expect(pessoa.sobrenome).toBeNull()
    expect(pessoa.nomeCompleto).toBe('Bia')
  })

  it('traduz MALE para masculino', () => {
    const dto = { ...dtoCompleto(), type: 'MALE' as const }
    expect(paraDominio(dto).tipo).toBe('masculino')
  })

  it('traduz FEMALE para feminino', () => {
    expect(paraDominio(dtoCompleto()).tipo).toBe('feminino')
  })

  it('id vazio é corpo corrompido, não pessoa sem identidade — lança', () => {
    const dto = { ...dtoCompleto(), id: '' }
    expect(() => paraDominio(dto)).toThrow()
  })

  it('nascimento no fuso de Brasília: meio-dia em SP é 15h UTC (verão) ou 14h UTC (sem verão), conforme deApi', () => {
    const dto = { ...dtoCompleto(), dateBirth: '1990-04-12T12:00:00' }
    const pessoa = paraDominio(dto)
    expect(pessoa.nascimento).toEqual(deApi('1990-04-12T12:00:00'))
  })
})
