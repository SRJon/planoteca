import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft'
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple'
import { Link, useParams } from 'react-router'
import type { PlanoDetalhe } from '@/entities/plano'
import { rotuloDuracao, usePlano } from '@/entities/plano'
import { classeCorComponente } from '@/entities/vocabulario'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'
import { Container } from '@/components/container'

/** O rótulo em mono, caixa alta e espacejado que a direção usa nas seções. */
function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
      {children}
    </h2>
  )
}

/** Um bloco de prosa com etiqueta. Some quando não há conteúdo — um título
 * "Recursos" com nada abaixo parece defeito, não ausência. */
function Secao({ titulo, texto }: { titulo: string; texto: string | null | undefined }) {
  if (!texto?.trim()) return null
  return (
    <section className="flex flex-col gap-2">
      <Etiqueta>{titulo}</Etiqueta>
      <p className="max-w-[68ch] whitespace-pre-line">{texto}</p>
    </section>
  )
}

/**
 * O roteiro, em passos numerados.
 *
 * Número em círculo é legítimo aqui porque a ORDEM é real: as etapas de um
 * plano acontecem em sequência, e o professor as executa uma após a outra.
 * Não é enfeite de lista.
 */
function Roteiro({ plano }: { plano: PlanoDetalhe }) {
  if (plano.etapas.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <Etiqueta>Como conduzir</Etiqueta>
      <ol className="flex list-none flex-col gap-4 p-0">
        {plano.etapas.map((etapa) => (
          <li key={etapa.ordem} className="flex gap-3">
            <span
              aria-hidden
              className="grid size-7 flex-none place-items-center border-2 border-traco font-mono text-[12px] font-bold"
            >
              {etapa.ordem}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              {etapa.titulo && <h3 className="text-base leading-tight">{etapa.titulo}</h3>}
              <p className="max-w-[64ch] whitespace-pre-line text-muted-foreground">
                {etapa.descricao}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

/**
 * A ficha completa de um plano.
 *
 * É a tela que o briefing pede quando fala em "objetivos de aprendizagem,
 * materiais necessários e o botão de download" — tudo visível SEM abrir o
 * PDF. O professor decide se o plano serve antes de baixar.
 *
 * Pública, como o resto do acervo: nenhuma guarda, e o botão de baixar é um
 * link direto para o arquivo no R2.
 */
export function PaginaPlano({ cliente }: { cliente: Cliente }) {
  // O `<main>` do `LayoutPublico` é só o palco, sem largura máxima: é a
  // página que pede a coluna de leitura. Ver `components/container`.
  return (
    <Container className="py-8">
      <ConteudoPlano cliente={cliente} />
    </Container>
  )
}

/** Separado do componente exportado só para que os quatro ramos de
 * estado — carregando, erro, ausente e a ficha — fiquem todos dentro do
 * mesmo `<Container>`, sem repeti-lo em cada `return`. */
function ConteudoPlano({ cliente }: { cliente: Cliente }) {
  const { id } = useParams<{ id: string }>()
  const consulta = usePlano(cliente, id)

  if (consulta.isPending) {
    return <p className="px-2 py-8 text-muted-foreground">Carregando plano…</p>
  }

  if (consulta.isError) {
    return (
      <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-6 text-err">
        {mensagemDe(consulta.error)}
      </p>
    )
  }

  // `null` é 404: o plano não existe OU ainda é rascunho. As duas dizem a
  // mesma coisa a quem chegou pela URL, e a tela não distingue de propósito
  // (ver `entities/plano/api.ts`).
  if (!consulta.data) {
    return (
      <div className="flex flex-col items-start gap-4 py-8">
        <h1 className="text-3xl">Este plano não está no acervo</h1>
        <p className="max-w-[52ch] text-muted-foreground">
          O endereço pode estar errado, ou o plano ainda não foi publicado.
        </p>
        <Link
          to="/biblioteca"
          className="border-2 border-traco bg-primary px-5 py-2.5 font-bold text-primary-foreground hover:bg-primary/90"
        >
          Ver a Biblioteca
        </Link>
      </div>
    )
  }

  const plano = consulta.data
  const componente = plano.componentePrincipal
  const duracao = rotuloDuracao(plano)

  return (
    <article className="flex flex-col gap-8 py-2">
      <Link
        to="/biblioteca"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        <ArrowLeft size={15} weight="bold" aria-hidden />
        Voltar à Biblioteca
      </Link>

      <header className="flex flex-col gap-4">
        <div className="flex items-stretch gap-3">
          <div
            className={`flex w-14 flex-none items-center justify-center border-2 border-traco ${classeCorComponente(componente)}`}
          >
            <span aria-hidden className="font-display text-[21px] font-bold text-comp-texto">
              {componente?.sigla ?? '—'}
            </span>
          </div>
          <div className="flex min-w-0 flex-col justify-center gap-1">
            <p className="font-mono text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              {componente?.nome ?? 'Sem componente'}
              {plano.componentesSecundarios.length > 0 &&
                ` · ${plano.componentesSecundarios.map((c) => c.nome).join(' · ')}`}
            </p>
            <h1 className="text-3xl leading-[1.12] max-sm:text-2xl">{plano.titulo}</h1>
          </div>
        </div>

        <p className="text-muted-foreground">{plano.autoria}</p>

        {/* A catalogação em bloco: o que o professor confere de relance antes
            de decidir se o plano serve para a turma dele. */}
        <dl className="flex flex-wrap gap-x-8 gap-y-3 border-y-2 border-traco py-3">
          <div className="flex flex-col gap-0.5">
            <dt className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
              Série
            </dt>
            <dd className="text-sm">
              {plano.series.length > 0
                ? plano.series.map((s) => s.rotuloCompleto).join(' · ')
                : '—'}
            </dd>
          </div>
          {plano.modalidade && (
            <div className="flex flex-col gap-0.5">
              <dt className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                Modalidade
              </dt>
              <dd className="text-sm">{plano.modalidade}</dd>
            </div>
          )}
          {duracao && (
            <div className="flex flex-col gap-0.5">
              <dt className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                Duração
              </dt>
              <dd className="text-sm">{duracao}</dd>
            </div>
          )}
          {/* Os códigos BNCC só aparecem quando existem. A maioria dos planos
              do acervo real não traz nenhum, e um "BNCC: —" em toda ficha
              anunciaria uma ausência que não é falha. */}
          {plano.codigosBncc.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <dt className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                BNCC
              </dt>
              <dd className="font-mono text-sm">{plano.codigosBncc.join(', ')}</dd>
            </div>
          )}
        </dl>

        {plano.metodologias.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {plano.metodologias.map((metodologia) => (
              <span
                key={metodologia.id}
                className="inline-block bg-accent px-[7px] py-[3px] text-[11.5px] font-bold text-accent-foreground"
              >
                {metodologia.nome}
              </span>
            ))}
          </div>
        )}

        {/* O download fica no ALTO, e repetido embaixo: quem já decidiu não
            deveria precisar rolar a ficha inteira para baixar. */}
        <a
          href={plano.arquivoUrl}
          download
          className="flex min-h-12 w-fit items-center gap-2 border-2 border-traco bg-acao px-6 text-[15px] font-bold text-acao-texto transition-colors hover:bg-acao-hover active:bg-acao-ativa"
        >
          <DownloadSimple size={17} weight="bold" aria-hidden />
          Baixar plano
          <span className="sr-only">: {plano.titulo}</span>
        </a>
      </header>

      <Secao titulo="Objetos de conhecimento" texto={plano.objetosConhecimento} />
      <Secao titulo="Objetivo da prática" texto={plano.objetivo} />
      <Secao titulo="Expectativas de aprendizagem" texto={plano.expectativasAprendizagem} />
      <Secao titulo="Recursos utilizados" texto={plano.recursos} />

      <Roteiro plano={plano} />

      <footer className="flex flex-col gap-3 border-t-2 border-traco pt-6">
        <a
          href={plano.arquivoUrl}
          download
          className="flex min-h-12 w-fit items-center gap-2 border-2 border-traco bg-acao px-6 text-[15px] font-bold text-acao-texto transition-colors hover:bg-acao-hover active:bg-acao-ativa"
        >
          <DownloadSimple size={17} weight="bold" aria-hidden />
          Baixar plano
          <span className="sr-only">: {plano.titulo}</span>
        </a>
      </footer>
    </article>
  )
}
