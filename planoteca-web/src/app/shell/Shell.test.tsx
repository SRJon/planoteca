import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ComAutenticacao } from '@/teste/autenticacao'
import { TemaProvider } from '../providers/TemaProvider'
import { Shell } from './Shell'

const CHAVE_RECOLHIDA = 'csc.barra-lateral-recolhida'

/**
 * Injeta os blocos de token do `tema.css` real como `<style>` no
 * `document.head`.
 *
 * `vitest.config.ts` não liga `test.css` (CSS Modules continuam funcionando
 * porque o mapa de classes é gerado independente disso, mas nenhum `<style>`
 * de verdade é injetado em teste) — sem isto o teste abaixo não teria a
 * regra de `--side-bg` disponível para o motor de CSS do jsdom resolver.
 * `fs.readFileSync` em vez de `import`: não depende de nenhuma configuração
 * de bundler para o teste, só lê o arquivo que `BarraLateral.module.css`
 * consome de verdade. Caminho relativo ao diretório de trabalho — o mesmo
 * que `vitest.config.ts` já assume (`setupFiles: ['./src/teste/preparo.ts']`).
 *
 * O `@layer base` do `tema.css` é removido antes de injetar, e isso NÃO é
 * cosmético: o parser de CSS do jsdom não entende `@layer` com bloco e
 * ABORTA A FOLHA INTEIRA ao encontrá-lo — `style.sheet` volta nulo e nenhuma
 * regra anterior sobrevive, nem as de `:root`. O sintoma é `--side-bg`
 * resolvendo para string vazia, como se o token não existisse. Medido com
 * jsdom 25 ao portar os tokens para o Tailwind v4; `@theme`, `@utility` e
 * `@custom-variant` passam sem problema, só `@layer` derruba. O que o teste
 * abaixo lê são os blocos `:root` e `.dark`, que o recorte
 * preserva — a asserção continua batendo contra o arquivo de verdade.
 */
function injetarTokensReais() {
  const folha = readFileSync('src/app/estilos/tema.css', 'utf8')
  const estilo = document.createElement('style')
  estilo.textContent = folha.replace(/@layer\s+[\w\s,-]*\{[\s\S]*?\n\}/g, '')
  document.head.appendChild(estilo)
}

function renderizar(caminhoInicial: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <ComAutenticacao>
      <QueryClientProvider client={queryClient}>
        <TemaProvider>
          <MemoryRouter initialEntries={[caminhoInicial]}>
            <Routes>
              <Route element={<Shell />}>
                <Route path="/pessoas" element={<p>Conteúdo de pessoas</p>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </TemaProvider>
      </QueryClientProvider>
    </ComAutenticacao>,
  )
}

afterEach(() => {
  cleanup()
  localStorage.removeItem(CHAVE_RECOLHIDA)
  // O tema persiste, então vaza de um teste para o seguinte se não for
  // limpo aqui.
  localStorage.removeItem('csc.tema')
  document.documentElement.classList.remove('dark')
  vi.restoreAllMocks()
})

