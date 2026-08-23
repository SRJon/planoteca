import { expect, test } from '@playwright/test'
import { instalarSimulacao } from './simulacao'

/**
 * Prova que o ARTEFATO DE PRODUÇÃO sobe — não que ele compila.
 *
 * O furo que este spec fecha: `src/shared/config/index.ts` avalia
 * `lerAmbiente(import.meta.env)` no carregamento do módulo e LANÇA sem
 * `VITE_URL_API`. Vite substitui `import.meta.env.VITE_URL_API` em tempo de
 * BUILD — sem a variável no ambiente do build, o bundle sai com o valor
 * estaticamente `undefined`. O `npm run build` termina com código 0 e a
 * aplicação estoura na primeira pintura. Sucesso de build estava sendo lido
 * como sucesso de boot.
 *
 * Os outros dois specs não cobrem isso de propósito: `playwright.config.ts`
 * roda o projeto `dev` contra `npm run dev`, porque `/design-system` só
 * existe com `import.meta.env.DEV`. O projeto `producao` deste arquivo tem
 * webServer próprio, que constrói com a variável definida e serve `dist` por
 * `vite preview`.
 *
 * `pageerror` é escutado porque a falha desta classe não deixa marca no DOM:
 * o React nunca monta, a página fica em branco, e um `expect` de elemento
 * ausente diria "não encontrei o cabeçalho" sem dizer o motivo.
 */
test('o bundle construído sobe e renderiza a tela de entrada', async ({ page }) => {
  const errosDePagina: string[] = []
  page.on('pageerror', (erro) => errosDePagina.push(erro.message))

  await instalarSimulacao(page)
  await page.goto('/entrar')

  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  expect(errosDePagina).toEqual([])
})

test('a rota dev-only /design-system não existe no bundle de produção', async ({ page }) => {
  // Complemento do teste de bundle da Tarefa 20, que provava a eliminação por
  // varredura de texto em `dist`. Aqui a prova é de comportamento: a rota
  // responde com o "não encontrada" da aplicação, não com a página.
  await instalarSimulacao(page)
  await page.goto('/design-system')

  await expect(page.getByRole('heading', { name: 'Design system' })).toHaveCount(0)
})
