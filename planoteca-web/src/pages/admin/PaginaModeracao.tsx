import { useState } from 'react'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import {
  CLASSE_SITUACAO,
  ROTULO_SITUACAO,
  dataDoPost,
  useModerarPost,
  usePostAdmin,
  usePostsAdmin,
} from '@/entities/post'
import type { Post, SituacaoPost } from '@/entities/post'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'

/**
 * O id do administrador que modera.
 *
 * **Provisório e inseguro**: enquanto não há login, o moderador não pode ser
 * identificado, e a API aceita o id no corpo da requisição. Quando o login
 * com Google existir, este valor sai da sessão e a constante some — junto com
 * o `AutorId`/`ModeradorId` dos DTOs da API.
 */
const MODERADOR_PROVISORIO = '66666666-6666-6666-6666-666666666666'

/** As abas da fila. "Pendente" abre primeiro porque é o que precisa de
 * atenção — o briefing diz que o painel mostra isso antes de tudo. */
const ABAS: { situacao: SituacaoPost; rotulo: string }[] = [
  { situacao: 'pendente', rotulo: 'Aguardando' },
  { situacao: 'publicado', rotulo: 'Publicados' },
  { situacao: 'devolvido', rotulo: 'Devolvidos' },
  { situacao: 'recusado', rotulo: 'Recusados' },
]

function Etiqueta({ situacao }: { situacao: SituacaoPost }) {
  return (
    <span
      className={`inline-block px-[7px] py-[3px] text-[11px] font-bold ${CLASSE_SITUACAO[situacao]}`}
    >
      {ROTULO_SITUACAO[situacao]}
    </span>
  )
}

/**
 * Um texto da fila, com a decisão embutida.
 *
 * O corpo abre em linha, e não numa página separada: moderar é ler e decidir,
 * e obrigar a navegar de ida e volta para cada texto de uma fila de vinte é
 * o atrito que faz a fila não andar.
 */
function ItemModeracao({
  post,
  cliente,
  aberto,
  aoAlternar,
}: {
  post: Post
  cliente: Cliente
  aberto: boolean
  aoAlternar: () => void
}) {
  const detalhe = usePostAdmin(cliente, aberto ? post.id : undefined)
  const moderar = useModerarPost(cliente, MODERADOR_PROVISORIO)
  const [comentario, setComentario] = useState('')
  const [erroComentario, setErroComentario] = useState<string | null>(null)

  function decidir(situacao: 'publicado' | 'devolvido' | 'recusado') {
    setErroComentario(null)

    // A mesma regra do back-end (RF-11), checada aqui só para não gastar uma
    // ida ao servidor. A garantia continua sendo a da API.
    if (situacao !== 'publicado' && comentario.trim() === '') {
      setErroComentario('Diga ao autor por que o texto foi devolvido ou recusado.')
      return
    }

    moderar.mutate({
      id: post.id,
      decisao: {
        situacao,
        ...(comentario.trim() ? { comentario: comentario.trim() } : {}),
      },
    })
  }

  return (
    <article className="flex flex-col gap-3 border-2 border-traco bg-card px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
            {post.autorNome} · {dataDoPost(post)}
          </p>
          <h3 className="text-lg leading-tight">{post.titulo}</h3>
          {post.resumo && <p className="text-sm text-muted-foreground">{post.resumo}</p>}
        </div>
        <Etiqueta situacao={post.situacao} />
      </div>

      {post.comentarioModeracao && (
        <p className="border-l-2 border-traco-suave pl-3 text-sm text-muted-foreground">
          <span className="font-bold">Comentário anterior:</span> {post.comentarioModeracao}
        </p>
      )}

      <Button
        type="button"
        variant="ghost"
        onClick={aoAlternar}
        className="w-fit rounded-none px-0 text-[13px] underline underline-offset-4"
        aria-expanded={aberto}
      >
        {aberto ? 'Fechar o texto' : 'Ler o texto'}
      </Button>

      {aberto && (
        <div className="flex flex-col gap-4">
          {detalhe.isPending ? (
            <p className="text-sm text-muted-foreground">Carregando o texto…</p>
          ) : detalhe.isError ? (
            <p role="alert" className="text-sm text-err">
              {mensagemDe(detalhe.error)}
            </p>
          ) : (
            <div className="max-w-[68ch] border-y-2 border-traco-suave py-3 leading-[1.7] whitespace-pre-line">
              {detalhe.data?.corpo}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`comentario-${post.id}`}>Comentário para o autor</Label>
            <Textarea
              id={`comentario-${post.id}`}
              rows={2}
              value={comentario}
              onChange={(evento) => setComentario(evento.target.value)}
              placeholder="Obrigatório ao devolver ou recusar"
            />
            {erroComentario && (
              <p role="alert" className="text-sm text-err">
                {erroComentario}
              </p>
            )}
          </div>

          {moderar.isError && (
            <p role="alert" className="text-sm text-err">
              {mensagemDe(moderar.error)}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={moderar.isPending}
              onClick={() => decidir('publicado')}
              className="min-h-11 rounded-none border-2 border-traco bg-acao px-5 font-bold text-acao-texto hover:bg-acao-hover"
            >
              Publicar
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={moderar.isPending}
              onClick={() => decidir('devolvido')}
              className="min-h-11 rounded-none border-2 px-5 font-bold"
            >
              Devolver para ajuste
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={moderar.isPending}
              onClick={() => decidir('recusado')}
              className="min-h-11 rounded-none px-5 text-err"
            >
              Recusar
            </Button>
          </div>
        </div>
      )}
    </article>
  )
}

/**
 * A fila de moderação do blog.
 *
 * É a tela que o briefing descreve: "mostra primeiro o que precisa de
 * atenção: textos aguardando aprovação". Por isso ela abre em "Aguardando" e
 * não num painel de números.
 */
export function PaginaModeracao({ cliente }: { cliente: Cliente }) {
  const [situacao, setSituacao] = useState<SituacaoPost>('pendente')
  const [abertoId, setAbertoId] = useState<string | null>(null)

  const consulta = usePostsAdmin(cliente, { situacao })
  const posts = consulta.data?.itens ?? []

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px]">Moderação do blog</h1>
        <p className="text-muted-foreground">
          Ler, publicar ou devolver com um comentário que ajude o autor a ajustar.
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Situação dos textos">
        {ABAS.map((aba) => (
          <Chip
            key={aba.situacao}
            ativo={situacao === aba.situacao}
            onClick={() => {
              setSituacao(aba.situacao)
              // Fecha o texto aberto ao trocar de aba: manter aberto um id
              // que não está mais na lista deixaria um painel órfão.
              setAbertoId(null)
            }}
          >
            {aba.rotulo}
          </Chip>
        ))}
      </div>

      {consulta.isError ? (
        <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-6 text-err">
          {mensagemDe(consulta.error)}
        </p>
      ) : consulta.isPending ? (
        <p className="px-2 py-6 text-muted-foreground">Carregando a fila…</p>
      ) : posts.length === 0 ? (
        <div className="flex items-center gap-3 border-2 border-traco bg-card px-6 py-8">
          <CheckCircle size={20} weight="bold" aria-hidden className="flex-none text-ok" />
          <p className="text-muted-foreground">
            {situacao === 'pendente'
              ? 'Nenhum texto aguardando. A fila está vazia.'
              : `Nenhum texto ${ROTULO_SITUACAO[situacao].toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <ItemModeracao
              key={post.id}
              post={post}
              cliente={cliente}
              aberto={abertoId === post.id}
              aoAlternar={() => setAbertoId(abertoId === post.id ? null : post.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
