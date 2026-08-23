import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AcessibilidadeProvider } from '@/shared/acessibilidade'
import { MenuAcessibilidade } from './MenuAcessibilidade'

/**
 * Monta o menu e o abre, devolvendo o usuário para a continuação do teste.
 *
 * `userEvent.setup()` vem ANTES do `render`: ele instala os ouvintes de
 * ponteiro e teclado no documento, e chamá-lo depois deixa a árvore já
 * montada fora do alcance deles.
 */
async function abrir() {
  const usuario = userEvent.setup()
  render(
    <AcessibilidadeProvider>
      <MenuAcessibilidade />
    </AcessibilidadeProvider>,
  )
  await usuario.click(screen.getByRole('button', { name: /acessibilidade/i }))
  return usuario
}

describe('MenuAcessibilidade', () => {
  beforeEach(() => {
    localStorage.clear()
    const raiz = document.documentElement
    raiz.className = ''
    raiz.style.fontSize = ''
  })

  afterEach(cleanup)

  it('oferece os quatro degraus de tamanho, com o padrão marcado', async () => {
    await abrir()

    const degraus = screen.getAllByRole('radio')
    expect(degraus).toHaveLength(4)
    expect(degraus[0]).toBeChecked()
  })

  it('muda o tamanho do texto ao escolher um degrau', async () => {
    const usuario = await abrir()

    await usuario.click(screen.getByRole('radio', { name: 'Grande' }))

    expect(document.documentElement.style.fontSize).toBe('130%')
    expect(screen.getByRole('radio', { name: 'Grande' })).toBeChecked()
  })

  it('liga o alto contraste pela chave', async () => {
    const usuario = await abrir()

    const chave = screen.getByRole('switch', { name: /alto contraste/i })
    expect(chave).not.toBeChecked()

    await usuario.click(chave)

    expect(document.documentElement).toHaveClass('alto-contraste')
  })

  it('liga menos movimento e sublinhado de link', async () => {
    const usuario = await abrir()

    await usuario.click(screen.getByRole('switch', { name: /menos movimento/i }))
    await usuario.click(screen.getByRole('switch', { name: /sublinhar links/i }))

    expect(document.documentElement).toHaveClass('menos-movimento')
    expect(document.documentElement).toHaveClass('sublinhar-links')
  })

  it('só oferece "voltar ao padrão" depois de haver o que desfazer', async () => {
    const usuario = await abrir()

    expect(screen.queryByRole('button', { name: /voltar ao padrão/i })).not.toBeInTheDocument()

    await usuario.click(screen.getByRole('switch', { name: /alto contraste/i }))

    await usuario.click(screen.getByRole('button', { name: /voltar ao padrão/i }))
    expect(document.documentElement).not.toHaveClass('alto-contraste')
  })

  it('cada controle se anuncia com o próprio estado', async () => {
    const usuario = await abrir()

    // `aria-checked` é o que o leitor de tela lê. Sem ele a chave seria
    // anunciada como um botão comum, sem dizer se está ligada.
    const chave = screen.getByRole('switch', { name: /alto contraste/i })
    expect(chave).toHaveAttribute('aria-checked', 'false')

    await usuario.click(chave)

    expect(chave).toHaveAttribute('aria-checked', 'true')
  })
})
