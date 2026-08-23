import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import {
  CLASSE_SITUACAO,
  ROTULO_SITUACAO,
  dataDoPost,
  useEscreverPost,
  usePostsAdmin,
} from '@/entities/post'
import { EditorTexto } from '@/features/escrever-post'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'

/**
 * O id do autor.
 *
 * **Provisório e inseguro**, pelo mesmo motivo de `PaginaModeracao`: sem
 * login, o autor não pode ser identificado. Sai da sessão quando o login com
 * Google existir.
 */
const AUTOR_PROVISORIO = '55555555-5555-5555-5555-555555555555'

const OBRIGATORIO = 'Campo obrigatório.'

/**
 * Se o HTML do editor está "vazio" para fins de validação.
 *
 * Um editor Tiptap sem conteúdo ainda produz `<p></p>`, então `.min(1)` no
 * `z.string()` nunca dispararia — precisa olhar o TEXTO, não a marcação.
 */
function corpoEstaVazio(html: string): boolean {
  return html.replace(/<[^>]*>/g, '').trim().length === 0
}

const esquema = z.object({
  titulo: z.string().min(1, OBRIGATORIO).max(300),
  resumo: z.string().max(500),
  corpo: z.string().refine((html) => !corpoEstaVazio(html), OBRIGATORIO),
})

type Campos = z.infer<typeof esquema>

/**
 * Escrever um texto para o blog.
 *
 * Duas coisas na mesma tela: o formulário e o que a pessoa já enviou. Elas
 * andam juntas porque a pergunta que vem depois de escrever é "e aí, saiu?" —
 * e a resposta inclui o texto DEVOLVIDO, com o comentário de quem moderou.
 * Sem isso, o professor reescreveria sem saber o que ajustar.
 */
export function PaginaEscrever({ cliente }: { cliente: Cliente }) {
  const [enviado, setEnviado] = useState(false)
  const escrever = useEscreverPost(cliente, AUTOR_PROVISORIO)
  const meus = usePostsAdmin(cliente, { autorId: AUTOR_PROVISORIO, situacao: 'pendente' })
  const devolvidos = usePostsAdmin(cliente, {
    autorId: AUTOR_PROVISORIO,
    situacao: 'devolvido',
  })

  const form = useForm<Campos>({
    resolver: zodResolver(esquema),
    defaultValues: { titulo: '', resumo: '', corpo: '' },
  })

  const submeter = form.handleSubmit(async (campos) => {
    setEnviado(false)
    await escrever.mutateAsync({
      titulo: campos.titulo.trim(),
      corpo: campos.corpo.trim(),
      ...(campos.resumo.trim() ? { resumo: campos.resumo.trim() } : {}),
    })
    form.reset()
    setEnviado(true)
  })

  const erros = form.formState.errors
  const aguardando = meus.data?.itens ?? []
  const paraAjustar = devolvidos.data?.itens ?? []

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px]">Escrever para o Blog</h1>
        <p className="max-w-[60ch] text-muted-foreground">
          Conte como foi na sua sala. O texto entra na fila e um administrador lê antes de
          publicar.
        </p>
      </header>

      {paraAjustar.length > 0 && (
        <section className="flex flex-col gap-3 border-2 border-traco bg-card px-4 py-3">
          <h2 className="font-mono text-[11px] font-semibold tracking-[0.1em] uppercase">
            Devolvidos para ajuste
          </h2>
          {paraAjustar.map((post) => (
            <div key={post.id} className="flex flex-col gap-1">
              <p className="font-bold">{post.titulo}</p>
              {/* O comentário é o motivo de esta seção existir: devolver sem
                  dizer o que ajustar transforma moderação em silêncio. */}
              {post.comentarioModeracao && (
                <p className="border-l-2 border-warn pl-3 text-sm text-muted-foreground">
                  {post.comentarioModeracao}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {enviado && (
        <p
          // `aria-live`: o formulário limpa e a mensagem aparece sem que o
          // foco mude — sem isto, quem usa leitor de tela não saberia.
          aria-live="polite"
          className="flex items-center gap-2 border-2 border-traco bg-ok-bg px-4 py-3 text-ok"
        >
          <CheckCircle size={17} weight="bold" aria-hidden />
          Texto enviado. Ele entra na fila de aprovação.
        </p>
      )}

      <form onSubmit={submeter} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="titulo">Título</Label>
          <Input id="titulo" {...form.register('titulo')} aria-invalid={!!erros.titulo} />
          {erros.titulo && (
            <p role="alert" className="text-sm text-err">
              {erros.titulo.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="resumo">Resumo</Label>
          <Textarea id="resumo" rows={2} {...form.register('resumo')} />
          <p className="text-xs text-muted-foreground">
            Opcional. É o que aparece na lista, abaixo do título.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="corpo">Texto</Label>
          <Controller
            name="corpo"
            control={form.control}
            render={({ field }) => (
              <EditorTexto
                id="corpo"
                valor={field.value}
                aoMudar={field.onChange}
                aoTocar={field.onBlur}
                invalido={!!erros.corpo}
              />
            )}
          />
          {erros.corpo && (
            <p role="alert" className="text-sm text-err">
              {erros.corpo.message}
            </p>
          )}
        </div>

        {escrever.isError && (
          <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-3 text-err">
            {mensagemDe(escrever.error)}
          </p>
        )}

        <Button
          type="submit"
          disabled={escrever.isPending}
          className="min-h-12 w-fit rounded-none border-2 border-traco bg-acao px-6 text-[15px] font-bold text-acao-texto hover:bg-acao-hover"
        >
          {escrever.isPending ? 'Enviando…' : 'Enviar para aprovação'}
        </Button>
      </form>

      {aguardando.length > 0 && (
        <section className="flex flex-col gap-2 border-t-2 border-traco pt-5">
          <h2 className="font-mono text-[11px] font-semibold tracking-[0.1em] uppercase">
            Aguardando aprovação
          </h2>
          <ul className="flex flex-col gap-2 pl-0">
            {aguardando.map((post) => (
              <li key={post.id} className="flex list-none flex-wrap items-center gap-2">
                <span
                  className={`inline-block px-[7px] py-[3px] text-[11px] font-bold ${CLASSE_SITUACAO[post.situacao]}`}
                >
                  {ROTULO_SITUACAO[post.situacao]}
                </span>
                <span>{post.titulo}</span>
                <span className="text-sm text-muted-foreground">{dataDoPost(post)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
