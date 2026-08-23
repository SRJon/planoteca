<!-- gerado de docs/specs/2026-08-22-modelo-dominio.html
     sha256 da fonte: d9b93428ea81c068
     em: 2026-08-22T14:56
     NAO ESCREVA NESTE ARQUIVO. Altere o HTML e regenere. -->

# Modelo de domínio da Planoteca — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o acervo real da SEDU cabe no banco, e a Biblioteca serve dele sem exigir conta.

**Architecture:** cada peça segue a camada da Clean Architecture já em uso.

- Entidade em `Domain/Entities`, enumeração em `Domain/Enumerable`
- Mapeamento Fluent API e migration em `Infra.Data`
- No front, o vocabulário deixa de ser union em `entities/plano/modelo.ts`. Ele passa a vir de `GET /api/v1/vocabulary`.

**Tech Stack:** .NET 10, EF Core 10.0.4 com Npgsql 10.0.2, PostgreSQL 16, xUnit. React 19, TypeScript 5.7, Vitest 4, Playwright.

## Global Constraints

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

## Fontes

| Caminho | O que decide |
|---|---|
| `docs/specs/2026-08-22-modelo-dominio.md` | o contrato de máquina, com esquema e RF |
| `docs/specs/2026-08-22-modelo-dominio.html` | o porquê de cada decisão |
| `Docs/Refbibliografica/Guia_De_Metodologias_Ativas (1).pdf` | RF-02 — o vocabulário de 16+13+12 |
| `Docs/Refbibliografica/E-book 2025-2 - PRÁTICAS EXITOSAS  PARA UMA EDUCAÇÃO INOVADORA (1).pdf` | RF-03, RF-10 — a estrutura real do relato |
| `CLAUDE.md` | a regra do acervo público |
| `planoteca-api/CLAUDE.md` | convenções PostgreSQL, snake_case, UTC |
| `planoteca-web/CLAUDE.md` | as duas cascas, guarda de token |
| `planoteca-web/src/entities/plano/modelo.ts` | o modelo que RF-09 substitui |
| `planoteca-api/src/SaraivaTech.Planoteca.Domain/Base/Entity.cs` | `Guid` gerado em C# |

---

### Task 1: Entidades de vocabulário

**Papel:** escrita
**Verificação:** `cd planoteca-api && dotnet build`

**Fontes:**
- `docs/specs/2026-08-22-modelo-dominio.md` — seção `## Esquema`, tabelas `serie`, `componente` e `metodologia`
- `planoteca-api/src/SaraivaTech.Planoteca.Domain/Base/Entity.cs` — a classe base

**Files:**
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Serie.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Componente.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Metodologia.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Enumerable/EtapaEnsino.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Enumerable/TipoMetodologia.cs`

**Interfaces:**
- Consumes: `Entity` (classe base, já existe).
- Produces: `Serie`, `Componente`, `Metodologia` — POCOs herdando `Entity`.

- [x] **Step 1: Escrever as entidades**

`Serie.cs`:

```csharp
using SaraivaTech.Planoteca.Domain.Base;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Uma série da educação básica. "1ª série" existe no Fundamental e no
    /// Médio, então o nome sozinho não identifica: a chave natural é
    /// (Etapa, Nome), e a Ordem global permite listar da menor para a maior
    /// sem nenhuma regra de desempate na aplicação.
    /// </summary>
    public class Serie : Entity
    {
        public string Etapa { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string RotuloCompleto { get; set; } = string.Empty;
        public string Sigla { get; set; } = string.Empty;
        public int Ordem { get; set; }
        public bool Ativa { get; set; } = true;
    }
}
```

`Componente.cs`:

```csharp
using SaraivaTech.Planoteca.Domain.Base;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Um componente curricular, agrupado por área do conhecimento.
    ///
    /// Cor e Sigla são obrigatórias porque a ficha da Biblioteca desenha um
    /// bloco chapado com a sigla de duas letras — um componente sem cor
    /// nasceria com bloco transparente. A garantia saiu do compilador (era
    /// union em TypeScript) e virou restrição de banco.
    /// </summary>
    public class Componente : Entity
    {
        public string Area { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string Sigla { get; set; } = string.Empty;
        public string Cor { get; set; } = string.Empty;
        public int Ordem { get; set; }
        public bool Ativo { get; set; } = true;
    }
}
```

`Metodologia.cs`:

```csharp
using SaraivaTech.Planoteca.Domain.Base;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Uma metodologia ativa, técnica ou ferramenta digital.
    ///
    /// Os três convivem numa tabela só, separados por Tipo, porque um plano
    /// os cita da mesma forma ("Storytelling e Escape Room") e o filtro da
    /// Biblioteca não distingue. Fonte guarda de onde a linha veio: as 41
    /// semeadas trazem 'guia-ugb-2020', e o que o administrador cadastrar
    /// depois fica nulo.
    /// </summary>
    public class Metodologia : Entity
    {
        public string Nome { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public string? Fonte { get; set; }
        public bool Ativa { get; set; } = true;
    }
}
```

`EtapaEnsino.cs`:

```csharp
namespace SaraivaTech.Planoteca.Domain.Enumerable
{
    /// <summary>
    /// Os valores aceitos em <see cref="Entities.Serie.Etapa"/>.
    ///
    /// Constantes de string, e não enum: a coluna é `text` no banco, e o
    /// valor viaja para o front no JSON do vocabulário. Um enum obrigaria
    /// conversor nas duas pontas sem ganhar nada.
    /// </summary>
    public static class EtapaEnsino
    {
        public const string FundamentalAnosFinais = "fundamental_anos_finais";
        public const string Medio = "medio";

        public static readonly string[] Todas = [FundamentalAnosFinais, Medio];
    }
}
```

`TipoMetodologia.cs`:

```csharp
namespace SaraivaTech.Planoteca.Domain.Enumerable
{
    /// <summary>Os valores aceitos em <see cref="Entities.Metodologia.Tipo"/>.</summary>
    public static class TipoMetodologia
    {
        public const string Metodologia = "metodologia";
        public const string Tecnica = "tecnica";
        public const string Ferramenta = "ferramenta";

        public static readonly string[] Todos = [Metodologia, Tecnica, Ferramenta];
    }
}
```

- [x] **Step 2: Compilar**

```bash
cd planoteca-api && dotnet build
```

Esperado: `Compilação com êxito` e `0 Erro(s)`.

- [x] **Step 3: Commitar**

```bash
git add planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities planoteca-api/src/SaraivaTech.Planoteca.Domain/Enumerable
git commit -m "feat(dominio): entidades de vocabulario (serie, componente, metodologia)"
```

---

### Task 2: Entidades do acervo

**Papel:** escrita
**Verificação:** `cd planoteca-api && dotnet build`

**Fontes:**
- `docs/specs/2026-08-22-modelo-dominio.md` — seção `## Esquema`, tabelas `plano`, `etapa_plano`, `bncc` e as três de ligação
- `Docs/Refbibliografica/E-book 2025-2 - PRÁTICAS EXITOSAS  PARA UMA EDUCAÇÃO INOVADORA (1).pdf` — os rótulos literais que viraram nome de campo

