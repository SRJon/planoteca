<!-- gerado de docs/specs/2026-08-06-boilerplate-front.html
     sha256 da fonte: df6f0cef5cbad0b9
     em: 2026-08-22T00:34
     NAO ESCREVA NESTE ARQUIVO. Altere o HTML e regenere. -->

# Boilerplate de front-end fotus-default-web — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o `csc-importacao-web-react` vira um boilerplate sem dominio, com fatia de exemplo contra o `fotus-default-api` e script de geracao.

**Architecture:** as camadas continuam `app -> pages -> features -> entities -> shared`, com a ordem imposta pelo `eslint.config.js`. A fundacao de `shared/` passa intacta. O dominio de importacao sai de `entities/`, `features/` e `pages/`, e a fatia `pessoa` entra no lugar dele.

**Tech Stack:** React 19, Vite, TypeScript estrito, Vitest, MSW, Playwright, PowerShell 5.1.

## Global Constraints

- O alvo e `DEV/boilerplate/fotus-default-web`. Ele nasce como git local, sem remote.
- `DEV/boilerplate/csc-importacao-web-react` e somente leitura. Nenhuma task escreve nele.
- `DEV/fotus-default-api` e somente leitura. O front se adapta ao contrato dele.
- Nenhuma dependencia nova entra no `package.json`.
- A ordem das camadas e `app -> pages -> features -> entities -> shared`.
- Cor literal fora de `tokens.css` quebra o `verifica-tokens.mjs`. Use token.
- Os testes executam sem rede. O MSW simula a API.
- A paleta continua azul e dourado.
- O tema tem duas variantes: claro e escuro.

## Fontes

| Caminho | O que decide |
|---|---|
| `../csc-importacao-web-react/src/shared/api/cliente.ts` | prefixo `/api/v1`, leitura do `X-Total-Count`, serializacao de array |
| `../csc-importacao-web-react/src/shared/api/erro.ts` | forma do erro de API |
| `../csc-importacao-web-react/src/shared/config/ambiente.ts` | erro no carregamento quando falta `VITE_URL_API` |
| `../csc-importacao-web-react/src/entities/sessao/deposito.ts` | o que sai com a claim `exp` |
| `../csc-importacao-web-react/src/entities/sessao/permissao.ts` | a matriz de flags que vira grupo |
| `../csc-importacao-web-react/src/features/autenticar/api.ts` | a rota de login a alterar |
| `../csc-importacao-web-react/src/app/estilos/tokens.css` | os blocos `[data-empresa]` que saem |
| `../csc-importacao-web-react/src/app/shell/BarraSuperior.tsx` | o seletor de empresa que sai |
| `../csc-importacao-web-react/src/app/shell/permissoes.ts` | a matriz de permissao que vira grupo |
| `../csc-importacao-web-react/src/entities/projeto/` | o molde da fatia `pessoa` |
| `../csc-importacao-web-react/src/features/filtrar-projetos/ordenacaoApi.ts` | a traducao de ordenacao |
| `../csc-importacao-web-react/src/pages/projetos/` | o molde da pagina de listagem |
| `../csc-importacao-web-react/scripts/api-sync.mjs` | como o contrato gera o `schema.d.ts` |
| `../csc-importacao-web-react/eslint.config.js` | a ordem das camadas |
| `../csc-importacao-web-react/e2e/entrar-e-listar.spec.ts` | o molde do fluxo ponta a ponta |
| `../csc-importacao-web-react/src/teste/servidor.ts` | a simulacao de rede |
| `../../fotus-default-api/src/Fotus.Default.Api/Controllers/PersonSampleController.cs` | as rotas, os parametros e o `204` |
| `../../fotus-default-api/src/Fotus.Default.Application/Base/FilterDto.cs` | `page`, `per_page`, `sort` e `filter` |
| `../../fotus-default-api/src/Fotus.Default.Application/Dto/Authorization/TokenDto.cs` | `access_token` e `expires_in` |
| `../../fotus-default-api/src/Fotus.Default.Application/Dto/Authorization/UserInfoDto.cs` | `groupMembership` |
| `../../fotus-default-api/New-Project.ps1` | o ritual de geracao a espelhar |
| `../../fotus-default-api/src/Fotus.Default.Api/ServiceExtensions.cs` | o prefixo `/api/v1` |

---

### Task 1: Copiar a origem e iniciar o git

**Papel:** escrita
**Verificação:** `cd fotus-default-web && git rev-parse --is-inside-work-tree && test ! -d .git/refs/remotes/origin && test -f package.json`

**Fontes:**
- `../csc-importacao-web-react/.gitignore` — o que o repositorio ignora

**Files:**
- Create: `fotus-default-web/` — a copia inteira da origem
- Keep: `fotus-default-web/docs/specs/`, `fotus-default-web/docs/plans/`

Cumpre RF-01.

**Interfaces:**
- Produces: a arvore do alvo, pronta para as tasks seguintes.

