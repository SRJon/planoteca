import { describe, expect, it } from 'vitest'
import { deApi, formatar, paraApi } from './data'

describe('deApi', () => {
  it('interpreta o texto sem fuso como horário de Brasília', () => {
    const d = deApi('2026-03-15T10:30:00.000')
    expect(d).not.toBeNull()
    expect(d!.toISOString()).toBe('2026-03-15T13:30:00.000Z')
  })

  it('devolve null para vazio', () => {
    expect(deApi(null)).toBeNull()
    expect(deApi('')).toBeNull()
  })

  it('aceita texto que já traz o fuso', () => {
    const d = deApi('2026-03-15T13:30:00.000Z')
    expect(d!.toISOString()).toBe('2026-03-15T13:30:00.000Z')
  })

  it('recusa texto irreconhecível', () => {
    expect(() => deApi('quinze de março')).toThrow(/data inválida/)
  })
})

describe('paraApi', () => {
  it('devolve o formato que a API espera', () => {
    const d = new Date('2026-03-15T13:30:00.000Z')
    expect(paraApi(d)).toBe('2026-03-15T10:30:00.000')
  })

  it('devolve null para null', () => {
    expect(paraApi(null)).toBeNull()
  })

  it('faz ida e volta sem perder valor', () => {
    const texto = '2026-07-01T23:59:59.999'
    expect(paraApi(deApi(texto))).toBe(texto)
  })
})

describe('formatar', () => {
  it('mostra a data no formato brasileiro', () => {
    expect(formatar(deApi('2026-03-15T10:30:00.000'))).toBe('15/03/2026')
  })

  it('mostra travessão para vazio', () => {
    expect(formatar(null)).toBe('—')
  })
})

// Testes de fuso histórico: o Brasil observou horário de verão até 2019, com o Distrito
// Federal em UTC-2 durante o verão e UTC-3 no resto do ano. Desde 2019 não há mais horário
// de verão. `deslocamentoEmMinutos` roda em duas passagens porque o deslocamento depende do
// próprio instante — uma conversão de passagem única erra perto (ou dentro) de uma janela de
// verão histórica. Os deslocamentos abaixo foram conferidos com `Intl.DateTimeFormat` no
// runtime local antes de escrever a asserção, não assumidos:
//   2018-01-15T12:30:00.000Z em America/Sao_Paulo -> 01/15/2018, 10:30:00 (UTC-2, verão)
//   2018-07-01T13:30:00.000Z em America/Sao_Paulo -> 07/01/2018, 10:30:00 (UTC-3, padrão)
//   2025-01-15T13:30:00.000Z em America/Sao_Paulo -> 01/15/2025, 10:30:00 (UTC-3, sem mais verão)
describe('fuso histórico (horário de verão)', () => {
  it('janeiro de 2018, dentro da janela de verão (UTC-2)', () => {
    const texto = '2018-01-15T10:30:00.000'
    const d = deApi(texto)
    expect(d!.toISOString()).toBe('2018-01-15T12:30:00.000Z')
    expect(paraApi(d)).toBe(texto)
  })

  it('julho de 2018, fora da janela de verão (UTC-3)', () => {
    const texto = '2018-07-01T10:30:00.000'
    const d = deApi(texto)
    expect(d!.toISOString()).toBe('2018-07-01T13:30:00.000Z')
    expect(paraApi(d)).toBe(texto)
  })

  it('janeiro de 2025, depois do fim do horário de verão (UTC-3)', () => {
    const texto = '2025-01-15T10:30:00.000'
    const d = deApi(texto)
    expect(d!.toISOString()).toBe('2025-01-15T13:30:00.000Z')
    expect(paraApi(d)).toBe(texto)
  })

  // O horário de verão brasileiro sempre começou à 0h local, então a virada abre um intervalo
  // de horários locais que nunca existiu (15/10/2017 00:00-00:59 não aconteceu em Brasília — o
  // relógio pulou de 14/10 23:59:59 direto para 15/10 01:00:00). `2017-10-15T00:00:00.000` cai
  // dentro desse intervalo. Instante e round-trip conferidos rodando a implementação corrigida
  // localmente: o instante correto é o primeiro depois da virada, não o momento anterior a ela.
  it('meia-noite do dia em que o verão começa cai no intervalo inexistente', () => {
    const d = deApi('2017-10-15T00:00:00.000')
    expect(d!.toISOString()).toBe('2017-10-15T03:00:00.000Z')
    expect(formatar(d)).toBe('15/10/2017')
    expect(paraApi(d)).toBe('2017-10-15T01:00:00.000')
  })
})

describe('deApi — texto sem fuso explícito e fora do formato reconhecido', () => {
  it('recusa em vez de interpretar como horário local da máquina', () => {
    // Sem segundos, o texto não casa com SEM_FUSO nem carrega um fuso explícito no fim
    // (`Z` ou `+hh:mm`). Sem a checagem de fuso explícito, `new Date(texto)` interpretaria
    // isso como horário local DA MÁQUINA que roda o código — certo por acidente num ambiente
    // brasileiro, errado em qualquer outro. Precisa recusar, não adivinhar.
    expect(() => deApi('2026-03-15T10:30')).toThrow(/data inválida/)
  })
})
