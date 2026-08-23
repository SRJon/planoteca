import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { FiltroPessoa } from '@/entities/pessoa'
import type { DirecaoOrdenacao, Ordenacao } from './ordenacao'
import { ORDENACAO_PADRAO_API, paraSortApi } from './ordenacaoApi'

/**
 * Tamanhos de página oferecidos — sempre escolha do usuário, nunca uma
 * constante fixa fora desta lista (mesma regra de
 * `prototipo-de-origem/src/features/filtrar-projetos/useFiltroProjetos.ts`).
 */
export const TAMANHOS_PAGINA = [25, 50, 100] as const
export type TamanhoPagina = (typeof TAMANHOS_PAGINA)[number]

const TAMANHO_PADRAO: TamanhoPagina = 25
const ATRASO_BUSCA_MS = 300

function paraPagina(valor: string | null): number {
  const numero = Number(valor)
  return valor !== null && Number.isInteger(numero) && numero > 0 ? numero : 1
}

function paraTamanhoPagina(valor: string | null): TamanhoPagina {
  const numero = Number(valor)
  return (TAMANHOS_PAGINA as readonly number[]).includes(numero) ? (numero as TamanhoPagina) : TAMANHO_PADRAO
}

function paraOrdenacao(valor: string | null): Ordenacao | null {
  if (!valor) return null
  const descendente = valor.startsWith('-')
  const campo = descendente ? valor.slice(1) : valor
  if (campo === '') return null
  return { campo, direcao: descendente ? 'desc' : 'asc' }
}

function serializarOrdenacao(ordenacao: Ordenacao): string {
  return ordenacao.direcao === 'desc' ? `-${ordenacao.campo}` : ordenacao.campo
}

/**
 * Estado do filtro da lista de pessoas — inteiramente na URL, no mesmo
 * padrão de `filtrar-projetos/useFiltroProjetos.ts`: recarregar preserva
 * busca, página, tamanho de página e ordenação, e a URL inteira é
 * compartilhável.
 *
 * A busca livre segue a mesma regra de debounce de 300ms do molde — só
 * dispara requisição via `usePessoas` (cuja `queryKey` inclui o filtro
 * inteiro) depois da última tecla, e o efeito só agenda o timer quando o
 * texto digitado diverge do que já está na URL.
 *
 * `filtro.sort` NUNCA fica ausente: sem ordenação escolhida pelo usuário,
 * cai em `ORDENACAO_PADRAO_API` ('Id'). O `FilterDto.cs` do back-end
 * lança `NullReferenceException` no getter de `sort` quando `_sort` é
 * `null` (`ordenacaoApi.ts` documenta a armadilha) — o parâmetro ausente
 * na querystring é seguro (o construtor já inicializa com `"Id"`), mas
 * este módulo garante o mesmo resultado explicitamente no filtro que
 * `usePessoas` manda, para o comportamento não depender de uma
 * particularidade do model binder do ASP.NET.
 */
export function useFiltroPessoas() {
  const [searchParams, setSearchParams] = useSearchParams()

  const pesquisaUrl = searchParams.get('pesquisa') ?? ''
  const pagina = paraPagina(searchParams.get('page'))
  const porPagina = paraTamanhoPagina(searchParams.get('per_page'))
  const ativoUrl = searchParams.get('ativo')
  const ordenacao = paraOrdenacao(searchParams.get('sort'))

  const [pesquisaDigitada, setPesquisaDigitada] = useState(pesquisaUrl)

  useEffect(() => {
    if (pesquisaDigitada === pesquisaUrl) return

    const id = setTimeout(() => {
      setSearchParams(
        (atual) => {
          const proximo = new URLSearchParams(atual)
          if (pesquisaDigitada) proximo.set('pesquisa', pesquisaDigitada)
          else proximo.delete('pesquisa')
          proximo.set('page', '1')
          return proximo
        },
        { replace: true },
      )
    }, ATRASO_BUSCA_MS)

    return () => clearTimeout(id)
    // `pesquisaUrl` de propósito fora das deps — mesma justificativa de
    // `filtrar-projetos/useFiltroProjetos.ts`: é derivado de `searchParams`
    // a cada render, e incluí-lo reagendaria o timer no commit que o
    // próprio efeito dispara. O guard acima já cobre a divergência que
    // importa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pesquisaDigitada])

  function irParaPagina(proxima: number) {
    setSearchParams((atual) => {
      const proximo = new URLSearchParams(atual)
      proximo.set('page', String(proxima))
      return proximo
    })
  }

  function definirPorPagina(tamanho: TamanhoPagina) {
    setSearchParams((atual) => {
      const proximo = new URLSearchParams(atual)
      proximo.set('per_page', String(tamanho))
      proximo.set('page', '1')
      return proximo
    })
  }

  function definirAtivo(valor: boolean | null) {
    setSearchParams((atual) => {
      const proximo = new URLSearchParams(atual)
      if (valor === null) proximo.delete('ativo')
      else proximo.set('ativo', String(valor))
      proximo.set('page', '1')
      return proximo
    })
  }

  function ordenarPor(campo: string, direcao: DirecaoOrdenacao) {
    setSearchParams((atual) => {
      const proximo = new URLSearchParams(atual)
      proximo.set('sort', serializarOrdenacao({ campo, direcao }))
      proximo.set('page', '1')
      return proximo
    })
  }

  const filtro: FiltroPessoa = {
    page: pagina,
    perPage: porPagina,
    sort: ordenacao ? paraSortApi(ordenacao) : ORDENACAO_PADRAO_API,
    ...(pesquisaUrl ? { filter: pesquisaUrl } : {}),
    ...(ativoUrl !== null ? { active: ativoUrl === 'true' } : {}),
  }

  return {
    filtro,
    pesquisaDigitada,
    definirPesquisa: setPesquisaDigitada,
    pagina,
    porPagina,
    ativo: ativoUrl === null ? null : ativoUrl === 'true',
    definirAtivo,
    ordenacao,
    irParaPagina,
    definirPorPagina,
    ordenarPor,
  }
}
