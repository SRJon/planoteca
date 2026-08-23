# planoteca-web

**Planoteca** — boilerplate de front-end para projetos novos. React 19, Vite, TypeScript
estrito, contra o back-end par [`saraivatech-api`](../saraivatech-api).

Este é a metade front-end do boilerplate. A metade back-end é o `saraivatech-api`, um
boilerplate .NET 9 que vive na pasta irmã [`../saraivatech-api`](../saraivatech-api) do mesmo
repositório ([SRJon/boilerplate](https://github.com/SRJon/boilerplate.git)). Os dois são
independentes — cada um instala, testa e constrói sozinho — mas o contrato da API amarra um ao
outro. O README da raiz cobre o repositório inteiro; este cobre só o front.

> **Estado: fundação pronta, com fatia de exemplo.**

> A base já traz componente de UI (Tailwind v4 e shadcn), cliente HTTP e tokens de design. O
> shell e o fluxo de login já existem. A fatia `pessoa` mostra o padrão de ponta a ponta contra
> a rota real `/api/v1/person-samples` — listar, paginar, filtrar. Gere um projeto a partir
> daqui e comece pela primeira tela.

---

## Como gerar um projeto a partir deste boilerplate

```powershell
.\New-Project.ps1 -Name acme-financeiro-web `
                   -Titulo "Acme Financeiro" `
                   -OutputPath C:\Projetos\acme-financeiro-web
```

| Parâmetro | Vira |
|---|---|
| `-Name` | o nome do pacote em `package.json`, `package-lock.json` e `.env.example` |
| `-Titulo` | o título da aplicação em `index.html`, na marca (`Marca.tsx`) e no README |
| `-OutputPath` | o caminho de destino. O script recusa um destino que já existe |

O script copia a árvore inteira e substitui os dois marcadores acima. Depois remove do
destino `.git`, `node_modules`, `dist`, `coverage`, `.env.local` e a si mesmo. No fim,
imprime os próximos passos.

## Como rodar

Pré-requisito: Node 22 ou mais novo (`.nvmrc` fixa a 24) e npm.

```bash
nvm use                      # opcional, se você usa nvm
npm ci
cp .env.example .env.local   # preencha VITE_URL_API com o endereço da API local
npm run dev
```

Sem `VITE_URL_API` definida em `.env.local`, a aplicação lança um erro assim que o primeiro
módulo importa `shared/config` — de propósito. Ver [`CONTRIBUTING.md`](CONTRIBUTING.md).

### Subindo o front e o back juntos

O back-end é a pasta irmã `../saraivatech-api`, no mesmo repositório. Ele escuta em
`https://localhost:7206` e em `http://localhost:5226` — os dois endereços estão em
`src/SaraivaTech.Default.Api/Properties/launchSettings.json`, no perfil
`SaraivaTech.Default.Api`. O `.env.example` deste projeto já aponta `VITE_URL_API` para o
endereço HTTPS, que é o mesmo que o `scripts/api-sync.mjs` usa por padrão.

Em dois terminais, a partir da raiz do repositório:

```bash
# terminal 1 — a API
cd saraivatech-api/src/SaraivaTech.Default.Api
dotnet run

# terminal 2 — o front
cd planoteca-web
npm run dev
```

O `dotnet run` sobe em ambiente `Development`, que é o único onde a especificação OpenAPI
existe (`/openapi/v1.json`) e onde a documentação do Scalar responde (`/scalar/v1`). O
`npm run api:sync` e o `npm run api:diff` só funcionam com a API nesse estado. Na primeira vez,
confie no certificado de desenvolvimento com `dotnet dev-certs https --trust`; sem isso o
navegador recusa a conexão. O `api-sync.mjs` contorna essa checagem sozinho quando a URL começa
com `https://localhost`.

### Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` | Typecheck completo (três `tsconfig`) seguido do build de produção |
| `npm run typecheck` | Só o typecheck, sem gerar build |
| `npm run lint` | ESLint, encadeando o verificador de tokens de design (`tokens:check`) |
| `npm test` | Testes unitários e de componente (Vitest) |
| `npm run test:watch` | Os mesmos testes, em modo observador |
| `npm run e2e` | Testes de ponta a ponta (Playwright), contra o servidor de desenvolvimento |
| `npm run api:sync` | Busca o schema da API viva e regrava o contrato e os tipos |
| `npm run api:check` | Confere se os tipos gerados batem com o contrato commitado — sem rede |
| `npm run api:diff` | Compara o contrato commitado com uma API viva |

## Sincronizar o contrato da API

O contrato da API vive versionado em [`contracts/openapi-v1.json`](contracts/openapi-v1.json).
Os tipos TypeScript gerados dele vivem em `src/shared/api/schema.d.ts`. Os dois são artefatos
**commitados**, não buscados a cada instalação ou a cada build. Detalhes de proveniência e das
duas rotas que o back-end ainda precisa implementar estão em
[`contracts/README.md`](contracts/README.md).

Para atualizar o contrato depois de uma mudança no back-end, com a API local no ar (ver
"Subindo o front e o back juntos" acima — o back é `../saraivatech-api`, e precisa estar em
ambiente `Development`):

```bash
npm run api:sync
```

Isso regrava `contracts/openapi-v1.json` e `src/shared/api/schema.d.ts` juntos — ou nenhum dos
dois, se a geração de tipos falhar no meio do caminho. Rode `npm run api:check` para confirmar
que os dois arquivos ainda batem, sem precisar da API no ar. Comite os dois juntos.

## Estrutura do código

```
src/
├── app/         # bootstrap: providers, rotas, shell (barra lateral, barra superior, trilha)
├── pages/       # uma pasta por tela; monta features e entities num fluxo
├── features/    # uma ação do usuário: autenticar, filtrar-pessoas
├── entities/    # um conceito de negócio: pessoa, sessão — modelo e acesso a dados
├── components/  # componente de UI sem conhecimento de negócio: ui (shadcn), marca
├── shared/      # sem conhecimento de negócio: api, config, lib
└── teste/       # preparo do Vitest e simulação de rede (MSW) — nunca entra no bundle
```

Cada camada só importa da própria camada ou de uma camada mais abaixo nesta ordem. Nunca ao
contrário, e nunca de lado a lado fora de `shared`:

```
app → pages → features → entities → shared
```

`shared` não importa nada além de `shared`. `entities` importa `shared`. `features` importa
`entities` e `shared`. `pages` importa `features`, `entities` e `shared`. `app` importa de todo
o resto. `components/ui` e `components/marca` não têm conhecimento de negócio: qualquer camada
os importa.

A regra é imposta por `eslint-plugin-boundaries`, em [`eslint.config.js`](eslint.config.js).
Importar na direção errada quebra o `lint` — não é uma convenção para lembrar de cabeça. As
convenções de contribuição dentro dessa estrutura estão em
[`CONTRIBUTING.md`](CONTRIBUTING.md).

## Camada visual: Tailwind v4 e shadcn

Os componentes de interface vêm do [shadcn/ui](https://ui.shadcn.com), sobre
[Tailwind v4](https://tailwindcss.com). O Tailwind entra pelo plugin oficial do Vite — sem
PostCSS, sem `tailwind.config`. A folha de entrada é
[`src/app/estilos/tema.css`](src/app/estilos/tema.css). O bloco `@theme` declara as primitivas
de cor, em valor estático — exigência da v4. Um `:root`/`.dark` aponta os nomes semânticos
(`--color-primary`, `--color-background`) para essas primitivas por `var()`. O tema escuro é a
classe `.dark` no elemento raiz, escrita por `TemaProvider`. Não é mais o atributo `data-theme`.

Os componentes instalados moram em `src/components/ui/`: `badge`, `button`, `card`, `dialog`,
`dropdown-menu`, `field`, `input`, `label`, `select`, `separator`, `table`, `tabs`, `textarea` e
`tooltip`. Para adicionar mais um:

```bash
npx shadcn@latest add <nome>
```

> **Armadilha:** não use `npx shadcn@latest init -d` para reinicializar o projeto. A flag `-d`
> trava o preset em `base-nova`, que usa `@base-ui/react` em vez do Radix. Ela também
> sobrescreve o CSS principal, e apaga a paleta da marca. O projeto foi inicializado com
> `npx shadcn@latest init -y -b radix -p nova --template vite`. Repita esse comando se a
> configuração precisar ser refeita.

Os ícones vêm do `@phosphor-icons/react`, sempre pelo caminho direto do ícone. Nunca pela raiz
do pacote: ela transpila mais de nove mil módulos.

```ts
import { House } from '@phosphor-icons/react/dist/csr/House'
```

Não existe componente `Icone` de embrulho. A tela importa o ícone que precisa, direto.

O [`scripts/verifica-tokens.mjs`](scripts/verifica-tokens.mjs) roda dentro de `npm run lint`.
Em arquivo de componente ele recusa:

- cor literal — hex, `rgb()`, nome de cor CSS
- classe crua da paleta embutida do Tailwind, como `bg-slate-950` ou `text-zinc-400`
- primitiva do tema usada como se fosse nome semântico, como `bg-red-500`. Primitiva é
  matéria-prima, não vocabulário de tela

Aceita classe que aponta para o tema: `bg-background`, `text-primary`, `border-border`. A
regra é lista negra, não lista branca. Um nome que o tema não declara (`bg-qualquer-coisa`)
passa, porque também não pinta nada.

## Como trocar a paleta de marca

A cor de identidade de um projeto novo mora inteira no bloco `PONTO DE TROCA`, no topo de
[`src/app/estilos/tema.css`](src/app/estilos/tema.css). É o único lugar que uma troca de
paleta edita.

1. Abra o `tema.css` e ache o bloco `PONTO DE TROCA`.
2. Troque os sete valores de `--marca*` e `--acento*`, no `:root` (tema claro) e no `.dark`
   (tema escuro). Meça o contraste dos dois blocos separadamente — o tom claro e o escuro não
   são o mesmo tom clareado.
3. Não renomeie o token. `--marca` continua se chamando `--marca`; o JSX consome o nome
   semântico (`bg-primary`), nunca o valor. Renomear aqui obrigaria a renomear no `@theme`, em
   `tokensReferencia.ts` e em cada tela, sem ganho nenhum.

## Da fatia de exemplo à primeira tela real

A fatia `pessoa` fica no projeto gerado de propósito. Ela é o exemplo vivo do padrão de
camadas — entities, features, pages — contra uma rota real da API. É mais fácil apagar um
exemplo funcionando do que escrever o primeiro do zero sem referência.

Quando a primeira tela real nascer, remova estes caminhos à mão:

| Caminho | O que é |
|---|---|
| `src/entities/pessoa/` | modelo, mapeador, acesso a dados |
| `src/features/filtrar-pessoas/` | estado do filtro e tradução de ordenação |
| `src/pages/pessoas/` | a tela de listagem |
| a linha de `/pessoas` em `ITENS_MENU`, em [`src/app/shell/permissoes.ts`](src/app/shell/permissoes.ts) | o item de menu |
| a rota `/pessoas` em [`src/app/rotas/Rotas.tsx`](src/app/rotas/Rotas.tsx) | inclusive o redirecionamento de fallback, que hoje aponta para ela |
| a entrada de `pessoas` no mapa de seção, em [`src/app/shell/Trilha.tsx`](src/app/shell/Trilha.tsx) | o rótulo da trilha de navegação |
| o handler de `person-samples`, em [`src/teste/servidor.ts`](src/teste/servidor.ts) | a simulação de rede usada pelos testes |
| [`e2e/entrar-e-listar.spec.ts`](e2e/entrar-e-listar.spec.ts) | o fluxo ponta a ponta que exercita a fatia |

Por que uma lista, e não um comando: a fatia `pessoa` toca rota, menu e simulação de rede
ao mesmo tempo. Um script automático falharia sozinho no primeiro desvio de nome. O erro
apareceria longe da causa — no lint ou no teste, não no script. A lista acima é mais
honesta: quem segue os oito passos sabe exatamente o que saiu e por quê.
