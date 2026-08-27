import { useState } from 'react'
import { Funnel } from '@phosphor-icons/react/dist/csr/Funnel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PainelFiltros } from './PainelFiltros'

type PainelProps = React.ComponentProps<typeof PainelFiltros>

interface GavetaFiltrosProps extends Omit<PainelProps, 'comBusca'> {
  /** Quantos itens estão marcados nos três grupos. O botão o mostra porque,
   * com a gaveta fechada, ele é a única pista de que há recorte além das
   * pílulas. */
  totalAtivos: number
  /** Quantos planos a seleção atual devolve. Vai para o rótulo do rodapé. */
  totalPlanos: number
  aoLimpar: () => void
}

/**
 * A gaveta de filtro, abaixo de `lg`.
 *
 * **Por que gaveta e não a coluna empilhada.** Em 390px a coluna inteira
 * são uns 700px de filtro antes do primeiro plano. O professor que abre a
 * Biblioteca no celular quer ver plano, não filtro.
 *
 * **Por que marcar aplica na hora, e o rodapé só fecha.** Um rodapé de
 * "Aplicar" exigiria estado temporário dentro da gaveta, divergente da URL
 * enquanto ela está aberta — e um abandono pelo Escape teria de decidir se
 * descarta ou não. Aplicando na hora, a URL continua a fonte única da
 * verdade, e "Ver N planos" é só um jeito de fechar que já diz o que se vai
 * encontrar do lado de fora.
 *
 * Escape, ✕ e clique fora fecham, e o foco volta ao botão "Filtros". Isso é
 * do Radix, não nosso — é a razão de reusar o `Dialog` em vez de desenhar
 * uma gaveta do zero.
 */
export function GavetaFiltros({
  totalAtivos,
  totalPlanos,
  aoLimpar,
  ...painel
}: GavetaFiltrosProps) {
  const [aberta, definirAberta] = useState(false)

  const rotuloPlanos = totalPlanos === 1 ? 'Ver 1 plano' : `Ver ${totalPlanos} planos`

  return (
    <Dialog open={aberta} onOpenChange={definirAberta}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full justify-between rounded-none border-2 border-traco bg-card px-[13px] text-[14px] font-bold"
        >
          <span className="flex items-center gap-2">
            <Funnel size={16} weight="bold" aria-hidden="true" />
            Filtros
          </span>
          {totalAtivos > 0 && (
            <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {totalAtivos} {totalAtivos === 1 ? 'ativo' : 'ativos'}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent variante="gaveta">
        <DialogTitle className="border-b-2 border-traco px-[13px] py-3 font-display text-[17px] font-bold">
          Filtros
        </DialogTitle>

        <div className="overflow-y-auto px-[13px] py-3">
          {/* `comBusca={false}`: a busca fica na PÁGINA, acima do botão que
              abre esta gaveta. Dois campos com o mesmo valor dariam a quem
              usa leitor de tela dois controles indistinguíveis pelo nome. */}
          <PainelFiltros {...painel} comBusca={false} />
        </div>

        <div className="flex gap-2 border-t-2 border-traco px-[13px] py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              aoLimpar()
              definirAberta(false)
            }}
            className="min-h-11 grow rounded-none border-2 border-traco bg-card text-[13.5px] font-bold"
          >
            Limpar
          </Button>
          <Button
            type="button"
            onClick={() => definirAberta(false)}
            className="min-h-11 grow rounded-none bg-primary text-[13.5px] font-bold text-primary-foreground"
          >
            {rotuloPlanos}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
