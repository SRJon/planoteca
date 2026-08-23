import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaginaDesignSystem } from './PaginaDesignSystem'
import {
  TOKENS_CAMADA,
  TOKENS_COR_MARCA,
  TOKENS_COR_PRIMITIVAS,
  TOKENS_COR_SHADCN,
  TOKENS_RAIO,
} from './tokensReferencia'

// `new URL(relativo, import.meta.url)` NÃO serve aqui: sob `environment:
// 'jsdom'`, o `URL` global é o do jsdom, que resolve relativo contra
// `http://localhost:3000/` — ignora silenciosamente a base `file:` recebida
// como segundo argumento, sem lançar. `fileURLToPath` + `node:path` evita o
// `URL` global inteiro.
const DIRETORIO_DESTE_ARQUIVO = dirname(fileURLToPath(import.meta.url))
const DIRETORIO_UI = join(DIRETORIO_DESTE_ARQUIVO, '../../components/ui')

/**
 * A lista que esta página promete cobrir nasce do DIRETÓRIO, nunca de um
 * array copiado à mão nesta suíte.
 *
 * A derivação anterior era um `import * as UI` do barril da biblioteca de
 * componentes própria, que reexportava tudo num `index.ts`. O que o shadcn
 * instala não tem barril: cada arquivo de `src/components/ui/` é uma ilha, e
 * a CLI escreve um arquivo novo a cada `shadcn add`. Ler o diretório por
 * `node:fs` é o equivalente exato — e é a MESMA técnica que a conferência de
 * tokens abaixo usa, pelo mesmo motivo (`eslint-plugin-boundaries` audita
 * declaração de import, não leitura de arquivo em tempo de teste).
 *
 * Um `npx shadcn add accordion` sem uma `<Amostra arquivo="accordion">` na
 * página reprova o teste abaixo, sem ninguém precisar tocar neste arquivo.
 */
const ARQUIVOS_UI = readdirSync(DIRETORIO_UI)
  .filter((nome) => nome.endsWith('.tsx'))
  .map((nome) => nome.replace(/\.tsx$/, ''))

function nomesDeclarados(cssTexto: string): string[] {
  const semComentarios = cssTexto.replace(/\/\*[\s\S]*?\*\//g, ' ')
  const nomes = new Set<string>()
  for (const m of semComentarios.matchAll(/--([\w-]+)\s*:/g)) nomes.add(m[1]!)
  return [...nomes]
}

function ordenado(lista: readonly string[]): string[] {
  return [...lista].sort()
}

const TEMA_CSS = readFileSync(join(DIRETORIO_DESTE_ARQUIVO, '../../app/estilos/tema.css'), 'utf8')
const NOMES_TOKENS_CSS = nomesDeclarados(TEMA_CSS)

describe('PaginaDesignSystem', () => {
  it('a derivação encontrou os componentes do shadcn — se isto falhar, o caminho quebrou, não a página', () => {
    expect(ARQUIVOS_UI.length).toBeGreaterThan(0)
  })

  it('mostra uma amostra de cada arquivo de src/components/ui', () => {
    render(<PaginaDesignSystem />)

    for (const arquivo of ARQUIVOS_UI) {
      expect(screen.getByTestId(`amostra-${arquivo}`)).toBeInTheDocument()
    }
  })

  it('mostra os tokens de cor nas duas variantes de tema', () => {
    render(<PaginaDesignSystem />)

    expect(screen.getByTestId('cores-light')).toBeInTheDocument()
    expect(screen.getByTestId('cores-dark')).toBeInTheDocument()
  })

  it('a amostra do dropdown-menu monta o menu de verdade quando aberta', async () => {
    const usuario = userEvent.setup()
    render(<PaginaDesignSystem />)

    // O Radix desmonta o `Content` enquanto o menu está fechado — a amostra
    // fechada prova só que o gatilho existe. Abrir aqui não é gambiarra do
    // teste: é o único jeito de ver esse pedaço da página, igual a qualquer
    // pessoa faria.
    await usuario.click(screen.getByRole('button', { name: 'Ações do registro' }))

    expect(await screen.findByRole('menuitem', { name: 'Editar' })).toBeInTheDocument()
  })

  it('as listas de tokensReferencia.ts batem, nome a nome, com o que tema.css declara — nem falta, nem sobra', () => {
    // As primitivas moram no `@theme`, onde a v4 exige o prefixo `--color-*`
    // para gerar utilitário. A lista escrita guarda o nome SEM prefixo, que é
    // o que se escreve numa classe (`bg-primary`, não `bg-color-primary`) —
    // por isso a comparação desfaz o prefixo dos dois lados.
    const PREFIXO_COR = /^color-/

    const coresEscritas = [
      ...TOKENS_COR_PRIMITIVAS,
      ...TOKENS_COR_SHADCN,
      ...TOKENS_COR_MARCA,
    ]
    const coresDeclaradas = NOMES_TOKENS_CSS.filter((nome) => PREFIXO_COR.test(nome)).map((nome) =>
      nome.replace(PREFIXO_COR, ''),
    )
    expect(ordenado(coresEscritas)).toEqual(ordenado(coresDeclaradas))

    expect(ordenado(TOKENS_RAIO)).toEqual(
      ordenado(NOMES_TOKENS_CSS.filter((nome) => nome.startsWith('raio-'))),
    )
    expect(ordenado(TOKENS_CAMADA)).toEqual(
      ordenado(NOMES_TOKENS_CSS.filter((nome) => nome.startsWith('camada-'))),
    )

    // As escalas antigas de espaço e tipografia (`--espaco-*`, `--fonte-*`,
    // `--peso-*`) saíram do `tema.css` junto com o último `.module.css` que as
    // consumia. Esta asserção é a guarda contra elas voltarem por engano: a do
    // Tailwind é a mesma base de 4px, e duas escalas idênticas com nomes
    // diferentes é exatamente a dívida que esta camada veio quitar.
    expect(
      NOMES_TOKENS_CSS.filter(
        (nome) =>
          nome.startsWith('espaco-') || nome.startsWith('fonte-') || nome.startsWith('peso-'),
      ),
    ).toEqual([])
  })
})
