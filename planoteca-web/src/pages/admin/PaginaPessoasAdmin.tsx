import { useState } from 'react'
import { UsersThree } from '@phosphor-icons/react/dist/csr/UsersThree'
import {
  DESCRICAO_PAPEL,
  ROTULO_PAPEL,
  primeiroNomeDe,
  useAlterarAtivo,
  useAlterarPapel,
  useContas,
} from '@/entities/conta'
import type { Conta, Papel } from '@/entities/conta'
import { Button } from '@/components/ui/button'
import { CampoBusca } from '@/components/ui/campo-busca'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'

/** A data de cadastro, sem hora — é o que a linha precisa mostrar. */
function dataCadastro(conta: Conta): string {
  return new Date(conta.criadoEm).toLocaleDateString('pt-BR')
}

/** O que uma ação de papel ou de acesso está prestes a fazer, em português
 * direto — é o texto que o diálogo de confirmação mostra. */
type AcaoPendente =
  | { tipo: 'papel'; conta: Conta; novoPapel: Papel }
  | { tipo: 'ativo'; conta: Conta; novoAtivo: boolean }

function tituloAcao(acao: AcaoPendente): string {
  if (acao.tipo === 'papel') {
    return acao.novoPapel === 'administrador'
      ? `Promover ${primeiroNomeDe(acao.conta)} a administrador?`
      : `Rebaixar ${primeiroNomeDe(acao.conta)} a professor?`
  }
  return acao.novoAtivo
    ? `Reativar o acesso de ${primeiroNomeDe(acao.conta)}?`
    : `Desativar o acesso de ${primeiroNomeDe(acao.conta)}?`
}

function descricaoAcao(acao: AcaoPendente): string {
  if (acao.tipo === 'papel') {
    return acao.novoPapel === 'administrador'
      ? DESCRICAO_PAPEL.administrador
      : 'A conta deixa de moderar o blog e catalogar planos. Continua podendo escrever para o blog.'
  }
  return acao.novoAtivo
    ? 'A pessoa volta a entrar com a própria conta.'
    : 'A pessoa não consegue mais entrar. Os textos e planos já publicados continuam no ar.'
}

