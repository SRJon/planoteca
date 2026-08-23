import { useId } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TamanhoPagina } from './useFiltroPessoas'
import { TAMANHOS_PAGINA } from './useFiltroPessoas'

const VALOR_TODOS = 'todos'

const OPCOES_ATIVO = [
  { valor: VALOR_TODOS, rotulo: 'Todos' },
  { valor: 'true', rotulo: 'Ativos' },
  { valor: 'false', rotulo: 'Inativos' },
]

function paraValorAtivo(ativo: boolean | null): string {
  return ativo === null ? VALOR_TODOS : String(ativo)
}

function paraAtivo(valor: string): boolean | null {
  return valor === VALOR_TODOS ? null : valor === 'true'
}

interface FiltrosPessoasProps {
  pesquisa: string
  aoMudarPesquisa: (texto: string) => void
  porPagina: TamanhoPagina
  aoMudarPorPagina: (tamanho: TamanhoPagina) => void
  ativo: boolean | null
  aoMudarAtivo: (valor: boolean | null) => void
}

/**
 * Barra de filtro da lista de pessoas: busca livre, situação e tamanho de
 * página. `PersonSampleController` aceita `active` além dos quatro
 * parâmetros do `FilterDto` (`entities/pessoa/api.ts`), e é por isso que
 * são três controles e não dois.
 *
 * Puramente controlado — não conhece URL nem debounce, os dois vivem em
 * `useFiltroPessoas`. `pesquisa` aqui é `pesquisaDigitada` (o valor a cada
 * tecla), não o valor já comprometido na URL, para o campo não "atrasar" a
 * digitação.
 *
 * A busca ocupa a sobra e os dois seletores têm base fixa: os rótulos deles
 * não mudam de tamanho, então esticá-los só afastaria os controles um do
 * outro. O `Label` do shadcn é ligado por `htmlFor`, e não por
 * aninhamento — o gatilho do `Select` do Radix é um `button`, que rótulo
 * aninhado não ativa.
 */
export function FiltrosPessoas({
  pesquisa,
  aoMudarPesquisa,
  porPagina,
  aoMudarPorPagina,
  ativo,
  aoMudarAtivo,
}: FiltrosPessoasProps) {
  const prefixo = useId()
  const idBusca = `${prefixo}-busca`
  const idSituacao = `${prefixo}-situacao`
  const idTamanho = `${prefixo}-tamanho`

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
        <Label htmlFor={idBusca}>Buscar</Label>
        <div className="relative">
          {/* Ícone dentro do campo, no tom do texto secundário: ele diz o que
              o campo faz sem virar um segundo elemento na barra. */}
          <MagnifyingGlass
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={idBusca}
            type="search"
            placeholder="Nome ou sobrenome"
            className="pl-8"
            value={pesquisa}
            onChange={(evento) => aoMudarPesquisa(evento.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-[0_0_160px] flex-col gap-1.5">
        <Label htmlFor={idSituacao}>Situação</Label>
        <Select value={paraValorAtivo(ativo)} onValueChange={(valor) => aoMudarAtivo(paraAtivo(valor))}>
          <SelectTrigger id={idSituacao} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPCOES_ATIVO.map((opcao) => (
              <SelectItem key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-[0_0_120px] flex-col gap-1.5">
        <Label htmlFor={idTamanho}>Itens por página</Label>
        <Select
          value={String(porPagina)}
          onValueChange={(valor) => aoMudarPorPagina(Number(valor) as TamanhoPagina)}
        >
          <SelectTrigger id={idTamanho} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAMANHOS_PAGINA.map((tamanho) => (
              <SelectItem key={tamanho} value={String(tamanho)}>
                {tamanho}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
