<!-- gerado de docs/specs/2026-08-22-camada-visual-shadcn.html
     sha256 da fonte: 3a7a4777e3512a88
     em: 2026-08-22T07:43
     NAO ESCREVA NESTE ARQUIVO. Altere o HTML e regenere. -->

# Camada visual em Tailwind e shadcn — contrato de maquina

## Objetivo

O `shared/ui` do `fotus-default-web` sai inteiro e da lugar ao shadcn, com Tailwind v4. A
fundacao de dados nao e tocada, e a tela `/pessoas` continua verde.

## Restricoes globais

- O trabalho acontece na `main`. Nenhuma branch nova.
- `entities/`, `shared/api`, `shared/lib` e `shared/config` NAO sao alterados. Eles tem zero
  import de CSS hoje, e essa medicao e a base desta spec.
- O contrato, o cliente HTTP, a sessao e a permissao nao tem o comportamento alterado.
- A ordem das camadas continua `app -> pages -> features -> entities -> shared`. O
  `eslint.config.js` que a impoe nao e alterado.
- O `@tanstack/react-table` permanece. O shadcn usa o mesmo.
- A paleta Fotus, azul e dourado, permanece.
- Os testes executam sem rede. O MSW simula a API.
- Nenhum arquivo `.module.css` sobra em `src/` ao final.

## Requisitos funcionais

### RF-01 — BASE DE ESTILO

O Tailwind v4 entra pelo plugin oficial do Vite:

```bash
npm install tailwindcss @tailwindcss/vite
```

O `vite.config.ts` recebe o plugin. Nenhum arquivo de PostCSS nasce: a v4 dispensa.

O CSS de entrada abre com `@import "tailwindcss"`.

### RF-02 — TRADUCAO DOS TOKENS

Os quatro arquivos de `src/app/estilos/` viram um. A declaracao de tema mora no bloco
`@theme`, que e onde a v4 declara tema.

| Sai | Entra |
|---|---|
| `tokens.css`, 283 linhas | bloco `@theme` |
| `tipografia.css`, 90 linhas | tokens `--font-*` |
| `espaco.css`, 33 linhas | a escala do Tailwind |
| `base.css`, 124 linhas | `@layer base` |

A paleta Fotus permanece. O verificador de token continua proibindo cor literal fora do bloco
de tema.

### RF-03 — O TEMA VIRA CLASSE

O tema hoje e o atributo `data-theme`, escrito pelo `TemaProvider` e lido em sete arquivos. O
shadcn espera a classe `.dark` no elemento raiz.

O provedor passa a escrever a classe. O atributo sai. Quem depende dele acompanha: o teste do
shell e a pagina de design system.

### RF-04 — O SHADCN ENTRA

O shadcn e inicializado sem interacao:

```bash
npx shadcn@latest init -d
```

Os componentes instalados cobrem a superficie que sai:

| Sai | Entra |
|---|---|
| `Botao`, `BotaoIcone`, `BotaoLink` | `button` |
| `Entrada`, `AreaTexto` | `input`, `textarea` |
| `Campo` | `form`, `label` |
| `Cartao`, `CartaoCabecalho`, `CartaoCorpo` | `card` |
| `Dialogo` | `dialog` |
| `Dica` | `tooltip` |
| `Selecao` | `select` |
| `Menu`, `MenuItem`, `MenuSeparador`, `MenuTitulo` | `dropdown-menu` |
| `Abas` | `tabs` |
| `Etiqueta` | `badge` |
| `Tabela` | `table` com `@tanstack/react-table` |
| `Paginacao` | composto de `button` |
| `EstadoVazio` | composto de `card` |

O `cn` de `shared/lib` permanece, e o shadcn aponta para ele. Dois utilitarios com a mesma
funcao seriam confusao.

### RF-05 — OS ICONES VEM DO PHOSPHOR

O catalogo proprio sai. O `@phosphor-icons/react` entra, e a tela importa o icone direto.

O pacote exporta mais de nove mil modulos, e alguns empacotadores transpilam todos. O sintoma
e compilacao lenta, nao artefato maior. O contorno e importar pelo caminho do icone:

```ts
import { House } from '@phosphor-icons/react/dist/csr/House'
```

O peso e o tamanho padrao ficam num `IconContext.Provider`, no provedor raiz.