- [x] **Step 1: Copiar a origem sem as pastas descartaveis**

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate
tar -c --exclude=.git --exclude=node_modules --exclude=dist \
    --exclude=coverage --exclude=.env.local --exclude=docs \
    -C csc-importacao-web-react . | tar -x -C fotus-default-web
```

Esperado: nenhuma saida. O comando termina com codigo 0.

- [x] **Step 2: Confirmar que o docs do alvo sobreviveu**

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
ls docs/specs docs/plans && ls src package.json
```

Esperado: os dois arquivos de `docs/` e a arvore de `src/`.

- [x] **Step 3: Iniciar o git local**

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
git init -b main && git remote -v
```

Esperado: `Initialized empty Git repository`. A lista de remote sai vazia.

- [x] **Step 4: Commitar**

```bash
git add -A
git commit -m "chore: copia a fundacao do csc-importacao-web-react"
```

---

### Task 2: Remover o dominio de importacao

**Papel:** escrita
**Verificação:** `cd fotus-default-web && test ! -d src/entities/projeto && test ! -d src/entities/empresa && test ! -d src/features/filtrar-projetos && test ! -d src/pages/projetos && test ! -f src/app/shell/empresas.ts`

**Fontes:**
- `../csc-importacao-web-react/src/app/rotas/Rotas.tsx` — as rotas que apontam para o dominio
- `../csc-importacao-web-react/src/app/providers/` — o provider de escopo que sai

**Files:**
- Delete: `src/entities/projeto/`, `src/entities/empresa/`, `src/features/filtrar-projetos/`, `src/pages/projetos/`
- Delete: `src/app/shell/empresas.ts`, `src/app/providers/EscopoEmpresaProvider.tsx`, `contracts/openapi-v1.json`
- Modify: `src/app/rotas/Rotas.tsx`, `src/app/providers/index.ts`, `src/teste/servidor.ts`
- Modify: `src/pages/design-system/PaginaDesignSystem.tsx` e o teste dele

Cumpre RF-02 e RF-03B.

> Nota de execucao, 2026-08-22: a spec dava a pagina `/design-system` como intacta, e ela
> exibia dado do dominio. A contradicao foi resolvida na spec HTML: a estrutura permanece,
> o dado de exemplo sai. O RF-03B nasceu dessa correcao.

> Achado de escopo, 2026-08-22: o `src/shared/api/schema.d.ts` continua no repositorio com
> 12.454 linhas, geradas do contrato que esta task removeu. A Task 6 escreve os dois de novo,
> entao o orfao morre la. Aceito, e registrado no commit da task.

**Interfaces:**
- Consumes: a arvore da Task 1.
- Produces: uma arvore sem dominio. A aplicacao ainda nao compila; a Task 7 fecha o vazio.

- [x] **Step 1: Remover os caminhos do dominio**

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
git rm -r --quiet src/entities/projeto src/entities/empresa \
  src/features/filtrar-projetos src/pages/projetos
git rm --quiet src/app/shell/empresas.ts \
  src/app/providers/EscopoEmpresaProvider.tsx contracts/openapi-v1.json
```

Esperado: nenhuma saida. O comando termina com codigo 0.

- [x] **Step 2: Remover as referencias que sobraram**

Retire de `src/app/rotas/Rotas.tsx` a rota de projetos e o import dela. Retire de
`src/app/providers/index.ts` o `EscopoEmpresaProvider`. Retire de `src/teste/servidor.ts`
os handlers do dominio.

Na `PaginaDesignSystem.tsx`, troque as quatro grades de cor por duas, uma por tema. Troque a
prosa de amostra por texto neutro. Retire o icone `projeto` da demonstracao.

```bash
grep -rn "projeto\|empresa\|Empresa\|Projeto" src/app src/teste --include=*.ts --include=*.tsx
```

Esperado: nenhuma linha.

- [x] **Step 3: Confirmar que o dominio saiu de todo o repositorio**

```bash
grep -rniE "importacao|projeto|empresa|sankhya|CODEMP|Litoral" src e2e contracts \
  --include=* -l || echo "limpo"
```

Esperado: `limpo`, ou so caminhos com comentario historico justificado.

- [x] **Step 4: Commitar**

```bash
git add -A
git commit -m "refactor: remove o dominio de importacao"
```

---

### Task 3: Reduzir o tema a claro e escuro

**Papel:** escrita
**Verificação:** `cd fotus-default-web && npm run lint -- --max-warnings=0 && ! grep -q "data-empresa" src/app/estilos/tokens.css`

**Fontes:**
- `../csc-importacao-web-react/src/app/estilos/tokens.css` — os blocos a colapsar
- `../csc-importacao-web-react/src/app/providers/TemaProvider.tsx` — a dimensao a remover
- `../csc-importacao-web-react/scripts/verifica-tokens.mjs` — a regra que o arquivo respeita

**Files:**
- Modify: `src/app/estilos/tokens.css`, `src/app/providers/TemaProvider.tsx`

