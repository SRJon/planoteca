import { expect, test } from '@playwright/test'
import { instalarSimulacao } from './simulacao'

/**
 * A Biblioteca ponta a ponta, SEM LOGIN: abrir, filtrar por componente e
 * paginar.
 *
 * A ausência do login aqui é o teste mais importante do arquivo. O acervo é
 * público por decisão de produto — o professor chega com pressa, e qualquer
 * porta entre ele e o PDF derruba o uso. Se alguém puser a Biblioteca atrás
 * da guarda, este teste falha logo na primeira linha.
 *
 * Prova também o que os testes de unidade não alcançam: que o filtro chega à
 * querystring no formato que o back-end espera (`subject=math`, não
 * `componente=matematica`) — a tradução de `entities/plano/mapeador.ts` —
 * e que o estado sobrevive a um recarregamento, porque ele vive na URL.
 *
 * A API está simulada por completo (`e2e/simulacao.ts`).
 */
test('filtra a biblioteca por componente e pagina, sem entrar', async ({ page }) => {
  await instalarSimulacao(page)

  await page.goto('/biblioteca')

  await expect(page).toHaveURL(/\/biblioteca$/)
  await expect(page.getByRole('heading', { name: 'Biblioteca', level: 1 })).toBeVisible()

  // A fixture tem 14 planos, um total deliberadamente MAIOR que o tamanho
  // de página (12): com um total menor, "Próxima" nasceria desabilitada e a
  // paginação passaria sem provar nada sobre o `X-Total-Count`.
  await expect(page.getByText('14 planos')).toBeVisible()
  // Ancorado na lista de planos, e não em `getByRole('listitem')` solto: a
  // navegação de áreas do `LayoutPublico` também é uma lista, e os itens
  // dela entrariam na contagem.
  const planos = page.getByRole('list', { name: 'Planos de aula' })
  await expect(planos.getByRole('listitem')).toHaveCount(12)

  await page.getByRole('button', { name: 'Próxima' }).click()
  await expect(planos.getByRole('listitem')).toHaveCount(2)

  // Filtrar por componente reinicia a paginação (`useFiltroPlanos` força
  // `page=1` a cada recorte) — sem isso, ficar na página 2 de um recorte de
  // 2 planos mostraria uma lista vazia com filtro aplicado.
  await page.getByRole('button', { name: 'Matemática' }).click()
  // O parâmetro carrega o ID do vocabulário, que vem de
  // `GET /api/v1/vocabulary` — não mais um slug traduzido no front.
  await expect(page).toHaveURL(/componente=20000000-0000-0000-0000-000000000001/)
  // Trocar o recorte volta para a página 1: sem isso, ficar na página 2 de
  // um recorte de 3 planos mostraria lista vazia com filtro aplicado.
  await expect(page).not.toHaveURL(/pagina=2/)

  // A fixture cicla cinco componentes por índice sobre 14 planos, então
  // Matemática (índice 0) casa com os planos 1, 6 e 11.
  await expect(page.getByText('3 planos')).toBeVisible()
  await expect(planos.getByRole('listitem')).toHaveCount(3)

  // O estado inteiro vive na URL: recarregar preserva o recorte. É o que
  // faz "manda o link desse filtro" funcionar entre professores.
  await page.reload()
  await expect(page.getByText('3 planos')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Matemática' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  // Tocar no chip já ativo desliga o recorte — o chip é o próprio botão de
  // desfazer (`useFiltroPlanos.alternar`).
  await page.getByRole('button', { name: 'Matemática' }).click()
  await expect(page.getByText('14 planos')).toBeVisible()
})

/**
 * Do card para a ficha, sem login.
 *
 * É o caminho completo de quem chega ao acervo: filtra, escolhe, lê a ficha
 * e baixa. Nenhum passo pede conta — se algum dia pedir, este teste falha.
 */
test('abre a ficha de um plano a partir do card', async ({ page }) => {
  await instalarSimulacao(page)

  await page.goto('/biblioteca')
  await expect(page.getByRole('heading', { name: 'Biblioteca', level: 1 })).toBeVisible()

  // O título do card é o link para a ficha. O card inteiro NÃO é clicável:
  // engoliria o botão de baixar, que é outro link.
  //
  // `exact: true` porque o botão de baixar carrega o título no rótulo
  // acessível ("Baixar plano: Plano003 de exemplo") — é o que faz um leitor
  // de tela distinguir os catorze botões "Baixar plano" da grade, e por isso
  // uma busca por substring casa os dois links.
  await page.getByRole('link', { name: 'Plano003 de exemplo', exact: true }).click()

  await expect(page).toHaveURL(/\/biblioteca\/10000000-0000-0000-0000-000000000003$/)
  await expect(page.getByRole('heading', { name: 'Plano003 de exemplo', level: 1 })).toBeVisible()

  // O plano interdisciplinar: duas séries e dois componentes na mesma ficha.
  await expect(
    page.getByText('8º ano do Ensino Fundamental · 9º ano do Ensino Fundamental'),
  ).toBeVisible()

  // O roteiro em passos, que o card não mostra.
  await expect(page.getByText('Início da Missão')).toBeVisible()

  // O download aponta para o arquivo, sem token.
  const baixar = page.getByRole('link', { name: /Baixar plano/ }).first()
  await expect(baixar).toHaveAttribute('download', '')

  // E há saída de volta: quem abriu a ficha por engano não fica preso.
  await page.getByRole('link', { name: 'Voltar à Biblioteca' }).click()
  await expect(page).toHaveURL(/\/biblioteca$/)
})
