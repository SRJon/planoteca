import { expect, test } from '@playwright/test'
import { entrarComoAdministrador, instalarSimulacao } from './simulacao'

/**
 * Caminho feliz ponta a ponta (Task 10 do boilerplate): entrar, chegar em
 * `/pessoas`, paginar e filtrar. É o único smoke test desta suíte — não
 * substitui os testes unitários, só prova que a composição inteira (rotas,
 * sessão, `Cliente` HTTP, TanStack Query, `shared/ui`) funciona junta num
 * navegador de verdade.
 *
 * A API está simulada por completo (`e2e/simulacao.ts`) — nenhuma requisição
 * sai para uma rede de verdade.
 */
test('entra, chega em /pessoas, pagina e filtra', async ({ page }) => {
  await instalarSimulacao(page)

  // A sessão é injetada em vez de passar pelo formulário: o login roda no
  // navegador contra o Google, e o Playwright não tem como fazê-lo. O caminho
  // real do login é coberto por `src/pages/entrar/PaginaEntrar.test.tsx`.
  await entrarComoAdministrador(page)
  await page.goto('/pessoas')

  // A asserção é sobre a TELA, e não sobre a URL: a guarda de rota mostra
  // "Verificando o acesso…" enquanto a sessão não chega, e uma checagem de
  // URL imediata correria contra esse instante. Chegar ao `h1` prova que a
  // guarda liberou.
  //
  // `h1` porque o shell não desenha cabeçalho nenhum acima: o título da tela
  // é o topo da árvore de cabeçalhos.
  await expect(page.getByRole('heading', { name: 'Pessoas', level: 1 })).toBeVisible()
  await expect(page).toHaveURL(/\/pessoas$/)

  // O menu lateral desenha os itens da área de trabalho para todo usuário
  // autenticado (`ITENS_MENU` em `app/shell/permissoes.ts` não declara
  // `grupo` em nenhum) — prova que o pipeline de sessão (login + userinfo)
  // rodou de ponta a ponta, não só a guarda de rota.
  //
  // "Pessoas" SAIU do menu quando o painel administrativo nasceu: era
  // andaime de boilerplate, não domínio da Planoteca. A rota continua de pé,
  // e é por isso que esta tela ainda abre.
  await expect(page.getByRole('link', { name: 'Moderação' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Catalogar' })).toBeVisible()

  // Tamanho de página padrão é 25 (`TAMANHOS_PAGINA`) — a fixture tem 26
  // pessoas, um total deliberadamente MAIOR que uma página: com um total
  // menor o botão "Próxima página" nasceria desabilitado e o teste passaria
  // sem provar nada sobre o `X-Total-Count`. A primeira página mostra
  // Pessoa001..Pessoa025 e esconde Pessoa026.
  await expect(page.getByText('Pessoa001 Exemplo')).toBeVisible()
  await expect(page.getByText('Pessoa025 Exemplo')).toBeVisible()
  await expect(page.getByText('Pessoa026 Exemplo')).toHaveCount(0)
  await expect(page.getByText(/de 26$/)).toBeVisible()

  await page.getByRole('button', { name: 'Próxima página' }).click()
  await expect(page.getByText('Pessoa026 Exemplo')).toBeVisible()
  await expect(page.getByText('Pessoa001 Exemplo')).toHaveCount(0)

  await page.getByRole('button', { name: 'Página anterior' }).click()
  await expect(page.getByText('Pessoa001 Exemplo')).toBeVisible()

  // A busca livre tem 300ms de atraso de digitação (`useFiltroPessoas`) — a
  // simulação filtra por `filter` contra `firstName`/`lastName`, do mesmo
  // jeito que o back-end faria.
  await page.getByRole('searchbox', { name: 'Buscar' }).fill('Pessoa017')
  await expect(page.getByText('Pessoa017 Exemplo')).toBeVisible()
  await expect(page.getByRole('row')).toHaveCount(2) // cabeçalho + 1 linha de dado
  await expect(page.getByText('1–1 de 1')).toBeVisible()
})
