import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { servidor } from '@/teste/servidor'
import { criarCliente } from './cliente'
import { ErroApi } from './erro'

const BASE = 'https://api.teste'
let token: string | null = null
const aoExpirar = vi.fn()

const cliente = criarCliente({
  urlBase: BASE,
  lerToken: () => token,
  aoExpirar,
})

beforeEach(() => {
  token = null
  aoExpirar.mockClear()
})

describe('listar', () => {
  it('devolve itens e total lido do cabeçalho', async () => {
    servidor.use(http.get(`${BASE}/api/v1/person-samples`, () =>
      HttpResponse.json([{ id: 1 }], { headers: { 'X-Total-Count': '137' } })))

    const r = await cliente.listar<{ id: number }>('/person-samples')
    expect(r.itens).toEqual([{ id: 1 }])
    expect(r.total).toBe(137)
  })

  it('converte 204 em lista vazia', async () => {
    servidor.use(http.get(`${BASE}/api/v1/person-samples`, () =>
      new HttpResponse(null, { status: 204 })))

    const r = await cliente.listar('/person-samples')
    expect(r.itens).toEqual([])
    expect(r.total).toBe(0)
  })

  it('usa o tamanho da lista quando o cabeçalho falta', async () => {
    servidor.use(http.get(`${BASE}/api/v1/person-samples`, () =>
      HttpResponse.json([{ id: 1 }, { id: 2 }])))

    expect((await cliente.listar('/person-samples')).total).toBe(2)
  })

  it('usa o tamanho da lista quando o cabeçalho de total não é numérico', async () => {
    servidor.use(http.get(`${BASE}/api/v1/person-samples`, () =>
      HttpResponse.json([{ id: 1 }], { headers: { 'X-Total-Count': 'abc' } })))

    expect((await cliente.listar('/person-samples')).total).toBe(1)
  })

  it('usa o tamanho da lista quando o cabeçalho de total vem vazio', async () => {
    // `Number('')` é 0, e 0 passa em `Number.isFinite` — sem a guarda de texto
    // em branco o total viria 0 com linhas na tela, e `PaginaProjetos.tsx:92`
    // (`total > 0 && <Paginacao/>`) esconderia a paginação de uma lista que
    // tem itens.
    servidor.use(http.get(`${BASE}/api/v1/person-samples`, () =>
      HttpResponse.json([{ id: 1 }, { id: 2 }], { headers: { 'X-Total-Count': '' } })))

    expect((await cliente.listar('/person-samples')).total).toBe(2)
  })

  it('monta a busca a partir dos parâmetros', async () => {
    let alcancada = ''
    servidor.use(http.get(`${BASE}/api/v1/person-samples`, ({ request }) => {
      alcancada = new URL(request.url).search
      return HttpResponse.json([])
    }))

    await cliente.listar('/person-samples', { page: 2, per_page: 25, sort: '-Id' })
    expect(alcancada).toBe('?page=2&per_page=25&sort=-Id')
  })

  it('omite parâmetro vazio', async () => {
    let alcancada = ''
    servidor.use(http.get(`${BASE}/api/v1/person-samples`, ({ request }) => {
      alcancada = new URL(request.url).search
      return HttpResponse.json([])
    }))

    await cliente.listar('/person-samples', { pesquisa: '', page: 1 })
    expect(alcancada).toBe('?page=1')
  })
})

describe('autorização', () => {
  it('injeta o token quando existe sessão', async () => {
    token = 'abc'
    let cabecalho: string | null = null
    servidor.use(http.get(`${BASE}/api/v1/x`, ({ request }) => {
      cabecalho = request.headers.get('Authorization')
      return HttpResponse.json({})
    }))

    await cliente.obter('/x')
    expect(cabecalho).toBe('Bearer abc')
  })

  it('não injeta cabeçalho sem sessão', async () => {
    let cabecalho: string | null = 'inicial'
    servidor.use(http.get(`${BASE}/api/v1/x`, ({ request }) => {
      cabecalho = request.headers.get('Authorization')
      return HttpResponse.json({})
    }))

    await cliente.obter('/x')
    expect(cabecalho).toBeNull()
  })

  it('avisa quando a sessão expira', async () => {
    servidor.use(http.get(`${BASE}/api/v1/x`, () => new HttpResponse(null, { status: 401 })))

    await expect(cliente.obter('/x')).rejects.toBeInstanceOf(ErroApi)
    expect(aoExpirar).toHaveBeenCalledOnce()
  })
})

describe('erro', () => {
  it('levanta ErroApi na forma de negócio', async () => {
    servidor.use(http.post(`${BASE}/api/v1/x`, () =>
      HttpResponse.json({ status: 400, messages: ['Código já utilizado'] }, { status: 400 })))

    await expect(cliente.enviar('/x', {})).rejects.toMatchObject({
      status: 400,
      mensagens: ['Código já utilizado'],
    })
  })

  it('levanta ErroApi na forma de validação', async () => {
    servidor.use(http.post(`${BASE}/api/v1/x`, () =>
      HttpResponse.json({ errors: { Name: ['obrigatório'] } }, { status: 400 })))

    await expect(cliente.enviar('/x', {})).rejects.toMatchObject({
      campos: { Name: ['obrigatório'] },
    })
  })
})

describe('resposta em texto', () => {
  it('devolve o texto puro que o login entrega', async () => {
    servidor.use(http.post(`${BASE}/api/v1/auth/login`, () =>
      HttpResponse.text('"jwt.token.aqui"', {
        headers: { 'Content-Type': 'application/json' },
      })))

    expect(await cliente.enviar<string>('/auth/login', {})).toBe('jwt.token.aqui')
  })
})

describe('negociação de conteúdo', () => {
  it('pede JSON explicitamente e recebe JSON, não a forma XML que o contrato também declara', async () => {
    servidor.use(http.get(`${BASE}/api/v1/x`, ({ request }) => {
      const aceite = request.headers.get('Accept')
      if (aceite === 'application/json') return HttpResponse.json({ ok: true })
      return new HttpResponse('<Objeto><ok>true</ok></Objeto>', {
        headers: { 'Content-Type': 'application/xml' },
      })
    }))

    await expect(cliente.obter('/x')).resolves.toEqual({ ok: true })
  })
})

describe('corpo inválido', () => {
  it('embrulha corpo 200 que não é JSON válido em ErroApi, sem deixar escapar SyntaxError', async () => {
    servidor.use(http.get(`${BASE}/api/v1/x`, () =>
      new HttpResponse('isto não é json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })))

    await expect(cliente.obter('/x')).rejects.toBeInstanceOf(ErroApi)
  })
})

describe('remover', () => {
  it('executa DELETE no caminho informado', async () => {
    let metodo = ''
    servidor.use(http.delete(`${BASE}/api/v1/x/1`, ({ request }) => {
      metodo = request.method
      return new HttpResponse(null, { status: 204 })
    }))

    await expect(cliente.remover('/x/1')).resolves.toBeUndefined()
    expect(metodo).toBe('DELETE')
  })
})

describe('localização', () => {
  it('envia Accept-Language pt-BR em toda requisição', async () => {
    let idioma: string | null = null
    servidor.use(http.get(`${BASE}/api/v1/x`, ({ request }) => {
      idioma = request.headers.get('Accept-Language')
      return HttpResponse.json({})
    }))

    await cliente.obter('/x')
    expect(idioma).toBe('pt-BR')
  })
})
