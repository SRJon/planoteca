import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { Link } from 'react-router'
import { FormularioCatalogar, useCatalogarPlano } from '@/features/catalogar-plano'
import { useVocabulario } from '@/entities/vocabulario'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'

/**
 * A tela de catalogação — a mesa de trabalho do administrador.
 *
 * O que ela mostra ACIMA do formulário é o que já foi catalogado nesta
 * sessão. Não é enfeite: numa leva de trinta planos, a pergunta que volta é
 * "já subi este?", e a lista responde sem sair da tela. Ela vive em memória
 * e some ao recarregar, de propósito — é um registro do turno de trabalho,
 * não um histórico.
 */
export function PaginaCatalogar({ cliente }: { cliente: Cliente }) {
  const { vocabulario, carregando, erro } = useVocabulario(cliente)
  const catalogacao = useCatalogarPlano(cliente)

  if (carregando) {
    return <p className="px-2 py-8 text-muted-foreground">Carregando o vocabulário…</p>
  }

  if (erro) {
    return (
      <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-6 text-err">
        {mensagemDe(erro)}
      </p>
    )
  }

  // Sem vocabulário não há como catalogar: os chips de componente e série
  // ficariam vazios, e o formulário recusaria o envio sem dizer por quê.
  if (vocabulario.componentes.length === 0 || vocabulario.series.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 py-8">
        <h1 className="text-2xl">O vocabulário está vazio</h1>
        <p className="max-w-[56ch] text-muted-foreground">
          Não há componentes curriculares nem séries cadastrados, e sem eles não é possível
          catalogar um plano. A migration inicial da API semeia os dois — confira se ela foi
          aplicada no banco.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px]">Catalogar plano</h1>
        <p className="text-muted-foreground">
          O arquivo vai direto para o acervo. Os campos seguem os rótulos do documento.
        </p>
      </header>

      {catalogacao.catalogados.length > 0 && (
        <section
          // `aria-live`: a lista cresce sem que o foco saia do formulário —
          // sem isto, quem usa leitor de tela não saberia que o envio deu
          // certo.
          aria-live="polite"
          className="flex flex-col gap-2 border-2 border-traco bg-card px-4 py-3"
        >
          <h2 className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.1em] uppercase">
            <CheckCircle size={15} weight="bold" aria-hidden className="text-ok" />
            {catalogacao.catalogados.length}{' '}
            {catalogacao.catalogados.length === 1 ? 'plano catalogado' : 'planos catalogados'} nesta
            sessão
          </h2>
          <ul className="flex flex-col gap-1 pl-0">
            {catalogacao.catalogados.map((titulo, indice) => (
              // A chave usa o índice porque a lista só CRESCE pela frente e
              // nada é removido nem reordenado — não há identidade a
              // preservar, e dois planos podem legitimamente ter o mesmo
              // título.
              <li key={`${titulo}-${indice}`} className="list-none text-sm text-muted-foreground">
                {titulo}
              </li>
            ))}
          </ul>
          <Link to="/biblioteca" className="w-fit text-sm underline underline-offset-4">
            Ver na Biblioteca
          </Link>
        </section>
      )}

      <FormularioCatalogar catalogacao={catalogacao} vocabulario={vocabulario} />
    </div>
  )
}
