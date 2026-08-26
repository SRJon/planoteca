import { useState } from 'react'
import type { FormEvent } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Container } from '@/components/container'

/**
 * O cartaz de abertura: foto de sala de aula sangrando a largura, com o
 * texto e as duas portas de entrada por cima.
 *
 * ── Por que a foto, se a direção é chapada ───────────────────────────────
 *
 * A direção B não tem textura decorativa, e a foto não é decoração: a
 * primeira dobra era 40% vazia, e nada nela dizia de que assunto o acervo
 * trata. A foto é o assunto — uma professora no quadro —, e o véu de token
 * por cima a devolve ao papel de fundo. Nenhuma cor literal participa: o
 * gradiente inteiro sai de `--inverso-bg`.
 *
 * A foto está posicionada em `70% center` porque o assunto dela mora no
 * centro-direita do enquadramento. A esquerda fica para o texto, e é por
 * isso que o véu é mais opaco desse lado.
 *
 * `alt` vazio de propósito: a foto não carrega informação que o texto ao
 * lado já não diga. Um `alt` descritivo faria o leitor de tela anunciar uma
 * cena que não muda o que a pessoa precisa fazer aqui.
 */
export function HeroAcervo() {
  const navegar = useNavigate()
  const [termo, definirTermo] = useState('')

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const limpo = termo.trim()
    // Sem termo, a busca leva para a Biblioteca inteira em vez de gravar
    // `?q=` vazio na URL — um recorte que não recorta nada.
    navegar(limpo ? `/biblioteca?q=${encodeURIComponent(limpo)}` : '/biblioteca')
  }

  return (
    <section className="relative isolate flex min-h-[35rem] items-center overflow-hidden bg-inverso-bg max-md:min-h-[28rem]">
      <img
        src="/hero-sala-de-aula.webp"
        srcSet="/hero-sala-de-aula-960.webp 960w, /hero-sala-de-aula.webp 1920w"
        sizes="100vw"
        alt=""
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover object-[70%_center]"
      />
      {/* O véu. Denso à esquerda, onde o texto passa, e quase aberto à
          direita, onde a foto precisa aparecer. Medido: o par
          `--inverso-ink` sobre `--inverso-bg` a 92% passa AA com folga. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-inverso-bg via-inverso-bg/80 to-inverso-bg/30"
      />

      <Container className="relative py-16 max-md:py-12">
        <div className="flex max-w-[60ch] flex-col items-start gap-6">
          <p className="font-mono text-xs tracking-[0.1em] text-inverso-ink-2 uppercase">
            Acervo aberto · Sem cadastro · PDF direto
          </p>
          <h1 className="font-display text-6xl leading-[1.05] font-bold tracking-tight text-inverso-ink max-lg:text-5xl max-sm:text-4xl">
            Plano de aula pronto, com metodologia ativa.
          </h1>
          <p className="max-w-[52ch] text-lg text-inverso-ink-2">
            Um acervo catalogado por série, componente e metodologia. Você filtra, abre e baixa o
            PDF.
          </p>

          <div className="flex w-full flex-wrap items-stretch gap-3 pt-2">
            <Link
              to="/biblioteca"
              className="flex min-h-12 items-center border-2 border-traco bg-acao px-6 text-base font-bold text-acao-texto transition-colors hover:bg-acao-hover active:bg-acao-ativa"
            >
              Ver os planos
            </Link>

            {/* O campo é de PAPEL, como todo campo do sistema, mesmo sobre o
                bloco escuro: um campo escuro sobre fundo escuro parecia
                desabilitado. Repete a anatomia do `CampoBusca` (lupa dentro
                da moldura, foco no contêiner); o foco é de papel porque o
                anel índigo padrão sumiria contra o hero. */}
            <form
              onSubmit={buscar}
              role="search"
              className="flex min-w-[20rem] grow items-stretch gap-2 max-sm:min-w-full"
            >
              <label htmlFor="busca-hero" className="sr-only">
                Buscar por assunto ou objeto de conhecimento
              </label>
              <div className="flex grow items-center gap-2 border-2 border-traco bg-campo px-3 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-inverso-ink">
                <MagnifyingGlass
                  size={17}
                  weight="bold"
                  className="shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="busca-hero"
                  type="search"
                  value={termo}
                  onChange={(evento) => definirTermo(evento.target.value)}
                  placeholder="Buscar: frações, Revolução Industrial, ecossistemas…"
                  className="min-h-12 w-full border-0 bg-transparent text-[14.5px] text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
                />
              </div>
              <Button
                type="submit"
                className="min-h-12 shrink-0 rounded-none border-2 border-inverso-ink bg-transparent px-5 text-base font-bold text-inverso-ink hover:bg-inverso-bg-2"
              >
                Buscar
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </section>
  )
}