**Files:**
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Plano.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/EtapaPlano.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/PlanoComponente.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/PlanoSerie.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/PlanoMetodologia.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Bncc.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Enumerable/SituacaoPlano.cs`

**Interfaces:**
- Consumes: `Serie`, `Componente`, `Metodologia` da Task 1.
- Produces: `Plano` com coleções de navegação.

- [x] **Step 1: Escrever as entidades**

`Plano.cs`:

```csharp
using System;
using System.Collections.Generic;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Enumerable;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Um plano de aula do acervo.
    ///
    /// Os nomes dos campos vêm dos rótulos literais dos relatos da SEDU
    /// ("Objetos de conhecimento abordados", "Expectativas de aprendizagem"),
    /// não de um modelo inventado.
    ///
    /// Duas ausências deliberadas:
    ///
    /// 1. Não existe ComponenteId nem SerieId. Um relato real declara "2ª
    ///    série I01 e 2ª série I02", e prática interdisciplinar cruza
    ///    componentes — as duas ligações são N:N.
    /// 2. Bncc é coleção OPCIONAL. Nenhum dos relatos analisados traz código
    ///    de habilidade; o eixo de busca é ObjetosConhecimento, que todo
    ///    plano tem.
    /// </summary>
    public class Plano : Entity
    {
        public string Titulo { get; set; } = string.Empty;

        /// <summary>Quem escreveu o plano. TEXTO, não FK para Pessoa: o autor
        /// do PDF quase nunca terá conta no sistema, e forçar cadastro criaria
        /// contas fantasma só para carregar um nome.</summary>
        public string Autoria { get; set; } = string.Empty;

        /// <summary>"Objetos de conhecimento abordados". É o eixo de busca da
        /// Biblioteca, no lugar do código BNCC que os relatos não trazem.</summary>
        public string ObjetosConhecimento { get; set; } = string.Empty;

        /// <summary>Regular, Integral, Integrado. Vinha grudado no ano nos
        /// relatos ("2ª série I01"); aqui é campo próprio.</summary>
        public string? Modalidade { get; set; }

        /// <summary>O código cru da turma, preservado como veio: `2ºIM02-EM-COM`.
        /// A amostra que gerou este modelo foi pequena — guardar o original
        /// permite reprocessar sem voltar aos PDFs.</summary>
        public string? TurmaOrigem { get; set; }

        public string Objetivo { get; set; } = string.Empty;
        public string ExpectativasAprendizagem { get; set; } = string.Empty;

        /// <summary>"Recurso(s) utilizado(s)". Prosa corrida, não lista: é
        /// assim que os relatos escrevem.</summary>
        public string? Recursos { get; set; }

        /// <summary>Número de aulas, para o filtro por duração funcionar.</summary>
        public int? DuracaoAulas { get; set; }

        /// <summary>O que o número não expressa: "Sequência didática",
        /// "1 bimestre".</summary>
        public string? DuracaoDescricao { get; set; }

        /// <summary>O PDF. Público, servido sem token — ver a regra do acervo
        /// público no CLAUDE.md da raiz.</summary>
        public string ArquivoUrl { get; set; } = string.Empty;

        /// <summary>Links de material de apoio que os relatos trazem (Drive).</summary>
        public string? LinksExtras { get; set; }

        public string Situacao { get; set; } = SituacaoPlano.Rascunho;

        /// <summary>Quem CATALOGOU, que não é quem escreveu. Ver Autoria.</summary>
        public Guid? CatalogadoPorId { get; set; }
        public Pessoa? CatalogadoPor { get; set; }

        public DateTime? PublicadoEm { get; set; }
        public DateTime CriadoEm { get; set; }
        public DateTime AtualizadoEm { get; set; }

        public ICollection<PlanoComponente> Componentes { get; set; } = [];
        public ICollection<PlanoSerie> Series { get; set; } = [];
        public ICollection<PlanoMetodologia> Metodologias { get; set; } = [];
        public ICollection<EtapaPlano> Etapas { get; set; } = [];
        public ICollection<Bncc> CodigosBncc { get; set; } = [];
    }
}
```

`EtapaPlano.cs`:

```csharp
using System;
using SaraivaTech.Planoteca.Domain.Base;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Um passo do roteiro: "ETAPA 1: Início da Missão".
    ///
    /// É a espinha do relato, e por isso é dado e não um campo de texto
    /// corrido: permite mostrar o passo a passo na página do plano sem abrir
    /// o PDF, e buscar dentro dele depois.
    /// </summary>
    public class EtapaPlano : Entity
    {
        public Guid PlanoId { get; set; }
        public Plano? Plano { get; set; }
        public int Ordem { get; set; }
        public string? Titulo { get; set; }
        public string Descricao { get; set; } = string.Empty;
    }
}
```

`PlanoComponente.cs`:

```csharp
using System;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Ligação plano-componente, com um principal.
    ///
    /// EPrincipal existe porque o card da Biblioteca tem UM bloco de cor com
    /// a sigla de duas letras — é a assinatura da direção visual. Um plano
    /// com três componentes iguais deixaria o card sem saber que cor usar.
    /// O principal manda na cor; os demais aparecem na ficha e continuam
    /// filtráveis.
    ///
    /// Não herda Entity: a chave é composta (PlanoId, ComponenteId).
    /// </summary>
    public class PlanoComponente
    {
        public Guid PlanoId { get; set; }
        public Plano? Plano { get; set; }
        public Guid ComponenteId { get; set; }
        public Componente? Componente { get; set; }
        public bool EPrincipal { get; set; }
    }
}
```

`PlanoSerie.cs`:

```csharp
using System;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Ligação plano-série. N:N porque um relato declara "2ª série I01 e 2ª
    /// série I02", e uma sequência didática que serve 8º e 9º ano é a norma.
    /// Com 1:1, catalogá-la exigiria duplicar o plano.
    ///
    /// Não herda Entity: a chave é composta.
    /// </summary>
    public class PlanoSerie
    {
        public Guid PlanoId { get; set; }
        public Plano? Plano { get; set; }
        public Guid SerieId { get; set; }
        public Serie? Serie { get; set; }
    }
}
```

`PlanoMetodologia.cs`:

```csharp
using System;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>Ligação plano-metodologia. Um relato usa "Storytelling e
    /// Escape Room" — duas de uma vez. Não herda Entity: chave composta.</summary>
    public class PlanoMetodologia
    {
        public Guid PlanoId { get; set; }
        public Plano? Plano { get; set; }
        public Guid MetodologiaId { get; set; }
        public Metodologia? Metodologia { get; set; }
    }
}
```

`Bncc.cs`:

```csharp
using System;
using SaraivaTech.Planoteca.Domain.Base;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Um código de habilidade da BNCC ligado a um plano — `EF09MA05`.
    ///
    /// A relação é 0..N e OPCIONAL. Nenhum dos relatos analisados traz
    /// código; exigir um na catalogação inviabilizaria o povoamento do
    /// acervo, que é manual e feito dezenas de vezes seguidas.
    /// </summary>
    public class Bncc : Entity
    {
        public Guid PlanoId { get; set; }
        public Plano? Plano { get; set; }
        public string Codigo { get; set; } = string.Empty;
    }
}
```

`SituacaoPlano.cs`:

```csharp
namespace SaraivaTech.Planoteca.Domain.Enumerable
{
    /// <summary>Os valores aceitos em <see cref="Entities.Plano.Situacao"/>.
    /// Rascunho permite catalogar sem publicar na hora.</summary>
    public static class SituacaoPlano
    {
        public const string Rascunho = "rascunho";
        public const string Publicado = "publicado";

