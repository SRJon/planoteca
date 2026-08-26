import { useEffect } from 'react'
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { Link, useParams } from 'react-router'
import {
  dataDoPost,
  jaVisualizadoNesteNavegador,
  marcarVisualizadoNesteNavegador,
  registrarVisualizacao,
  usePost,
} from '@/entities/post'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'
import { Container } from '@/components/container'

/**
 * Um texto do blog.
 *
 * O corpo é HTML rico, escrito no editor Tiptap de `PaginaEscrever`. Ele
 * chega a este componente JÁ sanitizado — a API roda o mesmo
 * `HtmlSanitizerService` (`Ganss.Xss`, lista de permissão estrita: `p`,
 * `br`, `strong`, `em`, `h2`, `h3`, `ul`, `ol`, `li`, `a[href]`) tanto ao
 * GRAVAR quanto ao SERVIR, então mesmo um post antigo, gravado antes desta
 * mudança, ou um `corpo` inserido direto no banco, passa pelo filtro antes
 * de chegar aqui. É essa garantia do SERVIDOR — não algo que este
 * componente verifica — que torna `dangerouslySetInnerHTML` aceitável
 * aqui e na tela de moderação, os dois únicos lugares do produto que o
 * usam.
 */
export function PaginaPost({ cliente }: { cliente: Cliente }) {
  // O `<main>` do `LayoutPublico` é só o palco, sem largura máxima: é a
  // página que pede a coluna de leitura. Ver `components/container`.
  return (
    <Container className="py-8">
      <ConteudoPost cliente={cliente} />
    </Container>
  )
}

/** Separado do componente exportado só para que os quatro ramos de
 * estado — carregando, erro, ausente e a ficha — fiquem todos dentro do
 * mesmo `<Container>`, sem repeti-lo em cada `return`. */
function ConteudoPost({ cliente }: { cliente: Cliente }) {
  const { id } = useParams<{ id: string }>()
  const consulta = usePost(cliente, id)

  // Uma vez por navegador a cada 24h: a marca fica só no `localStorage`
  // desta máquina, e a chamada é sempre depois de o texto já estar na tela
  // — se falhar, quem lê nem percebe.
  useEffect(() => {
    if (!id || !consulta.data) return
    if (jaVisualizadoNesteNavegador(id)) return

    marcarVisualizadoNesteNavegador(id)
    void registrarVisualizacao(cliente, id)
    // `consulta.data` na dependência dispararia de novo a cada refetch —
    // só o `id` importa aqui, é o que identifica QUAL texto foi lido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, Boolean(consulta.data)])

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
        <p className="flex flex-wrap items-center gap-x-2 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
          <span>
            {post.autorNome} · {dataDoPost(post)}
          </span>
          <span className="inline-flex items-center gap-1 normal-case tracking-normal">
            <Eye size={13} weight="bold" aria-hidden />
            {post.visualizacoes} {post.visualizacoes === 1 ? 'leitura' : 'leituras'}
          </span>
        </p>
        <h1 className="max-w-[26ch] text-4xl leading-[1.1] max-sm:text-3xl">{post.titulo}</h1>
        {post.resumo && <p className="max-w-[60ch] text-lg text-muted-foreground">{post.resumo}</p>}
      </header>

      {/* `max-w-[68ch]`: linha longa demais cansa a leitura, e este é o único
          lugar do produto com texto corrido de verdade.
          `dangerouslySetInnerHTML`: seguro aqui porque `post.corpo` já
          passou pela sanitização do servidor — ver o comentário do
          componente, acima. */}
      <div
        className="max-w-[68ch] leading-[1.7] [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-bold [&_p]:mt-4 [&_p:first-child]:mt-0 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-primary [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: post.corpo }}
      />
    </article>
  )
}
