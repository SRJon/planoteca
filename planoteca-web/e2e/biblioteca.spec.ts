import { expect, type Page, test } from '@playwright/test'
import { instalarSimulacao } from './simulacao'

/**
 * A caixa de marcar de um componente ou de uma metodologia, na coluna de
 * filtro.
 *
 * O nome acessível vem do `label` que embrulha a caixa (`GrupoFiltro.tsx`),
 * e ele carrega a contagem da faceta na mesma linha — "Matemática 3" hoje,
 * "Matemática 6" depois de marcar outro chip. Casar por substring é o que
 * mantém o seletor preso ao NOME do item, e não a um número que muda a cada
 * recorte. A sigla colorida ao lado não entra: ela é `aria-hidden`.
 *
 * **Por que os testes abaixo clicam, e não usam `check()`/`uncheck()`.**
 * Essas duas releem o `checked` do DOM logo depois do clique e falham se ele
 * ainda não mudou. Aqui ele demora: a caixa é CONTROLADA pela URL
 * (`useFiltroPlanos`), então o estado só volta ao DOM depois da navegação do
 * React Router e do re-render. O clique aplica o recorte — o que falha é a
 * releitura imediata, não a tela. Um `expect(...).toBeChecked()` logo
 * depois cobre o mesmo, e reexecuta até o estado chegar.
 */
function caixa(page: Page, nome: string) {
  return page.getByRole('checkbox', { name: new RegExp(nome) })
}

/**
 * Uma célula da régua de série.
 *
 * Continua `button` com `aria-pressed`, ao contrário de componente e
 * metodologia: a régua desenha a sigla e põe o nome por extenso no
 * `aria-label` (`ReguaSeries.tsx`), porque "6º" sozinho não diz de que
 * etapa é.
 */
function serie(page: Page, rotuloCompleto: string) {
  return page.getByRole('button', { name: rotuloCompleto, exact: true })
}

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
  await caixa(page, 'Matemática').click()
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
  await expect(caixa(page, 'Matemática')).toBeChecked()

  // Desmarcar a caixa desliga o recorte — ela é o próprio controle de
  // desfazer (`useFiltroPlanos.alternar`).
  await caixa(page, 'Matemática').click()
  await expect(page.getByText('14 planos')).toBeVisible()
})

/**
 * Multisseleção: dois itens do MESMO grupo somam (OU); um item de outro
 * grupo restringe (E). Prova também que a chave repetida sobrevive a um
 * recarregamento — a mesma exigência de "manda o link desse filtro" que o
 * teste acima cobre para um único valor.
 *
 * Os dois grupos aqui têm formas diferentes de controle de propósito, e o
 * teste passa pelas duas: componente é caixa de marcar, série é célula de
 * régua com `aria-pressed`. Se a semântica de um deles regredir, é aqui que
 * aparece.
 */