        public static readonly string[] Todas = [Rascunho, Publicado];
    }
}
```

- [x] **Step 2: Compilar**

```bash
cd planoteca-api && dotnet build
```

Esperado: erro `CS0246` sobre `Pessoa`, que a Task 3 cria. Se aparecer só isso, seguir para a Task 3 e recompilar lá.

- [x] **Step 3: Commitar**

```bash
git add planoteca-api/src/SaraivaTech.Planoteca.Domain
git commit -m "feat(dominio): entidades do acervo (plano, etapa, ligacoes N:N, bncc)"
```

---

### Task 3: Pessoa e Post

**Papel:** escrita
**Verificação:** `cd planoteca-api && dotnet build`

**Fontes:**
- `docs/specs/2026-08-22-modelo-dominio.md` — seção `## Esquema`, tabelas `pessoa` e `post`; RF-11
- `CLAUDE.md` — os dois papéis e a moderação do blog

**Files:**
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Pessoa.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Post.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Enumerable/PapelPessoa.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Enumerable/SituacaoPost.cs`

**Interfaces:**
- Consumes: `Entity`.
- Produces: `Pessoa`, `Post`. Fecha o `CS0246` da Task 2.

- [x] **Step 1: Escrever as entidades**

`Pessoa.cs`:

```csharp
using System;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Enumerable;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Quem tem conta na Planoteca: professor ou administrador.
    ///
    /// O papel é COLUNA, e não grupo de diretório como no boilerplate
    /// corporativo de origem: na Planoteca o professor se cadastra sozinho
    /// com conta Google, e não existe diretório que o classifique. Todo mundo
    /// nasce professor; só um administrador promove.
    ///
    /// GoogleSub é o `sub` do OIDC — o identificador estável do Google.
    /// Fica nulo até o login com Google existir de fato.
    /// </summary>
    public class Pessoa : Entity
    {
        public string? GoogleSub { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string Papel { get; set; } = PapelPessoa.Professor;
        public bool Ativo { get; set; } = true;
        public DateTime CriadoEm { get; set; }
    }
}
```

`Post.cs`:

```csharp
using System;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Enumerable;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Um texto do blog. Nasce pendente e só vai ao ar depois que um
    /// administrador aprova — não há publicação direta, nem para professor
    /// veterano.
    ///
    /// ComentarioModeracao é obrigatório quando a situação vira Devolvido ou
    /// Recusado (RF-11): devolver sem dizer o motivo transforma moderação em
    /// silêncio.
    /// </summary>
    public class Post : Entity
    {
        public Guid AutorId { get; set; }
        public Pessoa? Autor { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Resumo { get; set; }
        public string Corpo { get; set; } = string.Empty;
        public string Situacao { get; set; } = SituacaoPost.Pendente;
        public string? ComentarioModeracao { get; set; }
        public Guid? ModeradoPorId { get; set; }
        public Pessoa? ModeradoPor { get; set; }
        public DateTime? ModeradoEm { get; set; }
        public DateTime? PublicadoEm { get; set; }
        public DateTime CriadoEm { get; set; }
    }
}
```

`PapelPessoa.cs`:

```csharp
namespace SaraivaTech.Planoteca.Domain.Enumerable
{
    /// <summary>Os dois papéis. Visitante não é papel: quem não tem conta
    /// navega, filtra e baixa igual, porque o acervo é público.</summary>
    public static class PapelPessoa
    {
        public const string Professor = "professor";
        public const string Administrador = "administrador";

        public static readonly string[] Todos = [Professor, Administrador];
    }
}
```

`SituacaoPost.cs`:

```csharp
namespace SaraivaTech.Planoteca.Domain.Enumerable
{
    /// <summary>O ciclo de moderação do blog.</summary>
    public static class SituacaoPost
    {
        public const string Pendente = "pendente";
        public const string Publicado = "publicado";
        public const string Devolvido = "devolvido";
        public const string Recusado = "recusado";

        public static readonly string[] Todas = [Pendente, Publicado, Devolvido, Recusado];

        /// <summary>As situações que exigem `ComentarioModeracao` (RF-11).</summary>
        public static readonly string[] ExigemComentario = [Devolvido, Recusado];
    }
}
```

- [x] **Step 2: Compilar**

```bash
cd planoteca-api && dotnet build
```

Esperado: `Compilação com êxito` e `0 Erro(s)`. O `CS0246` da Task 2 desaparece.

- [x] **Step 3: Commitar**

```bash
git add planoteca-api/src/SaraivaTech.Planoteca.Domain
git commit -m "feat(dominio): pessoa, post e enumeracoes de papel e situacao"
```

---

### Task 4: Mapeamentos Fluent API

**Papel:** analise
**Verificação:** `cd planoteca-api && dotnet build`

**Fontes:**
- `docs/specs/2026-08-22-modelo-dominio.md` — seção `## Esquema`, e RF-04b para o índice parcial
- `planoteca-api/CLAUDE.md` — tipos PostgreSQL, snake_case, `timestamp with time zone`

**Files:**
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Mappings/SerieMap.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Mappings/ComponenteMap.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Mappings/MetodologiaMap.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Mappings/PlanoMap.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Mappings/EtapaPlanoMap.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Mappings/PlanoComponenteMap.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Mappings/PlanoSerieMap.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Mappings/PlanoMetodologiaMap.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Mappings/BnccMap.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Mappings/PessoaMap.cs`
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Mappings/PostMap.cs`

**Interfaces:**
- Consumes: todas as entidades das Tasks 1 a 3.
- Produces: `IEntityTypeConfiguration<T>` para cada uma. `ApplyConfigurationsFromAssembly` já as descobre.

- [x] **Step 1: Escrever os mapeamentos de vocabulário**

