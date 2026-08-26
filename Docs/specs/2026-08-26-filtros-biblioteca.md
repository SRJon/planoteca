<!-- gerado de docs/specs/2026-08-26-filtros-biblioteca.html
     sha256 da fonte: a7805a7e7dee9bb2
     em: 2026-08-26T09:43
     NAO ESCREVA NESTE ARQUIVO. Altere o HTML e regenere. -->

# Filtros da Biblioteca em coluna lateral — contrato de máquina

## Objetivo

Trocar a grade de chips da Biblioteca por uma coluna de filtro no desktop e
uma gaveta no celular. Cada item mostra o número de planos.

## Restrições globais

- O alvo são as pastas `planoteca-api` e `planoteca-web`. Nada fora delas se altera.
- Nada da Biblioteca fica atrás de `RotaProtegida` nem de `[Authorize]`. O endpoint de facetas é público.
- `useFiltroPlanos.ts` e seus testes não se alteram. A URL continua a fonte da verdade do filtro.
- O contrato de `GET /api/v1/lesson-plans` não se altera.
- Sem dependência nova no front. A gaveta reusa o Radix Dialog de `components/ui/dialog.tsx`.
- Cor literal em componente reprova no `npm run lint`. Use token. O bloco de sigla usa `classeCorComponente`.
- Fixture nova entra em `src/teste/servidor.ts` e em `e2e/simulacao.ts`, nos dois.
- Teste da API usa xUnit, NSubstitute e FluentAssertions. Teste de repositório roda contra PostgreSQL real e pula sem banco.
- Teste do front usa Vitest, Testing Library, MSW e Playwright.
- Arquivo novo de tela passa por `python ~/.claude/skills/sem-plastico/scripts/detectar.py`.
- Commit segue Conventional Commits, com escopo pelo domínio.

## Requisitos funcionais

### RF-01 — Endpoint de facetas

`GET /api/v1/lesson-plans/facets` responde 200 sem token. Aceita a mesma
querystring da listagem (`busca`, `componenteId[]`, `serieId[]`,
`metodologiaId[]`, `duracaoMinima`, `duracaoMaxima`). Ignora `pagina` e
`tamanhoPagina`. Conta só plano publicado.

```json
{
  "series":       [ { "id": "guid", "total": 12 } ],
  "componentes":  [ { "id": "guid", "total": 9 } ],
  "metodologias": [ { "id": "guid", "total": 5 } ]
}
```

Só ids com pelo menos um plano entram na resposta. Id ausente vale zero.
Quando nada casa, responde `200` com as três listas vazias, não `204`.

### RF-02 — Regra da contagem

A contagem de um grupo ignora a seleção do próprio grupo. Ela aplica a
seleção dos outros dois grupos, a busca e a duração.

| Seleção atual | Contagem de "História" (componente) | Contagem de "7º" (série) |
|---|---|---|
| nenhuma | planos publicados de História | planos publicados do 7º |
| 9º + Matemática | planos do 9º com História | planos de Matemática no 7º |
| busca "juros" | planos de História que casam "juros" | planos do 7º que casam "juros" |

### RF-03 — Repositório

`IPlanoRepository.ContarFacetasAsync(FiltroPlano)` devolve três listas de
`(Guid Id, int Total)`. A implementação faz três consultas LINQ com `GroupBy`
sobre `plano_serie`, `plano_componente` e `plano_metodologia`. Cada consulta
aplica o filtro base menos o próprio grupo.

### RF-04 — Cliente e cache no front

`obterFacetas(cliente, filtro)` chama `GET /lesson-plans/facets` com o filtro
sem `pagina` e `tamanhoPagina`. `useFacetas(cliente, filtro)` usa TanStack
Query com chave `['facetas', filtro-sem-pagina]` e `placeholderData` da
consulta anterior.

### RF-05 — Layout de duas colunas

A partir de `lg` (1024px), `PaginaBiblioteca` é um grid de `272px` mais
`minmax(0,1fr)`. A esquerda é um `aside` com borda de 2px. A direita tem
pílulas de seleção, faixa de contagem e lista de fichas. A lista tem duas
colunas até `xl` e três a partir daí. A faixa lê o total da listagem, não
das facetas.