Cumpre RF-04.

**Interfaces:**
- Consumes: a arvore da Task 2.
- Produces: `TemaProvider` com duas variantes.

- [x] **Step 1: Colapsar os blocos de empresa no tokens.css**

Mantenha `:root` para o tema claro e `[data-theme="dark"]` para o escuro. Remova todo
seletor `[data-empresa]`. Preserve os valores de azul e de dourado.

- [x] **Step 2: Remover a dimensao de empresa do provider**

O `TemaProvider` passa a escrever so `data-theme` no elemento raiz.

> Correcao, 2026-08-22: o plano dizia `[data-tema="escuro"]`. O nome real no codigo e
> `[data-theme="dark"]`, usado em sete arquivos. O nome errado nasceu aqui, sem leitura do
> `tokens.css`. Vale o nome do codigo.

- [x] **Step 3: Executar o verificador de tokens e o lint**

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
node scripts/verifica-tokens.mjs && npm run lint
```

Esperado: os dois comandos saem com codigo 0.

- [x] **Step 4: Commitar**

```bash
git add src/app/estilos/tokens.css src/app/providers/TemaProvider.tsx
git commit -m "refactor: reduz o tema a claro e escuro"
```

---

### Task 4: Trocar o contrato de autenticacao

**Papel:** analise
**Verificação:** `cd fotus-default-web && npx vitest run src/entities/sessao src/features/autenticar`

**Fontes:**
- `../../fotus-default-api/src/Fotus.Default.Application/Dto/Authorization/TokenDto.cs` — os campos da resposta
- `../csc-importacao-web-react/src/entities/sessao/deposito.ts` — a decodificacao que sai
- `../csc-importacao-web-react/src/features/autenticar/api.ts` — a rota a alterar

**Files:**
- Modify: `src/entities/sessao/modelo.ts`, `src/entities/sessao/deposito.ts`, `src/features/autenticar/api.ts`
- Test: `src/entities/sessao/deposito.test.ts`

Cumpre RF-05.

> Nota de execucao, 2026-08-22: a renovacao automatica de sessao SAIU. O back-end tem um
> controller so, e nenhuma rota de renovacao. A renovacao apontava para
> `/sankhya/refresh-token`, do dominio removido, e falharia a cada 30 segundos. A lacuna
> esta declarada no `SessaoProvider.tsx`, com a instrucao de como reintroduzir.
>
> A `Sessao` ganhou `grupos` e `nomeCompleto`. O `nomeCompleto` virou necessidade quando o
> token virou opaco: a `BarraSuperior` lia o nome de uma claim que deixou de existir.
>
> O `lerCodigoGrupo` saiu do `permissoes.ts`: ele lia a claim `codigoGrupo`, e sem claim nao
> ha fonte. A consulta da matriz falha fechada. A Task 5 fecha isso.

**Interfaces:**
- Consumes: a arvore da Task 3.
- Produces: `salvarSessao(token: TokenDto) -> void` — calcula a expiracao do `expires_in`.

- [x] **Step 1: Escrever o teste que falha**

O teste cobre tres casos: a expiracao sai do `expires_in`, a sessao expirada e recusada,
e nenhum JWT e decodificado.

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { salvarSessao, lerSessao, limparSessao } from './deposito'

describe('deposito de sessao', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    limparSessao()
  })
  afterEach(() => vi.useRealTimers())

  it('calcula a expiracao do expires_in', () => {
    salvarSessao({ access_token: 'abc', token_type: 'Bearer', expires_in: 3600 })
    expect(lerSessao()?.expiraEm).toBe(Date.parse('2026-01-01T01:00:00Z'))
  })

  it('recusa a sessao depois do prazo', () => {
    salvarSessao({ access_token: 'abc', token_type: 'Bearer', expires_in: 60 })
    vi.setSystemTime(new Date('2026-01-01T00:02:00Z'))
    expect(lerSessao()).toBeNull()
  })

  it('aceita token opaco, sem decodificar claim', () => {
    salvarSessao({ access_token: 'nao-e-um-jwt', token_type: 'Bearer', expires_in: 300 })
    expect(lerSessao()?.token).toBe('nao-e-um-jwt')
  })
})
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
npx vitest run src/entities/sessao/deposito.test.ts
```

Esperado: os tres casos falham.

- [x] **Step 3: Implementar**

O `modelo.ts` declara `TokenDto` e `Sessao`. O `deposito.ts` perde a decodificacao da
claim `exp` e passa a calcular `expiraEm = Date.now() + expires_in * 1000`. O `api.ts`
aponta para `POST /api/v1/auth/login` e para `GET /api/v1/auth/userinfo`.

- [x] **Step 4: Executar e confirmar que passa**

```bash
npx vitest run src/entities/sessao src/features/autenticar
```

Esperado: todos os testes passam.

- [x] **Step 5: Commitar**

```bash
git add src/entities/sessao src/features/autenticar
git commit -m "feat: adota o TokenDto do back-end boilerplate"
```

