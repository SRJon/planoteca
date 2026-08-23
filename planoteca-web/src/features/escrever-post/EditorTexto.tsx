import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise'
import { ArrowClockwise } from '@phosphor-icons/react/dist/csr/ArrowClockwise'
import { TextB } from '@phosphor-icons/react/dist/csr/TextB'
import { TextItalic } from '@phosphor-icons/react/dist/csr/TextItalic'
import { TextHOne } from '@phosphor-icons/react/dist/csr/TextHOne'
import { TextHTwo } from '@phosphor-icons/react/dist/csr/TextHTwo'
import { ListBullets } from '@phosphor-icons/react/dist/csr/ListBullets'
import { ListNumbers } from '@phosphor-icons/react/dist/csr/ListNumbers'
import { LinkSimple } from '@phosphor-icons/react/dist/csr/LinkSimple'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/cn'

/**
 * O que o editor sabe escrever.
 *
 * Cada nó a mais é superfície que a API precisa sanitizar sem ninguém usar
 * — por isso o `StarterKit` desliga tudo que não tem botão na barra
 * (`codeBlock`, `blockquote`, `horizontalRule`, `strike`, `code`), e o
 * `heading` fica só em H2/H3: H1 é o título do post, que já é um campo à
 * parte no formulário.
 *
 * `link: false`: o Tiptap 3 já embute `@tiptap/extension-link` dentro do
 * `StarterKit` — configurá-lo pelas DUAS vias registraria a extensão duas
 * vezes (`[tiptap warn]: Duplicate extension names found: ['link']`). Fica
 * só a instância explícita abaixo, que é a que carrega `rel`/`target`.
 */
const EXTENSOES = [
  StarterKit.configure({
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
    strike: false,
    code: false,
    heading: { levels: [2, 3] },
    link: false,
  }),
  Link.configure({
    openOnClick: false,
    autolink: false,
    HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
  }),
]

type Props = {
  valor: string
  aoMudar: (html: string) => void
  aoTocar?: () => void
  invalido?: boolean
  id?: string
}

/**
 * O editor de texto rico do blog.
 *
 * O HTML que ele produz sai para o campo `corpo` do formulário; a garantia
 * de segurança não mora aqui — mora no servidor, que sanitiza tudo de novo
 * antes de gravar (ver `HtmlSanitizerService` na API). O editor só limita a
 * SUPERFÍCIE de entrada, o que reduz ruído, mas não é a fronteira de
 * confiança.
 */
export function EditorTexto({ valor, aoMudar, aoTocar, invalido, id }: Props) {
  const editor = useEditor({
    extensions: EXTENSOES,
    content: valor,
    onUpdate: ({ editor }) => aoMudar(editor.getHTML()),
    onBlur: () => aoTocar?.(),
    editorProps: {
      attributes: {
        id: id ?? '',
        role: 'textbox',
        'aria-multiline': 'true',
        class: cn(
          'min-h-[280px] px-3 py-2 leading-[1.7] focus:outline-none',
          '[&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-bold',
          '[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6',
          '[&_a]:text-primary [&_a]:underline',
        ),
      },
    },
  })

  // O formulário pode resetar (`form.reset()` depois de enviar) sem que o
  // editor seja desmontado — sem sincronizar aqui, a tela mostraria o texto
  // antigo depois de um envio bem-sucedido.
  useEffect(() => {
    if (!editor) return
    if (valor === editor.getHTML()) return
    editor.commands.setContent(valor)
  }, [valor, editor])

  if (!editor) return null

  return (
    <div
      className={cn(
        'flex flex-col border-2 border-traco bg-card',
        invalido && 'border-err',
      )}
    >
      <BarraFerramentas editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

function BarraFerramentas({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  return (
    <div
      role="toolbar"
      aria-label="Formatação do texto"
      className="flex flex-wrap items-center gap-1 border-b-2 border-traco bg-secondary px-2 py-1.5"
    >
      <BotaoFormato
        aria-label="Negrito"
        pressionado={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <TextB size={16} weight="bold" aria-hidden />
      </BotaoFormato>
      <BotaoFormato
        aria-label="Itálico"
        pressionado={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <TextItalic size={16} weight="bold" aria-hidden />
      </BotaoFormato>

      <Separador />

      <BotaoFormato
        aria-label="Título 2"
        pressionado={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <TextHTwo size={16} weight="bold" aria-hidden />
      </BotaoFormato>
      <BotaoFormato
        aria-label="Título 3"
        pressionado={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <TextHOne size={16} weight="bold" aria-hidden />
      </BotaoFormato>

      <Separador />

      <BotaoFormato
        aria-label="Lista com marcador"
        pressionado={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListBullets size={16} weight="bold" aria-hidden />
      </BotaoFormato>
      <BotaoFormato
        aria-label="Lista numerada"
        pressionado={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListNumbers size={16} weight="bold" aria-hidden />
      </BotaoFormato>

      <Separador />

      <BotaoFormato
        aria-label="Link"
        pressionado={editor.isActive('link')}
        onClick={() => alternarLink(editor)}
      >
        <LinkSimple size={16} weight="bold" aria-hidden />
      </BotaoFormato>

      <Separador />

      <BotaoFormato
        aria-label="Desfazer"
        pressionado={false}
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <ArrowCounterClockwise size={16} weight="bold" aria-hidden />
      </BotaoFormato>
      <BotaoFormato
        aria-label="Refazer"
        pressionado={false}
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <ArrowClockwise size={16} weight="bold" aria-hidden />
      </BotaoFormato>
    </div>
  )
}

/**
 * Alterna o link na seleção atual.
 *
 * `window.prompt`: a barra já tem sete botões, e um diálogo próprio para
 * uma única URL pesaria mais do que resolve — o mesmo prompt nativo que o
 * `StarterKit` usa nos exemplos oficiais do Tiptap.
 */
function alternarLink(editor: NonNullable<ReturnType<typeof useEditor>>): void {
  if (editor.isActive('link')) {
    editor.chain().focus().unsetLink().run()
    return
  }

  const url = window.prompt('Endereço do link (https://…)')
  if (!url) return
  editor.chain().focus().setLink({ href: url }).run()
}

function Separador() {
  return <div className="mx-0.5 h-5 w-px bg-traco/30" aria-hidden />
}

function BotaoFormato({
  pressionado,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { pressionado: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-pressed={pressionado}
      className={cn(
        'border-2 border-transparent text-foreground',
        pressionado && 'border-traco bg-background text-primary',
        className,
      )}
      {...props}
    />
  )
}
