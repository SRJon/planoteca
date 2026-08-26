import { expect, test } from '@playwright/test'
import { instalarSimulacao } from './simulacao'

/**
 * A landing ponta a ponta, SEM LOGIN.
 *
 * Prova o que o jsdom não alcança: que a lista de componentes de uma área
 * abre no HOVER de um cursor real (a variante `group-hover:` do Tailwind não
 * existe em aparelho sem cursor, e jsdom não tem nem um nem outro), e que no
 * celular o mesmo card abre no TOQUE, pelo estado do `aria-expanded`.
 *
 * A ausência do login aqui é deliberada, como em `biblioteca.spec.ts`: o
 * acervo é público, e a landing é a porta dele.
 */

/** Ciências Humanas na fixture — ver `src/teste/planos.ts`. */
const AREA_HUMANAS = 'Ciências Humanas e Sociais Aplicadas'
const ID_HISTORIA = '20000000-0000-0000-0000-000000000004'

test('o hover num card de área revela os componentes, e o filho leva ao filtro', async ({
  page,
}) => {
  await instalarSimulacao(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /Plano de aula pronto/ })).toBeVisible()

  const cabecalho = page.getByRole('button', { name: new RegExp(AREA_HUMANAS) })
  await expect(cabecalho).toBeVisible()

  const historia = page.getByRole('link', { name: 'História' })
  await expect(historia).toBeHidden()

  await cabecalho.hover()
  await expect(historia).toBeVisible()

  await historia.click()
  await expect(page).toHaveURL(new RegExp(`componente=${ID_HISTORIA}`))
  // A Biblioteca abre com o recorte JÁ aplicado — é a mesma porta, não um
  // atalho que só pré-preenche um campo.
  await expect(page.getByRole('button', { name: 'História' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('a busca do hero leva à Biblioteca com o termo', async ({ page }) => {
  await instalarSimulacao(page)
  await page.goto('/')

  await page.getByRole('searchbox', { name: /Buscar por assunto/ }).fill('juros')
  await page.getByRole('button', { name: 'Buscar' }).click()

  await expect(page).toHaveURL(/\/biblioteca\?q=juros/)
})

test('no celular, tocar no card abre os componentes da área', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await instalarSimulacao(page)
  await page.goto('/')

  const cabecalho = page.getByRole('button', { name: new RegExp(AREA_HUMANAS) })
  await expect(cabecalho).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('link', { name: 'História' })).toBeHidden()

  await cabecalho.click()

  await expect(cabecalho).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('link', { name: 'História' })).toBeVisible()
})