O nome de tabela e coluna sai da convenção snake_case — **não** escrever `HasColumnName` só para converter caixa.

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Infra.Data.Mappings
{
    public class SerieMap : IEntityTypeConfiguration<Serie>
    {
        public void Configure(EntityTypeBuilder<Serie> builder)
        {
            builder.ToTable("serie");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Etapa).IsRequired().HasColumnType("text");
            builder.Property(x => x.Nome).IsRequired().HasColumnType("text");
            builder.Property(x => x.RotuloCompleto).IsRequired().HasColumnType("text");
            builder.Property(x => x.Sigla).IsRequired().HasColumnType("text");
            builder.Property(x => x.Ordem).IsRequired();
            builder.Property(x => x.Ativa).IsRequired().HasDefaultValue(true);

            builder.HasIndex(x => new { x.Etapa, x.Nome }).IsUnique();
            builder.HasIndex(x => x.Ordem).IsUnique();
        }
    }

    public class ComponenteMap : IEntityTypeConfiguration<Componente>
    {
        public void Configure(EntityTypeBuilder<Componente> builder)
        {
            builder.ToTable("componente");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Area).IsRequired().HasColumnType("text");
            builder.Property(x => x.Nome).IsRequired().HasColumnType("text");
            // Cor e Sigla NOT NULL: a ficha desenha um bloco chapado, e um
            // componente sem cor nasceria transparente (RF-03).
            builder.Property(x => x.Sigla).IsRequired().HasColumnType("varchar(2)");
            builder.Property(x => x.Cor).IsRequired().HasColumnType("text");
            builder.Property(x => x.Ordem).IsRequired();
            builder.Property(x => x.Ativo).IsRequired().HasDefaultValue(true);
        }
    }

    public class MetodologiaMap : IEntityTypeConfiguration<Metodologia>
    {
        public void Configure(EntityTypeBuilder<Metodologia> builder)
        {
            builder.ToTable("metodologia");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Nome).IsRequired().HasColumnType("text");
            builder.Property(x => x.Tipo).IsRequired().HasColumnType("text");
            builder.Property(x => x.Fonte).HasColumnType("text");
            builder.Property(x => x.Ativa).IsRequired().HasDefaultValue(true);
        }
    }
}
```

- [x] **Step 2: Escrever o mapeamento do plano e das ligações**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Infra.Data.Mappings
{
    public class PlanoMap : IEntityTypeConfiguration<Plano>
    {
        public void Configure(EntityTypeBuilder<Plano> builder)
        {
            builder.ToTable("plano");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Titulo).IsRequired().HasColumnType("text");
            builder.Property(x => x.Autoria).IsRequired().HasColumnType("text");
            builder.Property(x => x.ObjetosConhecimento).IsRequired().HasColumnType("text");
            builder.Property(x => x.Modalidade).HasColumnType("text");
            builder.Property(x => x.TurmaOrigem).HasColumnType("text");
            builder.Property(x => x.Objetivo).IsRequired().HasColumnType("text");
            builder.Property(x => x.ExpectativasAprendizagem).IsRequired().HasColumnType("text");
            builder.Property(x => x.Recursos).HasColumnType("text");
            builder.Property(x => x.DuracaoDescricao).HasColumnType("text");
            builder.Property(x => x.ArquivoUrl).IsRequired().HasColumnType("text");
            builder.Property(x => x.LinksExtras).HasColumnType("jsonb");
            builder.Property(x => x.Situacao).IsRequired().HasColumnType("text");

            builder.Property(x => x.PublicadoEm).HasColumnType("timestamp with time zone");
            builder.Property(x => x.CriadoEm)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");
            builder.Property(x => x.AtualizadoEm)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");

            builder.HasOne(x => x.CatalogadoPor)
                .WithMany()
                .HasForeignKey(x => x.CatalogadoPorId)
                .OnDelete(DeleteBehavior.SetNull);

            // A listagem pública filtra por situação em toda consulta.
            builder.HasIndex(x => x.Situacao);
        }
    }

    public class EtapaPlanoMap : IEntityTypeConfiguration<EtapaPlano>
    {
        public void Configure(EntityTypeBuilder<EtapaPlano> builder)
        {
            builder.ToTable("etapa_plano");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Ordem).IsRequired();
            builder.Property(x => x.Titulo).HasColumnType("text");
            builder.Property(x => x.Descricao).IsRequired().HasColumnType("text");

            builder.HasOne(x => x.Plano)
                .WithMany(p => p.Etapas)
                .HasForeignKey(x => x.PlanoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.PlanoId, x.Ordem }).IsUnique();
        }
    }

    public class PlanoComponenteMap : IEntityTypeConfiguration<PlanoComponente>
    {
        public void Configure(EntityTypeBuilder<PlanoComponente> builder)
        {
            builder.ToTable("plano_componente");
            builder.HasKey(x => new { x.PlanoId, x.ComponenteId });

            builder.Property(x => x.EPrincipal).IsRequired().HasDefaultValue(false);

            builder.HasOne(x => x.Plano)
                .WithMany(p => p.Componentes)
                .HasForeignKey(x => x.PlanoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Componente)
                .WithMany()
                .HasForeignKey(x => x.ComponenteId)
                .OnDelete(DeleteBehavior.Restrict);

            // O índice único PARCIAL que garante um principal por plano
            // (RF-04b) não sai daqui: o EF não gera índice parcial. Ele é
            // escrito com migrationBuilder.Sql() na Task 5.
        }
    }

    public class PlanoSerieMap : IEntityTypeConfiguration<PlanoSerie>
    {
        public void Configure(EntityTypeBuilder<PlanoSerie> builder)
        {
            builder.ToTable("plano_serie");
            builder.HasKey(x => new { x.PlanoId, x.SerieId });

            builder.HasOne(x => x.Plano)
                .WithMany(p => p.Series)
                .HasForeignKey(x => x.PlanoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Serie)
                .WithMany()
                .HasForeignKey(x => x.SerieId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class PlanoMetodologiaMap : IEntityTypeConfiguration<PlanoMetodologia>
    {
        public void Configure(EntityTypeBuilder<PlanoMetodologia> builder)
        {
            builder.ToTable("plano_metodologia");
            builder.HasKey(x => new { x.PlanoId, x.MetodologiaId });

            builder.HasOne(x => x.Plano)
                .WithMany(p => p.Metodologias)
                .HasForeignKey(x => x.PlanoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Metodologia)
                .WithMany()
                .HasForeignKey(x => x.MetodologiaId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class BnccMap : IEntityTypeConfiguration<Bncc>
    {
        public void Configure(EntityTypeBuilder<Bncc> builder)
        {
            builder.ToTable("bncc");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Codigo).IsRequired().HasColumnType("varchar(20)");

            builder.HasOne(x => x.Plano)
                .WithMany(p => p.CodigosBncc)
                .HasForeignKey(x => x.PlanoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.PlanoId, x.Codigo }).IsUnique();
        }
    }
}
```

