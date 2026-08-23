import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, beforeEach } from 'vitest'
import { criarCliente } from '@/shared/api'
import { VOCABULARIO_FIXTURE } from '@/teste/planos'
import { FormularioCatalogar } from './FormularioCatalogar'
import { useCatalogarPlano } from './useCatalogarPlano'
import { CHAVE_RASCUNHO } from './useRascunho'

const BASE = 'https://api.teste'

/** O `useCatalogarPlano` exige um `Cliente` — este componente auxiliar monta
 * o hook e passa para o formulário, como `PaginaCatalogar` faz. */
function Wrapper() {
  const cliente = criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })
  const catalogacao = useCatalogarPlano(cliente)
  return <FormularioCatalogar catalogacao={catalogacao} vocabulario={VOCABULARIO_FIXTURE} />
}

function renderizar() {
  return render(<Wrapper />)
}

function pdfFalso(nome = 'termoscopio.pdf') {
  return new File(['%PDF-1.4 conteúdo'], nome, { type: 'application/pdf' })
}

async function preencherPasso1(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText('Título'), 'Escape Room: Missão Termoscópio')
  await usuario.type(screen.getByLabelText('Autoria'), 'Anna Ruth de Souza e Souza')
  await usuario.type(
    screen.getByLabelText('Objetos de conhecimento abordados'),
    'Escalas Termométricas',
  )
}

async function avancarParaPasso2(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.upload(screen.getByLabelText('Escolher o PDF do plano'), pdfFalso())
  await preencherPasso1(usuario)
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
  await screen.findByText('Passo 2 de 4 — Onde se aplica')
}

async function preencherPasso2(usuario: ReturnType<typeof userEvent.setup>) {
  const componentes = screen.getByRole('group', { name: /Componente curricular/ })
  await usuario.click(within(componentes).getByRole('button', { name: 'Química' }))

  const series = screen.getByRole('group', { name: /Série/ })
  await usuario.click(within(series).getByRole('button', { name: '8º ano do Ensino Fundamental' }))
}

describe('FormularioCatalogar', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('começa no passo 1, mostrando "Passo 1 de 4"', () => {
    renderizar()
    expect(screen.getByText('Passo 1 de 4 — Arquivo e identificação')).toBeInTheDocument()
    expect(screen.getByLabelText('Título')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /Componente curricular/ })).not.toBeInTheDocument()
  })

  it('"Continuar" com campo obrigatório vazio não avança e mostra o erro', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))

    // Os três campos obrigatórios do passo 1 ficam vazios: três erros, um
    // por campo.
    expect(await screen.findAllByText('Campo obrigatório.')).toHaveLength(3)
    expect(screen.getByText('Passo 1 de 4 — Arquivo e identificação')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /Componente curricular/ })).not.toBeInTheDocument()
  })

  it('preenchido, avança e mostra os campos do passo 2', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await avancarParaPasso2(usuario)

    expect(screen.getByRole('group', { name: /Componente curricular/ })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /Série/ })).toBeInTheDocument()
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument()
  })

  it('"Voltar" do passo 2 volta ao 1 com o que foi digitado intacto', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await avancarParaPasso2(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.getByText('Passo 1 de 4 — Arquivo e identificação')).toBeInTheDocument()
    expect(screen.getByLabelText('Título')).toHaveValue('Escape Room: Missão Termoscópio')
    expect(screen.getByLabelText('Autoria')).toHaveValue('Anna Ruth de Souza e Souza')
  })

  it('só o passo 4 oferece "Catalogar plano"', async () => {
    const usuario = userEvent.setup()
    renderizar()

    expect(screen.queryByRole('button', { name: 'Catalogar plano' })).not.toBeInTheDocument()

    await avancarParaPasso2(usuario)
    expect(screen.queryByRole('button', { name: 'Catalogar plano' })).not.toBeInTheDocument()

    await preencherPasso2(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText('Passo 3 de 4 — A prática')
    expect(screen.queryByRole('button', { name: 'Catalogar plano' })).not.toBeInTheDocument()

    await usuario.type(screen.getByLabelText('Objetivo da prática'), 'Promover aprendizagem ativa.')
    await usuario.type(
      screen.getByLabelText('Expectativas de aprendizagem'),
      'Converter entre escalas.',
    )
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText('Passo 4 de 4 — Como conduzir')

    expect(screen.getByRole('button', { name: 'Catalogar plano' })).toBeInTheDocument()
  })

  it('o rascunho é gravado e a retomada é oferecida, não automática', async () => {
    const usuario = userEvent.setup()
    const primeira = renderizar()

    await usuario.type(screen.getByLabelText('Título'), 'Rascunho de teste')

    await waitFor(() => {
      expect(window.localStorage.getItem(CHAVE_RASCUNHO)).toContain('Rascunho de teste')
    })

    primeira.unmount()

    renderizar()

    // Não restaura em silêncio: o campo nasce vazio até a pessoa decidir.
    expect(screen.getByLabelText('Título')).toHaveValue('')
    expect(await screen.findByText(/Existe um rascunho salvo/)).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Retomar rascunho' }))

    expect(screen.getByLabelText('Título')).toHaveValue('Rascunho de teste')
    expect(screen.queryByText(/Existe um rascunho salvo/)).not.toBeInTheDocument()
  })

  it('envio bem-sucedido limpa o rascunho', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await avancarParaPasso2(usuario)
    await preencherPasso2(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText('Passo 3 de 4 — A prática')

    await usuario.type(screen.getByLabelText('Objetivo da prática'), 'Promover aprendizagem ativa.')
    await usuario.type(
      screen.getByLabelText('Expectativas de aprendizagem'),
      'Converter entre escalas.',
    )
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText('Passo 4 de 4 — Como conduzir')

    await waitFor(() => {
      expect(window.localStorage.getItem(CHAVE_RASCUNHO)).not.toBeNull()
    })

    await usuario.click(screen.getByRole('button', { name: 'Catalogar plano' }))

    await waitFor(() => {
      expect(window.localStorage.getItem(CHAVE_RASCUNHO)).toBeNull()
    })
  })

  it('recusa arquivo que não é PDF, antes de tocar na rede', async () => {
    renderizar()

    const entrada = screen.getByLabelText('Escolher o PDF do plano') as HTMLInputElement
    const planilha = new File(['x'], 'planilha.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    Object.defineProperty(entrada, 'files', { value: [planilha], configurable: true })
    fireEvent.change(entrada)

    expect(await screen.findByRole('alert')).toHaveTextContent('O acervo recebe PDF')
  })
})
