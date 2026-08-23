# CLAUDE.md

Guia para o Claude Code e para qualquer pessoa que entre neste repositório.

---

## O que é este projeto

`planoteca-web` é o front-end da **Planoteca**: um acervo público de planos de aula com
metodologias ativas, para professores da educação básica. Contexto de produto no
[`README.md` da raiz](../README.md); as decisões que não se renegociam no
[`CLAUDE.md` da raiz](../CLAUDE.md).

O back-end par é o `../planoteca-api` (.NET 10, PostgreSQL). Este front escreve contra ele,
nunca o contrário — o contrato da API é do back, e o front se adapta. A API escuta em
`https://localhost:7206` e `http://localhost:5226`.

Nasceu do boilerplate `saraivatech-web`, e sobrou andaime: a fatia `pessoa`
(`src/entities/pessoa`, `src/features/filtrar-pessoas`, `src/pages/pessoas`) não é domínio da
Planoteca. O padrão a copiar é `entities/plano`, não `entities/pessoa`.

---

## O acervo é público — a regra que estrutura o roteamento

Baixar um plano **não exige conta**. Isso é decisão de produto, não configuração: o professor
chega pelo celular, com pressa, e qualquer porta entre ele e o PDF derruba o uso.

Por isso existem **duas cascas**, e a linha entre elas é o assunto mais importante deste
arquivo:

| Casca | Onde | Rotas | Guarda |
|---|---|---|---|
| `LayoutPublico` | `src/app/shell/LayoutPublico.tsx` | `/` (landing), `/biblioteca`, `/blog` | nenhuma |
| `Shell` | `src/app/shell/Shell.tsx` | `/pessoas`, futuro painel administrativo | `RotaProtegida` |

O `Shell` tem barra lateral, trilha e um menu de conta que pressupõe sessão — `BarraSuperior`
desenha avatar e "Sair" sem checar `sessao`. Reaproveitá-lo numa rota pública mostraria menu
de conta a quem não tem conta. Não funda os dois: são dois desenhos, para dois usos.

Login leva para a **área de trabalho** (`useEntrar.ts`), não para a Biblioteca: quem se
identifica na Planoteca é quem vai escrever no blog ou catalogar plano.

A regra está travada por teste, e é para ficar assim:

- `src/app/rotas/guarda.test.tsx`, bloco "o acervo é público"
- `e2e/biblioteca.spec.ts`, que filtra e pagina sem nunca fazer login

Se um deles falhar porque alguém moveu a Biblioteca para dentro da guarda, **o teste está
certo e a mudança está errada**.

---

## As duas lacunas declaradas

O `../planoteca-api`, no estado atual, **não implementa nenhuma rota do contrato**.
Verificado em 2026-08-22, depois da migração para PostgreSQL.

### 1. Não existe autenticação no back-end

O back-end não expõe `POST /api/v1/auth/login` nem `GET /api/v1/auth/userinfo`.

Some-se a isto uma lacuna de produto: o login da Planoteca deve ser **só com conta Google**.
O formulário atual é de usuário e senha, herdado do boilerplate — quando o login de verdade
for implementado, esta tela muda junto.

Este front já escreve contra as duas rotas — `src/features/autenticar/api.ts` chama o login,
`src/entities/sessao/` guarda a resposta. O `access_token` é opaco para o front: nada dentro
dele é lido. O contrato exato que o back-end precisa
implementar está em [`contracts/openapi-v1.json`](contracts/openapi-v1.json), rotas
`/api/v1/auth/login` e `/api/v1/auth/userinfo`. Ele nasceu escrito à mão, não gerado de uma
API viva. A razão é a contrária: essas duas rotas ainda não existem para gerar nada delas.

Enquanto a lacuna não fecha, use a simulação de rede (`src/teste/servidor.ts` nos testes,
`e2e/simulacao.ts` no Playwright) para desenvolver a UI. Contra a API real, o login falha com
404.

### 2. A API não tem nenhum controller

A fatia `PersonSample` foi removida do back-end na migração para PostgreSQL — era andaime de
boilerplate, e o SQL Dapper dela era T-SQL puro.

