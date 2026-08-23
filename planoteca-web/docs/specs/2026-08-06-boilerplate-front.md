<!-- gerado de docs/specs/2026-08-06-boilerplate-front.html
     sha256 da fonte: df6f0cef5cbad0b9
     em: 2026-08-22T00:34
     NAO ESCREVA NESTE ARQUIVO. Altere o HTML e regenere. -->

# Boilerplate de front-end fotus-default-web — contrato de maquina

## Objetivo

O repositorio `csc-importacao-web-react` vira `fotus-default-web`: um boilerplate sem
dominio, com fatia de exemplo contra `/api/v1/person-samples` e script de geracao.

## Restricoes globais

- O alvo e `DEV/boilerplate/fotus-default-web`. Ele nasce como git local, sem remote.
- `DEV/boilerplate/csc-importacao-web-react` e somente leitura. Nenhuma task escreve nele.
- `DEV/fotus-default-api` e somente leitura. O front se adapta ao contrato dele.
- Nenhuma dependencia nova entra no `package.json`.
- A ordem das camadas e `app -> pages -> features -> entities -> shared`. O `eslint.config.js`
  impoe essa ordem e nao e alterado.
- Cor literal fora de `tokens.css` quebra o `verifica-tokens.mjs`. Use token.
- O heading de task do plano usa a palavra inglesa `Task`.
- Os testes rodam sem rede. O MSW simula a API.
- A paleta continua azul e dourado.
- O tema tem duas variantes: claro e escuro.

## Requisitos funcionais

### RF-01 — REPOSITORIO NOVO

O `fotus-default-web` nasce como copia do `csc-importacao-web-react`, sem `.git`,
sem `node_modules`, sem `dist`, sem `coverage` e sem `.env.local`. O `docs/` de origem
nao entra. O `docs/specs` e o `docs/plans` do alvo permanecem.

O `git init` roda no alvo. Nenhum remote e configurado.

### RF-02 — REMOCAO DO DOMINIO

Estes caminhos saem inteiros:

| Caminho | Motivo |
|---|---|
| `src/entities/projeto/` | dominio de importacao |
| `src/entities/empresa/` | dimensao de empresa |
| `src/features/filtrar-projetos/` | dominio de importacao |
| `src/pages/projetos/` | dominio de importacao |
| `src/app/shell/empresas.ts` | dimensao de empresa |
| `src/app/providers/EscopoEmpresaProvider.tsx` | dimensao de empresa |
| `contracts/openapi-v1.json` | despejo de 12.454 linhas da API real |
| `src/shared/api/schema.d.ts` | gerado do contrato que sai; sem ele, fica orfao |

Saem tambem o seletor de empresa da barra superior e os icones `solar` e `textil`.

Nenhuma ocorrencia de `importacao`, `projeto`, `empresa`, `sankhya`, `CODEMP` ou
`Litoral` sobra fora de comentario historico justificado.

### RF-03 — FUNDACAO INTACTA

Estes blocos passam sem alteracao de conteudo:

| Bloco | Conteudo |
|---|---|
| `src/shared/ui/` | 15 componentes com teste |
| `src/shared/lib/` | `cn`, `data`, `dinheiro` |
| `src/shared/config/` | ambiente que lanca erro quando falta `VITE_URL_API` |
| `src/app/estilos/base.css` | reset e base |
| `src/app/estilos/espaco.css` | escala de espaco |
| `src/app/estilos/tipografia.css` | escala tipografica |
| `scripts/` | `api-sync.mjs` e `verifica-tokens.mjs` |
| `eslint.config.js` | ordem das camadas e ponto de entrada de fatia |
| `tsconfig*.json` | os tres arquivos |
| `e2e/camadas.spec.ts` | fronteira entre camadas |
| `e2e/producao.spec.ts` | artefato de producao |

O `src/shared/api/cliente.ts` e alterado em um ponto: o comentario que cita o middleware do
Sankhya. O comportamento permanece.

### RF-03B — PAGINA DE DESIGN SYSTEM

A pagina `/design-system` continua visivel so em desenvolvimento. A estrutura dela e os 15
componentes permanecem.

O dado de exemplo sai. As quatro grades de cor por empresa viram duas, uma por tema. A prosa
de amostra perde o vocabulario de importacao.

O catalogo de icone perde `solar`, `textil` e `projeto`.

### RF-04 — TEMA DE DUAS VARIANTES

O `src/app/estilos/tokens.css` perde os blocos `[data-empresa]`. Restam duas variantes:
claro e escuro. Os valores de azul e dourado permanecem.

O `TemaProvider` deixa de ler a dimensao de empresa.

### RF-05 — CONTRATO DE AUTENTICACAO

O `POST /api/v1/auth/login` devolve `TokenDto`:

```json
{
  "access_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "string",
  "id_token": "string"
}
```

O `access_token` vai no cabecalho `Authorization`. O `expires_in` define a expiracao da
sessao, em segundos a partir do recebimento.

O `deposito.ts` perde a decodificacao da claim `exp` do JWT. Ele passa a guardar o instante
de expiracao calculado do `expires_in`.

O `GET /api/v1/auth/userinfo` devolve `UserInfoDto`. O campo `groupMembership` alimenta o
menu e a guarda de rota.

### RF-06 — PERMISSAO POR GRUPO

A matriz de quatro flags do Sankhya sai. O `permissao.ts` passa a receber a lista de
`groupMembership` e a responder se um grupo consta nela.

