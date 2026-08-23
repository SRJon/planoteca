import { expect, test } from '@playwright/test'

/**
 * Prova a ordem de pintura — a única coisa que este teste existe para provar.
 * Nenhuma suíte de unidade pode substituí-lo: jsdom não faz layout nem
 * pintura, então lá o `select` aberto dentro de um `dialog` aberto parece
 * íntegro mesmo quando, num navegador de verdade, a lista some atrás do véu.
 * Esse é o furo que este spec fecha.
 *
 * `/design-system` é dev-only — só existe quando `import.meta.env.DEV` é
 * `true`. `playwright.config.ts` roda contra o servidor de desenvolvimento
 * por causa disto; ver o comentário lá.
 *
 * Como a prova funciona: o `DialogOverlay` do shadcn é `fixed inset-0` —
 * cobre o viewport inteiro. `Dialog.Portal` e `Select.Portal` do Radix
 * anexam em `document.body` como IRMÃOS, não como descendentes: entre irmãos
 * `position: fixed` no nível do body, quem decide a ordem de pintura é só o
 * empilhamento, nunca a hierarquia visual. Por isso a lista precisa pintar
 * por cima do véu em QUALQUER ponto do viewport, não só onde ela se sobrepõe
 * visualmente ao painel do diálogo — dispensa depender de onde o Popper
 * decide posicionar a lista. `document.elementFromPoint` no centro de uma
 * opção devolve a própria opção (ou um filho dela) quando ela pinta por
 * cima; devolve o véu (ou o que estiver por cima dele) quando não pinta.
 *
 * Prova negativa, obrigatória antes de considerar este teste válido, e
 * reproduzível em um minuto: baixe o `z-50` do `SelectContent`
 * (`src/components/ui/select.tsx`) para `z-40`, abaixo do `z-50` do
 * `DialogOverlay`, e rode `npm run e2e`. A asserção de `elementFromPoint`
 * abaixo falha — o véu volta a vencer a lista. Feito, e o raciocínio inteiro
 * está em `docs/decisoes-da-fundacao.md` §3 e no comentário de `--camada-*`
 * em `src/app/estilos/tema.css`.
 */
test('a lista do select aberta dentro de um dialog aberto pinta acima do véu e do painel', async ({
  page,
}) => {
  await page.goto('/design-system')

  await page.getByRole('button', { name: 'Abrir diálogo com seleção' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Novo registro' })
  await expect(dialogo).toBeVisible()

  await dialogo.getByRole('combobox').click()
  const opcao = page.getByRole('option', { name: 'Filial Norte' })
  await expect(opcao).toBeVisible()

  const caixa = await opcao.boundingBox()
  if (!caixa) throw new Error('A opção não tem bounding box — não montou de verdade.')
  const x = caixa.x + caixa.width / 2
  const y = caixa.y + caixa.height / 2

  // A prova em si: o elemento que de fato receberia um clique neste ponto
  // (o topo da pilha de pintura) precisa pertencer à lista do select, não
  // ao véu nem ao painel do diálogo — os três se sobrepõem neste pixel, e
  // só o empilhamento decide quem vence.
  const opcaoPintaPorCima = await page.evaluate(
    ([px, py]) => document.elementFromPoint(px, py)?.closest('[role="option"]') !== null,
    [x, y] as [number, number],
  )
  expect(opcaoPintaPorCima).toBe(true)

  // A mesma ordem também precisa deixar a opção CLICÁVEL, não só visível no
  // topo da pintura — `.click()` do Playwright confere isso via
  // actionability (o alvo precisa estar recebendo eventos de ponteiro no
  // ponto clicado) antes de despachar o evento.
  await opcao.click()
  await expect(dialogo.getByRole('combobox')).toContainText('Filial Norte')
  await expect(dialogo).toBeVisible()
})
