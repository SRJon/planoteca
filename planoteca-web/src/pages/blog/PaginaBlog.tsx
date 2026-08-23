import { Link } from 'react-router'
import { usePosts, dataDoPost } from '@/entities/post'
import type { Post } from '@/entities/post'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'

/** Um texto na lista. O título é o link — o card inteiro não, pelo mesmo
 * motivo da ficha do plano: alvos de toque sobrepostos. */
function ItemPost({ post }: { post: Post }) {
  return (
    <article className="flex flex-col gap-1.5 border-b-2 border-traco-suave pb-5 last:border-b-0">
      <p className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
        {post.autorNome} · {dataDoPost(post)}
      </p>
      <h2 className="text-xl leading-tight">
        <Link to={`/blog/${post.id}`} className="hover:underline focus-visible:underline">
          {post.titulo}
        </Link>
      </h2>
      {post.resumo && <p className="max-w-[64ch] text-muted-foreground">{post.resumo}</p>}
    </article>
  )
}

/**
 * O Blog — relato de sala de aula, de professor para professor.
 *
 * Lista editorial, e não grade de cards: um texto se apresenta pelo título e
 * pelo resumo, não por uma miniatura. Cards iguais lado a lado fariam três
 * relatos distintos parecerem a mesma coisa.
 *
 * Só textos publicados. Pendente, devolvido e recusado não existem para quem
 * chega de fora — a API nem os devolve.
 */
export function PaginaBlog({ cliente }: { cliente: Cliente }) {
  const consulta = usePosts(cliente)
  const posts = consulta.data?.itens ?? []

  return (
    <div className="flex flex-col gap-8 py-2">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px]">Blog</h1>
        <p className="max-w-[60ch] text-muted-foreground">
          Relato de sala de aula, o que funcionou e o que não funcionou, escrito pelos próprios
          professores.
        </p>
      </header>

      {consulta.isError ? (
        <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-6 text-err">
          {mensagemDe(consulta.error)}
        </p>
      ) : consulta.isPending ? (
        <p className="px-2 py-6 text-muted-foreground">Carregando textos…</p>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-start gap-3 border-2 border-traco bg-card px-6 py-10">
          <h2 className="text-lg">Nenhum texto publicado ainda</h2>
          <p className="max-w-[52ch] text-muted-foreground">
            O Blog é dos professores. Se você tem um relato de sala de aula, entre e escreva — um
            administrador lê e publica.
          </p>
          <Link
            to="/entrar"
            className="mt-1 border-2 border-traco bg-card px-4 py-2 font-bold hover:bg-secondary"
          >
            Entrar para escrever
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {posts.map((post) => (
            <ItemPost key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
