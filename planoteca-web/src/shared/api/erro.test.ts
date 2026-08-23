import { describe, expect, it } from 'vitest'
import { ErroApi, mensagemDe, traduzirErro } from './erro'

describe('traduzirErro', () => {
  it('traduz a forma de negócio', () => {
    const e = traduzirErro(400, { status: 400, messages: ['Código já utilizado'] })
    expect(e).toBeInstanceOf(ErroApi)
    expect(e.status).toBe(400)
    expect(e.mensagens).toEqual(['Código já utilizado'])
    expect(e.campos).toBeUndefined()
  })

  it('traduz a forma de validação de campo', () => {
    const e = traduzirErro(400, {
      errors: { Name: ['O campo Name é obrigatório.'] },
      title: 'One or more validation errors occurred.',
    })
    expect(e.campos).toEqual({ Name: ['O campo Name é obrigatório.'] })
    expect(e.mensagens).toEqual(['O campo Name é obrigatório.'])
  })

  it('não trata errors em formato de array como validação de campo', () => {
    const e = traduzirErro(500, { errors: ['a', 'b'] })
    expect(e.campos).toBeUndefined()
    expect(e.mensagens).toEqual(['Erro inesperado no servidor.'])
  })

  it('traduz corpo vazio', () => {
    const e = traduzirErro(500, null)
    expect(e.status).toBe(500)
    expect(e.mensagens).toEqual(['Erro inesperado no servidor.'])
  })

  it('traduz 401 com mensagem própria', () => {
    expect(traduzirErro(401, null).mensagens).toEqual(['Sessão expirada.'])
  })

  it('traduz 403 com mensagem própria', () => {
    expect(traduzirErro(403, null).mensagens)
      .toEqual(['Você não tem permissão para esta operação.'])
  })

  it('traduz ProblemDetails com title e detail, sem errors nem messages', () => {
    const e = traduzirErro(404, {
      type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
      title: 'Não encontrado.',
      status: 404,
      detail: 'O projeto 123 não existe.',
    })
    expect(e.status).toBe(404)
    expect(e.mensagens).toEqual(['Não encontrado.', 'O projeto 123 não existe.'])
    expect(e.campos).toBeUndefined()
  })

  it('traduz a forma de negócio com messages nulo', () => {
    const e = traduzirErro(500, { status: 500, messages: null })
    expect(e.mensagens).toEqual(['Erro inesperado no servidor.'])
  })

  it('traduz a forma de negócio com status em string no corpo', () => {
    const e = traduzirErro(400, { status: '400', messages: ['Código já utilizado'] })
    expect(e.status).toBe(400)
    expect(e.mensagens).toEqual(['Código já utilizado'])
  })
})

describe('mensagemDe', () => {
  it('junta as mensagens', () => {
    const e = traduzirErro(400, { status: 400, messages: ['a', 'b'] })
    expect(mensagemDe(e)).toBe('a b')
  })

  it('trata erro de rede', () => {
    expect(mensagemDe(new TypeError('Failed to fetch')))
      .toBe('Não foi possível falar com o servidor.')
  })
})
