const FUSO = 'America/Sao_Paulo'
const SEM_FUSO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/
const COM_FUSO_EXPLICITO = /(?:Z|[+-]\d{2}:?\d{2})$/

const FORMATO_DESLOCAMENTO = new Intl.DateTimeFormat('en-US', {
  timeZone: FUSO,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

/** Deslocamento do fuso de Brasília, em minutos, para o instante informado. */
function deslocamentoEmMinutos(utc: Date): number {
  const partes = new Map<string, string>(
    FORMATO_DESLOCAMENTO.formatToParts(utc).map((x) => [x.type, x.value]),
  )
  const parte = (tipo: string): number => {
    const valor = partes.get(tipo)
    if (valor === undefined) throw new Error(`Intl não devolveu a parte "${tipo}" da data`)
    return Number(valor)
  }
  const local = Date.UTC(
    parte('year'), parte('month') - 1, parte('day'),
    parte('hour') % 24, parte('minute'), parte('second'),
  )
  // `Intl.DateTimeFormat` não devolve milissegundos, então `local` está sempre truncado no
  // segundo. Um deslocamento de fuso real é sempre um número inteiro de minutos; sem o
  // arredondamento, a fração de milissegundo de `utc` vaza para o resultado (ex.: um instante
  // em `.999` produz um deslocamento como -180.01665 em vez de -180).
  return Math.round((local - utc.getTime()) / 60000)
}

/** Converte o texto da API em Date. Texto sem fuso vale como horário de Brasília. */
export function deApi(texto: string | null | undefined): Date | null {
  if (texto === null || texto === undefined || texto === '') return null

  const casa = SEM_FUSO.exec(texto)
  if (!casa) {
    // Sem o fuso explícito no fim da string, `new Date(texto)` cai em regras do ECMAScript
    // hostis: texto sem hora vira meia-noite UTC, e texto com hora mas sem segundos ou com
    // fração de segundo fora do padrão (7 dígitos, por exemplo) é lido como horário LOCAL DA
    // MÁQUINA — certo por acidente num servidor brasileiro, errado em qualquer outro fuso.
    // Sem um fuso explícito, a string não é um formato que sabemos interpretar: recusa.
    if (!COM_FUSO_EXPLICITO.test(texto)) throw new Error(`data inválida: ${texto}`)
    const direto = new Date(texto)
    if (Number.isNaN(direto.getTime())) throw new Error(`data inválida: ${texto}`)
    return direto
  }

  // Os grupos 1-6 (ano, mês, dia, hora, min, seg) do regex são todos obrigatórios — nenhum
  // tem `?` no padrão. Se `casa` não é null, a string inteira casou, então esses grupos
  // sempre vieram preenchidos; só o grupo 7 (milissegundos) é opcional de verdade.
  // `noUncheckedIndexedAccess` não sabe disso, então `grupo()` confere em runtime — não
  // silencia o compilador, documenta a garantia que o regex já dá.
  const grupo = (indice: number): string => {
    const valor = casa[indice]
    if (valor === undefined) throw new Error(`grupo obrigatório ${indice} ausente em: ${texto}`)
    return valor
  }
  const ano = grupo(1)
  const mes = grupo(2)
  const dia = grupo(3)
  const hora = grupo(4)
  const min = grupo(5)
  const seg = grupo(6)
  const mili = casa[7]

  const comoUtc = Date.UTC(
    Number(ano), Number(mes) - 1, Number(dia),
    Number(hora), Number(min), Number(seg), Number((mili ?? '0').padEnd(3, '0')),
  )

  // Duas passagens: o deslocamento depende do próprio instante, por causa do horário de verão.
  // O horário de verão brasileiro sempre começou à 0h local, então o "salto" de uma hora abre
  // um intervalo de horários locais que nunca existiu (ex.: 15/10/2017 00:00 a 00:59 nunca
  // aconteceu em Brasília). Para um instante nesse intervalo, a segunda passagem pode convergir
  // para o deslocamento do lado ERRADO do salto. A regra (de Luxon `fixOffset`) é: só aceitar a
  // segunda passagem se ela reproduzir o mesmo deslocamento que ela própria implica — senão,
  // ficar com a primeira. Isso resolve o horário inexistente para o lado que faz sentido (o
  // instante um pouco depois do começo do verão) sem mudar nada nos outros casos.
  const o1 = deslocamentoEmMinutos(new Date(comoUtc))
  const chute = new Date(comoUtc - o1 * 60000)
  const o2 = deslocamentoEmMinutos(chute)
  if (o1 === o2) return chute

  const segundo = new Date(comoUtc - o2 * 60000)
  return deslocamentoEmMinutos(segundo) === o2 ? segundo : chute
}

/** Converte Date no texto que a API espera, em horário de Brasília. */
export function paraApi(data: Date | null | undefined): string | null {
  if (data === null || data === undefined) return null

  const local = new Date(data.getTime() + deslocamentoEmMinutos(data) * 60000)
  const p = (n: number, casas = 2) => String(n).padStart(casas, '0')

  return `${local.getUTCFullYear()}-${p(local.getUTCMonth() + 1)}-${p(local.getUTCDate())}` +
    `T${p(local.getUTCHours())}:${p(local.getUTCMinutes())}:${p(local.getUTCSeconds())}` +
    `.${p(local.getUTCMilliseconds(), 3)}`
}

/** Mostra a data no formato brasileiro. Vazio vira travessão. */
export function formatar(data: Date | null | undefined): string {
  if (data === null || data === undefined) return '—'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO }).format(data)
}