---

### Task 5: Trocar a matriz de permissao por grupo

**Papel:** analise
**Verificação:** `cd fotus-default-web && npx vitest run src/entities/sessao/permissao.test.ts src/app/shell`

**Fontes:**
- `../../fotus-default-api/src/Fotus.Default.Application/Dto/Authorization/UserInfoDto.cs` — o campo `groupMembership`
- `../csc-importacao-web-react/src/entities/sessao/permissao.ts` — a matriz que sai
- `../csc-importacao-web-react/src/app/shell/permissoes.ts` — o consumo da matriz

**Files:**
- Modify: `src/entities/sessao/permissao.ts`, `src/app/shell/permissoes.ts`, `src/app/shell/useMatrizPermissao.ts`
- Test: `src/entities/sessao/permissao.test.ts`

Cumpre RF-06.

> Nota de execucao, 2026-08-22: o `useMatrizPermissao.ts` foi removido, nao consertado. A
> matriz vinha de `/telas` e `/perfis-tela`, que o back-end boilerplate nao expoe.
>
> O item de menu declara grupo numa tabela estatica, `ITENS_MENU` em `app/shell/permissoes.ts`.
> O proximo projeto altera uma linha por item. O menu e codigo da aplicacao, versionado junto
> com a rota.
>
> A regra: o padrao e aberto, a excecao e declarada, e nenhum dos dois e controle de acesso.
> Item sem `grupo` aparece sempre; item com `grupo` some quando o grupo nao consta, inclusive
> com lista vazia.
>
> A guarda de rota nao chama `temGrupo`. Ela evita caminho sem saida. Expulsar alguem
> enquanto o userinfo esta em voo criaria justamente esse caminho.

**Interfaces:**
- Consumes: `Sessao` da Task 4.
- Produces: `temGrupo(sessao: Sessao, grupo: string) -> boolean`.

- [x] **Step 1: Escrever o teste que falha**

```ts
import { describe, expect, it } from 'vitest'
import { temGrupo } from './permissao'

const sessao = { token: 'abc', expiraEm: 0, grupos: ['financeiro', 'leitura'] }

describe('permissao por grupo', () => {
  it('confirma o grupo que consta', () => {
    expect(temGrupo(sessao, 'financeiro')).toBe(true)
  })

  it('recusa o grupo que nao consta', () => {
    expect(temGrupo(sessao, 'admin')).toBe(false)
  })

  it('recusa quando a lista esta vazia', () => {
    expect(temGrupo({ ...sessao, grupos: [] }, 'leitura')).toBe(false)
  })
})
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
npx vitest run src/entities/sessao/permissao.test.ts
```

Esperado: os tres casos falham.

- [x] **Step 3: Implementar**

O `permissao.ts` perde a matriz de quatro flags e expoe `temGrupo`. O `permissoes.ts` do
shell passa a mapear item de menu para nome de grupo. Escreva no arquivo o comentario que
diz: a permissao desenha interface e nao autoriza.

- [x] **Step 4: Executar e confirmar que passa**

```bash
npx vitest run src/entities/sessao/permissao.test.ts src/app/shell
```

Esperado: todos os testes passam.

- [x] **Step 5: Commitar**

```bash
git add src/entities/sessao src/app/shell
git commit -m "feat: troca a matriz de flags por grupo"
```

---

### Task 6: Escrever o contrato e gerar os tipos

**Papel:** analise
**Verificação:** `cd fotus-default-web && npm run api:check`

**Fontes:**
- `../../fotus-default-api/src/Fotus.Default.Api/Controllers/PersonSampleController.cs` — as rotas, campo a campo
- `../../fotus-default-api/src/Fotus.Default.Application/Base/FilterDto.cs` — os quatro parametros
- `../../fotus-default-api/src/Fotus.Default.Api/ServiceExtensions.cs` — o prefixo `/api/v1`
- `../csc-importacao-web-react/scripts/api-sync.mjs` — como o contrato gera o `schema.d.ts`

**Files:**
- Create: `contracts/openapi-v1.json`
- Modify: `src/shared/api/schema.d.ts` — gerado, nao escrito a mao

Cumpre RF-09.

**Interfaces:**
- Consumes: a arvore da Task 5.
- Produces: `schema.d.ts` com o DTO de pessoa e o de autenticacao.

- [x] **Step 1: Ler o controller e derivar as rotas**

Leia o `PersonSampleController.cs` inteiro. Anote cada rota, cada parametro e cada codigo
de resposta. O `204` sem corpo entra no contrato.

- [x] **Step 2: Escrever o contrato**

Oito rotas. Seis de `person-samples`:

| Verbo | Rota | Resposta |
|---|---|---|
| GET | `/person-samples` | 200 com `X-Total-Count`, ou 204 sem corpo. Aceita `active` alem do `FilterDto` |
| GET | `/person-samples/All` | 200 com `X-Total-Count`, ou 204 sem corpo |
| GET | `/person-samples/{id}` | 200. O id e `Guid` |
| POST | `/person-samples` | 201 |
| PUT | `/person-samples/{id}` | 200 |
| DELETE | `/person-samples/{id}` | 204 |