describe('Shell', () => {
  it('a barra lateral recolhe, e o estado persiste em localStorage', async () => {
    const user = userEvent.setup()
    renderizar('/pessoas')

    await user.click(await screen.findByRole('button', { name: 'Recolher menu' }))

    expect(localStorage.getItem(CHAVE_RECOLHIDA)).toBe('1')
    expect(await screen.findByRole('button', { name: 'Expandir menu' })).toBeInTheDocument()

    // A persistência é o ponto do teste: um remonte precisa nascer já
    // recolhido, lendo de `localStorage`, não do estado em memória do
    // componente anterior (que `cleanup()` acabou de destruir).
    cleanup()
    renderizar('/pessoas')

    expect(await screen.findByRole('button', { name: 'Expandir menu' })).toBeInTheDocument()
  })

  it('a barra lateral segue o tema — o token de fundo que ela consome muda entre claro e escuro', async () => {
    injetarTokensReais()
    renderizar('/pessoas')

    // Confirma que a `Shell` realmente montou a barra lateral antes de
    // medir o token — o teste prova o token que ELA consome
    // (`BarraLateral.module.css`: `.side { background: var(--side-bg) }`),
    // não um fato solto sobre `tokens.css`.
    await screen.findByRole('navigation', { name: 'Navegação principal' })

    // jsdom não resolve `var()` dentro de propriedades compostas como
    // `background` (a mesma regra, testada à parte, devolve
    // `backgroundColor: rgba(0, 0, 0, 0)` nos dois temas) nem herda o VALOR
    // de uma custom property para um elemento descendente — só resolve a
    // variável no elemento que a regra casa. A classe `.dark` é escrita em
    // `document.documentElement` (`BarraSuperior.tsx`/`TemaProvider`), que é
    // onde `tokens.css` declara a regra — por isso a leitura é ali.
    document.documentElement.classList.remove('dark')
    const claro = getComputedStyle(document.documentElement).getPropertyValue('--side-bg').trim()

    document.documentElement.classList.add('dark')
    const escuro = getComputedStyle(document.documentElement).getPropertyValue('--side-bg').trim()

    expect(claro).not.toBe('')
    expect(claro).not.toBe(escuro)
  })

  it('o botão de tema troca a classe .dark E grava a escolha', async () => {
    const user = userEvent.setup()
    renderizar('/pessoas')

    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(false))

    await user.click(await screen.findByRole('button', { name: 'Sua conta' }))
    await user.click(await screen.findByRole('menuitem', { name: /Trocar o tema/ }))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    // A gravação é o que faltava: o botão trocava o atributo direto no DOM, e
    // a escolha morria na recarga — e também na próxima vez que o SISTEMA
    // mudasse de tema, porque o provedor reescrevia por cima.
    expect(localStorage.getItem('csc.tema')).toBe('dark')
  })

  it('a escolha de tema vence a preferência do sistema depois de uma recarga', async () => {
    localStorage.setItem('csc.tema', 'dark')
    // O sistema pede claro; a escolha gravada pede escuro. Quem manda é quem
    // escolheu — este é o caso que o provedor antigo perdia.
    renderizar('/pessoas')

    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true))
  })

  // O caso "403 na matriz de permissão" vivia aqui, junto com o contraponto
  // "nenhuma tela liberada, e nenhum aviso". Os dois exercitavam a busca de
  // `/telas` e `/perfis-tela`, que a Task 5 removeu com a matriz inteira: o
  // menu é estático (`permissoes.ts`) e o filtro é síncrono, então não há
  // rede a falhar nem 403 a distinguir. A cobertura equivalente é a de baixo
  // — o menu desenha sem nenhuma requisição — mais a política de filtragem,
  // testada direto em `permissoes.test.ts`.

  it('a barra lateral desenha o menu SEM nenhuma requisição de rede', async () => {
    // A regressão que este caso guarda: alguém reintroduzir uma busca para
    // montar o menu. `servidor` (MSW) está configurado para falhar em
    // requisição não simulada, e nenhum handler foi registrado aqui — uma
    // chamada de rede quebraria este teste, que é o ponto.
    renderizar('/pessoas')

    const menu = await screen.findByRole('navigation', { name: 'Navegação principal' })

    // O papel vem junto com a sessão, numa resposta só (`GET /auth/me`) — o
    // menu não precisa buscar nada para saber o que mostrar. É a diferença
    // para o filtro por grupo de diretório que o antecedeu, que dependia de
    // uma segunda chamada e falhava aberto quando ela não vinha.
    expect(within(menu).getByRole('link', { name: 'Moderação' })).toBeInTheDocument()
    expect(within(menu).getByRole('link', { name: 'Catalogar' })).toBeInTheDocument()
  })

  it('a trilha de navegação vem da rota atual', async () => {
    renderizar('/pessoas')

    const trilha = await screen.findByRole('navigation', { name: 'Trilha de navegação' })
    expect(within(trilha).getByText('Pessoas')).toBeInTheDocument()
  })

  it('trava o scroll do documento, e o devolve ao sair do painel', () => {
    // Duas barras de rolagem: a do `<main>` e a do navegador. `tema.css`
    // fixa a altura com `height: 100%`, o que não impede o transbordo — e a
    // diferença entre `100%` e `dvh` sobrava como segunda barra. O
    // formulário de catalogar parava no meio da tela com área morta abaixo.
    const { unmount } = renderizar('/pessoas')
    expect(document.body.style.overflow).toBe('hidden')

    // As telas públicas rolam pelo documento. Sair do painel sem devolver o
    // scroll deixaria a Biblioteca presa.
    unmount()
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})