### RF-06 — Coluna de filtro

- Busca: o `CampoBusca` atual, separado por traço.
- Série: régua de células iguais com o `Chip` atual. `button` com `aria-pressed`, rótulo acessível `rotuloCompleto`.
- Componente e metodologia: `details` aberto por padrão, `summary` com nome do grupo e total de itens. Cada item é um `label` com `input type="checkbox"`. O componente leva o bloco de sigla colorido. A contagem fica à direita, em mono.
- A caixa é o `CaixaMarcar` novo em `components/ui/`: o lint proíbe `input` cru fora dali.
- Item com contagem zero fica visível e clicável.
- Ordem dos itens é a ordem da API.

### RF-07 — Limite de 8 e "mais N"

Cada grupo mostra os 8 primeiros e um botão "mais N". Item marcado aparece
sempre, mesmo fora dos 8. O estado do "mais" é local ao componente.

### RF-08 — Pílulas de seleção

Acima da lista, uma pílula por item marcado, com ✕ que remove só aquele
item, e um botão "Limpar filtros". A série mostra `rotuloCompleto`.

### RF-09 — Gaveta no celular

Abaixo de `lg`, a coluna some. Um botão "Filtros" de largura total mostra o
número de itens ativos. Ele abre um `DialogContent` em variante de gaveta,
de altura total, que sobe de baixo. O conteúdo é o painel do desktop sem a
busca. A busca fica na página. Rodapé com "Limpar" e "Ver N planos"; os dois
fecham. Escape e ✕ fecham. Marcar aplica na hora. As pílulas ficam visíveis
com a gaveta fechada.

### RF-10 — Simulação de rede

`src/teste/servidor.ts` e `e2e/simulacao.ts` ganham handler de
`GET */api/v1/lesson-plans/facets` que calcula a contagem a partir das
fixtures pela regra do RF-02.

### RF-11 — e2e

`e2e/biblioteca.spec.ts` acha componente e metodologia por
`getByRole('checkbox')` e série por `getByRole('button')`. Ganha um teste em
390px. Nele, "Filtros" abre a gaveta e o teste marca "Matemática". "Ver N
planos" fecha a gaveta. A pílula "Matemática" aparece na página.

### RF-12 — Remoção do componente antigo

`FiltrosPlanos.tsx` sai quando `PainelFiltros` entrar. `index.ts` exporta o novo.

## Defeitos conhecidos do protótipo

- O demonstrativo usa cores de componente que não existem como token (`FS`, `CO`). A implementação usa só `classeCorComponente` e os quatro tokens de `entities/vocabulario/modelo.ts`.
- As contagens do demonstrativo são inventadas. Vêm da API.
- O demonstrativo mostra "ordenados pelos mais recentes" na faixa. É texto fixo, sem controle de ordenação.

## Fontes

