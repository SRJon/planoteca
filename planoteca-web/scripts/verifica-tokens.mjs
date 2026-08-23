// Reprova em `src/**` a dívida que a camada de tema veio resolver:
//   - cor literal fora do tema: hex, rgb/rgba/hsl/hsla/hwb/lab/lch/
//     oklab/oklch/color/color-mix(...), ou uma das 147 cores nomeadas do CSS
//   - classe de cor CRUA do Tailwind no JSX (`bg-slate-950`, `text-zinc-400`)
//   - border-radius com valor que não está na escala de --raio-*
//   - z-index com número literal em vez de --camada-*
// Uso:
//   node scripts/verifica-tokens.mjs
import { readFile, glob } from 'node:fs/promises'
import { exit } from 'node:process'

// O único lugar onde cor mora. Todo o resto de `src/` é arquivo de
// componente, e cor literal ali é o defeito que este script existe para
// pegar. O caminho é comparado com a barra normalizada, porque o `glob` do
// Node devolve `\` no Windows.
const ARQUIVO_TEMA = 'src/app/estilos/tema.css'

const RAIO_VALIDO = new Set(['4px', '6px', '8px', '12px', '999px', '0', '0px', '50%'])
// A sintaxe elíptica de border-radius ("4px / 8px", raio horizontal/vertical
// distintos) é reprovada de propósito: nenhum uso dela existe hoje no
// sistema, e aceitá-la sem token específico reabriria a porta que --raio-*
// veio fechar. Se aparecer um caso real, é para declarar um token novo, não
// para o verificador passar a aceitar valor solto.

// `transparent`, `currentColor` e `inherit` (e os outros CSS-wide keywords:
// initial/unset/revert) ficam de fora da lista abaixo de propósito — não são
// cor literal no sentido que este script reprova, são a ausência de uma cor
// própria ou uma referência a outra já resolvida. É por isso que o SVG
// inline com `stroke="currentColor"` passa.
const CORES_NOMEADAS = [
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
  'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan',
  'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta',
  'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
  'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink',
  'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen',
  'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'grey', 'green',
  'greenyellow', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
  'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan',
  'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon',
  'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue',
  'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine',
  'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue',
  'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream',
  'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
  'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred',
  'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple',
  'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell',
  'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen',
  'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white',
  'whitesmoke', 'yellow', 'yellowgreen',
]

const HEX_REGEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/
const FUNCAO_COR_REGEX = /\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color-mix|color)\s*\(/
// Cor nomeada só conta dentro do VALOR de uma declaração — por isso a
// exigência de estar cercada por `:`, `,`, `(` ou espaço de um lado e por
// `;`, `,`, `)`, espaço ou fim de linha do outro. Isso evita marcar como cor
// um seletor de classe (`.text-red`), um nome de propriedade customizada
// (`--marca-red`) ou parte de um identificador maior (`goldenrod` não
// dispara por conter `gold`, porque o `gold` do meio não tem fronteira).
const NOME_COR_REGEX = new RegExp(
  String.raw`(?<=[:,(\s])(?:${CORES_NOMEADAS.join('|')})(?=[;,)\s]|$)`,
  'i',
)

// ── A regra do Tailwind ────────────────────────────────────────────────────
// O Tailwind muda o que "cor literal" significa: `bg-slate-950` não é hex,
// mas espalha cor fora do tema do mesmo jeito. As duas coisas são recusadas.
//
// A lista do que é ACEITO não fica escrita aqui: ela é DERIVADA das
// declarações `--color-*` do bloco `@theme` do `tema.css`. Acrescentar
// `--color-warning` ao tema faz `bg-warning` passar a valer sem tocar neste
// arquivo. Uma lista fixa aqui apodreceria à primeira cor nova.

// Os utilitários do Tailwind que recebem um nome de cor. `shadow` e `ring`
// também aceitam tamanho (`shadow-lg`, `ring-2`), e por isso o par
// nome/tamanho é desempatado pela paleta, não pelo prefixo: só reprova o que
// bate com um nome da paleta embutida.
const PREFIXOS_COR = [
  'bg', 'text', 'border', 'ring', 'outline', 'divide', 'fill', 'stroke',
  'shadow', 'accent', 'caret', 'decoration', 'placeholder', 'from', 'via', 'to',
]

// A paleta embutida do Tailwind v4. É esta lista que `bg-slate-950` usa, e é
// exatamente ela que a guarda recusa: usar a paleta do framework em vez do
// tema quebra a promessa de que trocar a paleta num lugar troca o app.
//
// A guarda é lista NEGRA, não lista branca. `bg-inventado-999` passa, e isso é
// deliberado: uma classe que o tema não declara também não pinta nada, o
// Tailwind já a ignora no build, e uma lista branca reprovaria o que é
// legítimo — `bg-[url(...)]`, `bg-gradient-to-r`, classe de plugin.
//
// O `nomesDoTema` abaixo NÃO decide o que passa. Ele escolhe a mensagem: um
// nome que consta no tema e colide com a paleta é "primitiva do tema", o
// resto é "paleta do Tailwind". A correção é diferente em cada caso.
const PALETA_TAILWIND = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose', 'black', 'white',
]

