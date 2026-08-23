import { NOME_PASSO, PASSOS, type NumeroPasso } from './useCatalogarPlano'

/**
 * A barra de progresso do formulário em 4 passos.
 *
 * Quatro segmentos de traço, não uma barra contínua com percentual: a
 * catalogação tem passos DISCRETOS, com nome cada um — "Passo 2 de 4:
 * Onde se aplica" é a informação que orienta, não "50%". Preenchido é
 * passo concluído; o segmento do passo atual usa a cor de seleção do
 * sistema (a mesma do chip ativo), o resto fica em traço suave.
 */
export function BarraProgresso({ passoAtual }: { passoAtual: NumeroPasso }) {
  const nome = NOME_PASSO[passoAtual]

  return (
    <div
      className="flex flex-col gap-2"
      role="progressbar"
      aria-valuenow={passoAtual}
      aria-valuemin={1}
      aria-valuemax={PASSOS.length}
      aria-valuetext={`Passo ${passoAtual} de ${PASSOS.length}: ${nome}`}
    >
      <div className="flex gap-1.5">
        {PASSOS.map((item) => (
          <span
            key={item.numero}
            aria-hidden
            className={
              item.numero <= passoAtual
                ? 'h-1.5 flex-1 bg-primary'
                : 'h-1.5 flex-1 bg-traco-suave'
            }
          />
        ))}
      </div>
      <p className="font-mono text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        Passo {passoAtual} de {PASSOS.length} — {nome}
      </p>
    </div>
  )
}
