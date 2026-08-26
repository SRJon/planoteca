import { Link } from 'react-router'
import type { Cliente } from '@/shared/api'
import { agruparPorArea, useVocabulario } from '@/entities/vocabulario'
import { Container } from '@/components/container'
import { CardArea } from './CardArea'
import { HeroAcervo } from './HeroAcervo'

/**
 * A landing pública — a primeira tela de quem chega.
 *
 * O trabalho dela é um só: dizer o que é a Planoteca e levar para a
 * Biblioteca. O professor chega com uma hora vaga e uma turma amanhã; cada
 * bloco a mais entre ele e o acervo é atrito.
 *
 * Continua SEM depoimento, contador de números e newsletter — nada disso
 * aproxima ninguém de um PDF.
 *
 * ── O que mudou em 2026-08-26 ────────────────────────────────────────────
 *
 * Ganhou hero com foto e cards de área, e a razão é medida, não estética: a
 * primeira dobra era cerca de 40% vazia, e os doze chips de componente
 * enfileirados liam como sobra de layout, não como caminho. Doze alvos do
 * mesmo peso não são uma hierarquia — são uma lista que a pessoa precisa
 * varrer inteira antes de escolher.
 *
 * Quatro áreas são um número que se lê de relance, e cada uma abre os
 * próprios componentes quando a pessoa pede. A foto entra porque a dobra
 * precisava dizer de que assunto o acervo trata antes da primeira linha de
 * texto ser lida.
 *
 * As áreas saem de `agruparPorArea(vocabulario.componentes)`, nunca de uma
 * lista escrita aqui: um componente cadastrado no painel aparece nesta tela
 * sem deploy, e uma área nova nasce sozinha do dado. Enquanto o vocabulário
 * está em voo ele é vazio, e as duas seções somem — melhor do que reservar
 * espaço para uma lista que talvez não venha.
 */
export function PaginaInicio({ cliente }: { cliente: Cliente }) {
  const { vocabulario } = useVocabulario(cliente)
  const areas = agruparPorArea(vocabulario.componentes)

  return (
    <div className="flex flex-col">
      <HeroAcervo />

      {areas.length > 0 && (
        <Container className="relative z-[var(--camada-base)] -mt-12 max-md:mt-8">
          <h2 className="sr-only">Comece pela área do conhecimento</h2>
          {/* Sem `items-start`: os nomes de área têm uma ou duas linhas, e os
              quatro cards precisam fechar na mesma altura. A lista aberta é
              `absolute` a partir do fim do card, então esticar não a move. */}
          <ul className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {areas.map(([area, componentes]) => (
              <li key={area}>
                <CardArea area={area} componentes={componentes} />
              </li>
            ))}
          </ul>
        </Container>
      )}

      {vocabulario.series.length > 0 && (
        <Container className="pt-14">
          <section className="flex flex-col gap-4">
            <h2 className="font-mono text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              Ou pela série
            </h2>
            {/* A régua: sete casas coladas, sem vão entre elas. O `-ml-[2px]`
                sobrepõe o traço da vizinha, senão cada divisa ficaria com 4px
                — dois traços de 2px encostados. */}
            <ul className="grid grid-cols-7 max-md:grid-cols-4">
              {vocabulario.series.map((serie) => (
                <li key={serie.id} className="-ml-[2px] first:ml-0 max-md:[&:nth-child(4n+1)]:ml-0">
                  <Link
                    to={`/biblioteca?serie=${serie.id}`}
                    aria-label={serie.rotuloCompleto}
                    className="flex min-h-14 items-center justify-center border-2 border-traco bg-card px-2 font-display text-base font-bold hover:bg-secondary"
                  >
                    {serie.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Container>
      )}

      <section className="mt-16 bg-inverso-bg py-14 text-inverso-ink">
        <Container>
          <div className="grid grid-cols-[1fr_auto] items-start gap-10 max-md:grid-cols-1 max-md:gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-2xl font-bold tracking-tight">Escreve também?</h2>
              <p className="max-w-[52ch] text-inverso-ink-2">
                O Blog é dos professores: relato de sala de aula, o que funcionou, o que não. Quem
                tem conta escreve; um administrador lê e publica.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/blog"
                className="flex min-h-12 items-center border-2 border-inverso-ink px-5 font-bold hover:bg-inverso-bg-2"
              >
                Ler o Blog
              </Link>
              <Link to="/entrar" className="font-bold underline underline-offset-4">
                Entrar para escrever
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}
