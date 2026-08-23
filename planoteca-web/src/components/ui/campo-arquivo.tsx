import { useId, useRef } from 'react'
import { FilePdf } from '@phosphor-icons/react/dist/csr/FilePdf'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/cn'

/** Bytes em algo legível. `1.4 MB` diz mais que `1468006`. */
function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Escolha de arquivo.
 *
 * O `<input type="file">` nativo é feio e não estiliza — o rótulo dele
 * ("Nenhum arquivo selecionado") vem do sistema operacional, em inglês
 * dependendo da máquina. Aqui ele fica escondido e o clique passa por um
 * botão da direção visual.
 *
 * O input continua sendo o elemento REAL: é ele que recebe o foco pelo
 * teclado, dispara o seletor nativo e carrega a validação de `accept`. Não é
 * um `div` fingindo ser campo.
 */
export function CampoArquivo({
  arquivo,
  aoEscolher,
  accept = 'application/pdf',
  erro,
  rotulo,
  className,
}: {
  arquivo: File | null
  aoEscolher: (arquivo: File | null) => void
  accept?: string
  erro?: string | null
  rotulo: string
  className?: string
}) {
  const id = useId()
  const referencia = useRef<HTMLInputElement>(null)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* O `label` é `sr-only`, e não ausente: o botão abaixo dispara o
          seletor, mas quem usa leitor de tela ou navega por formulário
          precisa que o INPUT tenha nome próprio. Sem isto ele é anunciado
          como "arquivo, botão" e nada mais. */}
      <label htmlFor={id} className="sr-only">
        {rotulo}
      </label>
      <input
        ref={referencia}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(evento) => aoEscolher(evento.target.files?.[0] ?? null)}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
      />

      {arquivo ? (
        <div className="flex items-center gap-3 border-2 border-traco bg-card px-3 py-2.5">
          <FilePdf size={20} weight="bold" aria-hidden className="flex-none text-primary" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold">{arquivo.name}</span>
            <span className="text-xs text-muted-foreground">{tamanhoLegivel(arquivo.size)}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="ml-auto min-h-11 gap-1.5 rounded-none px-2 text-[13px]"
            onClick={() => {
              aoEscolher(null)
              // Sem isto, escolher o MESMO arquivo de novo não dispara
              // `onChange` — o navegador vê o mesmo valor e cala. Quem
              // removeu por engano ficaria sem conseguir recolocar.
              if (referencia.current) referencia.current.value = ''
            }}
          >
            <X size={14} weight="bold" aria-hidden />
            Remover
            <span className="sr-only">: {arquivo.name}</span>
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="min-h-12 w-fit rounded-none border-2 px-5"
          onClick={() => referencia.current?.click()}
        >
          {rotulo}
        </Button>
      )}

      {erro && (
        <p id={`${id}-erro`} role="alert" className="text-sm text-err">
          {erro}
        </p>
      )}
    </div>
  )
}