// Uma classe utilitária pode vir com variante (`hover:`, `dark:`, `md:`,
// `group-hover:`), com `!` de importante e com grau (`-500`). O grupo 1 é o
// prefixo, o grupo 2 é o nome da cor mais o grau opcional.
const CLASSE_COR_REGEX = new RegExp(
  String.raw`(?<![\w-])!?(${PREFIXOS_COR.join('|')})-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)(?![\w-])`,
  'g',
)

/**
 * O corpo do bloco `@theme { ... }`, por contagem de chave. Um regex
 * preguiçoso pararia na primeira `}` de dentro; o tema não tem aninhamento
 * hoje, mas contar chave não depende disso continuar verdade.
 *
 * A busca acontece sobre o texto SEM comentário, mas o corte sai do texto
 * original — `semComentarios` troca cada caractere de comentário por espaço
 * e preserva o deslocamento, então os dois índices batem. Sem isso, a
 * primeira menção a `@theme` DENTRO de um comentário (o bloco PONTO DE TROCA
 * cita a diretiva ao explicar por que a camada semântica existe) sequestraria
 * a busca, e a guarda leria o `{` errado.
 */
function blocoTheme(conteudoOriginal) {
  const conteudo = semComentarios(conteudoOriginal, false)
  const abre = conteudo.indexOf('@theme')
  if (abre === -1) return ''
  const inicio = conteudo.indexOf('{', abre)
  if (inicio === -1) return ''
  let nivel = 0
  for (let i = inicio; i < conteudo.length; i += 1) {
    if (conteudo[i] === '{') nivel += 1
    else if (conteudo[i] === '}') {
      nivel -= 1
      if (nivel === 0) return conteudoOriginal.slice(inicio + 1, i)
    }
  }
  return ''
}

/**
 * Os nomes de cor que o tema declara, tirados do bloco `@theme` do
 * `tema.css`. `--color-primary-foreground` vira `primary-foreground`, e é
 * isso que faz `text-primary-foreground` ser aceito.
 *
 * Derivar em vez de listar é o ponto: um `--color-warning` novo no tema
 * passa a valer aqui sem ninguém editar este script.
 */
function nomesDeCorDoTema(conteudoTema) {
  const nomes = new Set()
  for (const [, nome] of blocoTheme(conteudoTema).matchAll(/--color-([a-z0-9-]+)\s*:/g)) {
    nomes.add(nome)
  }
  return nomes
}

function linhaTemCorLiteral(linha) {
  return HEX_REGEX.test(linha) || FUNCAO_COR_REGEX.test(linha) || NOME_COR_REGEX.test(linha)
}

/**
 * As classes de cor crua numa linha de JSX. Uma classe passa quando aponta
 * para um nome semântico do tema (`bg-background`, `text-primary`,
 * `border-border`); reprova quando usa a paleta embutida do Tailwind
 * (`bg-slate-950`, `text-zinc-400`) ou uma primitiva do tema que colide com
 * ela (`bg-red-500`, `text-blue-700`).
 *
 * Um nome que não é cor — `text-sm`, `shadow-lg`, `text-center`, `ring-2` —
 * passa. A guarda só afirma sobre o que reconhece como cor.
 */
function classesCorCrua(linha, nomesDoTema) {
  const achados = []
  CLASSE_COR_REGEX.lastIndex = 0
  let achado
  while ((achado = CLASSE_COR_REGEX.exec(linha))) {
    const [inteira, , nome] = achado
    // `bg-red-500` e `text-red` — o grau é opcional na paleta do Tailwind.
    const raiz = nome.replace(/-\d+$/, '')
    if (!PALETA_TAILWIND.includes(raiz)) continue

    // A paleta vem ANTES do tema de propósito. O `@theme` declara as
    // primitivas do tema com nome que COLIDE com a paleta embutida
    // (`--color-blue-500`, `--color-red-500`, `--color-violet-700`), e por
    // isso `bg-red-500` resolve para um token de verdade. Ainda assim é
    // recusado: primitiva é matéria-prima, não nome semântico. Espalhar
    // `bg-blue-500` pelo JSX quebra a mesma promessa que o hex solto quebra
    // — trocar a paleta num lugar troca o app inteiro. O que se escreve na
    // tela é `bg-primary`, e a camada `:root`/`.dark` decide qual azul isso
    // vira. Distinguir os dois casos importa para a mensagem: uma é paleta
    // do framework, a outra é primitiva do tema usada fora de lugar.
    achados.push({
      classe: inteira,
      motivo: nomesDoTema.has(nome) ? 'primitiva do tema' : 'paleta do Tailwind',
    })
  }
  return achados
}

