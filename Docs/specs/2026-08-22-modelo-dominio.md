<!-- gerado de docs/specs/2026-08-22-modelo-dominio.html
     sha256 da fonte: d9b93428ea81c068
     em: 2026-08-22T14:55
     NAO ESCREVA NESTE ARQUIVO. Altere o HTML e regenere. -->

# Modelo de domínio da Planoteca — contrato de máquina

## Objetivo

Criar as entidades do acervo na API .NET e no front. O vocabulário de classificação vira tabela administrável, e a Biblioteca ganha endpoint público.

## Restrições globais

- O banco é PostgreSQL 16. O provider é `Npgsql.EntityFrameworkCore.PostgreSQL`, com `EFCore.NamingConventions` e `.UseSnakeCaseNamingConvention()`.
- A wiring do `DbContext` é duplicada em `Infra.CrossCutting/IoC/DependencyInjectionBootStrapper.cs` (runtime) e `Infra.Data/Context/DatabaseContextFactory.cs` (design-time). Alterar uma exige alterar a outra.
- Toda `DateTime` gravada é UTC. O Npgsql recusa `Kind != Utc` em coluna `timestamptz`, em tempo de execução. Não ligar `Npgsql.EnableLegacyTimestampBehavior`.
- SQL cru é dialeto PostgreSQL. Não usar colchete `[coluna]`. Usar `LIMIT`/`OFFSET`, `ILIKE`, `COALESCE`. Em `RETURNING`, dar alias entre aspas duplas para o Dapper mapear.
- Versão de pacote NuGet mora só em `Directory.Packages.props`.
- `Id` de entidade é `Guid` gerado no construtor de `Entity`, nunca pelo banco.
- Índice parcial, índice GIN e coluna gerada não saem do EF. Escrever com `migrationBuilder.Sql()`.
- No front, cor literal em componente é reprovada por `npm run lint`. A cor aponta para o tema.
- No front, a fronteira entre camadas é imposta por `eslint-plugin-boundaries`. `pages/` não importa `app/`.
- Ícone do Phosphor entra pelo caminho direto: `@phosphor-icons/react/dist/csr/Nome`.
- A Biblioteca é pública. Rota de listagem, de detalhe, de vocabulário e de post publicado não recebem `[Authorize]`, e `arquivo_url` é acessível sem token.
- Prosa de interface e de comentário em português, com acento.

## Requisitos funcionais

### RF-01 — ENTIDADES E MIGRATION

As sete entidades e as três tabelas de ligação existem no domínio, com mapeamento Fluent API. A migration aplica num PostgreSQL limpo.

Entidades: `Plano`, `EtapaPlano`, `Metodologia`, `Componente`, `Serie`, `Pessoa`, `Post`.
Ligações: `plano_componente`, `plano_serie`, `plano_metodologia`. Mais `bncc`.

### RF-02 — SEED DE METODOLOGIA

A migration semeia 41 linhas em `metodologia`, com a coluna `tipo` correta.

| tipo | quantidade |
|---|---|
| `metodologia` | 16 |
| `tecnica` | 13 |
| `ferramenta` | 12 |

Nomes literais do Guia de Metodologias Ativas:

```
metodologia: Sala de Aula Invertida | Rotação por Estações de Aprendizagem |
  Aprendizagem por Pares | Ensino Sob Medida | Aprendizagem Baseada em Equipes |
  Método POE | Aprendizagem Baseada em Problemas | Aprendizagem Baseada em Projetos |
  Gamificação | Estudo de Casos | Aprendizagem Baseada em Jogos | Storytelling |
  Design Thinking | Escape Room | Pesquisa | A Escrita Através do Currículo

tecnica: Simulações | Atividades Práticas | Diagrama de Ishikawa | Brainstorming |
  Ferramenta 5W e 2H | Técnica dos Chapéus | Painel Integrado |
  Mapa Conceitual e Mapa Mental | Visita Técnica | Infográfico | Canvas |
  Menu de Aprendizagem | Trilhas de Aprendizagem

ferramenta: Plickers | Google Forms | Socrative | Pixton | Quizziz | Screencast |
  Mentimenter | Kahoot | Slido | TBL Active | EDMODO | Classcraft
```

### RF-03 — SEED DE COMPONENTE E SÉRIE

A migration semeia `componente` com área, cor e sigla, e sete linhas em `serie` com `ordem` global sem repetição.

