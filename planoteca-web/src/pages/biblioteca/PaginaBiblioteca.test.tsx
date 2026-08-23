import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { criarCliente } from '@/shared/api'
import { servidor } from '@/teste/servidor'
import { COMPONENTES_FIXTURE } from '@/teste/planos'
import { PaginaBiblioteca } from './PaginaBiblioteca'

const BASE = 'https://api.teste'

function renderizar(url = '/biblioteca') {
  // `retry: false`: sem isto, o caso de erro abaixo esperaria as três
  // tentativas padrão do TanStack Query antes de renderizar o alerta, e o
  // teste estouraria o tempo limite em vez de falhar por asserção.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <PaginaBiblioteca
          cliente={criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PaginaBiblioteca', () => {
  it('mostra os planos que a API devolve, com a contagem do X-Total-Count', async () => {
    renderizar()

    expect(await screen.findByRole('heading', { name: 'Biblioteca', level: 1 })).toBeInTheDocument()
    // 14 planos na fixture, 12 por página — a contagem vem do CABEÇALHO,
    // não do tamanho da lista, e é por isso que os dois números divergem.
    expect(await screen.findByText('14 planos')).toBeInTheDocument()
    // Ancorado na lista nomeada: a página é montada isolada aqui, mas o
    // mesmo seletor no e2e precisa distinguir os planos dos itens de menu
    // da barra lateral.
    const lista = screen.getByRole('list', { name: 'Planos de aula' })
    expect(within(lista).getAllByRole('listitem')).toHaveLength(12)
  })

  it('cada ficha traz a sigla do componente, a autoria e o botão de baixar', async () => {
    renderizar()

    const primeira = (await screen.findAllByRole('listitem'))[0]!
    // A sigla é `aria-hidden` (pista visual redundante), então a busca é
    // por texto, não por role. Ela vem do BANCO agora, não de um mapa
    // fechado em TypeScript.
    expect(within(primeira).getByText('MA')).toBeInTheDocument()
    // O código BNCC saiu do card: nenhum relato real do acervo traz um. O
    // que identifica o plano na listagem é a autoria.
    expect(within(primeira).getByText('Autoria 1')).toBeInTheDocument()
    // O download é um link com `download`, não um botão: baixar É navegar.
    expect(within(primeira).getByRole('link', { name: /Baixar plano/ })).toHaveAttribute(
      'download',
    )
  })

  it('o filtro por componente manda o id do vocabulário na querystring', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('14 planos')
    await usuario.click(screen.getByRole('button', { name: 'Matemática' }))

    // O chip carrega o GUID que veio de `GET /api/v1/vocabulary`, e não mais
    // um slug traduzido por um mapa no front. É o que permite cadastrar um
    // componente novo no painel sem deploy.
    expect(await screen.findByText('3 planos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Matemática' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('o filtro por componente acha a prática em que ele é SECUNDÁRIO', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('14 planos')
    await usuario.click(screen.getByRole('button', { name: 'Arte' }))

    // Três planos: dois em que Arte é o componente PRINCIPAL, e um — o
    // interdisciplinar — em que ela é secundária. Se o filtro olhasse só o
    // principal, viriam dois.
    expect(await screen.findByText('3 planos')).toBeInTheDocument()

    // A prova direta de que o interdisciplinar entrou: o card dele mostra
    // Química no bloco (o principal), e só aparece nesta busca porque Arte
    // é um dos secundários.
    const fichas = await screen.findAllByRole('listitem')
    const titulos = fichas.map((f) => f.textContent ?? '')
    expect(titulos.some((t) => t.includes('Plano003') && t.includes('QU'))).toBe(true)
  })

  it('o filtro por série acha o plano catalogado em duas séries', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('14 planos')
    // O plano interdisciplinar atende 8º E 9º ano. Com a ligação 1:1 antiga
    // ele nem existiria; com N:N, responde pelas duas séries.
    await usuario.click(screen.getByRole('button', { name: '9º ano do Ensino Fundamental' }))

    // Quatro: três que têm o 9º como série única, mais o interdisciplinar,
    // catalogado em 8º E 9º. Com a ligação 1:1 antiga ele teria de ser
    // duplicado para aparecer nas duas.
    expect(await screen.findByText('4 planos')).toBeInTheDocument()
  })

  it('filtrar por DUAS séries traz o plano de qualquer uma das duas (OU dentro do grupo)', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('14 planos')
    await usuario.click(screen.getByRole('button', { name: '6º ano do Ensino Fundamental' }))
    await usuario.click(screen.getByRole('button', { name: '7º ano do Ensino Fundamental' }))

    // A fixture cicla 5 séries por índice sobre 14 planos: 6º pega os planos
    // 1, 6, 11 e 7º pega 2, 7, 12 — seis ao todo, sem repetição.
    expect(await screen.findByText('6 planos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '6º ano do Ensino Fundamental' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '7º ano do Ensino Fundamental' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('série + componente juntos restringem o resultado (E entre grupos)', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('14 planos')
    // Plano003 (índice 2) é o interdisciplinar: 8º e 9º ano, Química
    // principal + Arte secundária. Só ele casa 9º ano E Arte ao mesmo tempo.
    await usuario.click(screen.getByRole('button', { name: '9º ano do Ensino Fundamental' }))
    await usuario.click(screen.getByRole('button', { name: 'Arte' }))

    expect(await screen.findByText('1 plano')).toBeInTheDocument()
    const ficha = (await screen.findAllByRole('listitem'))[0]!
    expect(within(ficha).getByRole('heading', { name: /Plano003/ })).toBeInTheDocument()
  })

  it('clicar num chip já ativo o remove sem derrubar os outros selecionados', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('14 planos')
    await usuario.click(screen.getByRole('button', { name: '6º ano do Ensino Fundamental' }))
    await usuario.click(screen.getByRole('button', { name: '7º ano do Ensino Fundamental' }))
    await screen.findByText('6 planos')

    // Desliga só o 6º: o 7º continua marcado e no resultado.
    await usuario.click(screen.getByRole('button', { name: '6º ano do Ensino Fundamental' }))

    expect(await screen.findByText('3 planos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '6º ano do Ensino Fundamental' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: '7º ano do Ensino Fundamental' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('a URL com a chave repetida é lida de volta e os dois chips nascem ativos', async () => {
    const matematica = COMPONENTES_FIXTURE[0]!
    const portugues = COMPONENTES_FIXTURE[1]!
    renderizar(`/biblioteca?componente=${matematica.id}&componente=${portugues.id}`)

    await screen.findByText('6 planos')
    expect(screen.getByRole('button', { name: 'Matemática' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Língua Portuguesa' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('tocar no chip já ativo desliga o recorte', async () => {
    const usuario = userEvent.setup()
    const matematica = COMPONENTES_FIXTURE[0]!
    renderizar(`/biblioteca?componente=${matematica.id}`)

    expect(await screen.findByText('3 planos')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Matemática' }))

    expect(await screen.findByText('14 planos')).toBeInTheDocument()
  })

  it('um componente desconhecido na URL não quebra a tela', async () => {
    // A URL é editável e compartilhada: `?componente=xyz` chega de link
    // torto e de link antigo — o slug `matematica` era válido antes de o
    // vocabulário virar tabela.
    //
    // O resultado é a lista VAZIA, e não a biblioteca inteira: o back-end
    // recebe um recorte que não casa nada e responde 204. É o mesmo que
    // acontece com qualquer filtro sem resultado, e a tela já sabe mostrar
    // — com o botão de limpar à mão. O que importa é não quebrar nem
    // devolver erro para quem só colou um link.
    renderizar('/biblioteca?componente=matematica')

    expect(
      await screen.findByRole('heading', { name: 'Nenhum plano com esses filtros' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument()
  })

  it('o filtro de metodologia não oferece ferramenta digital', async () => {
    renderizar()

    await screen.findByText('14 planos')
    // O seed traz 41 linhas, entre metodologias, técnicas e ferramentas. Só
    // as metodologias viram chip: uma grade com "Kahoot" e "Google Forms"
    // encheria a tela de recortes que quase nunca casam.
    expect(screen.getByRole('button', { name: 'Escape Room' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Kahoot' })).not.toBeInTheDocument()
  })

  it('mostra o estado vazio com saída quando o filtro não casa nada', async () => {
    renderizar('/biblioteca?q=inexistente')

    expect(
      await screen.findByRole('heading', { name: 'Nenhum plano com esses filtros' }),
    ).toBeInTheDocument()
    // Um único "Limpar filtros" na tela, o do painel de filtro. O estado
    // vazio aponta para ele em vez de repetir o controle — dois botões de
    // mesmo nome seriam indistinguíveis num leitor de tela.
    expect(screen.getAllByRole('button', { name: 'Limpar filtros' })).toHaveLength(1)
  })

  it('distingue biblioteca vazia de filtro sem resultado', async () => {
    servidor.use(
      http.get('*/api/v1/lesson-plans', () => new HttpResponse(null, { status: 204 })),
    )
    renderizar()

    expect(
      await screen.findByRole('heading', { name: 'A biblioteca ainda está vazia' }),
    ).toBeInTheDocument()
    // Sem filtro aplicado, "limpar filtros" seria um conselho inútil.
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()
  })

  it('mostra o erro da API em vez de uma lista vazia silenciosa', async () => {
    servidor.use(
      http.get('*/api/v1/lesson-plans', () =>
        HttpResponse.json({ status: 500, messages: ['Falha ao consultar planos.'] }, { status: 500 }),
      ),
    )
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao consultar planos.')
  })
})
