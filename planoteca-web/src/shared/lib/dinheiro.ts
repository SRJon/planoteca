declare const marca: unique symbol

/** Valor monetário em centavos inteiros. Nunca use number cru para dinheiro. */
export type Dinheiro = number & { readonly [marca]: 'Dinheiro' }

const criar = (centavos: number): Dinheiro => Math.round(centavos) as Dinheiro

export const zero: Dinheiro = criar(0)

// Casa a notação exponencial que `Number.prototype.toString` produz fora da faixa
// [1e-6, 1e21) — ex.: "1e-7", "-2.5e+30". Grupo 1 é a mantissa inteira, grupo 2 a fração
// (pode faltar), grupo 3 o expoente com sinal.
const NOTACAO_EXPONENCIAL = /^(\d+)(?:\.(\d+))?e([+-]\d+)$/
const CENTAVOS_MAXIMOS = BigInt(Number.MAX_SAFE_INTEGER)

/**
 * Extrai os dígitos e a posição do ponto decimal da representação textual mais curta que
 * volta ao mesmo double — a que `String(valor)` produz — nunca da expansão binária exata.
 * É essa diferença que distingue "o valor de origem era 1.005" de "o valor de origem era
 * 1.0049999999999998934...": os dois doubles são diferentes bit a bit, mas só o primeiro
 * tem "1.005" como a representação mais curta que volta a ele.
 */
function analisar(texto: string): { negativo: boolean; digitos: string; ponto: number } {
  const negativo = texto.startsWith('-')
  const semSinal = negativo ? texto.slice(1) : texto
  const casaExp = NOTACAO_EXPONENCIAL.exec(semSinal)
  if (casaExp) {
    const inteiro = casaExp[1]
    if (inteiro === undefined) throw new Error(`notação exponencial sem mantissa: ${texto}`)
    const expoenteTexto = casaExp[3]
    if (expoenteTexto === undefined) throw new Error(`notação exponencial sem expoente: ${texto}`)
    const fracao = casaExp[2] ?? ''
    return { negativo, digitos: inteiro + fracao, ponto: inteiro.length + Number(expoenteTexto) }
  }
  const [inteiro, fracao] = semSinal.split('.')
  return { negativo, digitos: (inteiro ?? '') + (fracao ?? ''), ponto: (inteiro ?? '').length }
}

/** Converte o ponto flutuante da API em centavos inteiros. */
export function deApi(valor: number | null | undefined): Dinheiro | null {
  if (valor === null || valor === undefined) return null
  if (!Number.isFinite(valor)) throw new Error(`valor monetário inválido: ${valor}`)

  const { negativo, digitos, ponto } = analisar(String(valor))
  let d = digitos
  let p = ponto + 2 // desloca o ponto duas casas: de reais para centavos

  if (p < 0) {
    d = '0'.repeat(-p) + d
    p = 0
  }
  if (p > d.length) d = d + '0'.repeat(p - d.length)

  // Meio para cima, afastando de zero: arredonda quando o dígito logo após o centavo é 5 ou
  // mais. Um único dígito basta — qualquer coisa além dele só confirma para que lado do meio
  // o valor cai, nunca inverte, porque estamos arredondando exatamente na casa seguinte.
  let centavos = BigInt(d.slice(0, p) || '0')
  if (d.length > p && Number(d[p]) >= 5) centavos += 1n

  if (centavos > CENTAVOS_MAXIMOS) {
    throw new Error(`valor monetário grande demais para representar com segurança: ${valor}`)
  }

  const magnitude = Number(centavos)
  // O "+ 0" descarta o -0 que "-magnitude" devolve quando magnitude é 0 (ex.: valor = -0.004).
  return criar((negativo ? -magnitude : magnitude) + 0)
}

/** Converte centavos de volta ao formato que a API espera. */
export function paraApi(valor: Dinheiro | null | undefined): number | null {
  if (valor === null || valor === undefined) return null
  return valor / 100
}

export function somar(a: Dinheiro, b: Dinheiro): Dinheiro {
  return criar(a + b)
}

export function subtrair(a: Dinheiro, b: Dinheiro): Dinheiro {
  return criar(a - b)
}

/** Multiplica por um fator sem unidade, como quantidade ou alíquota. */
export function multiplicar(valor: Dinheiro, fator: number): Dinheiro {
  return criar(valor * fator)
}

// `Intl.NumberFormat` separa o símbolo da moeda do valor com espaço-fino sem quebra
// (U+202F) ou espaço sem quebra (U+00A0), dependendo do runtime ICU. Nenhum dos dois é o
// espaço comum (U+0020) que o resto do sistema espera ao comparar ou exibir o texto.
const ESPACO_ICU = /[\u00A0\u202F]/g

export function formatar(valor: Dinheiro | null | undefined, moeda: string): string {
  if (valor === null || valor === undefined) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda })
    .format(valor / 100)
    .replace(ESPACO_ICU, ' ')
}
