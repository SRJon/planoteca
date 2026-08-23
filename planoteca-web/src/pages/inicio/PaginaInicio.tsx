import { Link } from 'react-router'
import type { Cliente } from '@/shared/api'
import { classeCorComponente, useVocabulario } from '@/entities/vocabulario'

/**
 * A landing pública — a primeira tela de quem chega.
 *
 * O trabalho dela é um só: explicar o que é a Planoteca em poucas linhas e
 * levar para a Biblioteca. O professor chega com uma hora vaga e uma turma
 * amanhã; cada bloco a mais entre ele e o acervo é atrito.
 *
 * Por isso NÃO tem: grade de "features", depoimento, contador de números,
 * newsletter. O caminho para o acervo é o elemento mais forte da página, e
 * os atalhos por componente e por ano abaixo dele são a mesma porta —
 * entram na Biblioteca com o filtro já aplicado, que é como um professor de
 * verdade começa a busca ("eu dou matemática, sétimo ano").
 */
export function PaginaInicio({ cliente }: { cliente: Cliente }) {
  // Os atalhos saem do vocabulário da API, não de uma lista fechada: um
  // componente cadastrado no painel aparece aqui sem deploy. Enquanto a
  // busca está em voo o vocabulário é vazio, e as duas seções somem — o que
  // é melhor do que reservar espaço para uma lista que talvez não venha.
  const { vocabulario } = useVocabulario(cliente)

  return (
    <div className="flex flex-col gap-12 py-4">
      <section className="flex flex-col items-start gap-5">
        <h1 className="max-w-[18ch] text-5xl leading-[1.05] font-bold tracking-tight max-sm:text-4xl">
          Plano de aula pronto, com metodologia ativa.
        </h1>
        <p className="max-w-[52ch] text-lg text-muted-foreground">
          Um acervo aberto, catalogado por série, componente e metodologia. Você filtra, abre e
          baixa o PDF. Sem cadastro, sem espera.
        </p>
        <Link
          to="/biblioteca"
          className="border-2 border-traco bg-primary px-6 py-3 text-base font-bold text-primary-foreground hover:bg-primary/90"
        >
          Ver os planos
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
          Comece pelo componente
        </h2>
        {/* A lista dos oito componentes usa o MESMO bloco de sigla do card da
            Biblioteca (`FichaPlano`) — mesma cor, mesma sigla de duas letras.
            Quem vê aqui já reconhece lá dentro. */}
        <ul className="flex flex-wrap gap-2">
          {vocabulario.componentes.map((componente) => (
            <li key={componente.id}>
              <Link
                to={`/biblioteca?componente=${componente.id}`}
                className="flex items-center gap-2 border-2 border-traco bg-card py-1.5 pr-3 pl-1.5 hover:bg-secondary"
              >
                <span
                  className={`grid size-7 flex-none place-items-center text-xs font-bold text-comp-texto ${classeCorComponente(componente)}`}
                  aria-hidden
                >
                  {componente.sigla}
                </span>
                <span className="text-sm">{componente.nome}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
          Ou pela série
        </h2>
        <ul className="flex flex-wrap gap-2">
          {vocabulario.series.map((serie) => (
            <li key={serie.id}>
              <Link
                to={`/biblioteca?serie=${serie.id}`}
                className="block border-2 border-traco bg-card px-4 py-2 text-sm hover:bg-secondary"
                aria-label={serie.rotuloCompleto}
              >
                {serie.nome}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 border-t-2 border-traco pt-8">
        <h2 className="text-2xl font-bold tracking-tight">Escreve também?</h2>
        <p className="max-w-[52ch] text-muted-foreground">
          O Blog é dos professores: relato de sala de aula, o que funcionou, o que não. Quem tem
          conta escreve; um administrador lê e publica.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            to="/blog"
            className="border-2 border-traco bg-card px-4 py-2 font-bold hover:bg-secondary"
          >
            Ler o Blog
          </Link>
          <Link to="/entrar" className="px-4 py-2 font-bold underline underline-offset-4">
            Entrar para escrever
          </Link>
        </div>
      </section>
    </div>
  )
}
