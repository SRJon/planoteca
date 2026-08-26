import { Link } from 'react-router'
import type { Post } from './modelo'
import { dataDoPost } from './modelo'

/**
 * Um relato do Blog, em card. É o mesmo desenho na landing e na lista do
 * Blog: quem reconhece o card na porta reconhece lá dentro.
 *
 * Card, e não lista editorial, por uma razão vista na tela: título e resumo
 * soltos sobre o papel liam como texto corrido, e nada dizia que dava para
 * clicar. O contorno de 2px, o kicker em mono e o "Ler o relato →" são o
 * que fazem o texto parecer uma porta.
 *
 * O título é o link, o card inteiro não — a mesma regra de `ItemPost`: um
 * card clicável com um link dentro cria alvos de toque sobrepostos.
 */
export function CardPost({ post }: { post: Post }) {
  return (
    <article className="flex w-full flex-col gap-2 border-2 border-traco bg-card p-5">
      <p className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
        {post.autorNome} · {dataDoPost(post)}
      </p>
      <h3 className="font-display text-lg leading-tight font-bold">
        <Link to={`/blog/${post.id}`} className="hover:underline focus-visible:underline">
          {post.titulo}
        </Link>
      </h3>
      {post.resumo && <p className="line-clamp-3 text-muted-foreground">{post.resumo}</p>}
      <p className="mt-auto pt-2">
        <Link to={`/blog/${post.id}`} className="font-bold underline underline-offset-4">
          Ler o relato →
        </Link>
      </p>
    </article>
  )
}