O front manda o cabeçalho `Authorization` em toda requisição autenticada (ver
`src/shared/api/cliente.ts`), e hoje não há nada do outro lado que o leia. Não trate esse
silêncio como sinal de que a autorização funciona.

Quando a entidade `Plano` nascer na API, `GET /api/v1/lesson-plans` e o download de PDF
**não** levam `[Authorize]` — ver a regra do acervo público acima. Se algum dia uma rota
protegida aparecer, revise se a UI trata 401 de forma explícita: hoje ela não precisa.

---

## O que o `contracts/README.md` já avisa

Duas partes do contrato foram derivadas da leitura do código C#, não observadas numa resposta
real da API:

- O casing de `UserInfoDto`. O record C# mistura `FirstName`, `EmployeeID` e `UserFullName` com
  campos minúsculos. O contrato assume o camelCase padrão do `AddJsonOptions` do back-end —
  `firstName`, `employeeID`, `userFullName`. O campo `employeeID` é o candidato mais provável a
  divergir. O padrão comum seria `employeeId`; o C# original usa a sigla toda em maiúscula.
- A forma do corpo de `POST /auth/login`. Não existe DTO de entrada no back-end para essa rota
  — ela nem existe ainda. O `LoginRequest` do contrato é uma proposta, não uma observação.

Ver [`contracts/README.md`](contracts/README.md) para o resto: como regenerar o contrato, e a
diferença entre `api:sync`, `api:check` e `api:diff`.

---

## Permissão desenha a interface, não autoriza

`src/entities/sessao/permissao.ts` expõe `temGrupo(sessao, grupo)`. Ele confere se um nome de
grupo consta em `sessao.grupos` — a lista que `groupMembership` do `/auth/userinfo` traz.

Isso decide o que a tela mostra: esconde um item de menu, evita um caminho sem saída. Nunca é
controle de acesso. A autorização real é do servidor, por operação. É a lacuna 2 acima que
falta para ela existir de verdade neste boilerplate.

## A renovação de sessão que não existe

`src/app/providers/SessaoProvider.tsx` documenta por que a renovação automática de sessão foi
removida. O `TokenDto` traz `refresh_token`, mas não existe rota de renovação no back-end.
Apontar para uma rota inventada falharia a cada 30 segundos, escondendo erro de verdade atrás
de ruído. Enquanto a lacuna não fecha, a sessão vence no prazo de `expires_in` e a pessoa
usuária entra de novo. O comentário no arquivo explica como reintroduzir a renovação quando o
back-end tiver a rota.

---

## A regra de estilo que a guarda impõe

A interface é Tailwind v4 com shadcn. Os componentes moram em
[`src/components/ui/`](src/components/ui/), e novos entram por `npx shadcn@latest add <nome>`.

O [`scripts/verifica-tokens.mjs`](scripts/verifica-tokens.mjs) executa dentro do
`npm run lint` e recusa três coisas em arquivo de componente:

- cor literal, seja `#0163a2`, `rgb()` ou `hsl()`
- classe crua da paleta do Tailwind, como `bg-slate-950` ou `text-zinc-400`
- primitiva do tema usada como nome semântico, como `bg-red-500`

O que passa é a classe que aponta para o tema: `bg-background`, `text-primary`,
`border-border`. A cor mora em [`src/app/estilos/tema.css`](src/app/estilos/tema.css), e em
nenhum outro lugar.

O motivo é a promessa do boilerplate: trocar a paleta num arquivo troca o aplicativo inteiro.
Uma cor espalhada pelo JSX quebra essa promessa em silêncio.

Os ícones vêm do Phosphor, sempre pelo caminho direto:

```ts
import { House } from '@phosphor-icons/react/dist/csr/House'
```

Importar da raiz do pacote transpila mais de nove mil módulos, e deixa o desenvolvimento
lento. Não existe componente de embrulho: a tela importa o ícone que usa.

O tema é a classe `.dark` no elemento raiz, e não um atributo.

---

## Convenção de commit

Conventional Commits:

```
<tipo>(<escopo>): <descrição>
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
`revert`.

Exemplo: `feat(pessoa): adiciona coluna de idade na listagem`.
