import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Button } from '@/components/ui/button'
import { AcessibilidadeProvider, useAcessibilidade } from './AcessibilidadeProvider'

const CHAVE = 'planoteca.acessibilidade'

/** Uma sonda que expõe o contexto como texto, para o teste ler o estado. */
function Sonda() {
  const { preferencias, definir, restaurarPadrao, alterado } = useAcessibilidade()
  return (
    <div>
      <span data-testid="escala">{preferencias.escala}</span>
      <span data-testid="contraste">{String(preferencias.altoContraste)}</span>
      <span data-testid="alterado">{String(alterado)}</span>
      <Button onClick={() => definir('escala', 1.3)}>aumentar</Button>
      <Button onClick={() => definir('altoContraste', true)}>contrastar</Button>
      <Button onClick={restaurarPadrao}>restaurar</Button>
    </div>
  )
}

function renderizar() {
  return render(
    <AcessibilidadeProvider>
      <Sonda />
    </AcessibilidadeProvider>,
  )
}

describe('AcessibilidadeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    const raiz = document.documentElement
    raiz.className = ''
    raiz.style.fontSize = ''
  })

  afterEach(cleanup)

  it('nasce no padrão quando não há nada gravado', () => {
    renderizar()

    expect(screen.getByTestId('escala')).toHaveTextContent('1')
    expect(screen.getByTestId('contraste')).toHaveTextContent('false')
    expect(screen.getByTestId('alterado')).toHaveTextContent('false')
    // Escala 1 não escreve `font-size`: o padrão do navegador é o que vale, e
    // sobrescrevê-lo com 100% ignoraria quem aumentou a fonte padrão.
    expect(document.documentElement.style.fontSize).toBe('')
  })

  it('aplica a escala como font-size da raiz', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('button', { name: 'aumentar' }))

    expect(screen.getByTestId('escala')).toHaveTextContent('1.3')
    expect(document.documentElement.style.fontSize).toBe('130%')
  })

  it('aplica o alto contraste como classe na raiz', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('button', { name: 'contrastar' }))

    expect(document.documentElement).toHaveClass('alto-contraste')
  })

  it('guarda a escolha e a recupera na montagem seguinte', async () => {
    const usuario = userEvent.setup()
    const { unmount } = renderizar()

    await usuario.click(screen.getByRole('button', { name: 'aumentar' }))
    unmount()
    renderizar()

    expect(screen.getByTestId('escala')).toHaveTextContent('1.3')
    expect(document.documentElement.style.fontSize).toBe('130%')
  })

  it('restaura o padrão e limpa o que havia sido aplicado', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('button', { name: 'aumentar' }))
    await usuario.click(screen.getByRole('button', { name: 'contrastar' }))
    expect(screen.getByTestId('alterado')).toHaveTextContent('true')

    await usuario.click(screen.getByRole('button', { name: 'restaurar' }))

    expect(screen.getByTestId('alterado')).toHaveTextContent('false')
    expect(document.documentElement.style.fontSize).toBe('')
    expect(document.documentElement).not.toHaveClass('alto-contraste')
  })

  it('ignora valor gravado fora dos degraus válidos', () => {
    // Um deploy futuro pode remover um degrau, e o valor antigo sobrevive no
    // navegador de quem já usou. Cair no padrão é melhor do que aplicar uma
    // escala que o desenho não prevê.
    localStorage.setItem(CHAVE, JSON.stringify({ escala: 9, altoContraste: true }))
    renderizar()

    expect(screen.getByTestId('escala')).toHaveTextContent('1')
    // O campo válido ao lado do inválido é preservado.
    expect(screen.getByTestId('contraste')).toHaveTextContent('true')
  })

  it('sobrevive a conteúdo corrompido no armazenamento', () => {
    localStorage.setItem(CHAVE, 'isto não é json')

    expect(() => renderizar()).not.toThrow()
    expect(screen.getByTestId('escala')).toHaveTextContent('1')
  })

  it('exige o provedor acima na árvore', () => {
    // O erro precisa ser explícito: sem ele, o componente receberia `null` e
    // quebraria com "cannot read property of null" longe da causa.
    expect(() => render(<Sonda />)).toThrow(/AcessibilidadeProvider/)
  })
})