| Caminho | O que decide |
|---|---|
| `design/2026-08-26-filtros-biblioteca-opcoes.html` | o desenho aprovado da opção B, desktop e celular |
| `design/tokens.css` | paleta, traço, alvo de 44px, fontes |
| `design/DirecaoB.dc.html` | a régua de série e o bloco de sigla como assinatura |
| `docs/specs/2026-08-24-gestao-vocabulario.md` | o vocabulário vem do banco; a rota pública não se altera |
| `planoteca-api/src/SaraivaTech.Planoteca.Api/Controllers/LessonPlansController.cs` | a rota pública, `FiltroPlanoRequest` e a razão de não ter `[Authorize]` |
| `planoteca-api/src/SaraivaTech.Planoteca.Domain/Repositories/Interfaces/IPlanoRepository.cs` | `FiltroPlano` e a assinatura de `BuscarAsync` |
| `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Repositories/PlanoRepository.cs` | como o filtro composto se aplica em LINQ; o `Any()` nas junções |
| `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Mappings/AcervoMap.cs` | as tabelas `plano_componente`, `plano_serie` e `plano_metodologia` |
| `planoteca-api/src/SaraivaTech.Planoteca.Application.Core/Services/PlanoAppService.cs` | forma do AppService e do mapeamento para DTO |
| `planoteca-api/src/SaraivaTech.Planoteca.Application/Dto/VocabularioDto.cs` | forma de um DTO de leitura |
| `planoteca-api/src/SaraivaTech.Planoteca.Infra.CrossCutting/IoC/DependencyInjectionBootStrapper.cs` | onde o registro de DI mora, caso surja interface nova |
| `planoteca-api/tests/SaraivaTech.Planoteca.Test/Integracao/PlanoRepositorioTest.cs` | forma do teste de repositório contra PostgreSQL real e o skip sem banco |
| `planoteca-api/tests/SaraivaTech.Planoteca.Test/Integracao/BaseBancoReal.cs` | conexão, limpeza por prefixo `[teste-integracao]` |
| `planoteca-api/tests/SaraivaTech.Planoteca.Test/Application/PlanoRemocaoTest.cs` | forma do teste de AppService com NSubstitute |
| `planoteca-web/src/pages/biblioteca/PaginaBiblioteca.tsx` | o layout atual: header, filtros, lista, paginação |
| `planoteca-web/src/features/filtrar-planos/FiltrosPlanos.tsx` | o componente que sai; os comentários de acessibilidade que ficam |
| `planoteca-web/src/features/filtrar-planos/useFiltroPlanos.ts` | o contrato de seleção que a coluna consome, sem alteração |
| `planoteca-web/src/entities/plano/api.ts` | `listarPlanos`, `paraParametros` e a forma da chamada tipada |
| `planoteca-web/src/pages/biblioteca/FichaPlano.tsx` | o bloco de sigla com `classeCorComponente` |
| `planoteca-web/src/entities/vocabulario/modelo.ts` | tipos de `Vocabulario`, `classeCorComponente` e os quatro tokens de cor |
| `planoteca-web/src/entities/vocabulario/useVocabulario.ts` | chave de cache e `staleTime` |
| `planoteca-web/src/components/ui/dialog.tsx` | o Radix Dialog que vira gaveta |
| `planoteca-web/src/components/ui/chip.tsx` | o chip da régua de série |
| `planoteca-web/src/shared/api/cliente.ts` | `obter` e como array vira querystring repetida |
| `planoteca-web/src/teste/servidor.ts` | handlers MSW de `lesson-plans` e `vocabulary` |
| `planoteca-web/e2e/simulacao.ts` | o roteador do Playwright e a lógica de filtro da simulação |
| `planoteca-web/e2e/biblioteca.spec.ts` | os três testes e os seletores que se alteram |
| `planoteca-web/src/app/shell/LayoutPublico.tsx` | largura de 1180px e padding por breakpoint |
| `planoteca-web/scripts/verifica-tokens.mjs` | o que o lint reprova em classe e cor |
| `CLAUDE.md` | o portão antes de dizer "pronto" |

## Critérios de aceite

- `GET /api/v1/lesson-plans/facets` responde 200 sem token.
- Teste de repositório com seleção 9º + Matemática: a contagem de História conta planos do 9º com História.
- No mesmo teste, a contagem de 7º conta planos de Matemática no 7º.
- Teste de repositório: plano rascunho não entra em nenhuma contagem.
- Teste de unidade de `GrupoFiltro`: com 12 itens mostra 8 e "mais 4".
- No mesmo teste, item marcado na posição 11 aparece sem expandir.
- Teste de unidade de `SelecaoAtiva`: ✕ numa pílula chama o callback do grupo certo com o id certo.
- e2e "filtra por componente e pagina": marca a caixa "Matemática", a URL carrega `componente=`, recarrega e a caixa continua marcada.
- e2e "combina dois do mesmo grupo por OU e grupos por E" passa. Componente é caixa; série é botão.
- e2e novo em 390px: "Filtros" abre a gaveta, marca "Matemática", "Ver N planos" fecha, a pílula "Matemática" aparece na página.
- Teste de guarda "o acervo é público" continua verde.
- `npm run lint`, `npm run test`, `npm run build`, `npm run e2e` saem com código 0.
- `dotnet build` e `dotnet test` saem com código 0.
- `python ~/.claude/skills/sem-plastico/scripts/detectar.py` nos arquivos novos sai com código 0.