const RADIUS_REGEX = /border-radius\s*:\s*([^;{}]+);/g
const ZINDEX_REGEX = /z-index\s*:\s*([^;{}]+);/g

function normalizar(caminho) {
  return caminho.replaceAll('\\', '/')
}

async function arquivosVerificados() {
  const arquivos = []
  for await (const arquivo of glob(['src/**/*.css', 'src/**/*.tsx'])) {
    arquivos.push(normalizar(arquivo))
  }
  return arquivos.sort()
}

// Apaga o conteúdo dos comentários sem apagar as quebras de linha, para que
// os números de linha reportados continuem batendo com o arquivo original.
// Vale para `/* */` de CSS e para `//` de JSX: um comentário que cita um hex
// não é um hex aplicado.
function semComentarios(texto, ehJsx) {
  const semBloco = texto.replace(/\/\*[\s\S]*?\*\//g, (bloco) => bloco.replace(/[^\n]/g, ' '))
  return ehJsx ? semBloco.replace(/\/\/[^\n]*/g, (linha) => ' '.repeat(linha.length)) : semBloco
}

function raioValido(valor) {
  return valor
    .trim()
    .split(/\s+/)
    .every((parte) => RAIO_VALIDO.has(parte) || parte.startsWith('var('))
}

function zIndexLiteral(valor) {
  return /^-?\d+$/.test(valor.trim())
}

function verificarArquivo(caminho, conteudo, nomesDoTema) {
  const problemas = []
  // O `tema.css` INTEIRO é lugar legítimo de cor: o `@theme` guarda as
  // primitivas, e o `:root`/`.dark` abaixo dele guarda os nomes semânticos
  // que trocam com o tema — a v4 não aceita valor variável dentro do
  // `@theme`, então essa segunda camada não é escolha, é exigência.
  const ehTema = caminho === ARQUIVO_TEMA
  const ehJsx = caminho.endsWith('.tsx')
  const linhas = semComentarios(conteudo, ehJsx).split('\n')

  linhas.forEach((linha, indice) => {
    const numero = indice + 1

    if (!ehTema && linhaTemCorLiteral(linha)) {
      problemas.push({ caminho, numero, tipo: 'cor-literal', trecho: linha.trim() })
    }

    // Raio e z-index são declaração de CSS. No JSX resta a regra de classe.
    if (ehJsx) {
      for (const { classe, motivo } of classesCorCrua(linha, nomesDoTema)) {
        problemas.push({
          caminho,
          numero,
          tipo: `classe-crua (${classe} — ${motivo})`,
          trecho: linha.trim(),
        })
      }
      return
    }

    RADIUS_REGEX.lastIndex = 0
    let raio
    while ((raio = RADIUS_REGEX.exec(linha))) {
      if (!raioValido(raio[1])) {
        problemas.push({ caminho, numero, tipo: 'raio-fora-da-escala', trecho: linha.trim() })
      }
    }

    ZINDEX_REGEX.lastIndex = 0
    let camada
    while ((camada = ZINDEX_REGEX.exec(linha))) {
      if (zIndexLiteral(camada[1])) {
        problemas.push({ caminho, numero, tipo: 'z-index-literal', trecho: linha.trim() })
      }
    }
  })

  return problemas
}

async function principal() {
  const conteudoTema = await readFile(ARQUIVO_TEMA, 'utf8')
  const nomesDoTema = nomesDeCorDoTema(conteudoTema)
  if (nomesDoTema.size === 0) {
    console.error(`${ARQUIVO_TEMA} não declara nenhum --color-* dentro de @theme.`)
    console.error('Sem isso a guarda não teria como saber qual nome de cor é do tema.')
    exit(1)
  }

  const arquivos = await arquivosVerificados()
  const problemas = []

  for (const caminho of arquivos) {
    const conteudo = await readFile(caminho, 'utf8')
    problemas.push(...verificarArquivo(caminho, conteudo, nomesDoTema))
  }

  if (problemas.length > 0) {
    console.error(`${problemas.length} problema(s) encontrado(s) em src/:\n`)
    for (const problema of problemas) {
      console.error(`  ${problema.caminho}:${problema.numero}  [${problema.tipo}]  ${problema.trecho}`)
    }
    console.error(
      `\nCor literal só é permitida em ${ARQUIVO_TEMA}. No JSX, use a classe que aponta para o tema (bg-background, text-primary), nunca a paleta embutida do Tailwind (bg-slate-950). border-radius só aceita a escala --raio-* (ou 0/50%). z-index só aceita --camada-*.`,
    )
    exit(1)
  }

  console.log(
    `ok — ${arquivos.length} arquivo(s) verificado(s) contra os ${nomesDoTema.size} nomes de cor do @theme, sem cor solta, classe crua, raio fora da escala ou z-index literal`,
  )
}

principal().catch((erro) => {
  console.error(erro.stack ?? erro.message)
  exit(1)
})
