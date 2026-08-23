import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { criarCliente } from '@/shared/api'
import { servidor } from '@/teste/servidor'
import { PaginaCatalogar } from './PaginaCatalogar'

const BASE = 'https://api.teste'

function renderizar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/catalogar']}>
        <PaginaCatalogar
          cliente={criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Um PDF de mentira. O conteúdo não importa: o upload é interceptado. */
function pdfFalso(nome = 'termoscopio.pdf') {
  return new File(['%PDF-1.4 conteúdo'], nome, { type: 'application/pdf' })
}

/** Preenche o mínimo que a validação exige, e devolve o botão de enviar. */
async function preencherMinimo(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText('Título'), 'Escape Room: Missão Termoscópio')
  await usuario.type(screen.getByLabelText('Autoria'), 'Anna Ruth de Souza e Souza')
  await usuario.type(
    screen.getByLabelText('Objetos de conhecimento abordados'),
    'Escalas Termométricas',
  )
  await usuario.type(screen.getByLabelText('Objetivo da prática'), 'Promover aprendizagem ativa.')
  await usuario.type(
    screen.getByLabelText('Expectativas de aprendizagem'),
    'Converter entre escalas.',
  )

  const componentes = screen.getByRole('group', { name: /Componente curricular/ })
  await usuario.click(within(componentes).getByRole('button', { name: 'Química' }))

  const series = screen.getByRole('group', { name: /Série/ })
  await usuario.click(
    within(series).getByRole('button', { name: '8º ano do Ensino Fundamental' }),
  )
}

describe('PaginaCatalogar', () => {
  it('cataloga um plano de ponta a ponta e confirma na tela', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByRole('heading', { name: 'Catalogar plano', level: 1 })

    await usuario.upload(screen.getByLabelText('Escolher o PDF do plano'), pdfFalso())
    await preencherMinimo(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Catalogar plano' }))

    // O retorno que diz "funcionou" sem tirar quem cataloga da tela: numa
    // leva de trinta planos, "já subi este?" é a pergunta que volta.
    expect(await screen.findByText('1 plano catalogado nesta sessão')).toBeInTheDocument()
    expect(screen.getByText('Escape Room: Missão Termoscópio')).toBeInTheDocument()
  })

  it('preserva as escolhas de vocabulário para o próximo plano da leva', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByRole('heading', { name: 'Catalogar plano', level: 1 })
    await usuario.upload(screen.getByLabelText('Escolher o PDF do plano'), pdfFalso())
    await preencherMinimo(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Catalogar plano' }))

    await screen.findByText('1 plano catalogado nesta sessão')

    // O que se LIMPA: o que é único de cada plano.
    expect(screen.getByLabelText('Título')).toHaveValue('')
    expect(screen.getByLabelText('Autoria')).toHaveValue('')

    // O que PERMANECE: série e componente costumam se repetir entre planos
    // da mesma leva. Reescolher os dois a cada plano é o atrito que faz
    // alguém desistir na décima vez.
    const componentes = screen.getByRole('group', { name: /Componente curricular/ })
    expect(within(componentes).getByRole('button', { name: 'Química' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    const series = screen.getByRole('group', { name: /Série/ })
    expect(
      within(series).getByRole('button', { name: '8º ano do Ensino Fundamental' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('recusa arquivo que não é PDF, antes de tocar na rede', async () => {
    renderizar()

    await screen.findByRole('heading', { name: 'Catalogar plano', level: 1 })

    // `fireEvent`, e não `userEvent.upload`: o `upload` respeita o
    // `accept="application/pdf"` do input e simplesmente NÃO entrega o
    // arquivo, então a validação em JS nunca rodaria e o teste passaria sem
    // provar nada.
    //
    // O caminho real que este teste cobre é o do `accept` contornado — que
    // acontece: arrastar e soltar, colar, ou um navegador que trata o
    // atributo como sugestão. O `accept` é conveniência de UI; a validação
    // é a garantia.
    const entrada = screen.getByLabelText('Escolher o PDF do plano') as HTMLInputElement
    const planilha = new File(['x'], 'planilha.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    Object.defineProperty(entrada, 'files', { value: [planilha], configurable: true })
    fireEvent.change(entrada)

    expect(await screen.findByRole('alert')).toHaveTextContent('O acervo recebe PDF')
  })

  it('exige o arquivo, mesmo com o formulário todo preenchido', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByRole('heading', { name: 'Catalogar plano', level: 1 })
    await preencherMinimo(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Catalogar plano' }))

    expect(await screen.findByText('Escolha o PDF do plano.')).toBeInTheDocument()
  })

  it('exige componente principal e série', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByRole('heading', { name: 'Catalogar plano', level: 1 })
    await usuario.upload(screen.getByLabelText('Escolher o PDF do plano'), pdfFalso())
    await usuario.click(screen.getByRole('button', { name: 'Catalogar plano' }))

    expect(await screen.findByText('Escolha o componente principal.')).toBeInTheDocument()
    expect(screen.getByText('Escolha ao menos uma série.')).toBeInTheDocument()
  })

  it('mostra o erro da API sem perder o que foi digitado', async () => {
    servidor.use(
      http.post('*/api/v1/admin/lesson-plans', () =>
        HttpResponse.json(
          { status: 400, messages: ['Já existe um plano com este arquivo.'] },
          { status: 400 },
        ),
      ),
    )
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByRole('heading', { name: 'Catalogar plano', level: 1 })
    await usuario.upload(screen.getByLabelText('Escolher o PDF do plano'), pdfFalso())
    await preencherMinimo(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Catalogar plano' }))

    expect(await screen.findByText('Já existe um plano com este arquivo.')).toBeInTheDocument()
    // Perder vinte campos digitados por causa de um erro do servidor seria
    // hostil — e a pessoa está na décima catalogação do dia.
    expect(screen.getByLabelText('Título')).toHaveValue('Escape Room: Missão Termoscópio')
  })

  it('avisa quando o armazenamento não está configurado', async () => {
    servidor.use(
      http.post('*/api/v1/admin/lesson-plans/upload-url', () =>
        HttpResponse.json(
          {
            status: 400,
            messages: ['O armazenamento de arquivos não está configurado. Preencha `Armazenamento:R2`.'],
          },
          { status: 400 },
        ),
      ),
    )
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByRole('heading', { name: 'Catalogar plano', level: 1 })
    await usuario.upload(screen.getByLabelText('Escolher o PDF do plano'), pdfFalso())
    await preencherMinimo(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Catalogar plano' }))

    // A mensagem precisa dizer O QUE FAZER. É o caso que acontece hoje, com
    // o R2 ainda sem credencial.
    expect(await screen.findByText(/Armazenamento:R2/)).toBeInTheDocument()
  })

  it('descarta etapa sem descrição e renumera o resto', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByRole('heading', { name: 'Catalogar plano', level: 1 })

    await usuario.click(screen.getByRole('button', { name: 'Acrescentar etapa' }))
    await usuario.type(screen.getByLabelText('Descrição da etapa 1'), 'Contextualize a missão.')
    // A etapa 2 fica vazia de propósito: quem cataloga acrescenta uma linha
    // a mais e não preenche.
    expect(screen.getByLabelText('Descrição da etapa 2')).toHaveValue('')

    await usuario.upload(screen.getByLabelText('Escolher o PDF do plano'), pdfFalso())
    await preencherMinimo(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Catalogar plano' }))

    // O envio não falha por causa da etapa vazia — ela é descartada.
    expect(await screen.findByText('1 plano catalogado nesta sessão')).toBeInTheDocument()
  })
})