Mais duas de autenticacao: `POST /auth/login` e `GET /auth/userinfo`. O topo do arquivo leva o
comentario que manda executar `npm run api:sync` contra a API viva.

- [x] **Step 3: Gerar os tipos**

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
npm run api:sync -- --arquivo contracts/openapi-v1.json
```

Esperado: o `src/shared/api/schema.d.ts` e reescrito.

> Correcao, 2026-08-22: o plano dizia `--local`. Essa flag nao existe. As flags reais do
> `api-sync.mjs` sao `--url`, `--arquivo`, `--check` e `--diff`. Sem flag reconhecida o script
> cai na rede, contra uma API fora do ar.

- [x] **Step 4: Confirmar que o schema bate com o contrato**

```bash
npm run api:check && npm run typecheck
```

Esperado: os dois comandos saem com codigo 0.

- [x] **Step 5: Commitar**

```bash
git add contracts src/shared/api/schema.d.ts
git commit -m "feat: escreve o contrato de oito rotas e gera os tipos"
```

---

### Task 7: Escrever a fatia pessoa em entities

**Papel:** escrita
**Verificação:** `cd fotus-default-web && npx vitest run src/entities/pessoa`

**Fontes:**
- `../csc-importacao-web-react/src/entities/projeto/` — o molde inteiro da fatia
- `../../fotus-default-api/src/Fotus.Default.Api/Controllers/PersonSampleController.cs` — os campos do DTO e o `204`
- `../csc-importacao-web-react/src/shared/api/cliente.ts` — a assinatura de `listar`

**Files:**
- Create: `src/entities/pessoa/modelo.ts`, `mapeador.ts`, `api.ts`, `usePessoas.ts`, `index.ts`
- Test: `src/entities/pessoa/mapeador.test.ts`

Cumpre RF-07 e RF-08.

**Interfaces:**
- Consumes: `schema.d.ts` da Task 6, `Cliente` de `shared/api`.
- Produces: `listarPessoas(cliente: Cliente, filtro: FiltroPessoa) -> Promise<Pagina<Pessoa>>`.

O DTO tem sete campos, o id e `Guid`, e o servidor omite campo nulo. O teste cobre os dois
casos: o registro cheio, e o registro sem `lastName`.

- [x] **Step 1: Escrever o teste que falha**

```ts
import { describe, expect, it } from 'vitest'
import { paraDominio } from './mapeador'

describe('mapeador de pessoa', () => {
  it('converte o DTO para o dominio', () => {
    const dto = {
      id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
      firstName: 'Ana',
      lastName: 'Souza',
      dateBirth: '1990-04-12T00:00:00',
      type: 'FEMALE' as const,
      active: true,
      age: 36,
    }
    expect(paraDominio(dto)).toEqual({
      id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
      nome: 'Ana',
      sobrenome: 'Souza',
      nomeCompleto: 'Ana Souza',
      nascimento: new Date('1990-04-12T00:00:00'),
      tipo: 'feminino',
      ativo: true,
      idade: 36,
    })
  })

  it('tolera sobrenome ausente', () => {
    const dto = {
      id: '5f2504e0-4f89-11d3-9a0c-0305e82c3302',
      firstName: 'Bia',
      dateBirth: '1988-01-03T00:00:00',
      type: 'FEMALE' as const,
      active: false,
      age: 38,
    }
    expect(paraDominio(dto).nomeCompleto).toBe('Bia')
  })
})
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
npx vitest run src/entities/pessoa/mapeador.test.ts
```

Esperado: os dois casos falham por modulo ausente.

- [x] **Step 3: Implementar**

O `mapeador.ts` e o unico arquivo da fatia que importa `schema.d.ts`. O `api.ts` recebe o
`Cliente` por parametro e devolve dominio. O `usePessoas.ts` embrulha o `api.ts` numa
consulta do TanStack Query.

- [x] **Step 4: Executar e confirmar que passa**

```bash
npx vitest run src/entities/pessoa && npm run lint
```

Esperado: os testes passam e o lint sai com codigo 0.

- [x] **Step 5: Commitar**

```bash
git add src/entities/pessoa
git commit -m "feat: escreve a fatia pessoa em entities"
```

---

### Task 8: Escrever a feature filtrar-pessoas

**Papel:** escrita
**Verificação:** `cd fotus-default-web && npx vitest run src/features/filtrar-pessoas`

**Fontes:**
- `../csc-importacao-web-react/src/features/filtrar-projetos/` — o molde inteiro
- `../csc-importacao-web-react/src/features/filtrar-projetos/ordenacaoApi.ts` — a traducao de ordenacao
- `../../fotus-default-api/src/Fotus.Default.Application/Base/FilterDto.cs` — a forma do `sort`

**Files:**
- Create: `src/features/filtrar-pessoas/FiltrosPessoas.tsx`, `useFiltroPessoas.ts`, `ordenacaoApi.ts`, `index.ts`
- Test: `src/features/filtrar-pessoas/ordenacaoApi.test.ts`

Cumpre RF-07 e RF-08.

**Interfaces:**
- Consumes: `FiltroPessoa` da Task 7.
- Produces: `paraSortApi(ordenacao: Ordenacao) -> string`, com `Ordenacao = { campo, direcao }`.

> Correcao, 2026-08-22: o plano rascunhava `paraSortApi(campo, direcao)`, com dois parametros.
> O molde real usa um objeto so. Vale a forma do molde.

- [x] **Step 1: Escrever o teste que falha**

```ts
import { describe, expect, it } from 'vitest'
import { paraSortApi } from './ordenacaoApi'