Permissao aqui desenha interface: ela esconde o que nao cabe. Ela nao autoriza. A
autorizacao real e do servidor, por operacao, e cobre o `GET`.

### RF-07 — FATIA DE EXEMPLO PESSOA

A fatia nasce contra `/api/v1/person-samples`, no molde da fatia `projeto` que sai.

| Camada | Arquivo | Papel |
|---|---|---|
| entities | `pessoa/modelo.ts` | o tipo do dominio |
| entities | `pessoa/mapeador.ts` | converte o DTO gerado para o dominio |
| entities | `pessoa/api.ts` | recebe o `Cliente` por parametro e devolve dominio |
| entities | `pessoa/usePessoas.ts` | a consulta do TanStack Query |
| features | `filtrar-pessoas/` | estado do filtro na URL e traducao da ordenacao |
| pages | `pessoas/` | monta tabela, paginacao e filtro num fluxo |

O `mapeador.ts` e o unico arquivo da fatia que importa `schema.d.ts`.

O `PersonSampleDto` tem sete campos. O JSON sai em camelCase, e o enum sai como texto:

| Campo | Tipo | Observacao |
|---|---|---|
| `id` | `string` | e um `Guid`, nao um inteiro |
| `firstName` | `string` | obrigatorio |
| `lastName` | `string` | pode vir ausente |
| `dateBirth` | `string` | data no formato do conversor da API |
| `type` | `'MALE' \| 'FEMALE'` | sai como texto, nao como numero |
| `active` | `boolean` | obrigatorio |
| `age` | `number` | derivado no servidor |

O servidor omite campo nulo, entao o mapeador trata ausencia.

O controller aceita `page`, `per_page`, `sort` e `filter`. O total vem no cabecalho
`X-Total-Count`.

### RF-08 — DUAS ARMADILHAS DO CONTROLLER

O `GET` devolve `204` sem corpo quando o total e zero. Ele nao devolve `200` com lista
vazia. O `cliente.listar` ja absorve esse caso.

O `sort` pede o nome da propriedade em PascalCase, com prefixo `-` para descendente.
Exemplo: `-FirstName`. O `ordenacaoApi.ts` faz essa traducao; o mapa de campos e alterado.

### RF-09 — CONTRATO ESCRITO A MAO

O `contracts/openapi-v1.json` nasce escrito a mao, com oito rotas: seis de
`person-samples`, incluindo o `GET /All`, e duas de autenticacao. Cada rota deriva do
`PersonSampleController.cs` lido, campo a campo.

Um cabecalho no arquivo manda rodar `npm run api:sync` contra a API viva.

O `npm run api:check` confirma que o `schema.d.ts` bate com o contrato.

### RF-10 — SCRIPT DE GERACAO

O `New-Project.ps1` do alvo segue o ritual do `New-Project.ps1` do `fotus-default-api`.

Dois marcadores literais:

| Marcador | Onde aparece | Vira |
|---|---|---|
| `fotus-default-web` | `package.json`, `package-lock.json`, `.env.example`, README | o valor de `-Name` |
| `Fotus Default` | `index.html`, `Marca.tsx`, cabecalho do README | o valor de `-Titulo` |

Forma de uso:

```powershell
.\New-Project.ps1 -Name acme-financeiro-web `
                  -Titulo "Acme Financeiro" `
                  -OutputPath C:\DEV\acme-financeiro-web
```

O script copia, substitui os dois marcadores, e remove `.git`, `node_modules`, `dist`,
`coverage`, `.env.local` e a si mesmo. Depois imprime os proximos passos.

O script recusa destino que ja existe.

A fatia de exemplo fica no projeto gerado. O README traz a lista dos caminhos a remover.

### RF-11 — DOCUMENTACAO

O `README.md`, o `CLAUDE.md` e o `CONTRIBUTING.md` nascem sem dominio, com o ritual de
geracao e com as lacunas declaradas.

## Defeitos conhecidos do prototipo

Nao existe prototipo. O trabalho parte de codigo em producao.

## Lacunas declaradas

| Lacuna | Quem fecha |
|---|---|
| O `fotus-default-api` nao tem `POST /api/v1/auth/login` nem `GET /api/v1/auth/userinfo` | o back-end, num trabalho separado. O contrato exato fica no `CLAUDE.md` |
| O `PersonSampleController` tem `[Authorize]` comentado | o back-end. O front manda o cabecalho e a API ignora |

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

## Criterios de aceite

No boilerplate:

- `npm ci` termina com codigo 0.
- `npm run lint` sai com codigo 0, incluindo o verificador de tokens.
- `npm run typecheck` sai com codigo 0 nos tres tsconfig.
- `npm test` sai com codigo 0, e a fatia `pessoa` tem teste proprio.
- `npm run api:check` confirma que o `schema.d.ts` bate com o contrato.
- `npm run build` gera o artefato.
- `npm run e2e` passa nos tres specs.
- `npm run dev` sobe, o login funciona pela simulacao, e a tela de pessoas lista, pagina
  e filtra.
- A varredura por `importacao`, `projeto`, `CODEMP`, `sankhya` e `Litoral` nao acha
  ocorrencia fora de comentario historico justificado.

No projeto gerado:

- O script cria o destino e recusa destino que ja existe.
- O destino nao tem `.git`, `node_modules` nem `New-Project.ps1`.
- O `package.json` e o `index.html` carregam o nome e o titulo passados.
- A varredura por `fotus-default-web` e por `Fotus Default` nao acha ocorrencia no destino.
- A bateria inteira do criterio anterior sai com codigo 0 dentro do destino.
