import { Link } from 'react-router'
import { CardPost, usePosts } from '@/entities/post'
import type { Cliente } from '@/shared/api'
import { Container } from '@/components/container'

/** Quantos relatos cabem na landing. Três é uma linha da grade, e a landing
 * mostra amostra — quem quiser a lista inteira tem o link ao lado. */
const QUANTOS = 3

/**
 * Os últimos relatos publicados, na landing.
 *
 * Enquanto a busca está em voo, e se ela falhar, a seção não renderiza nada
 * — a mesma decisão dos cards de área e da régua de séries: melhor não
 * existir do que reservar espaço para uma lista que talvez não venha. Com
 * zero publicados ela também some, porque a faixa "Escreve também?" logo
 * acima já faz o convite, e um "nenhum texto ainda" repetido embaixo dela
 * seria a mesma frase duas vezes.
 *
 * O corte de três é feito no CLIENTE, e não só por `tamanhoPagina`: o
 * parâmetro vai para a API — que ainda não existe —, mas nada garante que o
 * back-end o respeite, e a landing não pode crescer em silêncio se ele for
 * ignorado. A simulação de rede é exatamente esse caso: `filtrarPosts`
 * (`src/teste/planos.ts`) não lê `perPage`.
 */
export function UltimosDoBlog({ cliente }: { cliente: Cliente }) {
  const consulta = usePosts(cliente, { tamanhoPagina: QUANTOS })

  if (consulta.isPending || consulta.isError) return null

  const posts = (consulta.data?.itens ?? []).slice(0, QUANTOS)
  if (posts.length === 0) return null

  return (
    <Container className="py-14">
      <section className="flex flex-col gap-6">
        <header className="grid grid-cols-[1fr_auto] items-end gap-6 max-md:grid-cols-1 max-md:items-start max-md:gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
              Do Blog
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Últimos relatos de sala de aula
            </h2>
          </div>
          <Link
            to="/blog"
            className="border-2 border-traco bg-card px-4 py-2 font-bold hover:bg-secondary max-md:self-start"
          >
            Ver todos os textos
          </Link>
        </header>

        <ul className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {posts.map((post) => (
            <li key={post.id} className="flex">
              <CardPost post={post} />
            </li>
          ))}
        </ul>
      </section>
    </Container>
  )
}