describe('traducao de ordenacao', () => {
  it('traduz o campo do dominio para PascalCase', () => {
    expect(paraSortApi('nome', 'asc')).toBe('FirstName')
  })

  it('prefixa hifen na ordem descendente', () => {
    expect(paraSortApi('nome', 'desc')).toBe('-FirstName')
  })

  it('traduz o sobrenome', () => {
    expect(paraSortApi('sobrenome', 'desc')).toBe('-LastName')
  })
})
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
npx vitest run src/features/filtrar-pessoas/ordenacaoApi.test.ts
```

Esperado: os tres casos falham por modulo ausente.

- [x] **Step 3: Implementar**

O `ordenacaoApi.ts` mapeia campo do dominio para propriedade da API. O `useFiltroPessoas.ts`
guarda o estado do filtro na URL.

- [x] **Step 4: Executar e confirmar que passa**

```bash
npx vitest run src/features/filtrar-pessoas && npm run lint
```

Esperado: os testes passam e o lint sai com codigo 0.

- [x] **Step 5: Commitar**

```bash
git add src/features/filtrar-pessoas
git commit -m "feat: escreve a feature filtrar-pessoas"
```

---

### Task 9: Escrever a pagina de pessoas

**Papel:** escrita
**Verificação:** `cd fotus-default-web && npx vitest run src/pages/pessoas`

**Fontes:**
- `../csc-importacao-web-react/src/pages/projetos/` — o molde inteiro da pagina
- `../csc-importacao-web-react/src/teste/servidor.ts` — a simulacao de rede
- `../csc-importacao-web-react/src/app/rotas/Rotas.tsx` — onde a rota entra

**Files:**
- Create: `src/pages/pessoas/PaginaPessoas.tsx`, `colunas.tsx`, `PaginaPessoas.module.css`, `index.ts`
- Test: `src/pages/pessoas/PaginaPessoas.test.tsx`
- Modify: `src/app/rotas/Rotas.tsx`, `src/app/shell/BarraLateral.tsx`, `src/teste/servidor.ts`

Cumpre RF-07.

> Correcao, 2026-08-22: o rascunho do teste usava `montarComProvedores` de `@/teste/preparo`.
> Esse helper nao existe. O `preparo.ts` traz so os ganchos do MSW e o polyfill de ponteiro.
> Vale o padrao do molde: `render` com `QueryClientProvider` e `MemoryRouter`.
>
> O rascunho tambem provava a paginacao com total de 2, e a pagina mostra 25 por vez. O botao
> ficava desabilitado, e o teste passava sem exercitar o `X-Total-Count`. O total virou 26.

**Interfaces:**
- Consumes: `usePessoas` da Task 7 e `useFiltroPessoas` da Task 8.
- Produces: a rota `/pessoas`.

- [x] **Step 1: Escrever o teste que falha**

O teste monta a pagina com o MSW. Ele cobre tres casos: a lista aparece, a pagina avanca,
e o `204` vira estado vazio.

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { servidor } from '@/teste/servidor'
import { montarComProvedores } from '@/teste/preparo'
import { PaginaPessoas } from './PaginaPessoas'

describe('pagina de pessoas', () => {
  it('lista o que a API devolve', async () => {
    render(montarComProvedores(<PaginaPessoas />))
    expect(await screen.findByText('Ana Souza')).toBeInTheDocument()
  })

  it('mostra estado vazio quando a API devolve 204', async () => {
    servidor.use(
      http.get('*/api/v1/person-samples', () => new HttpResponse(null, { status: 204 })),
    )
    render(montarComProvedores(<PaginaPessoas />))
    expect(await screen.findByText(/nenhuma pessoa/i)).toBeInTheDocument()
  })

  it('avanca de pagina', async () => {
    render(montarComProvedores(<PaginaPessoas />))
    await screen.findByText('Ana Souza')
    await userEvent.click(screen.getByRole('button', { name: /proxima/i }))
    expect(await screen.findByText('Bia Lima')).toBeInTheDocument()
  })
})
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
npx vitest run src/pages/pessoas
```

Esperado: os tres casos falham por modulo ausente.

- [x] **Step 3: Implementar**

