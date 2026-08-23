# Contribuindo

Convenções que este repositório cobra de verdade — a maioria por ferramenta, não por revisão
humana. Se uma regra não aparece aplicada em algum lugar do código, ela pertence ao
[`CLAUDE.md`](CLAUDE.md), não a este arquivo.

## Versão do Node

Node **22 ou mais novo** (`.nvmrc` fixa a 24). Não é preferência: `npm run lint` encadeia
`scripts/verifica-tokens.mjs`, que importa `glob` de `node:fs/promises` — API que só existe a
partir do Node 22. Em Node 20 o `npm ci` passava limpo. O erro só aparecia como falha de
resolução de módulo no meio do lint.

O `package.json` declara `engines`. O `.npmrc` liga `engine-strict=true`. Assim a instalação
falha com a mensagem de versão, em vez de deixar o problema para o primeiro comando.

## Antes de abrir um pedido de revisão

```bash
npm run typecheck && npm run lint && npm run api:check && npm test && npm run build && npm run e2e
```

É a mesma sequência que roda no CI. No monorepo o workflow deste projeto vive na raiz do
repositório, em [`.github/workflows/web.yml`](../.github/workflows/web.yml) — o GitHub só lê
workflows da raiz, e um `.github/` aqui dentro seria ignorado em silêncio. Ele roda com
`working-directory: planoteca-web` e só dispara quando algo em `planoteca-web/` muda.
Rodar local antes evita ida e volta.

## A direção das camadas

`app → pages → features → entities → shared`. Uma camada só importa de si mesma ou de uma camada
mais à direita nessa lista. Nunca o contrário, nunca de lado a lado fora de `shared`.

A regra é o `boundaries/element-types` de [`eslint.config.js`](eslint.config.js). Importar
`pages` de dentro de `entities`, por exemplo, quebra o `lint` apontando a violação — não é algo
para lembrar de cabeça.

Duas consequências práticas:

- `pages`, `features` e `entities` só podem ser importadas pelo próprio `index.ts` (barrel) —
  é o `boundaries/entry-point`. `shared` é exceção: import profundo em `shared/*` existe de
  propósito, porque é onde vivem os primitivos que todo o resto consome. `src/components/*`
  conta como `shared` para essa regra: sem domínio, importável por qualquer camada. É onde a
  CLI do shadcn instala (`components/ui`) e onde mora a marca (`components/marca`).
- `features/` recebem o cliente HTTP (`Cliente`) **por parâmetro**, e nunca importam
  `shared/config` diretamente. Quem monta o `Cliente` a partir de `ambiente.urlApi` é a `page`
  (ou, quando existir, um provider em `app/`). Isso mantém `features` testável sem exigir
  `VITE_URL_API` definida no ambiente de teste.

## Nenhum controle de formulário cru

`<button>`, `<input>`, `<select>` e `<textarea>` fora de `src/components/ui/` derrubam o `lint`
(`react/forbid-elements`, mesmo `eslint.config.js`). Use `Button`, `Input`, `Select` e
`Textarea` de `@/components/ui/*`. Se o primitivo que você precisa não existe, instale-o com
`npx shadcn@latest add <nome>`. Não abra uma exceção pontual dentro de um componente de tela.

## O verificador de tokens de design

`npm run tokens:check` (encadeado em `npm run lint`) varre `src/**/*.css` e `src/**/*.tsx` e
reprova:

- cor literal (hex, `rgb()`, nome de cor CSS, etc.) fora de `src/app/estilos/tema.css`
- classe crua da paleta embutida do Tailwind no JSX (`bg-slate-950`, `text-zinc-400`)
- primitiva do tema usada como nome semântico (`bg-red-500`) — primitiva é matéria-prima, não
  vocabulário de tela
- `border-radius` fora da escala `--raio-*`, em CSS
- `z-index` como número literal, fora de `--camada-*`, em CSS

O script aceita classe que aponta para o tema: `bg-background`, `text-primary`,
`border-border`. Também aceita nome que o tema não declara, como `bg-qualquer-coisa` — é lista
negra, não lista branca. Nome desconhecido também não pinta nada.

Precisando de uma cor nova, declare a primitiva no bloco `@theme` de `tema.css`. Declare o
nome semântico correspondente no `:root`/`.dark` logo abaixo. Consuma por classe do Tailwind
(`bg-nome`, `text-nome`). Não relaxe o script para aceitar o valor solto.

## Corpo de requisição em camelCase

O back-end (`../saraivatech-api`) desserializa com política camelCase (`AddJsonOptions` com
`JsonSerializerDefaults.Web`), e é case-insensitive na leitura. PascalCase parece funcionar, mas
só por tolerância — não por estar correto. O contrato versionado (`contracts/openapi-v1.json` e o `schema.d.ts`
gerado dele) já é camelCase. Escreva o corpo das requisições em camelCase para bater com o tipo
gerado. Divergir do contrato é exatamente o que ele existe para prevenir.

## Todo arquivo de configuração na raiz precisa estar num `include`

Este projeto já foi pego três vezes pelo mesmo defeito. Um `.ts` de configuração na raiz
(`vite.config.ts`, depois `vitest.config.ts`, depois `playwright.config.ts`) ficava fora do
`include` de todo `tsconfig*.json`. O `tsc` sai com código 0 nesses casos. Não porque o arquivo
está correto, mas porque nenhum comando olha para ele. Um erro de tipo real pode viver ali
indefinidamente, sem que `typecheck` ou `build` o vejam.

Se você adicionar um novo arquivo de configuração na raiz, adicione-o ao `include` de um dos
`tsconfig*.json` existentes. Ou crie um dedicado, como `tsconfig.playwright.json` fez para não
afrouxar o `lib` dos outros dois.

## `shared/config` falha alto de propósito

`src/shared/config/index.ts` lê `VITE_URL_API` no carregamento do módulo, e lança se ela não
existir. Não é acidente: a intenção é falhar no boot da aplicação, não silenciosamente na
primeira requisição. Qualquer teste que monte um componente que alcance `shared/config` precisa
da variável definida no ambiente de teste. Por isso `features/` não importam `shared/config`
diretamente (ver acima).

**Isso vale também para o build.** O Vite substitui `import.meta.env.VITE_URL_API` em tempo de
compilação. `npm run build` sem a variável termina com código 0. Ele emite um bundle onde o
valor é estaticamente `undefined` — que estoura na primeira pintura. Sucesso de build não é
sucesso de boot. O projeto `producao` do Playwright (`e2e/producao.spec.ts`) constrói com a
variável definida e serve `dist` por `vite preview`. Ele confirma que a tela de entrada
renderiza. É o único portão que sobe o artefato de verdade.

## Permissão desenha a interface, não autoriza nada

`temGrupo` decide o que a tela mostra. Ele esconde um item de menu, ou desabilita uma ação sem
caminho de saída. Ele nunca é a fonte de autorização real — isso é do servidor, por operação.
Não escreva código que trate "o grupo consta" como "a operação é segura". Ver as duas lacunas
declaradas em [`CLAUDE.md`](CLAUDE.md): o `saraivatech-api`, o back-end par deste boilerplate
na pasta irmã `../saraivatech-api`, ainda não impõe autorização nenhuma.

## Nome do ramo

```
<tipo>/<nome-curto>
```

Exemplo: `feat/fundacao-frontend`. Vale para `feat`, `fix`, `docs` e `chore`.

## Mensagem de commit

Conventional Commits:

```
<tipo>(<escopo>): <descrição>
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
`revert`.

Exemplo: `fix(auth): corrige o cálculo de expiração da sessão`.
