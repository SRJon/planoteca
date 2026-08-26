/**
 * Os nomes dos tokens de `src/app/estilos/tema.css`, para o catálogo mostrar
 * as escalas sem redesenhar CSS.
 *
 * Por que é uma lista escrita à mão, e não derivada por IMPORT como a lista
 * de componentes: um custom property de CSS não tem representação nenhuma em
 * JavaScript em tempo de execução — não existe um `import` equivalente que
 * devolva `{ background: '...', primary: '...' }`. Ler o arquivo bruto e
 * extrair os nomes por regex resolve a derivação (é o que
 * `PaginaDesignSystem.test.tsx` faz, com `node:fs`), mas só dentro de um
 * TESTE, não dentro desta página: um `import '../../app/estilos/tema.css?raw'`
 * aqui, no módulo da própria página, seria `pages → app` de verdade —
 * exatamente o que `boundaries/element-types` proíbe (`eslint.config.js`:
 * `pages` só alcança `features`, `entities`, `shared`). Um `readFileSync` de
 * teste não cruza essa fronteira: a regra audita `import`/`require`, não
 * leitura de arquivo em tempo de teste — `scripts/verifica-tokens.mjs` já
 * prova isso, lendo o mesmo arquivo com `node:fs/promises` sem nunca
 * importar `app/estilos`.
 *
 * Por isso os arrays abaixo continuam escritos à mão — definem a ORDEM de
 * exibição da página, papel que uma derivação automática não teria como
 * cumprir sozinha — mas não ficam sem garantia: `PaginaDesignSystem.test.tsx`
 * lê o `tema.css` por `node:fs` e confere, nome a nome, que estes arrays são
 * exatamente o conjunto que ele declara — nem falta um token novo, nem sobra
 * um removido, nas DUAS direções.
 */

/**
 * As primitivas do bloco `@theme`. No CSS elas se chamam `--color-blue-500`,
 * porque a v4 exige o prefixo `--color-` para gerar utilitário; aqui e na
 * tela aparecem sem ele, que é o nome que se escreve numa classe.
 */
export const TOKENS_COR_PRIMITIVAS = [
  'caneta-900', 'caneta-700', 'caneta-500', 'caneta-300', 'caneta-100',
  'mimeo-900', 'mimeo-700', 'mimeo-500', 'mimeo-100',
  'regua-700', 'regua-500', 'regua-100',
  'tinta-900', 'tinta-700', 'tinta-500', 'tinta-300', 'tinta-200', 'tinta-100', 'tinta-050',
  'branco',
  'sinal-ok', 'sinal-erro', 'sinal-aviso',
  // Área do conhecimento — a cor do bloco do card desde que o vocabulário
  // virou tabela no banco. Quatro, e não uma por componente: com 13
  // componentes, treze cores distinguíveis com contraste AA não existem.
  'comp-linguagens', 'comp-matematica', 'comp-natureza', 'comp-humanas',
  // Legado da lista fechada de oito componentes. Nenhuma tela os consome;
  // ficam catalogados aqui enquanto a paleta antiga for referência visual.
  'comp-portugues', 'comp-ciencias', 'comp-historia',
  'comp-geografia', 'comp-arte', 'comp-edfisica', 'comp-ingles', 'comp-texto',
] as const

/**
 * Os nomes que o shadcn espera, e que a tela de fato escreve —
 * `bg-background`, `text-muted-foreground`, `border-border`. Cada um aponta,
 * por `var()`, para um token da camada `:root`/`.dark`, e é essa indireção
 * que faz o utilitário trocar junto com o tema.
 */
export const TOKENS_COR_SHADCN = [
  'background', 'foreground',
  'card', 'card-foreground',
  'popover', 'popover-foreground',
  'primary', 'primary-foreground',
  'secondary', 'secondary-foreground',
  'muted', 'muted-foreground',
  'accent', 'accent-foreground',
  'destructive', 'destructive-foreground',
  'border', 'input', 'ring', 'overlay',
] as const

/**
 * Os nomes próprios da marca, que o vocabulário do shadcn não cobre: a
 * identidade, os quatro estados de feedback e as superfícies da barra
 * lateral.
 */
export const TOKENS_COR_MARCA = [
  'brand', 'brand-d', 'brand-subtle', 'painel',
  'acao', 'acao-hover', 'acao-ativa', 'acao-texto',
  'traco', 'traco-suave',
  'ok', 'ok-bg', 'warn', 'warn-bg', 'err', 'err-bg', 'info', 'info-bg',
  'side-bg', 'side-ink', 'side-ativo-bg', 'side-ativo-ink', 'side-marca',
  'inverso-bg', 'inverso-bg-2', 'inverso-ink', 'inverso-ink-2', 'inverso-linha',
] as const

/**
 * A escala de z-index. Degraus nomeados, nunca número solto — e a ordem NÃO
 * é sequencial de propósito: `--camada-menu` fica acima de `--camada-dialogo`
 * porque os portais do Radix são irmãos no `body`, e só o número decide quem
 * pinta na frente. A seção "Camadas" da página é a prova viva disso.
 */
export const TOKENS_CAMADA = [
  'camada-base',
  'camada-veu',
  'camada-dialogo',
  'camada-menu',
  'camada-aviso',
  'camada-cabecalho-tabela',
  'camada-cabecalho-tabela-canto',
] as const

/** As cinco medidas de raio. `--raio-3` é o mesmo valor de `--radius`. */
export const TOKENS_RAIO = ['raio-1', 'raio-2', 'raio-3', 'raio-4', 'raio-5'] as const
