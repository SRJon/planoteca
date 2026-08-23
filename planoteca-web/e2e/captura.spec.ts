import { test } from '@playwright/test'
import { instalarSimulacao } from './simulacao'

/** Captura de tela para conferência visual. Não afirma nada — só produz os
 * PNGs. Sem login: as duas telas são públicas. */
test('captura a landing e a biblioteca', async ({ page }) => {
  await instalarSimulacao(page)

  await page.setViewportSize({ width: 1280, height: 1100 })
  await page.goto('/')
  await page.getByRole('heading', { level: 1 }).waitFor()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'captura-inicio.png', fullPage: true })

  await page.goto('/biblioteca')
  await page.getByRole('heading', { name: 'Biblioteca', level: 1 }).waitFor()
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'captura-biblioteca.png', fullPage: true })

  await page.setViewportSize({ width: 390, height: 900 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'captura-biblioteca-mobile.png', fullPage: true })

  await page.goto('/')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'captura-inicio-mobile.png', fullPage: true })

  await page.setViewportSize({ width: 1280, height: 1100 })
  await page.goto('/biblioteca/10000000-0000-0000-0000-000000000003')
  await page.getByRole('heading', { level: 1 }).waitFor()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'captura-ficha.png', fullPage: true })
})
