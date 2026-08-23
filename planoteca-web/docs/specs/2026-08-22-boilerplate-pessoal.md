<!-- gerado de docs/specs/2026-08-22-boilerplate-pessoal.html
     sha256 da fonte: 4d5ec0169e850645
     em: 2026-08-22T12:54
     NAO ESCREVA NESTE ARQUIVO. Altere o HTML e regenere. -->

# Boilerplate pessoal — contrato de maquina

## Objetivo

Trocar a marca do cliente pela marca propria. A paleta vira ponto de troca declarado, que cada
projeto novo substitui.

## Restricoes globais

- O alvo e o repositorio `fotus-default-web`. Nada fora dele e alterado.
- O nome novo e `planoteca-web`. O titulo novo e `Planoteca`.
- As citacoes ao back-end `fotus-default-api` ficam. Elas sao proveniencia de contrato real.
- A paleta continua azul e dourado. Nenhum valor de cor e alterado.
- `src/shared/api/schema.d.ts` e gerado por `npm run api:sync`. Nao se altera a mao.
- Os documentos em `docs/` dos ciclos anteriores nao sao reescritos.
- A fundacao fica intacta: `src/entities/`, `src/shared/`, `src/components/ui/`.
- O git continua local. Nenhum comando publica o repositorio.
- Ferramentas na maquina: `npm`, `node`, `pwsh`, `git`, `python`.

## Requisitos funcionais

### RF-01 — MARCADOR DE GERACAO

Os dois literais que o `New-Project.ps1` busca passam a valer os nomes novos.

| Arquivo | Linha | De | Para |
|---|---|---|---|
| `package.json` | 2 | `fotus-default-web` | `planoteca-web` |
| `.env.example` | 1 | `fotus-default-web` | `planoteca-web` |
| `New-Project.ps1` | 31 | `fotus-default-web` | `planoteca-web` |
| `New-Project.ps1` | 33 | `Fotus Default` | `Planoteca` |
| `index.html` | 6 | `Fotus Default` | `Planoteca` |
| `src/app/shell/BarraLateral.tsx` | 50 | `Fotus Default` | `Planoteca` |
| `src/pages/entrar/PaginaEntrar.tsx` | 38, 51 | `Fotus Default` | `Planoteca` |
| `src/pages/design-system/PaginaDesignSystem.tsx` | 177 | `Fotus Default` | `Planoteca` |

O `package-lock.json` acompanha o `name` do `package.json`.

### RF-02 — CHAVE DE RUNTIME

A chave de armazenamento e o evento perdem o nome do cliente.

```ts
const CHAVE = 'app.sessao'
const EVENTO_SESSAO = 'app:sessao'
```

O `src/entities/sessao/deposito.test.ts` afirma a chave literal na linha 11 e no titulo do caso
da linha 43. Ele e alterado no mesmo commit.

### RF-03 — PALETA COMO PONTO DE TROCA

O `src/app/estilos/tema.css` ganha um bloco delimitado no topo. Ele diz tres coisas:

- onde a cor de marca mora, com o nome de cada valor;
- o que um projeto novo troca;
- o que um projeto novo nao troca, e por que.

O bloco tem marca de inicio e de fim, buscavel por texto. Nenhum valor de cor e alterado.

O comentario da linha 5 deixa de dizer que a paleta permanece. O da linha 102 deixa de citar o
cliente.

### RF-04 — MARCA

O `src/components/marca/Marca.tsx` desenha um simbolo geometrico, sem referencia a ramo nenhum.

A assinatura publica permanece:

```ts
Marca({ tamanho = 26, tom: 'cor' | 'solido' = 'solido', className })
```

O componente continua carregando o marcador de titulo que o `New-Project.ps1` substitui.

### RF-05 — RESIDUO

O que a troca de marcador nao alcanca:

| Arquivo | Linha | O que e alterado |
|---|---|---|
| `src/pages/design-system/tokensReferencia.ts` | 61-65 | `TOKENS_COR_FOTUS` vira `TOKENS_COR_MARCA`, e o comentario perde o cliente |
| `src/pages/design-system/PaginaDesignSystem.tsx` | 39, 118, 184, 193 | o import, o titulo do grupo e a prosa |
| `src/pages/design-system/PaginaDesignSystem.test.tsx` | 10, 100 | o import e o teste de paridade |
| `src/features/autenticar/api.test.ts` | 64, 92, 96 | `ana@fotus.com` vira `ana@exemplo.com` |
| `scripts/verifica-tokens.mjs` | 174 | o comentario perde o cliente |
| `src/app/providers/TemaProvider.tsx` | 63 | o comentario perde o cliente |
| `src/pages/entrar/PaginaEntrar.tsx` | 18 | o comentario perde o cliente |
| `contracts/openapi-v1.json` | 4 | o `title` vira `Planoteca API` |

### RF-06 — CITACAO QUE FICA

Estas ocorrencias ficam. Elas apontam para arquivo e linha de codigo que existe:

| Arquivo | O que cita |
|---|---|
| `src/entities/sessao/modelo.ts:4,31` | `TokenDto.cs` e `UserInfoDto.cs` |
| `src/entities/sessao/permissao.ts:33` | `UserInfoDto.cs` |
| `src/shared/api/schema.d.ts` | seis descricoes derivadas do C# |
| `contracts/openapi-v1.json` | as descricoes de `Fotus.Default.*` e a lacuna declarada |
| `contracts/README.md:6,15` | de onde o contrato veio |
| `CLAUDE.md` | o par de back-end e as duas lacunas dele |

O exemplo de filtro `LastName:=:Fotus` fica no `openapi-v1.json` e no `schema.d.ts`. O
`npm run api:sync` o sobrescreve contra a API viva, e alterar a mao quebraria o `api:check`.

### RF-07 — DOCUMENTO

O `README.md`, o `CLAUDE.md` e o `CONTRIBUTING.md` passam a citar o nome novo.

O `README.md` ganha o passo a passo de troca de paleta, apontando para o bloco do RF-03.

### RF-08 — PASTA

A pasta do repositorio passa a se chamar `planoteca-web`.

Depois do rename, nenhum arquivo dentro dela cita o caminho antigo.

## Fontes

| Caminho | O que decide |
|---|---|
| `New-Project.ps1` | os dois literais e as extensoes que ele processa |
| `src/entities/sessao/deposito.ts` | a chave e o evento de sessao |
| `src/entities/sessao/deposito.test.ts` | o teste que afirma a chave literal |
| `src/components/marca/Marca.tsx` | a assinatura a preservar, e o desenho a trocar |
| `src/app/estilos/tema.css` | onde o bloco de ponto de troca entra |
| `src/pages/design-system/tokensReferencia.ts` | o nome do grupo de tokens de marca |
| `src/pages/design-system/PaginaDesignSystem.tsx` | o consumo desse grupo |
| `src/pages/design-system/PaginaDesignSystem.test.tsx` | o teste de paridade dos tokens |
| `README.md` | a instrucao de geracao, e onde a de troca de paleta entra |
| `docs/specs/2026-08-22-boilerplate-pessoal.html` | a decisao por tras de cada requisito |

## Criterios de aceite

- `npm run lint` sai com codigo 0.
- `npm run typecheck` sai com codigo 0.
- `npm run test` sai com codigo 0.
- `npm run api:check` sai com codigo 0.
- `npm run build` sai com codigo 0.
- `npm run e2e` sai com codigo 0.
- `grep -rniI fotus` fora de `docs/`, `dist/` e `node_modules/` so acha as citacoes do RF-06.
- O `tema.css` tem o bloco delimitado do RF-03, buscavel por texto.
- A pasta do repositorio se chama `planoteca-web`.
- O projeto gerado pelo `New-Project.ps1` nao carrega BOM em arquivo nenhum.
- O projeto gerado nao tem ocorrencia de `planoteca-web` nem de `Planoteca`.
- A bateria inteira passa dentro do projeto gerado.