A pagina monta tabela, paginacao e filtro num fluxo. O `servidor.ts` ganha o handler de
`person-samples`, com o `X-Total-Count` no cabecalho. A rota `/pessoas` entra no
`Rotas.tsx` e no menu lateral.

- [x] **Step 4: Executar e confirmar que passa**

```bash
npm test && npm run typecheck && npm run lint
```

Esperado: os tres comandos saem com codigo 0.

- [x] **Step 5: Commitar**

```bash
git add src/pages/pessoas src/app src/teste
git commit -m "feat: escreve a pagina de pessoas"
```

---

### Task 10: Ajustar o fluxo ponta a ponta

**Papel:** escrita
**Verificação:** `cd fotus-default-web && npm run build && npm run e2e`

**Fontes:**
- `../csc-importacao-web-react/e2e/entrar-e-listar.spec.ts` — o molde do fluxo
- `../csc-importacao-web-react/e2e/simulacao.ts` — os handlers do Playwright
- `../csc-importacao-web-react/e2e/camadas.spec.ts` — a fronteira que permanece

**Files:**
- Modify: `e2e/entrar-e-listar.spec.ts`, `e2e/simulacao.ts`

Cumpre RF-07.

> Nota de execucao, 2026-08-22: o `camadas.spec.ts` estava vermelho por divida da Task 2.
> Aquela task trocou os rotulos do dialogo de exemplo na pagina de design system. O spec
> continuou buscando os rotulos antigos. Corrigido em commit proprio.

**Interfaces:**
- Consumes: a rota `/pessoas` da Task 9.
- Produces: os tres specs verdes.

- [x] **Step 1: Apontar o spec para a rota de pessoas**

O fluxo entra pelo login, chega em `/pessoas`, confirma a lista, pagina e filtra. A
simulacao devolve `TokenDto` no login e `X-Total-Count` na listagem.

- [x] **Step 2: Gerar o artefato**

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
npm run build
```

Esperado: o `dist/` e gerado. O comando sai com codigo 0.

- [x] **Step 3: Executar os tres specs**

```bash
npm run e2e
```

Esperado: `3 passed`.

- [x] **Step 4: Commitar**

```bash
git add e2e
git commit -m "test: aponta o fluxo ponta a ponta para pessoas"
```

---

### Task 11: Escrever o script de geracao e a documentacao

**Papel:** escrita
**Verificação:** `cd fotus-default-web && pwsh -NoProfile -Command "& { . ./New-Project.ps1 -WhatIf } " ; test -f README.md && test -f CLAUDE.md && test -f CONTRIBUTING.md`

**Fontes:**
- `../../fotus-default-api/New-Project.ps1` — o ritual a espelhar
- `../csc-importacao-web-react/README.md` — a estrutura a reaproveitar
- `../csc-importacao-web-react/CLAUDE.md` — a estrutura a reaproveitar

**Files:**
- Create: `New-Project.ps1`
- Modify: `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `package.json`, `.env.example`, `index.html`

Cumpre RF-10 e RF-11.

**Interfaces:**
- Consumes: a arvore da Task 10.
- Produces: `New-Project.ps1 -Name <nome> -Titulo <titulo> -OutputPath <caminho>`.

- [x] **Step 1: Ler o script do back-end**

Leia o `New-Project.ps1` do `fotus-default-api` inteiro. O script do front espelha a
estrutura dele:

- parametro obrigatorio
- recusa de destino existente
- substituicao de marcador
- limpeza
- impressao dos proximos passos

- [x] **Step 2: Plantar os dois marcadores**

O `fotus-default-web` entra no `package.json`, no `package-lock.json`, no `.env.example`
e no README. O `Fotus Default` entra no `index.html`, no `Marca.tsx` e no cabecalho do
README.

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
grep -rl "fotus-default-web" package.json package-lock.json .env.example README.md
grep -rl "Fotus Default" index.html src/shared/ui/marca README.md
```

Esperado: cada comando lista os arquivos correspondentes.

- [x] **Step 3: Escrever o script**

O script copia, substitui os dois marcadores, e remove `.git`, `node_modules`, `dist`,
`coverage`, `.env.local` e a si mesmo.

- [x] **Step 4: Neutralizar a citacao de proveniencia**

As 46 citacoes do tipo `Porta Button de importacao-mock/...` sao rastro legitimo, e o
criterio de aceite as permite. Mas o vocabulario e do dominio que saiu.

Troque `importacao-mock` por `prototipo-de-origem` e `csc-importacao-prototipo` por
`prototipo-de-origem` em todo o `src/`. O rastro permanece; o vocabulario sai.

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
grep -rl "importacao-mock\|csc-importacao-prototipo" src | while read f; do
  sed -i 's/csc-importacao-prototipo/prototipo-de-origem/g; s/importacao-mock/prototipo-de-origem/g' "$f"
done
grep -rc "prototipo-de-origem" src | wc -l
```

Esperado: nenhuma ocorrencia de `importacao-mock` sobra.