test('combina dois itens do mesmo grupo por OU, e grupos diferentes por E', async ({ page }) => {
  await instalarSimulacao(page)

  await page.goto('/biblioteca')
  await expect(page.getByText('14 planos')).toBeVisible()

  // Fixture cicla 5 componentes por índice: Matemática (0) pega 1/6/11,
  // Língua Portuguesa (1) pega 2/7/12 — seis planos ao todo, sem repetição.
  await caixa(page, 'Matemática').click()
  // O segundo clique só depois do primeiro ter chegado à URL: sem esta
  // espera, os dois competiriam pela mesma navegação e o segundo poderia
  // partir de um estado que ainda não tem Matemática — a chave repetida
  // nunca se formaria.
  await expect(caixa(page, 'Matemática')).toBeChecked()
  await caixa(page, 'Língua Portuguesa').click()

  await expect(page).toHaveURL(/componente=.*componente=/)
  await expect(page.getByText('6 planos')).toBeVisible()
  await expect(caixa(page, 'Matemática')).toBeChecked()
  await expect(caixa(page, 'Língua Portuguesa')).toBeChecked()

  // A chave repetida sobrevive ao recarregamento — o mesmo mecanismo do
  // valor único, agora com dois ids na mesma chave.
  await page.reload()
  await expect(page.getByText('6 planos')).toBeVisible()

  // Um item de OUTRO grupo restringe (E): só quem casa (Matemática OU
  // Português) E 6º ano. Na fixture, Português nunca cai em 6º ano — sobra
  // só Matemática + 6º ano (índices 0, 5, 10), três planos.
  await serie(page, '6º ano do Ensino Fundamental').click()
  await expect(page.getByText('3 planos')).toBeVisible()

  // Remover um dos dois itens do grupo componente não derruba o outro nem a
  // série: tirar Português (que aqui não casava nada) deixa o resultado
  // igual — a prova de que os grupos continuam independentes.
  await caixa(page, 'Língua Portuguesa').click()
  await expect(caixa(page, 'Matemática')).toBeChecked()
  await expect(serie(page, '6º ano do Ensino Fundamental')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('3 planos')).toBeVisible()
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

/**
 * A gaveta de filtro em 390px (RF-11).
 *
 * Abaixo de `lg` a coluna de filtro não cabe e vira gaveta atrás do botão
 * "Filtros" (`features/filtrar-planos/GavetaFiltros.tsx`). Este é o único
 * teste que a exercita num navegador de verdade: em jsdom o breakpoint não
 * existe, e os dois painéis pareceriam estar na tela ao mesmo tempo.
 *
 * O que ele prova, e que nenhum teste de unidade alcança: que marcar dentro
 * da gaveta aplica NA HORA — o rodapé "Ver N planos" só fecha — e que a
 * seleção continua legível com a gaveta fechada, através da pílula. Sem a
 * pílula, quem filtra no celular perde toda pista do recorte assim que a
 * gaveta some.
 *
 * Sem login, como o resto do arquivo.
 */
test('filtra pela gaveta em 390px, e a pílula mostra o recorte com ela fechada', async ({
  page,
}) => {
  await instalarSimulacao(page)
  // 390px é o iPhone 12/13/14 — a largura de referência do desenho, e a
  // menor que a Planoteca atende.
  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto('/biblioteca')
  await expect(page.getByText('14 planos')).toBeVisible()

  // A coluna do desktop está escondida por `max-lg:hidden`, e a gaveta
  // fechada não monta conteúdo nenhum (o Radix não renderiza `Dialog`
  // fechado): nesta largura NÃO existe caixa de marcar na árvore.
  await expect(caixa(page, 'Matemática')).toHaveCount(0)

  const filtros = page.getByRole('button', { name: 'Filtros' })
  await filtros.click()

  const gaveta = page.getByRole('dialog')
  await expect(gaveta).toBeVisible()

  // Marcar aplica na hora: a contagem do rodapé acompanha, ainda com a
  // gaveta aberta. É a prova de que não há estado temporário esperando um
  // "Aplicar" — a URL continua a fonte única da verdade.
  await caixa(page, 'Matemática').click()
  const verPlanos = gaveta.getByRole('button', { name: 'Ver 3 planos' })
  await expect(verPlanos).toBeVisible()

  // O rodapé só FECHA. Nada de recorte acontece aqui.
  await verPlanos.click()
  await expect(gaveta).toBeHidden()

  // E com a gaveta fechada, a pílula é a única leitura do recorte nesta
  // largura. O rótulo acessível diz a AÇÃO, não só o nome — ver `Pilula`
  // em `SelecaoAtiva.tsx`.
  await expect(page.getByRole('button', { name: 'Remover Matemática' })).toBeVisible()
  await expect(page.getByText('3 planos')).toBeVisible()
  await expect(page.getByRole('list', { name: 'Planos de aula' }).getByRole('listitem')).toHaveCount(
    3,
  )
})

/**
 * A geometria da gaveta em 390px.
 *
 * Separado do teste acima de propósito: aquele prova o COMPORTAMENTO —
 * marcar aplica, o rodapé fecha, a pílula sobrevive — e passava intacto
 * enquanto a gaveta abria deslocada meia tela para a direita, com o botão
 * de aplicar fora do viewport. Comportamento correto em posição errada
 * ainda é uma tela que o professor não consegue usar.
 *
 * A causa era de cascata: o `cn()` deste projeto é `join(' ')` sem
 * tailwind-merge, então o `left-0` da gaveta não vencia o `left-1/2` do
 * `DialogContent` — quem decidia era a ordem no CSS gerado. Hoje os dois
 * posicionamentos são exclusivos por construção (`variante="gaveta"`), e
 * este teste é o que impede a regressão silenciosa.
 */
test('a gaveta ocupa a largura da tela em 390px, sem vazar', async ({ page }) => {
  await instalarSimulacao(page)
  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto('/biblioteca')
  await page.getByRole('button', { name: 'Filtros' }).click()

  const gaveta = page.getByRole('dialog')
  await expect(gaveta).toBeVisible()

  const caixaGaveta = await gaveta.boundingBox()
  if (!caixaGaveta) throw new Error('a gaveta não tem caixa')

  // Colada na borda esquerda e ocupando a largura inteira. Com o bug isto
  // era x:195, w:390 — metade dela fora da tela.
  expect(caixaGaveta.x).toBe(0)
  expect(caixaGaveta.width).toBe(390)

  // Os dois botões do rodapé precisam estar ALCANÇÁVEIS, não só montados.
  for (const nome of ['Limpar', 'Ver 14 planos']) {
    const botao = await gaveta.getByRole('button', { name: nome }).boundingBox()
    if (!botao) throw new Error(`o botão ${nome} não tem caixa`)
    expect(botao.x).toBeGreaterThanOrEqual(0)
    expect(botao.x + botao.width).toBeLessThanOrEqual(390)
  }

  // E a página não ganha rolagem horizontal por causa dela.
  const largura = await page.evaluate(() => ({
    documento: document.documentElement.scrollWidth,
    janela: window.innerWidth,
  }))
  expect(largura.documento).toBeLessThanOrEqual(largura.janela)
})
