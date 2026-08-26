import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple'
import { Link } from 'react-router'
import type { Plano } from '@/entities/plano'
import { rotuloDuracao } from '@/entities/plano'
import { classeCorComponente } from '@/entities/vocabulario'

/**
 * A ficha de um plano — o card da biblioteca.
 *
 * A assinatura da direção mora aqui: o bloco geométrico do componente, com
 * a sigla de duas letras, colado ao conteúdo por um traço de 2px.
 *
 * ── O bloco quando não há componente principal ───────────────────────────
 *
 * `componentePrincipal` pode vir `null`. Antes isso era impossível — o
 * componente era um union fechado, e o TypeScript recusava o caso. Com o
 * vocabulário no banco, um plano gravado por fora da validação chega aqui
 * sem principal, e a escolha é degradar de forma VISÍVEL: bloco neutro e
 * traço "—" no lugar da sigla, nunca um bloco transparente que parece
 * defeito de renderização.
 */
export function FichaPlano({ plano }: { plano: Plano }) {
  const componente = plano.componentePrincipal
  const duracao = rotuloDuracao(plano)
  // Só a primeira metodologia no card: um plano pode ter várias
  // ("Storytelling e Escape Room"), e listar todas quebraria a altura fixa
  // da linha da grade. As demais aparecem na ficha completa.
  const metodologiaPrincipal = plano.metodologias[0]
  const outrasMetodologias = plano.metodologias.length - 1

  return (
    // `h-full` + o `flex-grow` na faixa de baixo: a grade da página dá a
    // todas as fichas de uma linha a mesma altura, e sem isto a ficha ficaria
    // colada no topo com o botão flutuando no meio do vão. Com isto, o botão
    // de baixar alinha na base em toda a linha, independente de o título ter
    // uma ou duas linhas e de a metodologia ser curta ou longa.
    <article className="relative flex h-full flex-col border-2 border-traco bg-card">
      <div className="flex grow items-stretch">
        <div
          className={`flex w-14 shrink-0 items-center justify-center border-r-2 border-traco ${classeCorComponente(componente)}`}
        >
          {/* `aria-hidden`: a sigla é uma pista VISUAL redundante — o nome
              do componente por extenso vem na linha ao lado, e um leitor de
              tela que anunciasse "QU, Química, 2ª série" leria a mesma
              informação duas vezes. */}
          <span aria-hidden className="font-display text-[21px] font-bold text-comp-texto">
            {componente?.sigla ?? '—'}
          </span>
        </div>
        <div className="flex grow flex-col gap-[5px] px-[13px] py-[11px]">
          <p className="font-mono text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            {componente?.nome ?? 'Sem componente'}
            {/* As séries por sigla, separadas por vírgula: um plano atende
                mais de uma ("8º, 9º"), e o rótulo completo não caberia. */}
            {plano.series.length > 0 && ` · ${plano.series.map((s) => s.sigla).join(', ')}`}
          </p>
          {/* O título é o link para a ficha, e não o card inteiro: um card
              clicável engoliria o botão de baixar, que é um link aninhado —
              HTML inválido, e um alvo de toque que faz duas coisas
              diferentes dependendo de onde o dedo cai.
              `after:absolute inset-0` estende a área clicável do título por
              todo o card MENOS o rodapé, que tem `relative` e fica por
              cima. */}
          <h3 className="text-base leading-[1.22]">
            <Link
              to={`/biblioteca/${plano.id}`}
              className="after:absolute after:inset-0 hover:underline focus-visible:underline"
            >
              {plano.titulo}
            </Link>
          </h3>
          <p className="text-[12px] text-muted-foreground">{plano.objetosConhecimento}</p>
        </div>
      </div>

      <div className="relative mt-auto flex flex-col gap-[9px] border-t-2 border-traco px-[13px] py-2.5">
        {/* Duas linhas fixas, não uma que embrulha.
            A metodologia varia muito de comprimento ("Estudo de casos" contra
            "Aprendizagem Baseada em Projetos"), e numa única linha embrulhada
            a duração caía para a segunda linha em alguns cards e não em
            outros — a mesma informação mudava de lugar de card para card, que
            é justamente o que a grade rígida da direção existe para impedir. */}
        {metodologiaPrincipal && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-block bg-accent px-[7px] py-[3px] text-[11.5px] font-bold text-accent-foreground">
              {metodologiaPrincipal.nome}
            </span>
            {outrasMetodologias > 0 && (
              <span className="text-[11.5px] text-muted-foreground">
                +{outrasMetodologias}
              </span>
            )}
          </div>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[12.5px] text-muted-foreground">{duracao ?? ''}</span>
          <span className="font-mono text-[11px] text-primary">{plano.autoria}</span>
        </div>
        {/* Um `a` com `download`, não um `button` com `onClick`: baixar um
            arquivo É navegar até ele. Assim o menu de contexto, o
            "abrir em nova aba" e o clique do meio funcionam sozinhos.
            O arquivo mora no Cloudflare R2 e responde sem token — baixar
            plano não exige conta.

            Só existe quando HÁ anexo, e no lugar dele não entra nada: nem
            aviso, nem botão desabilitado. O plano sem arquivo continua
            valendo pelo que a ficha mostra, e anunciar a ausência em todo
            card transformaria um caso normal em falha aparente. */}
        {plano.arquivoUrl && (
          <a
            href={plano.arquivoUrl}
            download
            className="flex min-h-11 items-center justify-center gap-2 border-2 border-traco bg-acao text-[14.5px] font-bold text-acao-texto transition-colors hover:bg-acao-hover active:bg-acao-ativa"
          >
            <DownloadSimple size={16} weight="bold" />
            Baixar plano
            <span className="sr-only">: {plano.titulo}</span>
          </a>
        )}
      </div>
    </article>
  )
}
