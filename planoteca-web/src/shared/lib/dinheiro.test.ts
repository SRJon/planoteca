import { describe, expect, it } from 'vitest'
import { deApi, formatar, multiplicar, paraApi, somar, subtrair, zero } from './dinheiro'

describe('deApi', () => {
  it('arredonda para dois dígitos na entrada', () => {
    expect(paraApi(deApi(10.005))).toBe(10.01)
    expect(paraApi(deApi(0.1 + 0.2))).toBe(0.3)
  })

  it('trata null como zero ausente', () => {
    expect(deApi(null)).toBeNull()
  })

  it('preserva valor negativo com arredondamento correto', () => {
    // -10.005 já cai acima do meio do centavo como double puro (-1000.5000000000001...), então
    // até uma leitura ingênua do double acertaria por acaso. -1.005 exercita de fato o sinal
    // lido da string: "-1.005" tem "-" no início e "1.005" arredonda para "1.01" — o resultado
    // só sai certo se o sinal for aplicado depois, não inferido do valor numérico.
    expect(paraApi(deApi(-1.005))).toBe(-1.01)
  })

  it('mantém precisão em valor na casa dos milhões', () => {
    // 1500000.005 cai exatamente em cima do meio do centavo como double (150000000.5 sem
    // ruído), então qualquer arredondamento acerta por acaso. 10000.005 tem ruído genuíno como
    // double (1000000.499999999883...), mas `String(10000.005)` continua sendo "10000.005" — a
    // representação mais curta preserva a intenção mesmo onde o double não preservou.
    expect(paraApi(deApi(10000.005))).toBe(10000.01)
  })

  it('é simétrico entre um valor e seu negativo equivalente', () => {
    const positivo = deApi(19.995)!
    const negativo = deApi(-19.995)!
    expect(negativo).toBe(-positivo)
    expect(somar(positivo, negativo)).toBe(zero)
  })

  it('arredonda corretamente um double que fica abaixo do meio do centavo', () => {
    // 4.015 vira o double 4.014999999999999680..., abaixo do meio do centavo. Um ajuste de
    // magnitude fixa (a versão anterior deste módulo) já não alcançava esse valor; a leitura da
    // string "4.015" não depende de magnitude nenhuma.
    expect(paraApi(deApi(4.015))).toBe(4.02)
  })

  it('não arredonda para cima um valor genuinamente abaixo do meio do centavo', () => {
    // Um ajuste (nudge) baseado na magnitude do double — a implementação anterior deste
    // módulo — empurrava esses dois valores para cima por engano (0,51 e 500000,01) mesmo
    // sem estarem no meio do centavo. Nenhum ajuste consegue diferenciar "o valor de origem
    // era 0.505" de "o valor de origem era 0.5049999999999999": os dois são o mesmo double.
    expect(paraApi(deApi(0.5049999999999999))).toBe(0.5)
    expect(paraApi(deApi(500000.00499999995))).toBe(500000)
  })
})

describe('somar', () => {
  it('não acumula erro de ponto flutuante', () => {
    const total = somar(deApi(0.1)!, deApi(0.2)!)
    expect(paraApi(total)).toBe(0.3)
  })

  it('soma uma lista longa sem derivar', () => {
    const parcelas = Array.from({ length: 100 }, () => deApi(0.01)!)
    expect(paraApi(parcelas.reduce(somar, zero))).toBe(1)
  })
})

describe('subtrair', () => {
  it('produz resultado negativo quando o minuendo é menor', () => {
    expect(paraApi(subtrair(deApi(10)!, deApi(15.5)!))).toBe(-5.5)
  })
})

describe('multiplicar', () => {
  it('multiplica por quantidade e arredonda', () => {
    expect(paraApi(multiplicar(deApi(19.99)!, 3))).toBe(59.97)
  })

  it('arredonda meio para cima', () => {
    expect(paraApi(multiplicar(deApi(0.015)!, 1))).toBe(0.02)
  })
})

describe('formatar', () => {
  it('mostra o valor com o símbolo da moeda', () => {
    expect(formatar(deApi(1234.5)!, 'BRL')).toBe('R$ 1.234,50')
  })

  it('mostra travessão para vazio', () => {
    expect(formatar(null, 'BRL')).toBe('—')
  })

  it('formata em outra moeda (USD)', () => {
    expect(formatar(deApi(1234.5)!, 'USD')).toBe('US$ 1.234,50')
  })

  it('nunca mostra zero negativo', () => {
    // -0.004 arredonda para 0 centavos, mas o sinal "-" vem antes na string -- sem o "+ 0" no
    // retorno de deApi, "-0" sobreviveria e o Intl formataria como "-R$ 0,00".
    expect(formatar(deApi(-0.004), 'BRL')).toBe('R$ 0,00')
  })
})
