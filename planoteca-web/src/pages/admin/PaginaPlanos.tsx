import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  alterarSituacaoPlano,
  listarPlanosAdmin,
  removerPlano,
  rotuloDuracao,
} from '@/entities/plano'
import type { Plano } from '@/entities/plano'
import { classeCorComponente } from '@/entities/vocabulario'
import { Button } from '@/components/ui/button'
import { CampoBusca } from '@/components/ui/campo-busca'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'

const CHAVE_PLANOS_ADMIN = ['planos', 'admin'] as const

/** Uma linha da gestão. Traz o que decide: situação, componente, série. */
function LinhaPlano({
  plano,
  cliente,
  aoAgir,
}: {
  plano: Plano
  cliente: Cliente
  aoAgir: (erro: string | null) => void
}) {
  const queryClient = useQueryClient()
  const publicado = plano.situacao === 'publicado'

  const alterar = useMutation({
    mutationFn: () => alterarSituacaoPlano(cliente, plano.id, !publicado),
    onSuccess: () => {
      aoAgir(null)
      // A alteração muda a listagem admin E a pública — despublicar tira o
      // plano da Biblioteca. Invalidar as duas raízes.
      queryClient.invalidateQueries({ queryKey: CHAVE_PLANOS_ADMIN })
      queryClient.invalidateQueries({ queryKey: ['planos'] })
    },
    onError: (erro) => aoAgir(mensagemDe(erro)),
  })

  const remover = useMutation({
    mutationFn: () => removerPlano(cliente, plano.id),
    onSuccess: () => {
      aoAgir(null)
      queryClient.invalidateQueries({ queryKey: CHAVE_PLANOS_ADMIN })
    },
    // A API recusa remover plano publicado, e a mensagem dela diz o porquê:
    // ele já circulou, e apagá-lo quebraria links compartilhados.
    onError: (erro) => aoAgir(mensagemDe(erro)),
  })

  const ocupado = alterar.isPending || remover.isPending

  return (
    <article className="flex flex-wrap items-center gap-3 border-2 border-traco bg-card px-3 py-2.5">
      <div
        className={`grid size-9 flex-none place-items-center ${classeCorComponente(plano.componentePrincipal)}`}
      >
        <span aria-hidden className="font-display text-[13px] font-bold text-comp-texto">
          {plano.componentePrincipal?.sigla ?? '—'}
        </span>
      </div>

      <div className="flex min-w-[220px] grow flex-col gap-0.5">
        <h3 className="text-base leading-tight">
          {publicado ? (
            <Link
              to={`/biblioteca/${plano.id}`}
              className="hover:underline focus-visible:underline"
            >
              {plano.titulo}
            </Link>
          ) : (
            // Rascunho não tem página pública — a rota devolveria 404. Um
            // link que leva a "não encontrado" é pior que texto simples.
            plano.titulo
          )}
        </h3>
        <p className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
          {plano.componentePrincipal?.nome ?? 'Sem componente'}
          {plano.series.length > 0 && ` · ${plano.series.map((s) => s.sigla).join(', ')}`}
          {rotuloDuracao(plano) && ` · ${rotuloDuracao(plano)}`}
        </p>
      </div>

      <span
        className={`inline-block px-[7px] py-[3px] text-[11px] font-bold ${
          publicado ? 'bg-ok-bg text-ok' : 'bg-secondary text-foreground'
        }`}
      >
        {publicado ? 'Publicado' : 'Rascunho'}
      </span>

      <div className="flex gap-1.5">
        <Button
          type="button"
          variant="outline"
          disabled={ocupado}
          onClick={() => alterar.mutate()}
          className="min-h-11 rounded-none border-2 px-4 text-[13px] font-bold"
        >
          {publicado ? 'Despublicar' : 'Publicar'}
        </Button>
        {!publicado && (
          <Button
            type="button"
            variant="ghost"
            disabled={ocupado}
            onClick={() => remover.mutate()}
            className="min-h-11 rounded-none px-3 text-[13px] text-err"
          >
            Remover
            <span className="sr-only">: {plano.titulo}</span>
          </Button>
        )}
      </div>
    </article>
  )
}

/**
 * A gestão do acervo.
 *
 * Mostra rascunho e publicado juntos — é a diferença desta tela para a
 * Biblioteca. O fluxo que ela serve é o do povoamento: catalogar uma leva
 * inteira em rascunho, conferir, e publicar de uma vez.
 *
 * **Despublicar não apaga.** O plano volta a rascunho e some da Biblioteca,
 * mas continua no acervo. Remover só vale para o que nunca foi publicado — um
 * plano que circulou tem links que professores compartilharam entre si, e
 * apagá-lo os quebraria em silêncio.
 */
export function PaginaPlanos({ cliente }: { cliente: Cliente }) {
  const [busca, setBusca] = useState('')
  const [erroAcao, setErroAcao] = useState<string | null>(null)

  const consulta = useQuery({
    queryKey: [...CHAVE_PLANOS_ADMIN, busca],
    queryFn: () => listarPlanosAdmin(cliente, { busca }),
  })

  const planos = consulta.data?.itens ?? []
  const total = consulta.data?.total ?? 0
  const rascunhos = planos.filter((p) => p.situacao !== 'publicado').length

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px]">Planos do acervo</h1>
        <p className="text-muted-foreground">
          Rascunho e publicado, juntos. Despublicar tira da Biblioteca sem apagar.
        </p>
      </header>

      <CampoBusca
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
        placeholder="Título, autoria ou objeto de conhecimento"
        aria-label="Buscar planos do acervo"
      />

      <div className="flex items-center justify-between gap-3 bg-foreground px-[13px] py-2.5 text-background">
        <span aria-live="polite" className="font-mono text-[12.5px] font-semibold">
          {total} {total === 1 ? 'plano' : 'planos'}
          {rascunhos > 0 && ` · ${rascunhos} em rascunho`}
        </span>
        <Link to="/admin/catalogar" className="text-[13px] font-bold underline underline-offset-4">
          Catalogar novo
        </Link>
      </div>

      {erroAcao && (
        <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-3 text-err">
          {erroAcao}
        </p>
      )}

      {consulta.isError ? (
        <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-6 text-err">
          {mensagemDe(consulta.error)}
        </p>
      ) : consulta.isPending ? (
        <p className="px-2 py-6 text-muted-foreground">Carregando o acervo…</p>
      ) : planos.length === 0 ? (
        <div className="flex flex-col items-start gap-3 border-2 border-traco bg-card px-6 py-10">
          <h2 className="text-lg">
            {busca ? 'Nenhum plano com esse termo' : 'O acervo ainda está vazio'}
          </h2>
          <Link
            to="/admin/catalogar"
            className="border-2 border-traco bg-primary px-4 py-2 font-bold text-primary-foreground hover:bg-primary/90"
          >
            Catalogar o primeiro plano
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {planos.map((plano) => (
            <LinhaPlano key={plano.id} plano={plano} cliente={cliente} aoAgir={setErroAcao} />
          ))}
        </div>
      )}
    </div>
  )
}