- [x] **Step 3: Escrever pessoa e post**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Infra.Data.Mappings
{
    public class PessoaMap : IEntityTypeConfiguration<Pessoa>
    {
        public void Configure(EntityTypeBuilder<Pessoa> builder)
        {
            builder.ToTable("pessoa");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.GoogleSub).HasColumnType("text");
            builder.Property(x => x.Email).IsRequired().HasColumnType("text");
            builder.Property(x => x.Nome).IsRequired().HasColumnType("text");
            builder.Property(x => x.Papel).IsRequired().HasColumnType("text");
            builder.Property(x => x.Ativo).IsRequired().HasDefaultValue(true);
            builder.Property(x => x.CriadoEm)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");

            builder.HasIndex(x => x.Email).IsUnique();
            builder.HasIndex(x => x.GoogleSub).IsUnique();
        }
    }

    public class PostMap : IEntityTypeConfiguration<Post>
    {
        public void Configure(EntityTypeBuilder<Post> builder)
        {
            builder.ToTable("post");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Titulo).IsRequired().HasColumnType("text");
            builder.Property(x => x.Resumo).HasColumnType("text");
            builder.Property(x => x.Corpo).IsRequired().HasColumnType("text");
            builder.Property(x => x.Situacao).IsRequired().HasColumnType("text");
            builder.Property(x => x.ComentarioModeracao).HasColumnType("text");
            builder.Property(x => x.ModeradoEm).HasColumnType("timestamp with time zone");
            builder.Property(x => x.PublicadoEm).HasColumnType("timestamp with time zone");
            builder.Property(x => x.CriadoEm)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");

            builder.HasOne(x => x.Autor)
                .WithMany()
                .HasForeignKey(x => x.AutorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.ModeradoPor)
                .WithMany()
                .HasForeignKey(x => x.ModeradoPorId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(x => x.Situacao);
        }
    }
}
```

- [x] **Step 4: Compilar**

```bash
cd planoteca-api && dotnet build
```

Esperado: `Compilação com êxito` e `0 Erro(s)`.

- [x] **Step 5: Commitar**

```bash
git add planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Mappings
git commit -m "feat(infra): mapeamentos Fluent API do dominio"
```

---

### Task 5: Migration inicial com seed

**Papel:** analise
**Verificação:** `cd planoteca-api && dotnet build`

**Fontes:**
- `docs/specs/2026-08-22-modelo-dominio.md` — RF-02 (as 41 metodologias literais), RF-03 (as 7 séries), RF-04b (o índice parcial)
- `Docs/Refbibliografica/Guia_De_Metodologias_Ativas (1).pdf` — p. 6 e 7, o sumário de onde os 41 nomes vêm
- `planoteca-api/CLAUDE.md` — `migrationBuilder.Sql()` para o que o EF não gera

**Files:**
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Migrations/` (gerado por `dotnet ef`)
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Seed/DadosIniciais.cs`

**Interfaces:**
- Consumes: os mapeamentos da Task 4.
- Produces: `DadosIniciais.Metodologias()`, `DadosIniciais.Series()`, `DadosIniciais.Componentes()` — arrays lidos pela migration.

- [x] **Step 1: Escrever o seed**

Os 41 nomes são transcrição literal do sumário do guia. Não abreviar, não traduzir, não "corrigir" grafia — `Quizziz` e `Mentimenter` estão como o documento escreve.

```csharp
using SaraivaTech.Planoteca.Domain.Enumerable;

namespace SaraivaTech.Planoteca.Infra.Data.Seed
{
    /// <summary>
    /// Os dados que a migration inicial planta.
    ///
    /// O vocabulário de metodologia vem do "Guia prático de utilização de
    /// metodologias e técnicas ativas" (UGB/FERP, 2020), transcrito do
    /// sumário. Os nomes são LITERAIS: "Quizziz" e "Mentimenter" estão como
    /// o documento escreve, e corrigir a grafia aqui quebraria a
    /// rastreabilidade com a fonte.
    /// </summary>
    public static class DadosIniciais
    {
        public static (string Nome, string Tipo)[] Metodologias() =>
        [
            ("Sala de Aula Invertida", TipoMetodologia.Metodologia),
            ("Rotação por Estações de Aprendizagem", TipoMetodologia.Metodologia),
            ("Aprendizagem por Pares", TipoMetodologia.Metodologia),
            ("Ensino Sob Medida", TipoMetodologia.Metodologia),
            ("Aprendizagem Baseada em Equipes", TipoMetodologia.Metodologia),
            ("Método POE", TipoMetodologia.Metodologia),
            ("Aprendizagem Baseada em Problemas", TipoMetodologia.Metodologia),
            ("Aprendizagem Baseada em Projetos", TipoMetodologia.Metodologia),
            ("Gamificação", TipoMetodologia.Metodologia),
            ("Estudo de Casos", TipoMetodologia.Metodologia),
            ("Aprendizagem Baseada em Jogos", TipoMetodologia.Metodologia),
            ("Storytelling", TipoMetodologia.Metodologia),
            ("Design Thinking", TipoMetodologia.Metodologia),
            ("Escape Room", TipoMetodologia.Metodologia),
            ("Pesquisa", TipoMetodologia.Metodologia),
            ("A Escrita Através do Currículo", TipoMetodologia.Metodologia),

            ("Simulações", TipoMetodologia.Tecnica),
            ("Atividades Práticas", TipoMetodologia.Tecnica),
            ("Diagrama de Ishikawa", TipoMetodologia.Tecnica),
            ("Brainstorming", TipoMetodologia.Tecnica),
            ("Ferramenta 5W e 2H", TipoMetodologia.Tecnica),
            ("Técnica dos Chapéus", TipoMetodologia.Tecnica),
            ("Painel Integrado", TipoMetodologia.Tecnica),
            ("Mapa Conceitual e Mapa Mental", TipoMetodologia.Tecnica),
            ("Visita Técnica", TipoMetodologia.Tecnica),
            ("Infográfico", TipoMetodologia.Tecnica),
            ("Canvas", TipoMetodologia.Tecnica),
            ("Menu de Aprendizagem", TipoMetodologia.Tecnica),
            ("Trilhas de Aprendizagem", TipoMetodologia.Tecnica),

            ("Plickers", TipoMetodologia.Ferramenta),
            ("Google Forms", TipoMetodologia.Ferramenta),
            ("Socrative", TipoMetodologia.Ferramenta),
            ("Pixton", TipoMetodologia.Ferramenta),
            ("Quizziz", TipoMetodologia.Ferramenta),
            ("Screencast", TipoMetodologia.Ferramenta),
            ("Mentimenter", TipoMetodologia.Ferramenta),
            ("Kahoot", TipoMetodologia.Ferramenta),
            ("Slido", TipoMetodologia.Ferramenta),
            ("TBL Active", TipoMetodologia.Ferramenta),
            ("EDMODO", TipoMetodologia.Ferramenta),
            ("Classcraft", TipoMetodologia.Ferramenta),
        ];

        public static (int Ordem, string Etapa, string Nome, string Rotulo, string Sigla)[] Series() =>
        [
            (1, EtapaEnsino.FundamentalAnosFinais, "6º ano", "6º ano do Ensino Fundamental", "6º"),
            (2, EtapaEnsino.FundamentalAnosFinais, "7º ano", "7º ano do Ensino Fundamental", "7º"),
            (3, EtapaEnsino.FundamentalAnosFinais, "8º ano", "8º ano do Ensino Fundamental", "8º"),
            (4, EtapaEnsino.FundamentalAnosFinais, "9º ano", "9º ano do Ensino Fundamental", "9º"),
            (5, EtapaEnsino.Medio, "1ª série", "1ª série do Ensino Médio", "1ªEM"),
            (6, EtapaEnsino.Medio, "2ª série", "2ª série do Ensino Médio", "2ªEM"),
            (7, EtapaEnsino.Medio, "3ª série", "3ª série do Ensino Médio", "3ªEM"),
        ];