```
serie (ordem, etapa, nome, rotulo_completo, sigla)
  1, fundamental_anos_finais, 6º ano,   6º ano do Ensino Fundamental,   6º
  2, fundamental_anos_finais, 7º ano,   7º ano do Ensino Fundamental,   7º
  3, fundamental_anos_finais, 8º ano,   8º ano do Ensino Fundamental,   8º
  4, fundamental_anos_finais, 9º ano,   9º ano do Ensino Fundamental,   9º
  5, medio,                   1ª série, 1ª série do Ensino Médio,       1ªEM
  6, medio,                   2ª série, 2ª série do Ensino Médio,       2ªEM
  7, medio,                   3ª série, 3ª série do Ensino Médio,       3ªEM
```

`componente.cor` e `componente.sigla` são `NOT NULL`. A sigla tem duas letras.

### RF-04 — N METODOLOGIAS POR PLANO

Um plano aceita duas ou mais metodologias.

### RF-04a — N SÉRIES POR PLANO

Um plano aceita duas ou mais séries. A ficha as mostra ordenadas por `serie.ordem`.

### RF-04b — N COMPONENTES, UM PRINCIPAL

Um plano aceita dois ou mais componentes. O banco recusa um segundo `e_principal` no mesmo plano, por índice único parcial:

```sql
CREATE UNIQUE INDEX ix_plano_componente_principal_unico
    ON plano_componente (plano_id)
 WHERE e_principal;
```

### RF-05 — BNCC OPCIONAL

Um plano é catalogável sem nenhum código BNCC. `objetos_conhecimento` é `NOT NULL`.

### RF-06 — ETAPAS ORDENADAS

As etapas voltam ordenadas por `ordem`, e `(plano_id, ordem)` é único.

### RF-07 — LISTAGEM PÚBLICA

`GET /api/v1/lesson-plans` e `GET /api/v1/lesson-plans/{id}` respondem sem token e só devolvem `situacao = 'publicado'`.

### RF-08 — FILTRO COMBINADO

Filtro por componente, série, metodologia e duração funciona combinado. O total vem no cabeçalho `X-Total-Count`.

- Filtrar por `9º ano` acha o plano catalogado em 8º e 9º.
- Filtrar por um componente secundário acha a prática interdisciplinar.

### RF-09 — VOCABULÁRIO VEM DA API

O front consome o vocabulário de `GET /api/v1/vocabulary`, sem lista fechada em TypeScript. A ficha pinta a cor vinda do banco, com fallback neutro quando ausente.

### RF-10 — O ACERVO REAL CABE

Um plano de Química é catalogável de ponta a ponta e aparece na listagem pública. Ele tem série `2ª série` (turmas I01 e I02), modalidade integral, e duas metodologias: `Storytelling` e `Escape Room`.

### RF-11 — MODERAÇÃO DO POST

`post` nasce com `situacao = 'pendente'`. Devolver ou recusar exige `comentario_moderacao` preenchido.

### RF-12 — PORTÕES VERDES

`dotnet build`, `dotnet test`, `npm run lint`, `npm run test`, `npm run build` e `npm run e2e` saem com código 0.

## Esquema

```sql
serie
  id               uuid  not null primary key
  etapa            text  not null   -- 'fundamental_anos_finais' | 'medio'
  nome             text  not null
  rotulo_completo  text  not null
  sigla            text  not null
  ordem            int   not null
  ativa            bool  not null default true
  unique (etapa, nome)

componente
  id            uuid  not null primary key
  area          text  not null
  nome          text  not null
  sigla         text  not null   -- duas letras
  cor           text  not null   -- token ou hex
  ordem         int   not null
  ativo         bool  not null default true
  unique index on lower(nome)

metodologia
  id      uuid  not null primary key
  nome    text  not null
  tipo    text  not null   -- 'metodologia' | 'tecnica' | 'ferramenta'
  fonte   text  null       -- 'guia-ugb-2020' quando semeada
  ativa   bool  not null default true
  unique index on lower(nome)

plano
  id                          uuid        not null primary key
  titulo                      text        not null
  autoria                     text        not null
  objetos_conhecimento        text        not null
  modalidade                  text        null
  turma_origem                text        null
  objetivo                    text        not null
  expectativas_aprendizagem   text        not null
  recursos                    text        null
  duracao_aulas               int         null
  duracao_descricao           text        null
  arquivo_url                 text        not null
  links_extras                jsonb       null
  situacao                    text        not null   -- 'rascunho' | 'publicado'
  catalogado_por_id           uuid        null  → pessoa
  publicado_em                timestamptz null
  criado_em                   timestamptz not null default now()
  atualizado_em               timestamptz not null default now()

plano_componente
  plano_id       uuid not null → plano (on delete cascade)
  componente_id  uuid not null → componente
  e_principal    bool not null default false
  primary key (plano_id, componente_id)

plano_serie
  plano_id  uuid not null → plano (on delete cascade)
  serie_id  uuid not null → serie
  primary key (plano_id, serie_id)

plano_metodologia
  plano_id        uuid not null → plano (on delete cascade)
  metodologia_id  uuid not null → metodologia
  primary key (plano_id, metodologia_id)

etapa_plano
  id          uuid  not null primary key
  plano_id    uuid  not null → plano (on delete cascade)
  ordem       int   not null
  titulo      text  null
  descricao   text  not null
  unique (plano_id, ordem)

bncc
  id        uuid not null primary key
  plano_id  uuid not null → plano (on delete cascade)
  codigo    text not null
  unique (plano_id, codigo)

pessoa
  id          uuid        not null primary key
  google_sub  text        null unique
  email       text        not null unique
  nome        text        not null
  papel       text        not null   -- 'professor' | 'administrador'
  ativo       bool        not null default true
  criado_em   timestamptz not null default now()

post
  id                    uuid        not null primary key
  autor_id              uuid        not null → pessoa
  titulo                text        not null
  resumo                text        null
  corpo                 text        not null
  situacao              text        not null   -- 'pendente'|'publicado'|'devolvido'|'recusado'
  comentario_moderacao  text        null
  moderado_por_id       uuid        null → pessoa
  moderado_em           timestamptz null
  publicado_em          timestamptz null
  criado_em             timestamptz not null default now()
```

