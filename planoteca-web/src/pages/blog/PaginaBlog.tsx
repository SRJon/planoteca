import { Link } from 'react-router'
import { CardPost, usePosts } from '@/entities/post'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'
import { Container } from '@/components/container'

/**
 * O Blog — relato de sala de aula, de professor para professor.
 *
 * Grade de cards, e não lista editorial (decisão de 2026-08-26): a lista
 * de título e resumo soltos lia como texto corrido, e nada nela dizia que
 * dava para clicar. O card (`CardPost`, o mesmo da landing) dá contorno,
 * kicker e um "Ler o relato →" a cada texto — cada um vira uma porta.
 *
 * Só textos publicados. Pendente, devolvido e recusado não existem para quem
 * chega de fora — a API nem os devolve.
 */
export function PaginaBlog({ cliente }: { cliente: Cliente }) {
  const consulta = usePosts(cliente)
  const posts = consulta.data?.itens ?? []

  // O `<main>` do `LayoutPublico` é só o palco, sem largura máxima: é a
  // página que pede a coluna de leitura. Ver `components/container`.
  return (
    <Container className="py-8">
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
          <ul className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {posts.map((post) => (
              <li key={post.id} className="flex">
                <CardPost post={post} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  )
}