        /// <summary>
        /// Os componentes, agrupados pelas quatro áreas do Ensino Médio. A
        /// COR é da ÁREA, não do componente: doze cores distinguíveis e
        /// acessíveis não existem, e o card fica coerente quando Química,
        /// Física e Biologia compartilham o tom de Ciências da Natureza.
        ///
        /// Os valores de cor apontam para tokens do tema
        /// (planoteca-web/src/app/estilos/tema.css).
        /// </summary>
        public static (int Ordem, string Area, string Nome, string Sigla, string Cor)[] Componentes() =>
        [
            (1,  "Linguagens e suas Tecnologias", "Língua Portuguesa", "PT", "comp-linguagens"),
            (2,  "Linguagens e suas Tecnologias", "Arte", "AR", "comp-linguagens"),
            (3,  "Linguagens e suas Tecnologias", "Educação Física", "EF", "comp-linguagens"),
            (4,  "Linguagens e suas Tecnologias", "Língua Inglesa", "IN", "comp-linguagens"),
            (5,  "Matemática e suas Tecnologias", "Matemática", "MA", "comp-matematica"),
            (6,  "Ciências da Natureza e suas Tecnologias", "Ciências", "CN", "comp-natureza"),
            (7,  "Ciências da Natureza e suas Tecnologias", "Biologia", "BI", "comp-natureza"),
            (8,  "Ciências da Natureza e suas Tecnologias", "Física", "FI", "comp-natureza"),
            (9,  "Ciências da Natureza e suas Tecnologias", "Química", "QU", "comp-natureza"),
            (10, "Ciências Humanas e Sociais Aplicadas", "História", "HI", "comp-humanas"),
            (11, "Ciências Humanas e Sociais Aplicadas", "Geografia", "GE", "comp-humanas"),
            (12, "Ciências Humanas e Sociais Aplicadas", "Filosofia", "FL", "comp-humanas"),
            (13, "Ciências Humanas e Sociais Aplicadas", "Sociologia", "SO", "comp-humanas"),
        ];
    }
}
```

- [x] **Step 2: Gerar a migration**

```bash
cd planoteca-api && dotnet ef migrations add Inicial --project src/SaraivaTech.Planoteca.Infra.Data --startup-project src/SaraivaTech.Planoteca.Api
```

Esperado: pasta `Migrations/` criada com `<timestamp>_Inicial.cs`.

- [x] **Step 3: Acrescentar o seed e o índice parcial ao `Up()`**

Alterar a migration gerada, no fim do método `Up()`. O índice parcial não sai do EF — ele é o que garante RF-04b.

```csharp
// O EF não gera índice PARCIAL. Este é o árbitro de RF-04b: o banco recusa
// um segundo componente principal no mesmo plano, e a garantia não depende
// de nenhuma validação de aplicação.
migrationBuilder.Sql(@"
CREATE UNIQUE INDEX ix_plano_componente_principal_unico
    ON plano_componente (plano_id)
 WHERE e_principal;");

foreach (var (nome, tipo) in DadosIniciais.Metodologias())
{
    migrationBuilder.InsertData(
        table: "metodologia",
        columns: ["id", "nome", "tipo", "fonte", "ativa"],
        values: [Guid.NewGuid(), nome, tipo, "guia-ugb-2020", true]);
}

foreach (var (ordem, etapa, nome, rotulo, sigla) in DadosIniciais.Series())
{
    migrationBuilder.InsertData(
        table: "serie",
        columns: ["id", "etapa", "nome", "rotulo_completo", "sigla", "ordem", "ativa"],
        values: [Guid.NewGuid(), etapa, nome, rotulo, sigla, ordem, true]);
}

foreach (var (ordem, area, nome, sigla, cor) in DadosIniciais.Componentes())
{
    migrationBuilder.InsertData(
        table: "componente",
        columns: ["id", "area", "nome", "sigla", "cor", "ordem", "ativo"],
        values: [Guid.NewGuid(), area, nome, sigla, cor, ordem, true]);
}
```

E no `Down()`, antes do resto:

```csharp
migrationBuilder.Sql("DROP INDEX IF EXISTS ix_plano_componente_principal_unico;");
```

- [x] **Step 4: Compilar**

```bash
cd planoteca-api && dotnet build
```

Esperado: `Compilação com êxito` e `0 Erro(s)`.

- [x] **Step 5: Commitar**

```bash
git add planoteca-api/src/SaraivaTech.Planoteca.Infra.Data
git commit -m "feat(infra): migration inicial com seed de vocabulario e indice parcial"
```

---

### Task 6: Teste do modelo contra o acervo real

**Papel:** analise
**Verificação:** `cd planoteca-api && dotnet test`

**Fontes:**
- `docs/specs/2026-08-22-modelo-dominio.md` — RF-02, RF-03, RF-04, RF-04a, RF-04b, RF-05, RF-06, RF-10
- `Docs/Refbibliografica/E-book 2025-2 - PRÁTICAS EXITOSAS  PARA UMA EDUCAÇÃO INOVADORA (1).pdf` — p. 12, o relato do Termoscópio que RF-10 reproduz

**Files:**
- Create: `planoteca-api/tests/SaraivaTech.Planoteca.Test/Dominio/ModeloDominioTest.cs`
- Create: `planoteca-api/tests/SaraivaTech.Planoteca.Test/Dominio/DadosIniciaisTest.cs`

**Interfaces:**
- Consumes: todas as entidades e `DadosIniciais`.
- Produces: nada — é suíte de teste.

- [x] **Step 1: Escrever o teste do seed**

```csharp
using System.Linq;
using FluentAssertions;
using SaraivaTech.Planoteca.Domain.Enumerable;
using SaraivaTech.Planoteca.Infra.Data.Seed;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Dominio
{
    public class DadosIniciaisTest
    {
        [Fact]
        public void Metodologias_tem_41_linhas_nos_tres_tipos()
        {
            var todas = DadosIniciais.Metodologias();

            todas.Should().HaveCount(41, "o guia traz 16 metodologias, 13 técnicas e 12 ferramentas");
            todas.Count(x => x.Tipo == TipoMetodologia.Metodologia).Should().Be(16);
            todas.Count(x => x.Tipo == TipoMetodologia.Tecnica).Should().Be(13);
            todas.Count(x => x.Tipo == TipoMetodologia.Ferramenta).Should().Be(12);
        }

        [Fact]
        public void Metodologias_nao_repete_nome()
        {
            var nomes = DadosIniciais.Metodologias().Select(x => x.Nome.ToLowerInvariant());

            nomes.Should().OnlyHaveUniqueItems();
        }

        [Fact]
        public void Metodologias_traz_as_duas_do_relato_do_termoscopio()
        {
            var nomes = DadosIniciais.Metodologias().Select(x => x.Nome);

            nomes.Should().Contain("Storytelling");
            nomes.Should().Contain("Escape Room");
        }

        [Fact]
        public void Series_tem_sete_linhas_com_ordem_unica()
        {
            var series = DadosIniciais.Series();

            series.Should().HaveCount(7, "6º ao 9º ano e 1ª a 3ª série do Médio");
            series.Select(x => x.Ordem).Should().OnlyHaveUniqueItems();
            series.Select(x => x.Ordem).Should().BeInAscendingOrder();
        }

        [Fact]
        public void Series_desambigua_primeira_serie_entre_etapas()
        {
            var series = DadosIniciais.Series();
            var medio = series.Single(x => x.Nome == "1ª série" && x.Etapa == EtapaEnsino.Medio);

            medio.Rotulo.Should().Be("1ª série do Ensino Médio",
                "o nome sozinho é ambíguo — existe 1ª série no Fundamental e no Médio");
        }

        [Fact]
        public void Componentes_sempre_tem_cor_e_sigla_de_duas_letras()
        {
            foreach (var (_, _, nome, sigla, cor) in DadosIniciais.Componentes())
            {
                cor.Should().NotBeNullOrWhiteSpace($"{nome} nasceria com bloco transparente");
                sigla.Should().HaveLength(2, $"a sigla de {nome} tem largura fixa no card");
            }
        }

        [Fact]
        public void Componentes_cobre_o_que_o_acervo_real_traz()
        {
            var nomes = DadosIniciais.Componentes().Select(x => x.Nome);

            // As três que o modelo antigo, com "Ciências" genérico, não cobria.
            nomes.Should().Contain("Química");
            nomes.Should().Contain("Física");
            nomes.Should().Contain("Biologia");
        }
    }
}
```

- [x] **Step 2: Escrever o teste do modelo**

```csharp
using System.Linq;
using FluentAssertions;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Dominio
{
    public class ModeloDominioTest
    {
        /// <summary>
        /// RF-10 — o teste que prova que o acervo real cabe.
        ///
        /// Reproduz o relato "Escape Room: Missão Termoscópio", da p. 12 do
        /// e-book da SEDU: Química, 2ª série (turmas I01 e I02), integral,
        /// com DUAS metodologias e NENHUM código BNCC. Nenhuma dessas quatro
        /// características cabia no modelo anterior.
        /// </summary>
        [Fact]
        public void Plano_do_acervo_real_cabe_no_modelo()
        {
            var quimica = new Componente { Nome = "Química", Sigla = "QU", Cor = "comp-natureza", Area = "Ciências da Natureza e suas Tecnologias" };
            var segundaSerie = new Serie { Nome = "2ª série", Etapa = EtapaEnsino.Medio, RotuloCompleto = "2ª série do Ensino Médio", Sigla = "2ªEM", Ordem = 6 };
            var storytelling = new Metodologia { Nome = "Storytelling", Tipo = TipoMetodologia.Metodologia };
            var escapeRoom = new Metodologia { Nome = "Escape Room", Tipo = TipoMetodologia.Metodologia };

            var plano = new Plano
            {
                Titulo = "Escape Room: Missão Termoscópio — O Enigma das Escalas Perdidas",
                Autoria = "Anna Ruth de Souza e Souza",
                ObjetosConhecimento = "Escalas Termométricas.",
                Modalidade = "Integral",
                TurmaOrigem = "2ª série I01 e 2ª série I02",
                Objetivo = "Promover a aprendizagem ativa por meio de um jogo de Escape Room.",
                ExpectativasAprendizagem = "Fazer conversões entre diversas escalas de temperatura.",
                Recursos = "Cartões de pistas, lápis, projetor, celular, QR Codes, timer, notebook.",
                ArquivoUrl = "/arquivos/termoscopio.pdf",
                Situacao = SituacaoPlano.Publicado,
            };

            plano.Componentes.Add(new PlanoComponente { Componente = quimica, EPrincipal = true });
            plano.Series.Add(new PlanoSerie { Serie = segundaSerie });
            plano.Metodologias.Add(new PlanoMetodologia { Metodologia = storytelling });
            plano.Metodologias.Add(new PlanoMetodologia { Metodologia = escapeRoom });
            plano.Etapas.Add(new EtapaPlano { Ordem = 1, Titulo = "Início da Missão: O Mistério do Termoscópio", Descricao = "Contextualize a missão por meio de uma narrativa desafiadora." });
            plano.Etapas.Add(new EtapaPlano { Ordem = 2, Titulo = "Formação das Equipes de Cientistas", Descricao = "Divida a turma em equipes." });

            plano.Metodologias.Should().HaveCount(2, "RF-04: o relato usa Storytelling E Escape Room");
            plano.CodigosBncc.Should().BeEmpty("RF-05: nenhum relato analisado traz código BNCC");
            plano.Etapas.OrderBy(e => e.Ordem).First().Ordem.Should().Be(1, "RF-06");
            plano.Componentes.Single(c => c.EPrincipal).Componente!.Nome.Should().Be("Química", "RF-04b");
        }

        /// <summary>RF-04a — o caso que motivou a ligação N:N de série.</summary>
        [Fact]
        public void Plano_atende_mais_de_uma_serie()
        {
            var oitavo = new Serie { Nome = "8º ano", Etapa = EtapaEnsino.FundamentalAnosFinais, RotuloCompleto = "8º ano do Ensino Fundamental", Sigla = "8º", Ordem = 3 };
            var nono = new Serie { Nome = "9º ano", Etapa = EtapaEnsino.FundamentalAnosFinais, RotuloCompleto = "9º ano do Ensino Fundamental", Sigla = "9º", Ordem = 4 };

            var plano = new Plano { Titulo = "Sequência didática de duas séries" };
            plano.Series.Add(new PlanoSerie { Serie = oitavo });
            plano.Series.Add(new PlanoSerie { Serie = nono });

            plano.Series.Should().HaveCount(2);
            plano.Series.Select(s => s.Serie!.Ordem).Should().BeEquivalentTo([3, 4]);
        }

        /// <summary>RF-04b — prática interdisciplinar tem um componente principal.</summary>
        [Fact]
        public void Plano_interdisciplinar_tem_um_principal_e_secundarios_filtraveis()
        {
            var arte = new Componente { Nome = "Arte", Sigla = "AR", Cor = "comp-linguagens", Area = "Linguagens e suas Tecnologias" };
            var historia = new Componente { Nome = "História", Sigla = "HI", Cor = "comp-humanas", Area = "Ciências Humanas e Sociais Aplicadas" };

            var plano = new Plano { Titulo = "Prática interdisciplinar" };
            plano.Componentes.Add(new PlanoComponente { Componente = historia, EPrincipal = true });
            plano.Componentes.Add(new PlanoComponente { Componente = arte, EPrincipal = false });

            plano.Componentes.Should().HaveCount(2);
            plano.Componentes.Count(c => c.EPrincipal).Should().Be(1, "o card tem UM bloco de cor");
            plano.Componentes.Should().Contain(c => c.Componente!.Nome == "Arte",
                "buscar por Arte precisa achar a prática em que Arte é secundária");
        }

        [Fact]
        public void Post_nasce_pendente()
        {
            new Post().Situacao.Should().Be(SituacaoPost.Pendente, "RF-11");
        }

        [Fact]
        public void Pessoa_nasce_professor()
        {
            new Pessoa().Papel.Should().Be(PapelPessoa.Professor,
                "quem se cadastra sozinho não vira administrador");
        }

        [Fact]
        public void Plano_nasce_rascunho()
        {
            new Plano().Situacao.Should().Be(SituacaoPlano.Rascunho,
                "catalogar não é publicar");
        }
    }
}
```

- [x] **Step 3: Executar**

```bash
cd planoteca-api && dotnet test
```

Esperado: `Aprovado!` e `Com falha: 0`. O total sobe de 10 para 23.

- [x] **Step 4: Commitar**

```bash
git add planoteca-api/tests
git commit -m "test(dominio): modelo cobre o relato real do acervo (RF-10)"
```

---

### Task 7: Aplicar a migration num banco real

**Papel:** analise
**Verificação:** `cd planoteca-api && dotnet ef database update --project src/SaraivaTech.Planoteca.Infra.Data --startup-project src/SaraivaTech.Planoteca.Api`

**Fontes:**
- `docs/specs/2026-08-22-modelo-dominio.md` — seção `## Critérios de aceite`, as consultas de verificação
- `planoteca-api/docker-compose.yml` — o serviço de banco

**Files:**
- Test: nenhum arquivo novo. A verificação é por consulta ao banco.

**Interfaces:**
- Consumes: a migration da Task 5.
- Produces: um banco `planoteca` com schema e seed aplicados.

- [x] **Step 1: Subir o PostgreSQL**

```bash
cd planoteca-api && docker-compose up -d db
```

Esperado: container `db` saudável. O healthcheck do compose espera o banco aceitar conexão.

- [x] **Step 2: Aplicar a migration**

```bash
cd planoteca-api && dotnet ef database update --project src/SaraivaTech.Planoteca.Infra.Data --startup-project src/SaraivaTech.Planoteca.Api
```

Esperado: `Done.` e nenhuma exceção.

- [x] **Step 3: Conferir o seed e o índice parcial**

```bash
docker exec -i $(docker compose -f planoteca-api/docker-compose.yml ps -q db) psql -U postgres -d planoteca -c "select tipo, count(*) from metodologia group by tipo order by tipo;" -c "select count(*) as series from serie;" -c "select count(distinct ordem) as ordens from serie;" -c "select indexname from pg_indexes where indexname = 'ix_plano_componente_principal_unico';"
```

Esperado: `ferramenta 12`, `metodologia 16`, `tecnica 13`; `series 7`; `ordens 7`; e o índice listado.

- [x] **Step 4: Provar que o índice parcial barra o segundo principal**

```bash
docker exec -i $(docker compose -f planoteca-api/docker-compose.yml ps -q db) psql -U postgres -d planoteca -v ON_ERROR_STOP=0 -c "
begin;
insert into plano (id, titulo, autoria, objetos_conhecimento, objetivo, expectativas_aprendizagem, arquivo_url, situacao)
values ('11111111-1111-1111-1111-111111111111', 't', 'a', 'o', 'ob', 'ex', '/x.pdf', 'rascunho');
insert into plano_componente (plano_id, componente_id, e_principal)
select '11111111-1111-1111-1111-111111111111', id, true from componente order by ordem limit 1;
insert into plano_componente (plano_id, componente_id, e_principal)
select '11111111-1111-1111-1111-111111111111', id, true from componente order by ordem offset 1 limit 1;
rollback;"
```

Esperado: `ERROR: duplicate key value violates unique constraint "ix_plano_componente_principal_unico"`. A transação faz `rollback`, então o banco não guarda nada. **Um comando que termina sem erro reprova a task** — significa que o índice não está fazendo efeito.

- [x] **Step 5: Commitar**

Nada a commitar: a task é de verificação. Registrar o resultado no relatório de conclusão.

---

## Self-Review

- [ ] Todo `### Task N` usa a palavra inglesa `Task`.
- [ ] Toda task tem `Papel`: `busca`, `escrita` ou `analise`.
- [ ] Toda task tem `Verificação` com um comando.
- [ ] O comando de `Verificação` executa a partir da raiz do repositório.
- [ ] Toda task tem `Fontes`, com caminho ou com a palavra `nenhuma`.
- [ ] Todo caminho de `Fontes` existe no disco.
- [ ] Todo passo tem comando e resultado esperado.
- [ ] Todo bloco de teste está inteiro, sem reticência.
- [ ] Todo bloco de código usa cerca, nunca indentação de quatro espaços.
- [ ] Nenhuma task depende de arquivo que nenhuma task anterior criou.

## Escopo desta leva

Este plano entrega o **modelo e o banco**. Ficam para o próximo ciclo, na ordem:

1. Repositórios, serviços de domínio, app services e mappers do Mapperly
2. Os controllers e o contrato REST da seção `## Contrato REST` da spec de máquina
3. `GET /api/v1/vocabulary` e a troca do union por dado no front (RF-09)
4. O formulário de catalogação, otimizado para repetição
5. Login com Google, e só então `[Authorize]` nas rotas de escrita

A separação é deliberada: schema errado descoberto depois do acervo povoado custa migração de dado digitado à mão. Este plano fecha quando o banco aceitar o relato do Termoscópio.

---

## Notas de execução — 2026-08-22

Executado de ponta a ponta contra PostgreSQL 16.14 em Docker. Quatro divergências
em relação ao plano, todas registradas aqui.

### D-1 — Ordem invertida: Task 3 antes da Task 2

O plano previa que a Task 2 falhasse com `CS0246` por referenciar `Pessoa`, criada
só na Task 3. Escrevi `Pessoa` e `Post` antes de `Plano`, e o erro nunca aconteceu.
Mesma entrega, um build quebrado a menos.

### D-2 — Defeito no `DatabaseContextFactory`, corrigido

`dotnet ef database update` falhou com `The ConnectionString property has not been
initialized`.

A causa: a factory lia só `appsettings.json`. Aquele arquivo **não tem** connection
string, porque a senha real mora em `appsettings.Local.json`, gitignored.

Corrigido: a cadeia de configuração agora espelha a do runtime
(`appsettings.json` → `appsettings.{ambiente}.json` → `appsettings.Local.json` →
variáveis de ambiente). Exigiu o pacote
`Microsoft.Extensions.Configuration.EnvironmentVariables`.

É defeito herdado do boilerplate, não introduzido por este plano.

### D-3 — `appsettings.Local.json` não estava no `.gitignore`

O `planoteca-api/CLAUDE.md` afirma que está. Não estava. Como o arquivo carrega a
senha do banco, acrescentei ao `.gitignore` antes de escrevê-lo.

### D-4 — Projeto de teste não referenciava `Infra.Data`

`DadosIniciaisTest` precisa de `DadosIniciais`, que mora em `Infra.Data`. A
referência de projeto não existia e foi acrescentada.

### Verificação — saída dos comandos

```
dotnet build   → Compilação com êxito, 0 Erro(s)
dotnet test    → Aprovado! Com falha: 0, Aprovado: 25, Total: 25
dotnet ef database update → Applying migration '20260822181410_Inicial'. Done.

select tipo, count(*) from metodologia group by tipo;
  ferramenta   12
  metodologia  16
  tecnica      13

select count(*) as series, count(distinct ordem) as ordens from serie;
  series 7 | ordens 7

select count(*) from componente;  →  13

select indexname from pg_indexes where indexname='ix_plano_componente_principal_unico';
  ix_plano_componente_principal_unico
```

Teste negativo de RF-04b, que precisa FALHAR e falhou:

```
ERROR:  duplicate key value violates unique constraint "ix_plano_componente_principal_unico"
DETAIL:  Key (plano_id)=(11111111-1111-1111-1111-111111111111) already exists.
```

RF-10 gravado e lido de volta no banco real:

```
 titulo                          | modalidade | componente_principal | series                   | metodologias               | etapas | codigos_bncc
 Escape Room: Missao Termoscopio | Integral   | Química              | 2ª série do Ensino Médio | Escape Room + Storytelling |      2 |            0
```

O `delete` do plano levou as duas etapas junto, sem órfãs — o `on delete cascade`
está de pé.

Front conferido e intacto: 175 testes, 20 arquivos, exit 0.