## Contrato REST

| Rota | Acesso | Observação |
|---|---|---|
| `GET /api/v1/lesson-plans` | anônimo | paginada. Filtros: componente, série, metodologia, duração, busca. Só publicados |
| `GET /api/v1/lesson-plans/{id}` | anônimo | traz etapas, metodologias, componentes, séries e BNCC embutidos |
| `GET /api/v1/vocabulary` | anônimo | componentes, séries e metodologias numa chamada |
| `GET /api/v1/posts` | anônimo | só publicados |
| `POST /api/v1/lesson-plans` | administrador | catalogação |
| `POST /api/v1/lesson-plans/{id}/file` | administrador | upload do PDF |
| `POST /api/v1/posts` | professor | nasce `pendente` |
| `POST /api/v1/posts/{id}/moderation` | administrador | publicar, devolver ou recusar |

## Fontes

| Caminho | O que decide |
|---|---|
| `docs/specs/2026-08-22-modelo-dominio.html` | a spec de leitura humana, com o porquê de cada decisão |
| `Docs/Refbibliografica/Guia_De_Metodologias_Ativas (1).pdf` | RF-02 — o vocabulário de 16+13+12 e os três tipos |
| `Docs/Refbibliografica/E-book 2025-2 - PRÁTICAS EXITOSAS  PARA UMA EDUCAÇÃO INOVADORA (1).pdf` | RF-03, RF-04a, RF-05, RF-06, RF-10 — a estrutura real do relato |
| `Docs/Refbibliografica/4922644189443460367.jpg` | selo Escola do Futuro, azul `#26355F` e laranja `#F0921E` |
| `Docs/Refbibliografica/4922644189443460368.jpg` | logo EEEFM Prof. João Antunes das Dores |
| `CLAUDE.md` | a regra do acervo público, que RF-07 implementa |
| `planoteca-api/CLAUDE.md` | convenções PostgreSQL, snake_case, UTC, SQL cru |
| `planoteca-web/CLAUDE.md` | as duas cascas, guarda de token, Phosphor |
| `planoteca-web/src/entities/plano/modelo.ts` | o modelo que RF-09 substitui |
| `planoteca-api/src/SaraivaTech.Planoteca.Domain/Base/Entity.cs` | `Guid` gerado em C# |
| `planoteca-web/contracts/openapi-v1.json` | o contrato que o front consome hoje |

## Critérios de aceite

- `dotnet build` sai com código 0.
- `dotnet test` sai com código 0.
- `dotnet ef database update` aplica num PostgreSQL vazio sem erro.
- Consulta `select count(*) from metodologia` devolve 41.
- Consulta `select count(*) from serie` devolve 7.
- Consulta `select count(distinct ordem) from serie` devolve 7.
- Inserir dois `plano_componente` com `e_principal = true` para o mesmo plano falha com violação de índice único.
- `GET /api/v1/lesson-plans` sem cabeçalho `Authorization` responde 200.
- `GET /api/v1/lesson-plans?serie=9-ano` inclui o plano catalogado em 8º e 9º.
- Um plano gravado sem nenhuma linha em `bncc` aparece na listagem.
- `npm run lint` sai com código 0.
- `npm run test` sai com código 0.
- `npm run build` sai com código 0.
- `npm run e2e` sai com código 0.