/** Uma pessoa cadastrada, com os controles de papel e de acesso. */
function LinhaConta({
  conta,
  souEu,
  aoPedirConfirmacao,
}: {
  conta: Conta
  souEu: boolean
  aoPedirConfirmacao: (acao: AcaoPendente) => void
}) {
  const administrador = conta.papel === 'administrador'

  return (
    <article className="flex flex-wrap items-center gap-3 border-2 border-traco bg-card px-3 py-2.5">
      <div className="flex min-w-[220px] grow flex-col gap-0.5">
        <h3 className="text-base leading-tight">
          {conta.nome}
          {souEu && <span className="ml-1.5 text-[12px] text-muted-foreground">(você)</span>}
        </h3>
        <p className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
          {conta.email} · cadastrado em {dataCadastro(conta)}
        </p>
      </div>

      <p className="min-w-[140px] text-[13px] text-muted-foreground">
        {conta.postsPublicados} {conta.postsPublicados === 1 ? 'texto publicado' : 'textos publicados'}
        {conta.postsPendentes > 0 && ` · ${conta.postsPendentes} pendente${conta.postsPendentes === 1 ? '' : 's'}`}
      </p>

      <span
        className={`inline-block px-[7px] py-[3px] text-[11px] font-bold ${
          administrador ? 'bg-info-bg text-info' : 'bg-secondary text-foreground'
        }`}
      >
        {ROTULO_PAPEL[conta.papel]}
      </span>

      <span
        className={`inline-block px-[7px] py-[3px] text-[11px] font-bold ${
          conta.ativo ? 'bg-ok-bg text-ok' : 'bg-err-bg text-err'
        }`}
      >
        {conta.ativo ? 'Ativa' : 'Desativada'}
      </span>

      <div className="flex gap-1.5">
        <Button
          type="button"
          variant="outline"
          disabled={souEu}
          onClick={() =>
            aoPedirConfirmacao({
              tipo: 'papel',
              conta,
              novoPapel: administrador ? 'professor' : 'administrador',
            })
          }
          className="min-h-11 rounded-none border-2 px-4 text-[13px] font-bold"
        >
          {administrador ? 'Rebaixar a professor' : 'Promover a administrador'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={souEu}
          onClick={() =>
            aoPedirConfirmacao({ tipo: 'ativo', conta, novoAtivo: !conta.ativo })
          }
          className={`min-h-11 rounded-none px-3 text-[13px] ${conta.ativo ? 'text-err' : ''}`}
        >
          {conta.ativo ? 'Desativar' : 'Reativar'}
          <span className="sr-only">: {conta.nome}</span>
        </Button>
      </div>
    </article>
  )
}

/**
 * O painel de pessoas.
 *
 * Quem se cadastrou, o que cada uma escreveu, e o controle de papel e de
 * acesso. As duas ações mudam permissão — por isso pedem confirmação, e por
 * isso o próprio botão some para a linha da pessoa logada: ninguém remove o
 * próprio acesso de administrador por aqui.
 *
 * As guardas de verdade são da API (`AdminPessoasController`): esconder o
 * botão evita um clique que já sabemos que vai falhar, mas quem garante a
 * regra é o servidor.
 */
export function PaginaPessoasAdmin({ cliente, minhaContaId }: { cliente: Cliente; minhaContaId: string | null }) {
  const [busca, setBusca] = useState('')
  const [acaoPendente, setAcaoPendente] = useState<AcaoPendente | null>(null)

  const consulta = useContas(cliente, { busca })
  const alterarPapel = useAlterarPapel(cliente)
  const alterarAtivo = useAlterarAtivo(cliente)

  const contas = consulta.data?.itens ?? []
  const total = consulta.data?.total ?? 0
  const ocupado = alterarPapel.isPending || alterarAtivo.isPending
  const erro = alterarPapel.error ?? alterarAtivo.error

  function confirmar() {
    if (!acaoPendente) return
    if (acaoPendente.tipo === 'papel') {
      alterarPapel.mutate(
        { id: acaoPendente.conta.id, papel: acaoPendente.novoPapel },
        { onSuccess: () => setAcaoPendente(null) },
      )
    } else {
      alterarAtivo.mutate(
        { id: acaoPendente.conta.id, ativo: acaoPendente.novoAtivo },
        { onSuccess: () => setAcaoPendente(null) },
      )
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px]">Pessoas</h1>
        <p className="text-muted-foreground">
          Quem se cadastrou na Planoteca, e o controle de papel e de acesso de cada um.
        </p>
      </header>

      <CampoBusca
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
        placeholder="Nome ou e-mail"
        aria-label="Buscar pessoas"
      />

      <div className="flex items-center justify-between gap-3 bg-foreground px-[13px] py-2.5 text-background">
        <span aria-live="polite" className="font-mono text-[12.5px] font-semibold">
          {total} {total === 1 ? 'pessoa' : 'pessoas'}
        </span>
      </div>

      {erro && (
        <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-3 text-err">
          {mensagemDe(erro)}
        </p>
      )}

      {consulta.isError ? (
        <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-6 text-err">
          {mensagemDe(consulta.error)}
        </p>
      ) : consulta.isPending ? (
        <p className="px-2 py-6 text-muted-foreground">Carregando as pessoas…</p>
      ) : contas.length === 0 ? (
        <div className="flex items-center gap-3 border-2 border-traco bg-card px-6 py-8">
          <UsersThree size={20} weight="bold" aria-hidden className="flex-none text-muted-foreground" />
          <p className="text-muted-foreground">
            {busca ? 'Nenhuma pessoa com esse termo.' : 'Ninguém se cadastrou ainda.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {contas.map((conta) => (
            <LinhaConta
              key={conta.id}
              conta={conta}
              souEu={conta.id === minhaContaId}
              aoPedirConfirmacao={setAcaoPendente}
            />
          ))}
        </div>
      )}

      <Dialog
        open={acaoPendente !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setAcaoPendente(null)
        }}
      >
        <DialogContent>
          {acaoPendente && (
            <>
              <DialogHeader>
                <DialogTitle>{tituloAcao(acaoPendente)}</DialogTitle>
                <DialogDescription>{descricaoAcao(acaoPendente)}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAcaoPendente(null)} disabled={ocupado}>
                  Cancelar
                </Button>
                <Button type="button" onClick={confirmar} disabled={ocupado}>
                  Confirmar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