Nenhum componente de embrulho nasce. O `Icone` de hoje declara 41 nomes, e 24 sao resquicio do
dominio que saiu.

### RF-06 — A MARCA PERMANECE

O `Marca.tsx` fica, reescrito em classe utilitaria. Ele carrega o marcador `Fotus Default`, que
o `New-Project.ps1` substitui na geracao. Troca-lo por componente de biblioteca quebraria o
ritual de geracao.

### RF-07 — AS DEPENDENCIAS ANTIGAS SAEM

Os cinco pacotes `@radix-ui/react-*` instalados hoje saem. O shadcn usa o pacote unificado
`radix-ui`, e manter os dois duplicaria a arvore de dependencia.

### RF-08 — O VERIFICADOR DE TOKEN PASSA A MIRAR O TEMA

O `scripts/verifica-tokens.mjs` hoje proibe cor literal fora do `tokens.css`. Ele passa a
validar o bloco `@theme`, e a aceitar classe utilitaria do Tailwind.

A guarda continua existindo. Sem ela, o proximo projeto espalha cor literal pelo JSX.

### RF-09 — AS TELAS SAO REESCRITAS

| Tela | O que e alterado | O que fica |
|---|---|---|
| `app/shell/` | barra lateral, barra superior, trilha | a logica de menu e de permissao |
| `features/autenticar/` | so o formulario | o `useEntrar` e o `api.ts` |
| `features/filtrar-pessoas/` | so o componente de filtro | o `ordenacaoApi.ts` e o `useFiltroPessoas.ts` |
| `pages/entrar/` | o JSX | nada mais existe ali |
| `pages/pessoas/` | o JSX e as colunas | o consumo de `usePessoas` |
| `pages/design-system/` | vira catalogo do shadcn | a rota, visivel so em desenvolvimento |

### RF-10 — A TELA DE PESSOAS CONTINUA VERDE

A `/pessoas` lista, pagina e filtra ao final do trabalho. Os testes dela e o fluxo ponta a
ponta passam.

Ela e a prova de que a fundacao sobrevive a troca de interface.

As duas armadilhas do controller continuam cobertas: o `204` sem corpo vira estado vazio, e a
paginacao le o `X-Total-Count`.

### RF-11 — A ORDEM DE PINTURA E PRESERVADA

O `e2e/camadas.spec.ts` prova, num navegador real, que a lista do componente de selecao pinta
acima do veu do dialogo. Ele continua executando contra os componentes do shadcn.

O teste afirma comportamento, nao marcacao. So o rotulo do exemplo e alterado.

## Defeitos conhecidos do prototipo

Nao existe prototipo. O trabalho parte de codigo com bateria verde.

## Fontes

| Caminho | O que decide |
|---|---|
| `src/shared/ui/` | a superficie de 32 exportacoes a cobrir |
| `src/app/estilos/tokens.css` | a paleta a traduzir para `@theme` |
| `src/app/providers/TemaProvider.tsx` | o atributo que vira classe |
| `scripts/verifica-tokens.mjs` | a regra a reapontar |
| `src/pages/pessoas/` | a tela que prova a fundacao |
| `e2e/camadas.spec.ts` | a ordem de pintura a preservar |
| `New-Project.ps1` | o marcador `Fotus Default` na marca |
| `docs/specs/2026-08-06-boilerplate-front.html` | a spec anterior, que criou o que esta altera |

## Criterios de aceite

No boilerplate:

- `npm ci` termina com codigo 0.
- `npm run lint` sai com codigo 0, incluindo o verificador reapontado.
- `npm run typecheck` sai com codigo 0 nos tres tsconfig.
- `npm test` sai com codigo 0, e a fatia `pessoa` continua com teste proprio.
- `npm run api:check` confirma que o contrato e o schema batem.
- `npm run build` gera o artefato.
- `npm run e2e` passa nos tres specs, inclusive o de ordem de pintura.
- Nenhum arquivo `.module.css` sobra em `src/`.
- Nenhum pacote `@radix-ui/react-*` individual sobra no `package.json`.
- O tema claro e o escuro funcionam, e a paleta Fotus permanece.

No projeto gerado:

- O script cria o destino e recusa destino que ja existe.
- Nenhum arquivo carrega BOM.
- Nenhuma ocorrencia de `fotus-default-web` nem de `Fotus Default` sobra.
- A bateria inteira do criterio anterior sai com codigo 0 dentro do destino.