- [x] **Step 5: Escrever a documentacao**

O README traz o ritual de geracao e a lista dos caminhos a remover quando a primeira tela
real nascer. O CLAUDE.md traz o contrato exato que o back-end precisa implementar, e as
duas lacunas declaradas.

- [x] **Step 5: Confirmar a prosa**

```bash
python ~/.claude/skills/portugues-tecnico/scripts/check_docs.py README.md CLAUDE.md CONTRIBUTING.md
```

Esperado: codigo 0.

- [x] **Step 7: Commitar**

```bash
git add New-Project.ps1 README.md CLAUDE.md CONTRIBUTING.md package.json .env.example index.html
git commit -m "feat: escreve o script de geracao e a documentacao"
```

---

### Task 12: Provar o projeto gerado

**Papel:** analise
**Verificação:** `cd fotus-default-web && pwsh -NoProfile -File ./New-Project.ps1 -Name acme-financeiro-web -Titulo "Acme Financeiro" -OutputPath "$TEMP/acme-financeiro-web" && cd "$TEMP/acme-financeiro-web" && npm ci && npm run lint && npm run typecheck && npm test && npm run build`

**Fontes:**
- `nenhuma` — a task exercita o que as tasks anteriores produziram

**Files:**
- Modify: `New-Project.ps1` — so quando a bateria acusar defeito

Cumpre os criterios de aceite do projeto gerado.

> Achado da execucao, 2026-08-22: esta task encontrou o defeito que justifica a sua existencia.
> O boilerplate estava verde nas sete verificacoes, e o projeto gerado falhava em 21 arquivos
> de teste.
>
> A causa: o `[System.Text.Encoding]::UTF8` do .NET emite BOM. Os quatro arquivos reescritos
> pelo script saiam com BOM.
>
> O PostCSS le a propria configuracao do `package.json` com `JSON.parse`. O BOM quebra o parse.
> O erro aparece em toda suite que importa CSS.
>
> O sintoma nao apontava para a causa: 21 suites vermelhas, nenhuma delas de CSS, com
> `Unexpected token`. Corrigido com `New-Object System.Text.UTF8Encoding($false)`.

**Interfaces:**
- Consumes: o `New-Project.ps1` da Task 11.
- Produces: o veredito do par.

- [x] **Step 1: Executar a bateria inteira no boilerplate**

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
npm ci && npm run lint && npm run typecheck && npm test && npm run api:check && npm run build && npm run e2e
```

Esperado: todos os comandos saem com codigo 0.

- [x] **Step 2: Gerar um projeto para destino temporario**

```powershell
$destino = Join-Path $env:TEMP 'acme-financeiro-web'
Remove-Item -Recurse -Force $destino -ErrorAction SilentlyContinue
.\New-Project.ps1 -Name acme-financeiro-web -Titulo "Acme Financeiro" -OutputPath $destino
```

Esperado: o script imprime os proximos passos.

- [x] **Step 3: Confirmar que o script recusa destino existente**

```powershell
.\New-Project.ps1 -Name acme-financeiro-web -Titulo "Acme Financeiro" -OutputPath $destino
```

Esperado: o script recusa e sai com codigo diferente de 0.

- [x] **Step 4: Confirmar a limpeza e a substituicao no destino**

```bash
cd "$TEMP/acme-financeiro-web"
test ! -d .git && test ! -d node_modules && test ! -f New-Project.ps1
grep -rn "fotus-default-web\|Fotus Default" . --exclude-dir=node_modules || echo "limpo"
grep -n "acme-financeiro-web" package.json && grep -n "Acme Financeiro" index.html
```

Esperado: `limpo`, e o nome e o titulo nos dois arquivos.

- [x] **Step 5: Executar a bateria inteira no destino**

```bash
cd "$TEMP/acme-financeiro-web"
npm ci && npm run lint && npm run typecheck && npm test && npm run build && npm run e2e
```

Esperado: todos os comandos saem com codigo 0.

- [x] **Step 6: Commitar**

```bash
cd /c/Users/joao.saraiva/Documents/DEV/boilerplate/fotus-default-web
git add -A
git commit -m "chore: prova o projeto gerado ponta a ponta"
```

---

## Self-Review

- [x] Todo `### Task N` usa a palavra inglesa `Task`.
- [x] Toda task tem `Papel`: `busca`, `escrita` ou `analise`.
- [x] Toda task tem `Verificação` com um comando.
- [x] O comando de `Verificação` executa a partir da raiz do repositorio.
- [x] Toda task tem `Fontes`, com caminho ou com a palavra `nenhuma`.
- [x] Todo caminho de `Fontes` existe no disco.
- [x] Todo passo tem comando e resultado esperado.
- [x] Todo bloco de teste esta inteiro, sem reticencia.
- [x] Todo bloco de codigo usa cerca, nunca indentacao de quatro espacos.
- [x] Nenhuma task depende de arquivo que nenhuma task anterior criou.
