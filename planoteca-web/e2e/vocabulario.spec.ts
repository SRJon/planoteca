import { expect, test } from '@playwright/test'
import { entrarComoAdministrador, instalarSimulacao } from './simulacao'

/**
 * A gestão de vocabulário ponta a ponta (RF-07 e RF-09): entra como
 * administrador, abre `/admin/vocabulario`, cadastra um componente e o vê
 * na lista, sem recarregar — a mutação invalida `CHAVE_VOCABULARIO` (RF-08).
 *
 * Cobre também a troca de aba, porque as três listas (componentes, séries,
 * metodologias) vivem na mesma tela, e cada uma tem o próprio conteúdo.
 */
test('cadastra um componente e troca de aba', async ({ page }) => {
  await instalarSimulacao(page)
  await entrarComoAdministrador(page)

  await page.goto('/admin/vocabulario')
  await expect(page.getByRole('heading', { name: 'Vocabulário', level: 1 })).toBeVisible()

  // Começa na aba de componentes, com o dado da fixture visível.
  // `getByRole('heading', ...)`, e não `getByText`: cada linha também traz
  // um botão "Desativar" cujo rótulo acessível repete o nome do item
  // (`<span class="sr-only">: Língua Portuguesa</span>`), e uma busca por
  // texto solto casaria os dois.
  await expect(page.getByRole('button', { name: 'Componentes' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Língua Portuguesa' })).toBeVisible()

  // Cadastra um componente novo. A rota simulada
  // (`POST /admin/vocabulary/components`) devolve 201 e o formulário fecha.
  //
  // O nome é SOCIOLOGIA, e não Filosofia: esta já vive na fixture
  // administrativa como o item desativado, e uma asserção sobre ela passaria
  // por já estar na tela desde o carregamento. O teste precisa de um nome que
  // só pode ter chegado ali pelo cadastro.
  await page.getByRole('button', { name: 'Cadastrar componente' }).click()
  await page.getByLabel('Nome').fill('Sociologia')
  await page.getByLabel('Área do conhecimento').fill('Ciências Humanas e Sociais Aplicadas')
  await page.getByLabel('Sigla (duas letras)').fill('SO')
  await page.getByLabel('Ordem').fill('7')
  await page.getByRole('button', { name: 'Salvar' }).click()

  // A lista atualiza sem recarregar a página — a prova de RF-08.
  await expect(page.getByRole('heading', { name: 'Sociologia' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cadastrar componente' })).toHaveCount(0)

  // Troca de aba: a lista de séries é outro conteúdo, com o próprio dado.
  await page.getByRole('button', { name: 'Séries' }).click()
  await expect(page.getByRole('heading', { name: '6º ano' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Língua Portuguesa' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Metodologias' }).click()
  await expect(page.getByRole('heading', { name: 'Escape Room' })).toBeVisible()
})
