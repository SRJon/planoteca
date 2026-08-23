import { describe, expect, it } from 'vitest'
import { Books } from '@phosphor-icons/react/dist/csr/Books'
import { Tray } from '@phosphor-icons/react/dist/csr/Tray'
import type { Sessao } from '@/entities/autenticacao'
import { filtrarMenu } from './permissoes'
import type { ItemMenu } from './permissoes'

const ABERTO: ItemMenu = { rota: '/biblioteca', titulo: 'Biblioteca', icone: Books }
const SO_ADMIN: ItemMenu = {
  rota: '/admin/moderacao',
  titulo: 'Moderação',
  icone: Tray,
  papel: 'administrador',
}

function sessaoCom(papel: Sessao['papel']): Sessao {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'pessoa@escola.test',
    nome: 'Pessoa de Teste',
    papel,
    ativo: true,
    novo: false,
  }
}

describe('filtrarMenu', () => {
  it('mostra ao professor só o que não exige papel', () => {
    expect(filtrarMenu([ABERTO, SO_ADMIN], sessaoCom('professor'))).toEqual([ABERTO])
  })

  it('mostra ao administrador os dois', () => {
    expect(filtrarMenu([ABERTO, SO_ADMIN], sessaoCom('administrador'))).toEqual([
      ABERTO,
      SO_ADMIN,
    ])
  })

  it('sem sessão, não mostra nada', () => {
    // A barra lateral só existe dentro de `RotaProtegida`, então este caso
    // não deveria acontecer. Devolver lista vazia é a degradação correta:
    // falha FECHADA, ao contrário do filtro por grupo que a antecedeu.
    expect(filtrarMenu([ABERTO, SO_ADMIN], null)).toEqual([])
  })

  it('não altera a lista recebida', () => {
    const itens = [ABERTO, SO_ADMIN]
    filtrarMenu(itens, sessaoCom('professor'))
    expect(itens).toHaveLength(2)
  })
})
