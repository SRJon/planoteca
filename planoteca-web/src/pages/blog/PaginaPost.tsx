import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft'
import { Link, useParams } from 'react-router'
import { usePost, dataDoPost } from '@/entities/post'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'

/**
 * Um texto do blog.
 *
 * O corpo é texto simples com quebras de linha preservadas
 * (`whitespace-pre-line`), e NÃO HTML: o texto vem de um professor pelo
 * formulário, e renderizar HTML de entrada de usuário abriria injeção de
 * script. Quando o blog precisar de negrito e link, o caminho é markdown
 * sanitizado, não `dangerouslySetInnerHTML`.
 */
export function PaginaPost({ cliente }: { cliente: Cliente }) {
  const { id } = useParams<{ id: string }>()
  const consulta = usePost(cliente, id)

  if (consulta.isPending) {
    return <p className="px-2 py-8 text-muted-foreground">Carregando o texto…</p>
  }

  if (consulta.isError) {
    return (
      <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-6 text-err">
        {mensagemDe(consulta.error)}
      </p>
    )
  }

  // `null` é 404: não existe, ou ainda não foi publicado. As duas dizem a
  // mesma coisa a quem chegou pela URL.
  if (!consulta.data) {
    return (
      <div className="flex flex-col items-start gap-4 py-8">
        <h1 className="text-3xl">Este texto não está publicado</h1>
        <p className="max-w-[52ch] text-muted-foreground">
          O endereço pode estar errado, ou o texto ainda não passou pela moderação.
        </p>
        <Link
          to="/blog"
          className="border-2 border-traco bg-primary px-5 py-2.5 font-bold text-primary-foreground hover:bg-primary/90"
        >
          Ver o Blog
        </Link>
      </div>
    )
  }

  const post = consulta.data

  return (
    <article className="flex flex-col gap-6 py-2">
      <Link
        to="/blog"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        <ArrowLeft size={15} weight="bold" aria-hidden />
        Voltar ao Blog
      </Link>

      <header className="flex flex-col gap-3 border-b-2 border-traco pb-5">
        <p className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
          {post.autorNome} · {dataDoPost(post)}
        </p>
        <h1 className="max-w-[26ch] text-4xl leading-[1.1] max-sm:text-3xl">{post.titulo}</h1>
        {post.resumo && <p className="max-w-[60ch] text-lg text-muted-foreground">{post.resumo}</p>}
      </header>

      {/* `max-w-[68ch]`: linha longa demais cansa a leitura, e este é o único
          lugar do produto com texto corrido de verdade. */}
      <div className="max-w-[68ch] leading-[1.7] whitespace-pre-line">{post.corpo}</div>
    </article>
  )
}
