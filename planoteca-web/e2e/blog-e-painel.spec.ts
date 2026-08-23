import { expect, test } from '@playwright/test'
import { entrarComoAdministrador, instalarSimulacao } from './simulacao'

/**
 * O Blog do lado de quem LÊ — sem login, como o resto do acervo.
 */
test('lê o blog e abre um texto, sem entrar', async ({ page }) => {
  await instalarSimulacao(page)

  await page.goto('/blog')
  await expect(page.getByRole('heading', { name: 'Blog', level: 1 })).toBeVisible()

  // Só o publicado. A fixture tem um pendente e um devolvido, e nenhum dos
  // dois existe para quem chega de fora.
  await expect(page.getByText('Escape Room na aula de Química')).toBeVisible()
  await expect(page.getByText('Rotação por estações em turma grande')).toHaveCount(0)

  await page.getByRole('link', { name: 'Escape Room na aula de Química' }).click()
  await expect(page).toHaveURL(/\/blog\/70000000-0000-0000-0000-000000000001$/)
  await expect(page.getByText(/Relato completo da prática/)).toBeVisible()

  await page.getByRole('link', { name: 'Voltar ao Blog' }).click()
  await expect(page).toHaveURL(/\/blog$/)
})

/**
 * A navegação das três abas, que é a estrutura que o produto descreve.
 */
test('navega entre Início, Biblioteca e Blog', async ({ page }) => {
  await instalarSimulacao(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /plano de aula pronto/i })).toBeVisible()

  const navegacao = page.getByRole('navigation', { name: 'Áreas do acervo' })
  await navegacao.getByRole('link', { name: 'Biblioteca' }).click()
  await expect(page.getByRole('heading', { name: 'Biblioteca', level: 1 })).toBeVisible()

  await navegacao.getByRole('link', { name: 'Blog' }).click()
  await expect(page.getByRole('heading', { name: 'Blog', level: 1 })).toBeVisible()

  await navegacao.getByRole('link', { name: 'Início' }).click()
  await expect(page.getByRole('heading', { name: /plano de aula pronto/i })).toBeVisible()

  // Em nenhum momento apareceu o formulário de login: o acervo é público.
  await expect(page.getByRole('heading', { name: 'Entrar' })).toHaveCount(0)
})

/**
 * O painel administrativo, do login à fila de moderação.
 *
 * É o caminho que quem MANTÉM o acervo percorre — o oposto do de cima.
 */
test('entra e percorre as quatro telas do painel', async ({ page }) => {
  await instalarSimulacao(page)

  await entrarComoAdministrador(page)
  await page.goto('/admin/moderacao')

  // Ancorado na barra lateral: a tela de planos tem um link "Catalogar
  // novo", e uma busca solta por "Catalogar" casaria os dois.
  const menu = page.getByRole('navigation', { name: 'Navegação principal' })

  // A moderação abre a lista de propósito: é o que precisa de atenção.
  await menu.getByRole('link', { name: 'Moderação' }).click()
  await expect(page.getByRole('heading', { name: 'Moderação do blog', level: 1 })).toBeVisible()
  await expect(page.getByText('Rotação por estações em turma grande')).toBeVisible()

  // Ler o texto sem sair da fila.
  await page.getByRole('button', { name: 'Ler o texto' }).click()
  await expect(page.getByText('Texto aguardando aprovação.')).toBeVisible()

  // Devolver sem comentário é recusado — RF-11.
  await page.getByRole('button', { name: 'Devolver para ajuste' }).click()
  await expect(
    page.getByText('Diga ao autor por que o texto foi devolvido ou recusado.'),
  ).toBeVisible()

  await menu.getByRole('link', { name: 'Planos', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Planos do acervo', level: 1 })).toBeVisible()

  await menu.getByRole('link', { name: 'Catalogar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Catalogar plano', level: 1 })).toBeVisible()

  await menu.getByRole('link', { name: 'Escrever', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Escrever para o Blog', level: 1 })).toBeVisible()

  // O editor de texto rico: escreve, aplica negrito, e o botão reflete o
  // cursor — a mesma garantia que `PaginaEscrever.test.tsx` cobre em
  // isolamento, aqui contra o roteador e o layout de verdade.
  await page.getByLabel('Título', { exact: true }).fill('Um relato de sala, pelo e2e')
  const editor = page.getByRole('textbox', { name: '' }).last()
  await editor.click()
  await page.keyboard.type('texto em negrito')
  await page.keyboard.press('ControlOrMeta+a')

  const botaoNegrito = page.getByRole('button', { name: 'Negrito' })
  await botaoNegrito.click()
  await expect(botaoNegrito).toHaveAttribute('aria-pressed', 'true')
  await expect(editor.locator('strong')).toHaveText('texto em negrito')
})
