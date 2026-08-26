<!-- gerado de docs/specs/2026-08-26-filtros-biblioteca.html
     sha256 da fonte: d57d0feb8520f7a2
     em: 2026-08-26T11:10
     NAO ESCREVA NESTE ARQUIVO. Altere o HTML e regenere. -->

# Filtros da Biblioteca em coluna lateral — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a Biblioteca filtra por uma coluna à esquerda no desktop e por uma
gaveta no celular. Cada item mostra quantos planos devolve.

**Architecture:** a API ganha `GET /api/v1/lesson-plans/facets`, público, ao
lado da listagem. Ele reusa `FiltroPlano` e conta pelas três tabelas de
junção. O front ganha `useFacetas` em `entities/plano` e cinco componentes em
`features/filtrar-planos`. `PaginaBiblioteca` monta o grid de duas colunas e
troca coluna por gaveta abaixo de `lg`. `useFiltroPlanos` e a URL não se
alteram.

**Tech Stack:** .NET com EF Core, xUnit, NSubstitute e FluentAssertions.
React com Tailwind, TanStack Query, Radix Dialog, Vitest, Testing Library,
MSW e Playwright.

## Global Constraints

- O alvo são as pastas `planoteca-api` e `planoteca-web`. Nada fora delas se altera.
- Nada da Biblioteca fica atrás de `RotaProtegida` nem de `[Authorize]`. O endpoint de facetas é público.
- `useFiltroPlanos.ts` e seus testes não se alteram. A URL continua a fonte da verdade do filtro.
- O contrato de `GET /api/v1/lesson-plans` não se altera.
- Sem dependência nova no front. A gaveta reusa o Radix Dialog de `components/ui/dialog.tsx`.
- O padrão visual da landing manda. Bloco escuro público é `bg-inverso-bg text-inverso-ink`, nunca `bg-foreground`.
- Breakpoint desce: `grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1`. Não use `md:`/`xl:` subindo.
- Toda página pública abre com `<Container className="py-8">` e organiza o miolo com `gap-8`.
- O bloco de sigla copia a receita de `CardArea.tsx`, com `aria-hidden`.
- Cor literal em componente reprova no `npm run lint`. Use token. O bloco de sigla usa `classeCorComponente`.
- Fixture nova entra em `src/teste/servidor.ts` e em `e2e/simulacao.ts`, nos dois.
- Teste da API usa xUnit, NSubstitute e FluentAssertions. Teste de repositório executa contra PostgreSQL real e pula sem banco.
- Teste do front usa Vitest, Testing Library, MSW e Playwright.
- Arquivo novo de tela passa por `python ~/.claude/skills/sem-plastico/scripts/detectar.py`.
- Commit segue Conventional Commits, com escopo pelo domínio.

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
| `planoteca-web/src/pages/inicio/CardArea.tsx` | a receita do bloco de sigla e do menu por área |
| `planoteca-web/src/pages/blog/PaginaBlog.tsx` | o padrão de página pública: `Container`, `gap-8`, grade de cards |
| `planoteca-web/src/components/container/Container.tsx` | a coluna de 1180px que cada página pede |
| `planoteca-web/src/app/shell/Rodape.tsx` | o bloco invertido com `bg-inverso-bg` |
| `CLAUDE.md` | o portão antes de dizer "pronto" |

---

### Task 1: O contrato de facetas — DTO, domínio e assinaturas

**Papel:** escrita
**Verificação:** `cd planoteca-api && dotnet build src/SaraivaTech.Planoteca.Application/SaraivaTech.Planoteca.Application.csproj`

**Fontes:**
- `planoteca-api/src/SaraivaTech.Planoteca.Application/Dto/VocabularioDto.cs` — forma de um DTO de leitura
- `planoteca-api/src/SaraivaTech.Planoteca.Domain/Repositories/Interfaces/IPlanoRepository.cs` — `FiltroPlano` e a assinatura de `BuscarAsync`
- `planoteca-api/src/SaraivaTech.Planoteca.Application.Core/Services/PlanoAppService.cs` — forma do AppService e do mapeamento para DTO

**Files:**
- Create: `planoteca-api/src/SaraivaTech.Planoteca.Application/Dto/FacetasDto.cs`
- Modify: `planoteca-api/src/SaraivaTech.Planoteca.Domain/Repositories/Interfaces/IPlanoRepository.cs`
- Modify: `planoteca-api/src/SaraivaTech.Planoteca.Application/Services/IPlanoAppService.cs`

**Interfaces:**
- Produces: `Task<ContagemFacetas> ContarFacetasAsync(FiltroPlano filtro)`
- Produces: `Task<FacetasDto> ObterFacetasAsync(FiltroPlano filtro)`
- Produces: `ContagemFacetas` — três `IReadOnlyList<FacetaContada>` de `(Guid Id, int Total)`

- [x] **Step 1: Escrever o DTO de saída**

`FacetasDto` é o corpo de `GET /lesson-plans/facets` do RF-01. Ele é só
contagem: nome, sigla e cor já chegam por `GET /vocabulary`. Repeti-los aqui
faria duas fontes para o mesmo dado.

```csharp
using System;
using System.Collections.Generic;

namespace SaraivaTech.Planoteca.Application.Dto
{
    /// <summary>
    /// Quantos planos cada item do vocabulário responde, dentro do recorte
    /// que a Biblioteca tem aberto.
    ///
    /// Só id e total. Nome, sigla e cor vêm de `GET /vocabulary`, que o front
    /// já mantém em cache por uma hora — devolvê-los de novo aqui criaria uma
    /// segunda fonte para o mesmo dado, e a cada teclada da busca.
    ///
    /// Id ausente da lista vale zero (RF-01). O item continua na tela, e
    /// continua clicável.
    /// </summary>
    public class FacetasDto
    {
        public List<ContagemDto> Series { get; set; } = [];
        public List<ContagemDto> Componentes { get; set; } = [];
        public List<ContagemDto> Metodologias { get; set; } = [];
    }

    public class ContagemDto
    {
        public Guid Id { get; set; }
        public int Total { get; set; }
    }
}
```

- [x] **Step 2: Escrever o tipo de domínio da contagem**

`ContarFacetasAsync` não pode devolver `FacetasDto`: o repositório mora no
Domain, e o DTO mora no Application. `ContagemFacetas` vive ao lado de
`FiltroPlano`, no mesmo arquivo, porque um só existe por causa do outro.

Acrescente ao fim de `IPlanoRepository.cs`, dentro do mesmo namespace, e
amplie a interface:

```csharp
    /// <summary>Um item de vocabulário e quantos planos ele responde dentro
    /// do recorte. `record struct` porque é par de valor sem identidade — não
    /// há nada a rastrear nem a comparar por referência.</summary>
    public readonly record struct FacetaContada(Guid Id, int Total);

    /// <summary>As três contagens de uma consulta só.
    ///
    /// Três listas num tipo, e não três chamadas, porque a tela desenha as
    /// três de uma vez: uma ida por grupo faria três viagens ao Render
    /// gratuito a cada teclada da busca.
    ///
    /// Tipo de domínio, e não `FacetasDto`: o repositório não conhece a camada
    /// de aplicação. A tradução é do AppService.</summary>
    public class ContagemFacetas
    {
        public IReadOnlyList<FacetaContada> Series { get; init; } = [];
        public IReadOnlyList<FacetaContada> Componentes { get; init; } = [];
        public IReadOnlyList<FacetaContada> Metodologias { get; init; } = [];
    }
```

E dentro de `IPlanoRepository`, depois de `BuscarAsync`:

```csharp
        /// <summary>Quantos planos cada item do vocabulário responde.
        ///
        /// A contagem de um grupo IGNORA a seleção do próprio grupo, e aplica
        /// a dos outros dois mais a busca e a duração (RF-02). É o que faz o
        /// número ao lado de "História" dizer "quantos planos eu ganho se
        /// marcar isto", em vez de repetir o total já filtrado.
        ///
        /// `Pagina` e `TamanhoPagina` do filtro são ignorados: a contagem é do
        /// recorte inteiro, não da página à vista.</summary>
        Task<ContagemFacetas> ContarFacetasAsync(FiltroPlano filtro);
```

- [x] **Step 3: Ampliar a interface do AppService**

Em `IPlanoAppService`, depois de `ListarAsync`:

```csharp
        /// <summary>As contagens que a coluna de filtro mostra. O `filtro`
        /// chega da mesma querystring da listagem, sem paginação.</summary>
        Task<FacetasDto> ObterFacetasAsync(FiltroPlano filtro);
```

- [x] **Step 4: Compilar e confirmar a falha esperada**

```bash
cd planoteca-api && dotnet build
```

Esperado: erro `CS0535` em `PlanoRepository` e em `PlanoAppService`, porque
nenhum dos dois implementa ainda o método novo da sua interface. As Tasks 2 e 3
fecham cada um.

- [x] **Step 5: Commitar**

```bash
git add planoteca-api/src
git commit -m "feat(plano): contrato de facetas no domínio e na aplicação"
```

---

### Task 2: A contagem no repositório, contra o PostgreSQL real

**Papel:** analise
**Verificação:** `cd planoteca-api && dotnet test tests/SaraivaTech.Planoteca.Test/SaraivaTech.Planoteca.Test.csproj --filter PlanoRepositorioTest`

**Fontes:**
- `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Repositories/PlanoRepository.cs` — como o filtro composto se aplica em LINQ; o `Any()` nas junções
- `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Mappings/AcervoMap.cs` — as tabelas `plano_componente`, `plano_serie` e `plano_metodologia`
- `planoteca-api/src/SaraivaTech.Planoteca.Domain/Repositories/Interfaces/IPlanoRepository.cs` — `FiltroPlano` e a assinatura de `BuscarAsync`
- `planoteca-api/tests/SaraivaTech.Planoteca.Test/Integracao/PlanoRepositorioTest.cs` — forma do teste de repositório contra PostgreSQL real e o skip sem banco
- `planoteca-api/tests/SaraivaTech.Planoteca.Test/Integracao/BaseBancoReal.cs` — conexão, limpeza por prefixo `[teste-integracao]`

**Files:**
- Modify: `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Repositories/PlanoRepository.cs`
- Test: `planoteca-api/tests/SaraivaTech.Planoteca.Test/Integracao/PlanoRepositorioTest.cs`

**Interfaces:**
- Consumes: `ContagemFacetas` e `FacetaContada` da Task 1.
- Produces: `Task<ContagemFacetas> ContarFacetasAsync(FiltroPlano filtro)`

- [x] **Step 1: Escrever os testes que falham**

Três testes novos no fim de `PlanoRepositorioTest`, antes do fecho da classe.
O primeiro prova a regra do RF-02 nos dois sentidos. O segundo prova que
rascunho não conta. O terceiro prova que id sem plano fica fora.

O cenário do primeiro usa o vocabulário que `VocabularioAsync` já traz. A
contagem de Arte, com o 9º marcado, precisa contar só o plano de 9º com Arte.
A contagem do 8º precisa contar só o plano de 8º com Química. A seleção de
componente vale para o grupo série.

```csharp
        [SkippableFact]
        public async Task Faceta_de_um_grupo_ignora_a_selecao_do_proprio_grupo()
        {
            await LimparAsync();
            var (quimica, arte, oitavo, nono, _, _) = await VocabularioAsync();

            // Nono ano com Química: casa a série marcada e o componente marcado.
            var nonoQuimica = NovoPlano("nono de química");
            nonoQuimica.Series.Add(new PlanoSerie { SerieId = nono.Id });
            nonoQuimica.Componentes.Add(new PlanoComponente { ComponenteId = quimica.Id, EPrincipal = true });

            // Nono ano com Arte: casa a série marcada, componente diferente.
            var nonoArte = NovoPlano("nono de arte");
            nonoArte.Series.Add(new PlanoSerie { SerieId = nono.Id });
            nonoArte.Componentes.Add(new PlanoComponente { ComponenteId = arte.Id, EPrincipal = true });

            // Oitavo ano com Química: série diferente, componente marcado.
            var oitavoQuimica = NovoPlano("oitavo de química");
            oitavoQuimica.Series.Add(new PlanoSerie { SerieId = oitavo.Id });
            oitavoQuimica.Componentes.Add(new PlanoComponente { ComponenteId = quimica.Id, EPrincipal = true });

            // Oitavo ano com Arte: fora dos dois recortes.
            var oitavoArte = NovoPlano("oitavo de arte");
            oitavoArte.Series.Add(new PlanoSerie { SerieId = oitavo.Id });
            oitavoArte.Componentes.Add(new PlanoComponente { ComponenteId = arte.Id, EPrincipal = true });

            Contexto.AddRange(nonoQuimica, nonoArte, oitavoQuimica, oitavoArte);
            await Contexto.SaveChangesAsync();

            var repo = new Infra.Data.Repositories.PlanoRepository(new UoWFalso(Contexto));
            var contagem = await repo.ContarFacetasAsync(new FiltroPlano
            {
                Busca = MarcaTeste,
                SeriesIds = [nono.Id],
                ComponentesIds = [quimica.Id],
            });

            // RF-02: a contagem de componente ignora o componente marcado e
            // aplica a série marcada. Arte responde pelo plano de 9º com Arte.
            contagem.Componentes.Should().ContainEquivalentOf(
                new FacetaContada(arte.Id, 1),
                "a contagem de componente aplica o 9º e ignora Química");
            contagem.Componentes.Should().ContainEquivalentOf(
                new FacetaContada(quimica.Id, 1),
                "o próprio item marcado conta dentro do recorte dos outros grupos");

            // No outro sentido: a contagem de série ignora a série marcada e
            // aplica Química. O 8º responde pelo plano de 8º com Química.
            contagem.Series.Should().ContainEquivalentOf(
                new FacetaContada(oitavo.Id, 1),
                "a contagem de série aplica Química e ignora o 9º");
            contagem.Series.Should().ContainEquivalentOf(
                new FacetaContada(nono.Id, 1),
                "o 9º conta o plano de 9º com Química");

            await LimparAsync();
        }

        [SkippableFact]
        public async Task Rascunho_nao_entra_em_nenhuma_contagem()
        {
            await LimparAsync();
            var (quimica, _, _, nono, storytelling, _) = await VocabularioAsync();

            var rascunho = NovoPlano("rascunho que não conta", SituacaoPlano.Rascunho);
            rascunho.Series.Add(new PlanoSerie { SerieId = nono.Id });
            rascunho.Componentes.Add(new PlanoComponente { ComponenteId = quimica.Id, EPrincipal = true });
            rascunho.Metodologias.Add(new PlanoMetodologia { MetodologiaId = storytelling.Id });
            Contexto.Add(rascunho);
            await Contexto.SaveChangesAsync();

            var repo = new Infra.Data.Repositories.PlanoRepository(new UoWFalso(Contexto));
            var contagem = await repo.ContarFacetasAsync(new FiltroPlano { Busca = MarcaTeste });

            contagem.Series.Should().NotContain(f => f.Id == nono.Id,
                "a contagem é do acervo público, e rascunho não é público");
            contagem.Componentes.Should().NotContain(f => f.Id == quimica.Id);
            contagem.Metodologias.Should().NotContain(f => f.Id == storytelling.Id);

            await LimparAsync();
        }

        [SkippableFact]
        public async Task Item_sem_plano_fica_fora_da_resposta()
        {
            await LimparAsync();
            var (quimica, _, _, nono, storytelling, escape) = await VocabularioAsync();

            var plano = NovoPlano("só storytelling");
            plano.Series.Add(new PlanoSerie { SerieId = nono.Id });
            plano.Componentes.Add(new PlanoComponente { ComponenteId = quimica.Id, EPrincipal = true });
            plano.Metodologias.Add(new PlanoMetodologia { MetodologiaId = storytelling.Id });
            Contexto.Add(plano);
            await Contexto.SaveChangesAsync();

            var repo = new Infra.Data.Repositories.PlanoRepository(new UoWFalso(Contexto));
            var contagem = await repo.ContarFacetasAsync(new FiltroPlano { Busca = MarcaTeste });

            // RF-01: só id com pelo menos um plano entra. Id ausente vale zero,
            // e o front desenha o item com zero do mesmo jeito.
            contagem.Metodologias.Should().ContainEquivalentOf(new FacetaContada(storytelling.Id, 1));
            contagem.Metodologias.Should().NotContain(f => f.Id == escape.Id);

            await LimparAsync();
        }
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd planoteca-api && dotnet test --filter PlanoRepositorioTest
```

Esperado: falha de compilação, porque `ContarFacetasAsync` ainda não existe em
`PlanoRepository`.

- [x] **Step 3: Extrair o filtro base de `BuscarAsync`**

`BuscarAsync` e as três consultas de faceta aplicam a mesma coisa: situação,
busca, duração e os grupos de vocabulário. Duplicar isso quatro vezes garante
que uma correção futura pegue só três dos quatro lugares.

Extraia um método privado com um parâmetro por grupo, e reescreva `BuscarAsync`
sobre ele. O parâmetro `grupoExcluido` é o que dá a regra do RF-02: a faceta
de série chama com `Grupo.Serie`. Aí a cláusula de série não entra na árvore.

```csharp
        /// <summary>Qual grupo de vocabulário NÃO entra no filtro.
        ///
        /// A listagem usa `Nenhum` — ela aplica os três. Cada faceta usa o seu
        /// próprio grupo, porque a contagem de "História" precisa ignorar o
        /// componente já marcado para responder "quantos planos eu ganho se
        /// marcar isto" (RF-02).</summary>
        private enum GrupoVocabulario { Nenhum, Componente, Serie, Metodologia }

        /// <summary>
        /// O recorte que a listagem e as facetas compartilham.
        ///
        /// Um método só, e não a cláusula repetida em quatro consultas: a
        /// contagem precisa concordar com a listagem por construção. Duplicada,
        /// uma correção na busca textual passaria a valer para o resultado e
        /// não para o número ao lado do item.
        /// </summary>
        private IQueryable<Plano> Recorte(FiltroPlano filtro, GrupoVocabulario grupoExcluido)
        {
            var consulta = Context.Set<Plano>().AsNoTracking().AsQueryable();

            // A listagem pública nunca vê rascunho. O padrão é o seguro: quem
            // quiser o contrário precisa pedir explicitamente.
            if (!filtro.IncluirRascunhos)
                consulta = consulta.Where(p => p.Situacao == SituacaoPlano.Publicado);

            if (!string.IsNullOrWhiteSpace(filtro.Busca))
            {
                var termo = $"%{filtro.Busca.Trim()}%";
                // `EF.Functions.ILike` vira ILIKE no Postgres — busca sem
                // diferenciar maiúscula, sem precisar de `lower()` dos dois
                // lados. Não existe no SQL Server; é dialeto, e é intencional.
                consulta = consulta.Where(p =>
                    EF.Functions.ILike(p.Titulo, termo) ||
                    EF.Functions.ILike(p.ObjetosConhecimento, termo) ||
                    EF.Functions.ILike(p.Autoria, termo));
            }

            // Os três filtros de vocabulário atravessam a tabela de ligação.
            // Dentro de um grupo a semântica é OU: `Contains` casa com
            // QUALQUER id da lista (série 6º OU 7º). Entre grupos é E — cada
            // `Where` encadeado estreita mais o resultado (série E
            // componente). Lista vazia não entra na árvore: `is { Length: >
            // 0 }` é o guarda que faz "sem filtro" != "filtro que não casa
            // nada". No caso do componente, `Any` sem checar `EPrincipal` é o
            // comportamento correto: buscar por "Arte" precisa achar a prática
            // interdisciplinar em que Arte é secundária (RF-08).
            if (grupoExcluido != GrupoVocabulario.Componente && filtro.ComponentesIds is { Length: > 0 })
                consulta = consulta.Where(p => p.Componentes.Any(c => filtro.ComponentesIds.Contains(c.ComponenteId)));

            if (grupoExcluido != GrupoVocabulario.Serie && filtro.SeriesIds is { Length: > 0 })
                consulta = consulta.Where(p => p.Series.Any(s => filtro.SeriesIds.Contains(s.SerieId)));

            if (grupoExcluido != GrupoVocabulario.Metodologia && filtro.MetodologiasIds is { Length: > 0 })
                consulta = consulta.Where(p => p.Metodologias.Any(m => filtro.MetodologiasIds.Contains(m.MetodologiaId)));

            // Plano sem duração declarada fica FORA do recorte por duração:
            // `null` não é "zero aulas", é "não sabemos". Incluí-lo faria o
            // filtro "até 2 aulas" devolver plano de duração desconhecida.
            if (filtro.DuracaoMinima.HasValue)
                consulta = consulta.Where(p => p.DuracaoAulas != null && p.DuracaoAulas >= filtro.DuracaoMinima);

            if (filtro.DuracaoMaxima.HasValue)
                consulta = consulta.Where(p => p.DuracaoAulas != null && p.DuracaoAulas <= filtro.DuracaoMaxima);

            return consulta;
        }
```

E `BuscarAsync` passa a começar por:

```csharp
        public async Task<(IEnumerable<Plano> Itens, int Total)> BuscarAsync(FiltroPlano filtro)
        {
            // `Nenhum`: a listagem aplica os três grupos. Só a faceta exclui um.
            var consulta = Recorte(filtro, GrupoVocabulario.Nenhum);

            var total = await consulta.CountAsync();
```

O resto do corpo de `BuscarAsync` — a paginação, o `OrderByDescending` e os
`Include` — não se altera.

- [x] **Step 4: Implementar `ContarFacetasAsync`**

Três consultas, uma por grupo. Cada uma parte do recorte sem o próprio grupo,
desce à tabela de ligação por `SelectMany` e agrupa pelo id.

```csharp
        public async Task<ContagemFacetas> ContarFacetasAsync(FiltroPlano filtro)
        {
            // Três consultas, e não uma com três `GroupBy`: um plano de duas
            // séries e três componentes viraria seis linhas num join só, e o
            // `count` de cada grupo sairia multiplicado pelo tamanho do outro.
            //
            // `SelectMany` desce do plano para a tabela de ligação. O Npgsql
            // traduz para um join com `group by`, e o filtro do recorte vira
            // subconsulta — o banco conta, não a aplicação.
            var series = await Recorte(filtro, GrupoVocabulario.Serie)
                .SelectMany(p => p.Series)
                .GroupBy(s => s.SerieId)
                .Select(g => new FacetaContada(g.Key, g.Count()))
                .ToListAsync();

            var componentes = await Recorte(filtro, GrupoVocabulario.Componente)
                .SelectMany(p => p.Componentes)
                .GroupBy(c => c.ComponenteId)
                .Select(g => new FacetaContada(g.Key, g.Count()))
                .ToListAsync();

            var metodologias = await Recorte(filtro, GrupoVocabulario.Metodologia)
                .SelectMany(p => p.Metodologias)
                .GroupBy(m => m.MetodologiaId)
                .Select(g => new FacetaContada(g.Key, g.Count()))
                .ToListAsync();

            return new ContagemFacetas
            {
                Series = series,
                Componentes = componentes,
                Metodologias = metodologias,
            };
        }
```

- [x] **Step 5: Executar e confirmar que passa**

```bash
cd planoteca-api && dotnet test --filter PlanoRepositorioTest
```

Esperado: `Passed!` e código 0. Sem banco de pé, os testes saem como
`Skipped` — é o comportamento de `BaseBancoReal`, e continua sendo código 0.

- [x] **Step 6: Confirmar que a listagem não se alterou**

```bash
cd planoteca-api && dotnet test
```

Esperado: `Passed!`. Os oito testes anteriores de `PlanoRepositorioTest` executam
contra o `Recorte` extraído, e provam que a extração preservou o comportamento.

- [x] **Step 7: Commitar**

```bash
git add planoteca-api/src planoteca-api/tests
git commit -m "feat(plano): conta as facetas do filtro no repositório"
```

---

### Task 3: A tradução para DTO no AppService

> **Nota de execução, 2026-08-26.** O projeto de teste referencia
> `Application.Core`, então o `CS0535` que a Task 1 deixou no `PlanoAppService`
> impede QUALQUER teste de compilar — inclusive os da Task 2. Por isso esta
> task foi executada logo depois da Task 2, e o portão da Task 2 só fechou
> depois dela. Num próximo ciclo, o contrato do AppService deve nascer na
> mesma task que o implementa.

**Papel:** escrita
**Verificação:** `cd planoteca-api && dotnet test --filter PlanoFacetasTest`

**Fontes:**
- `planoteca-api/src/SaraivaTech.Planoteca.Application.Core/Services/PlanoAppService.cs` — forma do AppService e do mapeamento para DTO
- `planoteca-api/src/SaraivaTech.Planoteca.Application/Dto/VocabularioDto.cs` — forma de um DTO de leitura
- `planoteca-api/tests/SaraivaTech.Planoteca.Test/Application/PlanoRemocaoTest.cs` — forma do teste de AppService com NSubstitute

**Files:**
- Modify: `planoteca-api/src/SaraivaTech.Planoteca.Application.Core/Services/PlanoAppService.cs`
- Test: `planoteca-api/tests/SaraivaTech.Planoteca.Test/Application/PlanoFacetasTest.cs`

**Interfaces:**
- Consumes: `ContarFacetasAsync` da Task 2 e `FacetasDto` da Task 1.
- Produces: `Task<FacetasDto> ObterFacetasAsync(FiltroPlano filtro)`

- [x] **Step 1: Escrever o teste que falha**

O AppService não tem regra própria aqui: ele traduz. O teste prova que a
tradução preserva id e total nos três grupos. Prova também que a paginação da
requisição não chega ao repositório como recorte.

```csharp
using System;
using System.Threading.Tasks;
using FluentAssertions;
using NSubstitute;
using SaraivaTech.Planoteca.Application.Core.Services;
using SaraivaTech.Planoteca.Application.Mappers;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Domain.Services;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Application
{
    /// <summary>
    /// A tradução da contagem de domínio para o corpo de
    /// `GET /lesson-plans/facets`.
    ///
    /// A regra do RF-02 mora no repositório, contra o banco real. O que
    /// sobra aqui é o que este teste cobre: nenhum grupo se perde e nenhum
    /// total se troca no caminho.
    /// </summary>
    public class PlanoFacetasTest
    {
        private readonly IPlanoRepository _repositorio = Substitute.For<IPlanoRepository>();
        private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
        private readonly IArmazenamentoArquivo _armazenamento = Substitute.For<IArmazenamentoArquivo>();

        private PlanoAppService Servico() =>
            new(_repositorio, new PlanoMapper(new VocabularioMapper()), _uow, _armazenamento);

        [Fact]
        public async Task ObterFacetasAsync_traduz_os_tres_grupos()
        {
            var serie = Guid.NewGuid();
            var componente = Guid.NewGuid();
            var metodologia = Guid.NewGuid();

            _repositorio.ContarFacetasAsync(Arg.Any<FiltroPlano>()).Returns(new ContagemFacetas
            {
                Series = [new FacetaContada(serie, 12)],
                Componentes = [new FacetaContada(componente, 9)],
                Metodologias = [new FacetaContada(metodologia, 5)],
            });

            var facetas = await Servico().ObterFacetasAsync(new FiltroPlano());

            facetas.Series.Should().ContainSingle()
                .Which.Should().BeEquivalentTo(new { Id = serie, Total = 12 });
            facetas.Componentes.Should().ContainSingle()
                .Which.Should().BeEquivalentTo(new { Id = componente, Total = 9 });
            facetas.Metodologias.Should().ContainSingle()
                .Which.Should().BeEquivalentTo(new { Id = metodologia, Total = 5 });
        }

        [Fact]
        public async Task ObterFacetasAsync_devolve_grupo_vazio_sem_nulo()
        {
            _repositorio.ContarFacetasAsync(Arg.Any<FiltroPlano>()).Returns(new ContagemFacetas());

            var facetas = await Servico().ObterFacetasAsync(new FiltroPlano());

            // Lista vazia, e não `null`: o front lê `facetas.series.length`
            // sem guarda, e um nulo no JSON viraria erro de tela.
            facetas.Series.Should().BeEmpty();
            facetas.Componentes.Should().BeEmpty();
            facetas.Metodologias.Should().BeEmpty();
        }

        [Fact]
        public async Task ObterFacetasAsync_repassa_o_recorte_ao_repositorio()
        {
            var componente = Guid.NewGuid();
            _repositorio.ContarFacetasAsync(Arg.Any<FiltroPlano>()).Returns(new ContagemFacetas());

            var filtro = new FiltroPlano
            {
                Busca = "juros",
                ComponentesIds = [componente],
                DuracaoMaxima = 3,
            };

            await Servico().ObterFacetasAsync(filtro);

            await _repositorio.Received(1).ContarFacetasAsync(Arg.Is<FiltroPlano>(f =>
                f.Busca == "juros" &&
                f.ComponentesIds.Length == 1 &&
                f.DuracaoMaxima == 3 &&
                !f.IncluirRascunhos));
        }
    }
}
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd planoteca-api && dotnet test --filter PlanoFacetasTest
```

Esperado: falha de compilação, porque `ObterFacetasAsync` ainda não existe em
`PlanoAppService`.

- [x] **Step 3: Implementar no AppService**

Em `PlanoAppService`, logo depois de `ListarAsync`:

```csharp
        public async Task<FacetasDto> ObterFacetasAsync(FiltroPlano filtro)
        {
            var contagem = await _repositorio.ContarFacetasAsync(filtro);

            // Tradução direta, sem `PlanoMapper`: o mapeador existe para
            // achatar as coleções de ligação de um plano, e aqui não há plano
            // nenhum — só par de id e número.
            return new FacetasDto
            {
                Series = ParaDto(contagem.Series),
                Componentes = ParaDto(contagem.Componentes),
                Metodologias = ParaDto(contagem.Metodologias),
            };
        }

        private static List<ContagemDto> ParaDto(IReadOnlyList<FacetaContada> facetas) =>
            facetas.Select(f => new ContagemDto { Id = f.Id, Total = f.Total }).ToList();
```

`PlanoAppService.cs` já importa `System.Collections.Generic`, `System.Linq` e
`SaraivaTech.Planoteca.Application.Dto`. Nenhum `using` novo entra.

- [x] **Step 4: Executar e confirmar que passa**

```bash
cd planoteca-api && dotnet test --filter PlanoFacetasTest
```

Esperado: `Passed! - Failed: 0, Passed: 3` e código 0.

- [x] **Step 5: Commitar**

```bash
git add planoteca-api/src planoteca-api/tests
git commit -m "feat(plano): traduz a contagem de facetas para DTO"
```

---

### Task 4: A rota pública de facetas

**Papel:** escrita
**Verificação:** `cd planoteca-api && dotnet build && dotnet test`

**Fontes:**
- `planoteca-api/src/SaraivaTech.Planoteca.Api/Controllers/LessonPlansController.cs` — a rota pública, `FiltroPlanoRequest` e a razão de não ter `[Authorize]`
- `planoteca-api/src/SaraivaTech.Planoteca.Infra.CrossCutting/IoC/DependencyInjectionBootStrapper.cs` — onde o registro de DI mora, caso surja interface nova
- `docs/specs/2026-08-26-filtros-biblioteca.md` — RF-01

**Files:**
- Modify: `planoteca-api/src/SaraivaTech.Planoteca.Api/Controllers/LessonPlansController.cs`

**Interfaces:**
- Consumes: `IPlanoAppService.ObterFacetasAsync` da Task 3.
- Produces: `GET /api/v1/lesson-plans/facets` → `200 FacetasDto`

- [x] **Step 1: Escrever a ação**

Não há teste de controller neste projeto: `tests/SaraivaTech.Planoteca.Test`
tem `Application`, `Base`, `Dominio`, `Helpers` e `Integracao`, e nenhuma pasta
de API. A verificação desta task é o build mais a suíte. O comportamento de
ponta a ponta fica com o e2e do front.

Em `LessonPlansController`, entre `Listar` e `Obter`:

```csharp
        /// <summary>Quantos planos cada item do vocabulário responde, no
        /// recorte atual.
        ///
        /// `[AllowAnonymous]` pela mesma razão da listagem: a coluna de filtro
        /// é parte da Biblioteca, e a Biblioteca é pública. Ver o comentário
        /// no alto desta classe antes de acrescentar `[Authorize]`.
        /// </summary>
        [HttpGet("facets")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(FacetasDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> Facetas([FromQuery] FiltroPlanoRequest requisicao)
        {
            var filtro = new FiltroPlano
            {
                Busca = requisicao.Busca,
                ComponentesIds = requisicao.ComponenteId ?? Array.Empty<Guid>(),
                SeriesIds = requisicao.SerieId ?? Array.Empty<Guid>(),
                MetodologiasIds = requisicao.MetodologiaId ?? Array.Empty<Guid>(),
                DuracaoMinima = requisicao.DuracaoMinima,
                DuracaoMaxima = requisicao.DuracaoMaxima,
                // `Pagina` e `TamanhoPagina` ficam de fora de propósito
                // (RF-01): a contagem é do recorte inteiro. Copiá-los daria um
                // número que muda ao virar a página.
                IncluirRascunhos = false,
            };

            // 200 com as três listas vazias quando nada casa, e não 204: a
            // coluna de filtro precisa desenhar os itens com zero. Um corpo
            // ausente faria a tela alternar entre com e sem filtro a cada
            // teclada da busca.
            return Ok(await _app.ObterFacetasAsync(filtro));
        }
```

`FiltroPlanoRequest` é reusado sem alteração. A rota `facets` é literal e não
conflita com `{id:guid}` — a restrição de rota já recusa o texto.

- [x] **Step 2: Confirmar que o DI não precisa de registro novo**

```bash
grep -n "IPlanoAppService" planoteca-api/src/SaraivaTech.Planoteca.Infra.CrossCutting/IoC/DependencyInjectionBootStrapper.cs
```

Esperado: a linha `services.AddScoped<IPlanoAppService, PlanoAppService>();`.
Nenhuma interface nasceu nesta feature, então nada entra no bootstrapper.

- [x] **Step 3: Compilar e executar a suíte**

```bash
cd planoteca-api && dotnet build && dotnet test
```

Esperado: `Build succeeded`, `Passed!` e código 0.

- [x] **Step 4: Confirmar que a rota responde sem token**

```bash
cd planoteca-api && dotnet run --project src/SaraivaTech.Planoteca.Api &
curl -i -k "https://localhost:7206/api/v1/lesson-plans/facets"
```

Esperado: `HTTP/1.1 200` e um corpo com `series`, `componentes` e
`metodologias`. Nenhum cabeçalho `Authorization` foi enviado.

- [x] **Step 5: Commitar**

```bash
git add planoteca-api/src
git commit -m "feat(api): expõe GET /lesson-plans/facets"
```

---

### Task 5: Facetas no front — cliente, cache e simulação

**Papel:** analise
**Verificação:** `cd planoteca-web && npx vitest run src/entities/plano/useFacetas.test.tsx`

**Fontes:**
- `planoteca-web/src/entities/plano/api.ts` — `listarPlanos`, `paraParametros` e a forma da chamada tipada
- `planoteca-web/src/shared/api/cliente.ts` — `obter` e como array vira querystring repetida
- `planoteca-web/src/entities/vocabulario/useVocabulario.ts` — chave de cache e `staleTime`
- `planoteca-web/src/teste/servidor.ts` — handlers MSW de `lesson-plans` e `vocabulary`
- `planoteca-web/e2e/simulacao.ts` — o roteador do Playwright e a lógica de filtro da simulação

**Files:**
- Modify: `planoteca-web/src/entities/plano/modelo.ts`
- Modify: `planoteca-web/src/entities/plano/api.ts`
- Create: `planoteca-web/src/entities/plano/useFacetas.ts`
- Modify: `planoteca-web/src/entities/plano/index.ts`
- Modify: `planoteca-web/src/teste/planos.ts`
- Modify: `planoteca-web/src/teste/servidor.ts`
- Modify: `planoteca-web/e2e/simulacao.ts`
- Test: `planoteca-web/src/entities/plano/useFacetas.test.tsx`

**Interfaces:**
- Consumes: `GET /api/v1/lesson-plans/facets` das Tasks 1 a 4.
- Produces: `type ContagemFaceta = { id: string; total: number }`
- Produces: `type Facetas = { series: ContagemFaceta[]; componentes: ContagemFaceta[]; metodologias: ContagemFaceta[] }`
- Produces: `obterFacetas(cliente, filtro?): Promise<Facetas>`
- Produces: `useFacetas(cliente, filtro?)`
- Produces: `contarFacetas(parametros, todos): Facetas` em `src/teste/planos.ts`

- [x] **Step 1: Escrever o teste que falha**

O teste cobre as duas metades do RF-04. Primeiro, que `obterFacetas` chama a
rota sem `page` nem `perPage`. Repetir a paginação faria a chave de cache
alterar a cada troca de página. A coluna piscaria sem nenhum número ter
alterado. Depois, que a contagem obedece ao RF-02: com Matemática marcada, a
contagem do próprio grupo componente ignora a marca. A de série a aplica.

```tsx
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { criarCliente } from '@/shared/api'
import { COMPONENTES_FIXTURE, SERIES_FIXTURE } from '@/teste/planos'
import { obterFacetas } from './api'
import { useFacetas } from './useFacetas'

const BASE = 'https://api.teste'

const cliente = criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })

function envolver({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('facetas', () => {
  it('não manda paginação na querystring', async () => {
    let urlChamada = ''
    const espiao = criarCliente({
      urlBase: BASE,
      lerToken: () => null,
      aoExpirar: () => {},
    })
    const original = espiao.obter
    // Envolve `obter` só para ler o caminho: a asserção é sobre o que o
    // cliente monta, e não sobre o que a simulação devolve.
    espiao.obter = ((caminho: string, parametros?: Record<string, unknown>) => {
      urlChamada = `${caminho}?${new URLSearchParams(
        Object.entries(parametros ?? {})
          .filter(([, v]) => v !== undefined)
          .map(([c, v]) => [c, String(v)]),
      ).toString()}`
      return original.call(espiao, caminho, parametros as never)
    }) as typeof espiao.obter

    await obterFacetas(espiao, { busca: 'juros', pagina: 3, tamanhoPagina: 12 })

    expect(urlChamada).toContain('/lesson-plans/facets')
    expect(urlChamada).toContain('q=juros')
    expect(urlChamada).not.toContain('page=')
    expect(urlChamada).not.toContain('perPage=')
  })

  it('a contagem do próprio grupo ignora a seleção dele, e a dos outros a aplica', async () => {
    const matematica = COMPONENTES_FIXTURE[0]!
    const historia = COMPONENTES_FIXTURE[3]!
    const setimo = SERIES_FIXTURE[1]!

    const { result } = renderHook(
      () => useFacetas(cliente, { componentesIds: [matematica.id] }),
      { wrapper: envolver },
    )

    await waitFor(() => expect(result.current.data).toBeDefined())
    const facetas = result.current.data!

    // RF-02: o grupo componente ignora a própria marca. História continua
    // com os planos de História, e não com zero.
    const deHistoria = facetas.componentes.find((c) => c.id === historia.id)
    expect(deHistoria?.total).toBeGreaterThan(0)

    // Já a série aplica o recorte do OUTRO grupo: o 7º só conta o que também
    // é Matemática. Na fixture os índices ciclam 5 componentes sobre 5
    // séries, e Matemática nunca cai no 7º ano.
    const doSetimo = facetas.series.find((s) => s.id === setimo.id)
    expect(doSetimo?.total ?? 0).toBe(0)
  })

  it('mantém a contagem anterior enquanto a busca nova está em voo', async () => {
    const { result, rerender } = renderHook(
      ({ ids }: { ids: string[] }) => useFacetas(cliente, { componentesIds: ids }),
      { wrapper: envolver, initialProps: { ids: [] as string[] } },
    )

    await waitFor(() => expect(result.current.data).toBeDefined())
    const antes = result.current.data!

    rerender({ ids: [COMPONENTES_FIXTURE[0]!.id] })

    // `keepPreviousData`: sem isto a coluna inteira perderia os números a
    // cada marca, e cada toque pareceria uma tela recarregando.
    expect(result.current.data).toBe(antes)
  })
})
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd planoteca-web && npx vitest run src/entities/plano/useFacetas.test.tsx
```

Esperado: `Failed to resolve import "./useFacetas"` — o módulo ainda não existe.

- [x] **Step 3: Declarar `Facetas` no modelo**

Acrescente ao fim de `src/entities/plano/modelo.ts`:

```ts
/**
 * Quantos planos um item do vocabulário devolveria, dada a seleção atual.
 *
 * A resposta traz só id com pelo menos um plano (RF-01). Id ausente vale
 * zero, e o item continua VISÍVEL na coluna: esconder o que dá zero tiraria
 * da tela a informação de que o componente existe no acervo.
 */
export type ContagemFaceta = {
  id: string
  total: number
}

/**
 * As três contagens de `GET /api/v1/lesson-plans/facets`.
 *
 * A contagem de um grupo IGNORA a seleção do próprio grupo (RF-02). É o que
 * faz o número ao lado de História responder "quantos planos eu ganharia se
 * marcasse História", e não "quantos tenho agora", que seria sempre zero
 * para todo item não marcado.
 */
export type Facetas = {
  series: ContagemFaceta[]
  componentes: ContagemFaceta[]
  metodologias: ContagemFaceta[]
}

/** As facetas vazias. Valor corrente enquanto a busca está em voo: a coluna
 * desenha sem número em vez de quebrar. */
export const FACETAS_VAZIAS: Facetas = {
  series: [],
  componentes: [],
  metodologias: [],
}
```

- [x] **Step 4: Escrever `obterFacetas`**

Em `src/entities/plano/api.ts`, acrescente o import de `Facetas` e a função. O
`paraParametros` já existe e serve: o que se remove é a paginação, e não os
recortes.

```ts
/**
 * As contagens por item do vocabulário, para a coluna de filtro.
 *
 * `pagina` e `tamanhoPagina` são DESCARTADOS antes de montar a querystring.
 * A rota os ignora do lado do servidor, mas mandá-los mudaria a chave de
 * cache de `useFacetas` a cada troca de página — e a coluna refaria a busca
 * sem que nenhum número tivesse mudado.
 *
 * O 204 vira facetas vazias, pelo mesmo motivo de `buscarVocabulario`: uma
 * base sem plano publicado não é erro de rede.
 */
export async function obterFacetas(cliente: Cliente, filtro?: FiltroPlano): Promise<Facetas> {
  const { pagina: _pagina, tamanhoPagina: _tamanho, ...semPaginacao } = filtro ?? {}
  const resposta = await cliente.obter<Facetas>('/lesson-plans/facets', paraParametros(semPaginacao))
  return resposta ?? FACETAS_VAZIAS
}
```

O import no topo do arquivo passa a ser:

```ts
import type { Facetas, Plano, PlanoDetalhe } from './modelo'
import { FACETAS_VAZIAS } from './modelo'
```

- [x] **Step 5: Escrever `useFacetas`**

Arquivo novo `src/entities/plano/useFacetas.ts`:

```ts
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Cliente } from '@/shared/api'
import { obterFacetas } from './api'
import type { FiltroPlano } from './api'

/**
 * As contagens da coluna de filtro, em cache.
 *
 * A chave é `['facetas', filtro-sem-paginação]`, IRMÃ de `['planos', filtro]`
 * e não filha: as duas consultas respondem perguntas diferentes sobre o mesmo
 * recorte, e `invalidateQueries` casa por prefixo — uma chave filha
 * invalidaria a outra em silêncio (`Docs/lessons.md`, 2026-08-23).
 *
 * `placeholderData: keepPreviousData` pelo mesmo motivo de `usePlanos`: sem
 * ele, marcar um componente apagaria TODOS os números da coluna até a
 * resposta nova chegar. Numa tela cujo modo de uso é ligar e desligar item,
 * isso transformaria cada refinamento numa tela recarregando.
 */
export function useFacetas(cliente: Cliente, filtro?: FiltroPlano) {
  const { pagina: _pagina, tamanhoPagina: _tamanho, ...semPaginacao } = filtro ?? {}
  return useQuery({
    queryKey: ['facetas', semPaginacao],
    queryFn: () => obterFacetas(cliente, filtro),
    placeholderData: keepPreviousData,
  })
}
```

- [x] **Step 6: Exportar pelo índice da fatia**

Em `src/entities/plano/index.ts`, acrescente às linhas existentes:

```ts
export type { Facetas, ContagemFaceta } from './modelo'
export { FACETAS_VAZIAS } from './modelo'
export { obterFacetas } from './api'
export { useFacetas } from './useFacetas'
```

- [x] **Step 7: Escrever `contarFacetas` na fixture compartilhada**

Em `src/teste/planos.ts`, depois de `paginarPlanos`. É a regra do RF-02
implementada uma vez, para as duas simulações. Escrevê-la duas vezes deixaria
o e2e e o unitário provando contagens diferentes.

```ts
/**
 * As contagens por item, do jeito que a API as calcula (RF-02).
 *
 * A regra em uma linha: a contagem de um grupo aplica o filtro inteiro MENOS
 * a seleção do próprio grupo. É isso que faz o número ao lado de História
 * responder "quantos planos eu ganharia se marcasse História".
 *
 * Só id com pelo menos um plano entra na lista devolvida (RF-01) — id ausente
 * vale zero para quem lê.
 */
export function contarFacetas(
  parametros: URLSearchParams,
  todos: PlanoFixture[],
): {
  series: { id: string; total: number }[]
  componentes: { id: string; total: number }[]
  metodologias: { id: string; total: number }[]
} {
  // Reusa `paginarPlanos` com o grupo alvo apagado da querystring, e com a
  // paginação neutralizada: a contagem é sobre o conjunto inteiro, e um
  // `perPage` de 12 truncaria o `total` se ele viesse do tamanho da fatia.
  function semGrupo(grupo: string): PlanoFixture[] {
    const copia = new URLSearchParams(parametros)
    copia.delete(grupo)
    copia.delete('page')
    copia.set('perPage', String(todos.length + 1))
    return paginarPlanos(copia, todos).itens
  }

  function contar(planos: PlanoFixture[], idsDoPlano: (p: PlanoFixture) => string[]) {
    const soma = new Map<string, number>()
    for (const plano of planos) {
      // `Set`: um plano interdisciplinar pode citar o mesmo componente como
      // principal e secundário, e ele conta UMA vez.
      for (const id of new Set(idsDoPlano(plano))) {
        soma.set(id, (soma.get(id) ?? 0) + 1)
      }
    }
    return [...soma.entries()].map(([id, total]) => ({ id, total }))
  }

  return {
    series: contar(semGrupo('serie'), (p) => p.series.map((s) => s.id)),
    componentes: contar(semGrupo('componente'), (p) => [
      ...(p.componentePrincipal ? [p.componentePrincipal.id] : []),
      ...p.componentesSecundarios.map((c) => c.id),
    ]),
    metodologias: contar(semGrupo('metodologia'), (p) => p.metodologias.map((m) => m.id)),
  }
}
```

- [x] **Step 8: Acrescentar o handler MSW**

Em `src/teste/servidor.ts`, importe `contarFacetas` do bloco de import que já
traz `paginarPlanos`. Acrescente o handler ANTES do handler de
`*/api/v1/lesson-plans/:id` — o MSW casa na ordem, e `:id` engoliria `facets`.

```ts
  // As contagens da coluna de filtro (RF-10). Entra ANTES do handler de
  // `/lesson-plans/:id`: o MSW casa por ordem, e o parâmetro `:id` casaria
  // com o literal `facets`, devolvendo 404 para a rota certa.
  http.get('*/api/v1/lesson-plans/facets', ({ request }) =>
    HttpResponse.json(contarFacetas(new URL(request.url).searchParams, PLANOS_PADRAO)),
  ),
```

- [x] **Step 9: Acrescentar o mesmo handler à simulação do Playwright**

Em `e2e/simulacao.ts`, importe `contarFacetas` junto de `paginarPlanos` e
acrescente o bloco ANTES do `const fichaPlano = caminho.match(...)`, pela mesma
razão de ordem:

```ts
    if (metodo === 'GET' && caminho === '/lesson-plans/facets') {
      await json(route, 200, contarFacetas(url.searchParams, planos))
      return
    }
```

- [x] **Step 10: Executar e confirmar que passa**

```bash
cd planoteca-web && npx vitest run src/entities/plano/useFacetas.test.tsx
```

Esperado: `3 passed`.

- [x] **Step 11: Commitar**

```bash
git add planoteca-web/src planoteca-web/e2e
git commit -m "feat(biblioteca): busca as contagens por item do vocabulário"
```

---

### Task 6: A régua de série

**Papel:** escrita
**Verificação:** `cd planoteca-web && npx vitest run src/features/filtrar-planos/ReguaSeries.test.tsx`

**Fontes:**
- `design/2026-08-26-filtros-biblioteca-opcoes.html` — o desenho aprovado da opção B, desktop e celular
- `design/DirecaoB.dc.html` — a régua de série e o bloco de sigla como assinatura
- `planoteca-web/src/components/ui/chip.tsx` — o chip da régua de série
- `planoteca-web/src/features/filtrar-planos/FiltrosPlanos.tsx` — o componente que sai; os comentários de acessibilidade que ficam
- `planoteca-web/src/entities/vocabulario/modelo.ts` — tipos de `Vocabulario`, `classeCorComponente` e os quatro tokens de cor

**Files:**
- Create: `planoteca-web/src/features/filtrar-planos/ReguaSeries.tsx`
- Test: `planoteca-web/src/features/filtrar-planos/ReguaSeries.test.tsx`

**Interfaces:**
- Consumes: `Serie` de `@/entities/vocabulario`, `Chip` de `@/components/ui/chip`.
- Produces: `ReguaSeries(props: { series: Serie[]; selecionadas: string[]; aoAlternar: (id: string) => void })`

- [x] **Step 1: Escrever o teste que falha**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SERIES_FIXTURE } from '@/teste/planos'
import { ReguaSeries } from './ReguaSeries'

describe('ReguaSeries', () => {
  it('desenha uma célula por série, com a sigla à vista e o nome completo no rótulo', () => {
    render(<ReguaSeries series={SERIES_FIXTURE} selecionadas={[]} aoAlternar={() => {}} />)

    const botoes = screen.getAllByRole('button')
    expect(botoes).toHaveLength(SERIES_FIXTURE.length)

    // A sigla é o que se vê; o nome completo é o que o leitor de tela
    // anuncia. "2ªEM" não se lê sozinho.
    const sexto = screen.getByRole('button', { name: '6º ano do Ensino Fundamental' })
    expect(sexto).toHaveTextContent('6º')
  })

  it('marca a série selecionada com aria-pressed', () => {
    const nono = SERIES_FIXTURE[3]!
    render(<ReguaSeries series={SERIES_FIXTURE} selecionadas={[nono.id]} aoAlternar={() => {}} />)

    expect(screen.getByRole('button', { name: nono.rotuloCompleto })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: SERIES_FIXTURE[0]!.rotuloCompleto })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('chama aoAlternar com o id da série tocada', async () => {
    const usuario = userEvent.setup()
    const aoAlternar = vi.fn()
    render(<ReguaSeries series={SERIES_FIXTURE} selecionadas={[]} aoAlternar={aoAlternar} />)

    await usuario.click(screen.getByRole('button', { name: SERIES_FIXTURE[1]!.rotuloCompleto }))

    expect(aoAlternar).toHaveBeenCalledWith(SERIES_FIXTURE[1]!.id)
  })

  it('não desenha nada quando não há série', () => {
    const { container } = render(
      <ReguaSeries series={[]} selecionadas={[]} aoAlternar={() => {}} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd planoteca-web && npx vitest run src/features/filtrar-planos/ReguaSeries.test.tsx
```

Esperado: `Failed to resolve import "./ReguaSeries"`.

- [x] **Step 3: Implementar**

```tsx
import type { Serie } from '@/entities/vocabulario'
import { Chip } from '@/components/ui/chip'
import { EtiquetaGrupo } from './EtiquetaGrupo'

interface ReguaSeriesProps {
  series: Serie[]
  /** Multisseleção: uma célula fica ativa quando o id consta na lista. */
  selecionadas: string[]
  aoAlternar: (id: string) => void
}

/**
 * A régua de série — a assinatura da direção B, mantida da coluna antiga.
 *
 * Série continua RÉGUA e não lista com caixa de marcar, ao contrário de
 * componente e metodologia. A razão é o número: as séries da educação
 * básica são sete e não crescem, então cabem todas numa faixa de células
 * iguais. Componente e metodologia crescem por cadastro, e por isso viraram
 * lista com contagem e dobra.
 *
 * As células não têm contagem própria de propósito. Sete números miúdos numa
 * faixa de 272px competiriam com a sigla, que é o que se lê à distância.
 *
 * A grade se ajusta ao conteúdo (`auto-fit`) em vez de fixar colunas: o dia
 * em que a oitava série entrar, ela cabe sem ninguém alterar esta linha.
 */
export function ReguaSeries({ series, selecionadas, aoAlternar }: ReguaSeriesProps) {
  if (series.length === 0) return null

  return (
    /* `fieldset` + `legend`: a régua é um grupo de controles com um rótulo
       comum, e é assim que um leitor de tela anuncia "Série, botão 9º ano
       do Ensino Fundamental, pressionado". Um `div` com um `p` acima leria
       as células sem dizer do que são. */
    <fieldset className="border-0 p-0">
      <legend className="mb-[7px] p-0">
        <EtiquetaGrupo>Série</EtiquetaGrupo>
      </legend>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(48px,1fr))] gap-[3px]">
        {series.map((serie) => (
          <Chip
            key={serie.id}
            ativo={selecionadas.includes(serie.id)}
            onClick={() => aoAlternar(serie.id)}
            // O chip mostra a sigla, que é curta; o nome completo vai no
            // rótulo acessível, porque "2ªEM" não se lê sozinho.
            aria-label={serie.rotuloCompleto}
            className="px-0.5 text-[12px]"
          >
            {serie.sigla}
          </Chip>
        ))}
      </div>
    </fieldset>
  )
}
```

- [x] **Step 4: Extrair `EtiquetaGrupo`**

O rótulo em mono, caixa alta e espacejado vivia dentro de `FiltrosPlanos.tsx`,
que sai na Task 11. Três componentes o usam agora, então ele passa a ter arquivo
próprio. Crie `src/features/filtrar-planos/EtiquetaGrupo.tsx`:

```tsx
/** O rótulo em mono, caixa alta e espacejado que a direção usa nas seções.
 * Saiu de dentro de `FiltrosPlanos.tsx` quando o painel virou três
 * componentes: os três precisam do mesmo rótulo, e uma cópia em cada um
 * divergiria no primeiro ajuste de espacejamento. */
export function EtiquetaGrupo({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
      {children}
    </span>
  )
}
```

- [x] **Step 5: Executar e confirmar que passa**

```bash
cd planoteca-web && npx vitest run src/features/filtrar-planos/ReguaSeries.test.tsx
```

Esperado: `4 passed`.

- [x] **Step 6: Commitar**

```bash
git add planoteca-web/src/features/filtrar-planos
git commit -m "feat(biblioteca): régua de série como componente próprio"
```

---

### Task 7: O grupo de filtro com caixa de marcar, contagem e dobra

**Papel:** analise
**Verificação:** `cd planoteca-web && npx vitest run src/features/filtrar-planos/GrupoFiltro.test.tsx`

**Fontes:**
- `design/2026-08-26-filtros-biblioteca-opcoes.html` — o desenho aprovado da opção B, desktop e celular
- `design/tokens.css` — paleta, traço, alvo de 44px, fontes
- `planoteca-web/src/entities/vocabulario/modelo.ts` — tipos de `Vocabulario`, `classeCorComponente` e os quatro tokens de cor
- `planoteca-web/src/pages/biblioteca/FichaPlano.tsx` — o bloco de sigla com `classeCorComponente`
- `planoteca-web/scripts/verifica-tokens.mjs` — o que o lint reprova em classe e cor
- `planoteca-web/src/components/ui/chip.tsx` — o chip da régua de série

**Files:**
- Create: `planoteca-web/src/components/ui/caixa-marcar.tsx`
- Create: `planoteca-web/src/features/filtrar-planos/GrupoFiltro.tsx`
- Test: `planoteca-web/src/features/filtrar-planos/GrupoFiltro.test.tsx`

**Interfaces:**
- Consumes: `ContagemFaceta` de `@/entities/plano`, `classeCorComponente` de `@/entities/vocabulario`.
- Produces: `CaixaMarcar(props: React.ComponentProps<'input'>)` em `components/ui`.
- Produces: `type ItemFiltro = { id: string; nome: string; sigla?: string; cor?: string }` — um `Componente` do vocabulário já o satisfaz.
- Produces: `GrupoFiltro(props: { titulo, itens, selecionados, contagens, aoAlternar, comSigla? })`

- [x] **Step 1: Escrever o teste que falha**

Ele cobre os dois critérios de aceite do RF-07: com 12 itens mostra 8 e "mais
4". O item marcado na posição 11 aparece sem ninguém expandir.

```tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GrupoFiltro } from './GrupoFiltro'

/** Doze itens: quatro a mais que o limite de 8 do RF-07. */
const DOZE = Array.from({ length: 12 }, (_, indice) => ({
  id: `id-${indice + 1}`,
  nome: `Item ${indice + 1}`,
}))

const CONTAGENS = DOZE.map((item, indice) => ({ id: item.id, total: 12 - indice }))

describe('GrupoFiltro', () => {
  it('com 12 itens mostra 8 e um botão "mais 4"', () => {
    render(
      <GrupoFiltro
        titulo="Componente"
        itens={DOZE}
        selecionados={[]}
        contagens={CONTAGENS}
        aoAlternar={() => {}}
      />,
    )

    expect(screen.getAllByRole('checkbox')).toHaveLength(8)
    expect(screen.getByRole('button', { name: 'mais 4' })).toBeInTheDocument()
  })

  it('expandir mostra os 12, e o botão passa a recolher', async () => {
    const usuario = userEvent.setup()
    render(
      <GrupoFiltro
        titulo="Componente"
        itens={DOZE}
        selecionados={[]}
        contagens={CONTAGENS}
        aoAlternar={() => {}}
      />,
    )

    await usuario.click(screen.getByRole('button', { name: 'mais 4' }))

    expect(screen.getAllByRole('checkbox')).toHaveLength(12)
    expect(screen.getByRole('button', { name: 'Mostrar menos' })).toBeInTheDocument()
  })

  it('item marcado na posição 11 aparece sem expandir', () => {
    const decimoPrimeiro = DOZE[10]!
    render(
      <GrupoFiltro
        titulo="Componente"
        itens={DOZE}
        selecionados={[decimoPrimeiro.id]}
        contagens={CONTAGENS}
        aoAlternar={() => {}}
      />,
    )

    // Marcado fora dos oito primeiros continua VISÍVEL: esconder o que a
    // pessoa acabou de marcar faria a seleção parecer que se perdeu.
    const marcado = screen.getByRole('checkbox', { name: /Item 11/ })
    expect(marcado).toBeChecked()
    // Ele entra ALÉM dos oito, e não no lugar de um deles.
    expect(screen.getAllByRole('checkbox')).toHaveLength(9)
    expect(screen.getByRole('button', { name: 'mais 4' })).toBeInTheDocument()
  })

  it('mostra a contagem de cada item, e zero para o id ausente da resposta', () => {
    render(
      <GrupoFiltro
        titulo="Componente"
        itens={DOZE.slice(0, 2)}
        selecionados={[]}
        // O segundo item NÃO consta: a API só devolve id com pelo menos um
        // plano (RF-01), e o ausente vale zero.
        contagens={[{ id: 'id-1', total: 12 }]}
        aoAlternar={() => {}}
      />,
    )

    const primeiro = screen.getByRole('checkbox', { name: /Item 1/ }).closest('label')!
    expect(within(primeiro).getByText('12')).toBeInTheDocument()

    const segundo = screen.getByRole('checkbox', { name: /Item 2/ }).closest('label')!
    expect(within(segundo).getByText('0')).toBeInTheDocument()
    // Contagem zero fica visível e clicável (RF-06).
    expect(screen.getByRole('checkbox', { name: /Item 2/ })).toBeEnabled()
  })

  it('chama aoAlternar com o id do item marcado', async () => {
    const usuario = userEvent.setup()
    const aoAlternar = vi.fn()
    render(
      <GrupoFiltro
        titulo="Componente"
        itens={DOZE}
        selecionados={[]}
        contagens={CONTAGENS}
        aoAlternar={aoAlternar}
      />,
    )

    await usuario.click(screen.getByRole('checkbox', { name: /Item 3/ }))

    expect(aoAlternar).toHaveBeenCalledWith('id-3')
  })

  it('o resumo traz o nome do grupo e o total de itens', () => {
    render(
      <GrupoFiltro
        titulo="Metodologia"
        itens={DOZE}
        selecionados={[]}
        contagens={CONTAGENS}
        aoAlternar={() => {}}
      />,
    )

    const resumo = screen.getByText('Metodologia').closest('summary')!
    expect(within(resumo).getByText('· 12')).toBeInTheDocument()
  })

  it('com sigla, desenha o bloco de cor do componente', () => {
    render(
      <GrupoFiltro
        titulo="Componente"
        comSigla
        itens={[{ id: 'id-ma', nome: 'Matemática', sigla: 'MA', cor: 'comp-matematica' }]}
        selecionados={[]}
        contagens={[{ id: 'id-ma', total: 3 }]}
        aoAlternar={() => {}}
      />,
    )

    const bloco = screen.getByText('MA')
    expect(bloco).toHaveClass('bg-comp-matematica')
    // A sigla é pista VISUAL redundante: o nome por extenso vem ao lado.
    expect(bloco).toHaveAttribute('aria-hidden', 'true')
  })

  it('não desenha nada quando não há item', () => {
    const { container } = render(
      <GrupoFiltro
        titulo="Componente"
        itens={[]}
        selecionados={[]}
        contagens={[]}
        aoAlternar={() => {}}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd planoteca-web && npx vitest run src/features/filtrar-planos/GrupoFiltro.test.tsx
```

Esperado: `Failed to resolve import "./GrupoFiltro"`.

- [x] **Step 3: Escrever `CaixaMarcar` em `components/ui/`**

`react/forbid-elements` proíbe `<input>` cru fora de `src/components/ui/`
(`eslint.config.js`, bloco `files: ['src/components/ui/**/*.tsx']`), e o projeto
não tem `checkbox.tsx` — o shadcn nunca o instalou aqui. A caixa nasce onde a
regra a permite, pelo mesmo raciocínio já escrito em `chip.tsx` e em
`campo-busca.tsx`. Este É o componente do sistema.

```tsx
import * as React from 'react'

import { cn } from '@/shared/lib/cn'

/**
 * A caixa de marcar da Planoteca: quadrado de traço, canto vivo, sem raio.
 *
 * **Por que não é o `Checkbox` do shadcn.** Ele não está instalado, e o que
 * a CLI instalaria traz `rounded-sm` e um `data-state` desenhado com ícone
 * embutido — a direção B pede o quadrado nu de 2px, e o `accent-color`
 * nativo resolve o preenchimento sem SVG nem estado em JavaScript.
 *
 * **Por que mora aqui.** É o único lugar onde `react/forbid-elements`
 * permite o `<input>` cru, e é a mesma razão de `Chip` e `CampoBusca`
 * morarem ao lado: a regra existe para cobrar o componente do sistema nas
 * telas, e este é o componente do sistema.
 *
 * `accent-primary` pinta o quadrado marcado com a cor de seleção do tema.
 * `appearance-none` fica de FORA de propósito: sem a aparência nativa, o
 * indicador de marcado teria de ser desenhado à mão, e o modo de alto
 * contraste do sistema operacional deixaria de o reconhecer.
 */
function CaixaMarcar({ className, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  return (
    <input
      type="checkbox"
      data-slot="caixa-marcar"
      className={cn(
        'size-4 shrink-0 accent-primary outline-offset-2 focus-visible:outline-3 focus-visible:outline-ring',
        className,
      )}
      {...props}
    />
  )
}

export { CaixaMarcar }
```

- [x] **Step 4: Escrever `GrupoFiltro`**

```tsx
import { useState } from 'react'
import type { ContagemFaceta } from '@/entities/plano'
import { classeCorComponente } from '@/entities/vocabulario'
import { Button } from '@/components/ui/button'
import { CaixaMarcar } from '@/components/ui/caixa-marcar'

/** Quantos itens o grupo mostra antes de dobrar (RF-07). Oito é o que cabe
 * na coluna sem obrigar rolagem dentro dela numa tela de 1080px de altura. */
const LIMITE = 8

/** O que um item precisa ter para entrar no grupo. `sigla` e `cor` só o
 * componente tem — a metodologia não carrega bloco colorido. */
export type ItemFiltro = {
  id: string
  nome: string
  sigla?: string
  /** O token de cor do tema. O tipo é o mesmo que `classeCorComponente`
   * consome, então um `Componente` do vocabulário JÁ satisfaz `ItemFiltro`
   * — o painel passa a lista da API sem mapear campo a campo. */
  cor?: string
}

interface GrupoFiltroProps {
  titulo: string
  itens: ItemFiltro[]
  selecionados: string[]
  contagens: ContagemFaceta[]
  aoAlternar: (id: string) => void
  /** Desenha o bloco de sigla colorido à esquerda do nome. Só componente
   * curricular o tem: é a assinatura que a ficha do plano já usa. */
  comSigla?: boolean
}

/**
 * Um grupo da coluna de filtro: componente ou metodologia.
 *
 * **Por que `details`/`summary`, e não um botão com estado.** Dobrar é
 * exatamente o que o elemento faz, com teclado, com leitor de tela e sem
 * JavaScript. Reimplementá-lo custaria `aria-expanded`, `aria-controls` e o
 * tratamento de Enter e Espaço — três coisas para errar num comportamento
 * que o navegador já entrega correto.
 *
 * **Por que a contagem fica em mono, à direita.** Ela é número, e alinhada
 * à direita em fonte de largura fixa a coluna de números lê como coluna. Em
 * fonte proporcional, "12" e "9" desalinham e a leitura vertical se perde.
 *
 * **Por que o item com zero continua clicável.** Desabilitá-lo esconderia
 * que o componente existe no acervo. O zero informa; o item apagado só
 * confunde.
 *
 * O estado do "mais" é LOCAL. Ele não descreve o recorte, e sim quanto da
 * lista está à vista — pô-lo na URL faria "manda o link desse filtro"
 * carregar uma preferência de tela junto com a seleção.
 */
export function GrupoFiltro({
  titulo,
  itens,
  selecionados,
  contagens,
  aoAlternar,
  comSigla = false,
}: GrupoFiltroProps) {
  const [expandido, definirExpandido] = useState(false)

  if (itens.length === 0) return null

  const totalPorId = new Map(contagens.map((c) => [c.id, c.total]))
  const escondidos = itens.length - LIMITE

  // Item marcado aparece SEMPRE, mesmo fora dos oito primeiros (RF-07):
  // esconder o que a pessoa acabou de marcar faria a seleção parecer
  // perdida, e o clique de desmarcar deixaria de ter alvo.
  const visiveis = expandido
    ? itens
    : itens.filter((item, indice) => indice < LIMITE || selecionados.includes(item.id))

  return (
    <details open className="border-t-2 border-traco pt-[11px]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1">
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {titulo}{' '}
          <span className="font-normal normal-case">· {itens.length}</span>
        </span>
      </summary>

      <ul className="mt-[7px] flex list-none flex-col p-0">
        {visiveis.map((item) => (
          <li key={item.id}>
            {/* O `label` embrulha a caixa: o alvo de toque passa a ser a
                linha inteira, e não o quadrado de 16px. Num celular, essa é
                a diferença entre marcar e errar. */}
            <label className="flex min-h-11 cursor-pointer items-center gap-2 py-1 text-[13.5px] hover:bg-muted">
              <CaixaMarcar
                checked={selecionados.includes(item.id)}
                onChange={() => aoAlternar(item.id)}
              />
              {comSigla && (
                /* `aria-hidden`: a sigla é pista VISUAL redundante — o nome
                   por extenso vem na mesma linha, e um leitor de tela que
                   anunciasse "MA, Matemática" leria duas vezes o mesmo. */
                {/* A MESMA receita de `CardArea.tsx`, à letra: `size-7`,
                    `place-items-center`, `text-xs`. O bloco de sigla é a
                    assinatura da direção, e assinatura que muda de tamanho
                    entre telas deixa de ser assinatura. */}
                <span
                  aria-hidden
                  className={`grid size-7 flex-none place-items-center font-display text-xs font-bold text-comp-texto ${classeCorComponente(
                    item.cor ? { cor: item.cor } : null,
                  )}`}
                >
                  {item.sigla}
                </span>
              )}
              <span className="grow truncate">{item.nome}</span>
              <span className="shrink-0 font-mono text-[11.5px] text-muted-foreground tabular-nums">
                {totalPorId.get(item.id) ?? 0}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {escondidos > 0 && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => definirExpandido((atual) => !atual)}
          className="min-h-11 rounded-none px-0 text-[12px] font-bold text-accent hover:bg-transparent hover:text-accent hover:underline"
        >
          {expandido ? 'Mostrar menos' : `mais ${escondidos}`}
        </Button>
      )}
    </details>
  )
}
```

- [x] **Step 5: Executar e confirmar que passa**

```bash
cd planoteca-web && npx vitest run src/features/filtrar-planos/GrupoFiltro.test.tsx
```

Esperado: `8 passed`.

- [x] **Step 6: Confirmar que o lint aceita a caixa e as classes**

```bash
cd planoteca-web && npx eslint src/components/ui/caixa-marcar.tsx src/features/filtrar-planos/GrupoFiltro.tsx && node scripts/verifica-tokens.mjs
```

Esperado: nenhuma saída do `eslint`, e `ok — N arquivo(s) verificado(s)` do
verificador. Se `react/forbid-elements` acusar o `<input>`, a caixa está no
arquivo errado: ela precisa morar em `src/components/ui/`.

- [x] **Step 7: Commitar**

```bash
git add planoteca-web/src/components/ui/caixa-marcar.tsx planoteca-web/src/features/filtrar-planos
git commit -m "feat(biblioteca): grupo de filtro com contagem e dobra"
```

---

### Task 8: As pílulas de seleção ativa

**Papel:** escrita
**Verificação:** `cd planoteca-web && npx vitest run src/features/filtrar-planos/SelecaoAtiva.test.tsx`

**Fontes:**
- `design/2026-08-26-filtros-biblioteca-opcoes.html` — o desenho aprovado da opção B, desktop e celular
- `planoteca-web/src/features/filtrar-planos/FiltrosPlanos.tsx` — o componente que sai; os comentários de acessibilidade que ficam
- `planoteca-web/src/entities/vocabulario/modelo.ts` — tipos de `Vocabulario`, `classeCorComponente` e os quatro tokens de cor

**Files:**
- Create: `planoteca-web/src/features/filtrar-planos/SelecaoAtiva.tsx`
- Test: `planoteca-web/src/features/filtrar-planos/SelecaoAtiva.test.tsx`

**Interfaces:**
- Consumes: `Vocabulario` de `@/entities/vocabulario`.
- Produces: `SelecaoAtiva(props: { vocabulario, componentesIds, seriesIds, metodologiasIds, aoAlternarComponente, aoAlternarSerie, aoAlternarMetodologia, aoLimpar })`

- [x] **Step 1: Escrever o teste que falha**

O critério de aceite: o ✕ de uma pílula chama o callback do grupo certo com o
id certo.

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VOCABULARIO_FIXTURE } from '@/teste/planos'
import { SelecaoAtiva } from './SelecaoAtiva'

const MATEMATICA = VOCABULARIO_FIXTURE.componentes[0]!
const NONO = VOCABULARIO_FIXTURE.series[3]!
const ESTACOES = VOCABULARIO_FIXTURE.metodologias[0]!

function renderizar(sobrepor: Partial<React.ComponentProps<typeof SelecaoAtiva>> = {}) {
  const props = {
    vocabulario: VOCABULARIO_FIXTURE,
    componentesIds: [MATEMATICA.id],
    seriesIds: [NONO.id],
    metodologiasIds: [ESTACOES.id],
    aoAlternarComponente: vi.fn(),
    aoAlternarSerie: vi.fn(),
    aoAlternarMetodologia: vi.fn(),
    aoLimpar: vi.fn(),
    ...sobrepor,
  }
  render(<SelecaoAtiva {...props} />)
  return props
}

describe('SelecaoAtiva', () => {
  it('desenha uma pílula por item marcado, com o rótulo completo da série', () => {
    renderizar()

    expect(screen.getByRole('button', { name: `Remover ${MATEMATICA.nome}` })).toBeInTheDocument()
    // A série mostra `rotuloCompleto` (RF-08): "9º" fora da régua não se lê.
    expect(screen.getByText(NONO.rotuloCompleto)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Remover ${ESTACOES.nome}` })).toBeInTheDocument()
  })

  it('o ✕ de um componente chama o callback do grupo componente com o id', async () => {
    const usuario = userEvent.setup()
    const props = renderizar()

    await usuario.click(screen.getByRole('button', { name: `Remover ${MATEMATICA.nome}` }))

    expect(props.aoAlternarComponente).toHaveBeenCalledWith(MATEMATICA.id)
    expect(props.aoAlternarSerie).not.toHaveBeenCalled()
    expect(props.aoAlternarMetodologia).not.toHaveBeenCalled()
  })

  it('o ✕ de uma série chama o callback do grupo série com o id', async () => {
    const usuario = userEvent.setup()
    const props = renderizar()

    await usuario.click(screen.getByRole('button', { name: `Remover ${NONO.rotuloCompleto}` }))

    expect(props.aoAlternarSerie).toHaveBeenCalledWith(NONO.id)
    expect(props.aoAlternarComponente).not.toHaveBeenCalled()
  })

  it('"Limpar filtros" chama aoLimpar', async () => {
    const usuario = userEvent.setup()
    const props = renderizar()

    await usuario.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(props.aoLimpar).toHaveBeenCalled()
  })

  it('não desenha nada sem seleção', () => {
    const { container } = render(
      <SelecaoAtiva
        vocabulario={VOCABULARIO_FIXTURE}
        componentesIds={[]}
        seriesIds={[]}
        metodologiasIds={[]}
        aoAlternarComponente={() => {}}
        aoAlternarSerie={() => {}}
        aoAlternarMetodologia={() => {}}
        aoLimpar={() => {}}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('id desconhecido na URL não vira pílula fantasma', () => {
    renderizar({ componentesIds: ['nao-existe-no-vocabulario'] })

    // Um link antigo com id que saiu do vocabulário não desenha pílula sem
    // nome — o item simplesmente não aparece, e o recorte segue sem ele.
    expect(screen.queryByText('nao-existe-no-vocabulario')).not.toBeInTheDocument()
  })
})
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd planoteca-web && npx vitest run src/features/filtrar-planos/SelecaoAtiva.test.tsx
```

Esperado: `Failed to resolve import "./SelecaoAtiva"`.

- [x] **Step 3: Implementar**

```tsx
import { X } from '@phosphor-icons/react/dist/csr/X'
import type { Vocabulario } from '@/entities/vocabulario'
import { Button } from '@/components/ui/button'

interface SelecaoAtivaProps {
  vocabulario: Vocabulario
  componentesIds: string[]
  seriesIds: string[]
  metodologiasIds: string[]
  aoAlternarComponente: (id: string) => void
  aoAlternarSerie: (id: string) => void
  aoAlternarMetodologia: (id: string) => void
  aoLimpar: () => void
}

/** Uma pílula: o rótulo do item e o ✕ que o remove. */
function Pilula({ rotulo, aoRemover }: { rotulo: string; aoRemover: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={aoRemover}
      // O rótulo acessível diz a AÇÃO, e não só o nome: sem ele, um leitor
      // de tela anunciaria três botões chamados "Matemática", "9º ano" e
      // "Estudo de Casos", sem dizer que tocá-los REMOVE o recorte.
      aria-label={`Remover ${rotulo}`}
      className="min-h-11 gap-1.5 rounded-none border-2 border-traco bg-card px-2.5 text-[12.5px] font-semibold"
    >
      {rotulo}
      <X size={12} weight="bold" aria-hidden="true" />
    </Button>
  )
}

/**
 * A seleção atual, acima da lista de planos.
 *
 * **Por que ela existe, já que a coluna mostra o mesmo.** No celular a
 * coluna vira gaveta, e com a gaveta fechada nada na tela diria o que está
 * recortado. As pílulas são a única leitura da seleção nessa largura. No
 * desktop elas continuam, e passam a ser o caminho curto de desfazer um
 * item sem procurá-lo na lista.
 *
 * **Por que a série usa `rotuloCompleto`.** Na régua, "9º" está cercado de
 * outras siglas e o contexto o resolve. Numa pílula solta ao lado de
 * "Matemática", "9º" não diz de que etapa é.
 *
 * Um id que não casa com nenhum item do vocabulário simplesmente não vira
 * pílula. É o caso do link antigo com um componente já removido: o recorte
 * segue aplicado, e a tela não desenha uma pílula sem nome.
 */
export function SelecaoAtiva({
  vocabulario,
  componentesIds,
  seriesIds,
  metodologiasIds,
  aoAlternarComponente,
  aoAlternarSerie,
  aoAlternarMetodologia,
  aoLimpar,
}: SelecaoAtivaProps) {
  const componentes = vocabulario.componentes.filter((c) => componentesIds.includes(c.id))
  const series = vocabulario.series.filter((s) => seriesIds.includes(s.id))
  const metodologias = vocabulario.metodologias.filter((m) => metodologiasIds.includes(m.id))

  if (componentes.length + series.length + metodologias.length === 0) return null

  return (
    /* `aria-live="polite"`: as pílulas mudam por causa de um toque em OUTRO
       elemento — uma caixa da coluna, uma célula da régua — e o foco fica
       lá. Sem isto, quem usa leitor de tela não saberia que a seleção
       mudou. */
    <div aria-live="polite" aria-label="Filtros ativos" className="flex flex-wrap items-center gap-1.5">
      {series.map((serie) => (
        <Pilula
          key={serie.id}
          rotulo={serie.rotuloCompleto}
          aoRemover={() => aoAlternarSerie(serie.id)}
        />
      ))}
      {componentes.map((componente) => (
        <Pilula
          key={componente.id}
          rotulo={componente.nome}
          aoRemover={() => aoAlternarComponente(componente.id)}
        />
      ))}
      {metodologias.map((metodologia) => (
        <Pilula
          key={metodologia.id}
          rotulo={metodologia.nome}
          aoRemover={() => aoAlternarMetodologia(metodologia.id)}
        />
      ))}
      <Button
        type="button"
        variant="ghost"
        onClick={aoLimpar}
        className="min-h-11 rounded-none px-2 text-[12.5px] font-bold text-accent hover:bg-transparent hover:text-accent hover:underline"
      >
        Limpar filtros
      </Button>
    </div>
  )
}
```

- [x] **Step 4: Executar e confirmar que passa**

```bash
cd planoteca-web && npx vitest run src/features/filtrar-planos/SelecaoAtiva.test.tsx
```

Esperado: `6 passed`.

- [x] **Step 5: Commitar**

```bash
git add planoteca-web/src/features/filtrar-planos
git commit -m "feat(biblioteca): pílulas da seleção ativa"
```

---

### Task 9: O painel que compõe os três grupos

**Papel:** escrita
**Verificação:** `cd planoteca-web && npx vitest run src/features/filtrar-planos/PainelFiltros.test.tsx`

**Fontes:**
- `design/2026-08-26-filtros-biblioteca-opcoes.html` — o desenho aprovado da opção B, desktop e celular
- `planoteca-web/src/features/filtrar-planos/FiltrosPlanos.tsx` — o componente que sai; os comentários de acessibilidade que ficam
- `planoteca-web/src/entities/vocabulario/modelo.ts` — tipos de `Vocabulario`, `classeCorComponente` e os quatro tokens de cor
- `planoteca-web/src/components/ui/chip.tsx` — o chip da régua de série

**Files:**
- Create: `planoteca-web/src/features/filtrar-planos/PainelFiltros.tsx`
- Modify: `planoteca-web/src/features/filtrar-planos/index.ts`
- Test: `planoteca-web/src/features/filtrar-planos/PainelFiltros.test.tsx`

**Interfaces:**
- Consumes: `ReguaSeries` (Task 6), `GrupoFiltro` (Task 7), `Facetas` (Task 5).
- Produces: `PainelFiltros(props: { pesquisa, aoMudarPesquisa, vocabulario, facetas, componentesIds, aoAlternarComponente, seriesIds, aoAlternarSerie, metodologiasIds, aoAlternarMetodologia, comBusca? })`

- [x] **Step 1: Escrever o teste que falha**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FACETAS_VAZIAS } from '@/entities/plano'
import { VOCABULARIO_FIXTURE } from '@/teste/planos'
import { PainelFiltros } from './PainelFiltros'

function renderizar(sobrepor: Partial<React.ComponentProps<typeof PainelFiltros>> = {}) {
  render(
    <PainelFiltros
      pesquisa=""
      aoMudarPesquisa={() => {}}
      vocabulario={VOCABULARIO_FIXTURE}
      facetas={FACETAS_VAZIAS}
      componentesIds={[]}
      aoAlternarComponente={() => {}}
      seriesIds={[]}
      aoAlternarSerie={() => {}}
      metodologiasIds={[]}
      aoAlternarMetodologia={() => {}}
      {...sobrepor}
    />,
  )
}

describe('PainelFiltros', () => {
  it('compõe busca, régua de série e os dois grupos', () => {
    renderizar()

    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '6º ano do Ensino Fundamental' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Matemática/ })).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: /Rotação por Estações de Aprendizagem/ }),
    ).toBeInTheDocument()
  })

  it('com comBusca falso, a gaveta não repete o campo de busca', () => {
    renderizar({ comBusca: false })

    // A busca fica na PÁGINA no celular (RF-09). Dois campos de busca com o
    // mesmo valor dariam a quem usa leitor de tela dois controles
    // indistinguíveis pelo nome.
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Matemática/ })).toBeInTheDocument()
  })

  it('o filtro de metodologia não oferece ferramenta digital', () => {
    renderizar()

    // "Kahoot" é `tipo: 'ferramenta'` na fixture. A coluna só lista o que é
    // metodologia de fato — as 41 do seed encheriam a lista de itens que
    // nenhum plano usa.
    expect(screen.queryByRole('checkbox', { name: /Kahoot/ })).not.toBeInTheDocument()
  })

  it('a contagem de cada item vem das facetas', () => {
    const matematica = VOCABULARIO_FIXTURE.componentes[0]!
    renderizar({
      facetas: { ...FACETAS_VAZIAS, componentes: [{ id: matematica.id, total: 7 }] },
    })

    const linha = screen.getByRole('checkbox', { name: /Matemática/ }).closest('label')!
    expect(linha).toHaveTextContent('7')
  })
})
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd planoteca-web && npx vitest run src/features/filtrar-planos/PainelFiltros.test.tsx
```

Esperado: `Failed to resolve import "./PainelFiltros"`.

- [x] **Step 3: Implementar**

```tsx
import { useId } from 'react'
import type { Facetas } from '@/entities/plano'
import type { Vocabulario } from '@/entities/vocabulario'
import { CampoBusca } from '@/components/ui/campo-busca'
import { GrupoFiltro } from './GrupoFiltro'
import { ReguaSeries } from './ReguaSeries'

interface PainelFiltrosProps {
  pesquisa: string
  aoMudarPesquisa: (texto: string) => void
  /** As listas vêm da API (`GET /api/v1/vocabulary`), não de uma constante:
   * cadastrar um componente novo passa a funcionar sem deploy. */
  vocabulario: Vocabulario
  /** As contagens de `GET /api/v1/lesson-plans/facets`. Vazias enquanto a
   * busca está em voo: cada item mostra zero, e nenhum some. */
  facetas: Facetas
  componentesIds: string[]
  aoAlternarComponente: (id: string) => void
  seriesIds: string[]
  aoAlternarSerie: (id: string) => void
  metodologiasIds: string[]
  aoAlternarMetodologia: (id: string) => void
  /** A gaveta do celular passa `false`: lá a busca fica na PÁGINA, atrás do
   * botão "Filtros" e não dentro dele. Dois campos de busca com o mesmo
   * valor dariam a quem usa leitor de tela dois controles indistinguíveis
   * pelo nome. */
  comBusca?: boolean
}

/**
 * O painel de filtro da Biblioteca — a coluna do desktop e o miolo da
 * gaveta do celular.
 *
 * Puramente controlado: não conhece URL nem debounce, os dois vivem em
 * `useFiltroPlanos`. `pesquisa` aqui é o valor a cada tecla, não o já
 * comprometido na URL, para o campo não atrasar a digitação.
 *
 * A ordem é a do desenho aprovado (`design/2026-08-26-filtros-biblioteca-opcoes.html`,
 * opção B): busca, série, componente, metodologia. Série vem antes de
 * componente porque a primeira pergunta de um professor é "para que turma",
 * e só depois "de que matéria" — o recorte mais grosso primeiro.
 * Metodologia entrou por último: é o recorte que só quem já sabe o que
 * procura usa.
 *
 * O painel não tem faixa de contagem, ao contrário do `FiltrosPlanos` que
 * ele substitui. O total agora fica ao lado da LISTA, onde o desenho o
 * colocou: com a coluna à esquerda, uma faixa no pé dela ficaria longe do
 * que ela conta.
 */
export function PainelFiltros({
  pesquisa,
  aoMudarPesquisa,
  vocabulario,
  facetas,
  componentesIds,
  aoAlternarComponente,
  seriesIds,
  aoAlternarSerie,
  metodologiasIds,
  aoAlternarMetodologia,
  comBusca = true,
}: PainelFiltrosProps) {
  const idBusca = useId()

  // Só as metodologias ativas de fato, e não as 41 do seed: uma lista com
  // técnicas e ferramentas digitais que nenhum plano usa enche a coluna de
  // itens que sempre devolvem lista vazia.
  const metodologiasFiltro = vocabulario.metodologias.filter((m) => m.tipo === 'metodologia')

  return (
    <div className="flex flex-col gap-[13px]">
      {comBusca && (
        <div>
          <label htmlFor={idBusca} className="sr-only">
            Buscar por assunto, autoria ou objeto de conhecimento
          </label>
          <CampoBusca
            id={idBusca}
            value={pesquisa}
            onChange={(evento) => aoMudarPesquisa(evento.target.value)}
            placeholder="Assunto, autoria ou objeto de conhecimento"
          />
        </div>
      )}

      <ReguaSeries
        series={vocabulario.series}
        selecionadas={seriesIds}
        aoAlternar={aoAlternarSerie}
      />

      <GrupoFiltro
        titulo="Componente"
        comSigla
        itens={vocabulario.componentes}
        selecionados={componentesIds}
        contagens={facetas.componentes}
        aoAlternar={aoAlternarComponente}
      />

      <GrupoFiltro
        titulo="Metodologia"
        itens={metodologiasFiltro}
        selecionados={metodologiasIds}
        contagens={facetas.metodologias}
        aoAlternar={aoAlternarMetodologia}
      />
    </div>
  )
}
```

- [x] **Step 4: Exportar pelo índice da fatia**

`src/features/filtrar-planos/index.ts` passa a exportar o painel ao lado do
componente antigo. `FiltrosPlanos` só sai na Task 11, quando a página deixar
de o usar. Tirá-lo agora quebraria o build entre duas tasks.

```ts
export { FiltrosPlanos } from './FiltrosPlanos'
export { PainelFiltros } from './PainelFiltros'
export { SelecaoAtiva } from './SelecaoAtiva'
export { useFiltroPlanos, TAMANHO_PAGINA } from './useFiltroPlanos'
```

- [x] **Step 5: Executar e confirmar que passa**

```bash
cd planoteca-web && npx vitest run src/features/filtrar-planos/PainelFiltros.test.tsx
```

Esperado: `4 passed`.

- [x] **Step 6: Commitar**

```bash
git add planoteca-web/src/features/filtrar-planos
git commit -m "feat(biblioteca): painel de filtro que compõe régua e grupos"
```

---

### Task 10: A gaveta do celular

**Papel:** analise
**Verificação:** `cd planoteca-web && npx vitest run src/features/filtrar-planos/GavetaFiltros.test.tsx`

**Fontes:**
- `design/2026-08-26-filtros-biblioteca-opcoes.html` — o desenho aprovado da opção B, desktop e celular
- `planoteca-web/src/components/ui/dialog.tsx` — o Radix Dialog que vira gaveta
- `design/tokens.css` — paleta, traço, alvo de 44px, fontes
- `planoteca-web/scripts/verifica-tokens.mjs` — o que o lint reprova em classe e cor

**Files:**
- Modify: `planoteca-web/src/components/ui/dialog.tsx`
- Create: `planoteca-web/src/features/filtrar-planos/GavetaFiltros.tsx`
- Modify: `planoteca-web/src/features/filtrar-planos/index.ts`
- Test: `planoteca-web/src/features/filtrar-planos/GavetaFiltros.test.tsx`

**Interfaces:**
- Consumes: `PainelFiltros` (Task 9), `Dialog` de `@/components/ui/dialog`.
- Produces: `CLASSE_GAVETA: string` exportada de `components/ui/dialog.tsx`.
- Produces: `GavetaFiltros(props: PainelFiltrosProps & { totalAtivos: number; totalPlanos: number; aoLimpar: () => void })`

- [x] **Step 1: Escrever o teste que falha**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FACETAS_VAZIAS } from '@/entities/plano'
import { VOCABULARIO_FIXTURE } from '@/teste/planos'
import { GavetaFiltros } from './GavetaFiltros'

function renderizar(sobrepor: Partial<React.ComponentProps<typeof GavetaFiltros>> = {}) {
  const props = {
    pesquisa: '',
    aoMudarPesquisa: vi.fn(),
    vocabulario: VOCABULARIO_FIXTURE,
    facetas: FACETAS_VAZIAS,
    componentesIds: [] as string[],
    aoAlternarComponente: vi.fn(),
    seriesIds: [] as string[],
    aoAlternarSerie: vi.fn(),
    metodologiasIds: [] as string[],
    aoAlternarMetodologia: vi.fn(),
    totalAtivos: 0,
    totalPlanos: 14,
    aoLimpar: vi.fn(),
    ...sobrepor,
  }
  render(<GavetaFiltros {...props} />)
  return props
}

describe('GavetaFiltros', () => {
  it('o botão nasce fechado e diz "Filtros"', () => {
    renderizar()

    expect(screen.getByRole('button', { name: /Filtros/ })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('o botão mostra quantos itens estão ativos', () => {
    renderizar({ totalAtivos: 3 })

    expect(screen.getByRole('button', { name: /3 ativos/ })).toBeInTheDocument()
  })

  it('abrir mostra o painel sem o campo de busca', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('button', { name: /Filtros/ }))

    const gaveta = await screen.findByRole('dialog')
    expect(gaveta).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Matemática/ })).toBeInTheDocument()
    // A busca fica na página (RF-09), não dentro da gaveta.
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('marcar aplica na hora, sem esperar o rodapé', async () => {
    const usuario = userEvent.setup()
    const props = renderizar()

    await usuario.click(screen.getByRole('button', { name: /Filtros/ }))
    await usuario.click(await screen.findByRole('checkbox', { name: /Matemática/ }))

    expect(props.aoAlternarComponente).toHaveBeenCalledWith(
      VOCABULARIO_FIXTURE.componentes[0]!.id,
    )
  })

  it('"Ver N planos" fecha a gaveta', async () => {
    const usuario = userEvent.setup()
    renderizar({ totalPlanos: 3 })

    await usuario.click(screen.getByRole('button', { name: /Filtros/ }))
    await usuario.click(await screen.findByRole('button', { name: 'Ver 3 planos' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('"Limpar" limpa e fecha', async () => {
    const usuario = userEvent.setup()
    const props = renderizar({ totalAtivos: 2 })

    await usuario.click(screen.getByRole('button', { name: /Filtros/ }))
    await usuario.click(await screen.findByRole('button', { name: 'Limpar' }))

    expect(props.aoLimpar).toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Escape fecha', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('button', { name: /Filtros/ }))
    await screen.findByRole('dialog')
    await usuario.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('o singular concorda quando só há um plano', async () => {
    const usuario = userEvent.setup()
    renderizar({ totalPlanos: 1 })

    await usuario.click(screen.getByRole('button', { name: /Filtros/ }))

    expect(await screen.findByRole('button', { name: 'Ver 1 plano' })).toBeInTheDocument()
  })
})
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd planoteca-web && npx vitest run src/features/filtrar-planos/GavetaFiltros.test.tsx
```

Esperado: `Failed to resolve import "./GavetaFiltros"`.

- [x] **Step 3: Acrescentar a variante de gaveta ao `dialog.tsx`**

Sem dependência nova: `DialogContent` já é um `Dialog.Content` do Radix com
`className` aberto. A gaveta é a mesma peça com outra geometria — colada ao
rodapé, de largura total e altura limitada. Exporte a classe ao lado dos
componentes, no fim do arquivo:

```tsx
/**
 * A variante de GAVETA do `DialogContent`.
 *
 * **Por que uma classe e não um componente.** O Radix já entrega tudo o que
 * a gaveta precisa — foco preso, Escape, `aria-modal`, retorno do foco ao
 * gatilho. O que muda é geometria: onde a caixa encosta e por onde ela
 * entra. Uma classe expressa isso sem uma segunda árvore de componentes a
 * manter em paralelo, e sem `vaul` nem outra biblioteca no `package.json`.
 *
 * As três anulações são deliberadas, e cada uma desfaz um padrão do shadcn
 * que a direção B contradiz (`Docs/lessons.md`, 2026-08-23: o painel do
 * shadcn não segue a direção sozinho):
 *
 * - `rounded-none` contra o `rounded-xl` de fábrica — raio zero é a direção.
 * - `border-t-2 border-traco` contra o `ring-1` — a elevação aqui é traço,
 *   não anel difuso.
 * - `translate-x-0 translate-y-0` contra o `-translate-1/2` do centro — a
 *   gaveta sobe de baixo, e não nasce no meio da tela.
 *
 * `max-h-[85svh]` e não `h-full`: `svh` acompanha a barra do navegador
 * móvel, que `vh` ignora — com `vh`, o rodapé de "Ver N planos" ficaria
 * debaixo da barra do Safari. Os 15% restantes mostram a lista por trás,
 * o que diz de onde a gaveta veio.
 */
const CLASSE_GAVETA =
  'top-auto bottom-0 left-0 max-h-[85svh] w-full max-w-full translate-x-0 translate-y-0 grid-rows-[auto_1fr_auto] gap-0 overflow-y-auto rounded-none border-t-2 border-traco bg-card p-0 ring-0 data-open:slide-in-from-bottom data-closed:slide-out-to-bottom data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-full'
```

E acrescente `CLASSE_GAVETA` à lista de `export { ... }` do fim do arquivo.

- [x] **Step 4: Escrever `GavetaFiltros`**

```tsx
import { useState } from 'react'
import { Funnel } from '@phosphor-icons/react/dist/csr/Funnel'
import { Button } from '@/components/ui/button'
import {
  CLASSE_GAVETA,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PainelFiltros } from './PainelFiltros'

type PainelProps = React.ComponentProps<typeof PainelFiltros>

interface GavetaFiltrosProps extends Omit<PainelProps, 'comBusca'> {
  /** Quantos itens estão marcados nos três grupos. O botão o mostra porque,
   * com a gaveta fechada, ele é a única pista de que há recorte além das
   * pílulas. */
  totalAtivos: number
  /** Quantos planos a seleção atual devolve. Vai para o rótulo do rodapé. */
  totalPlanos: number
  aoLimpar: () => void
}

/**
 * A gaveta de filtro, abaixo de `lg`.
 *
 * **Por que gaveta e não a coluna empilhada.** Em 390px a coluna inteira
 * são uns 700px de filtro antes do primeiro plano. O professor que abre a
 * Biblioteca no celular quer ver plano, não filtro.
 *
 * **Por que marcar aplica na hora, e o rodapé só fecha.** Um rodapé de
 * "Aplicar" exigiria estado temporário dentro da gaveta, divergente da URL
 * enquanto ela está aberta — e um abandono pelo Escape teria de decidir se
 * descarta ou não. Aplicando na hora, a URL continua a fonte única da
 * verdade, e "Ver N planos" é só um jeito de fechar que já diz o que se vai
 * encontrar do lado de fora.
 *
 * Escape, ✕ e clique fora fecham, e o foco volta ao botão "Filtros". Isso é
 * do Radix, não nosso — é a razão de reusar o `Dialog` em vez de desenhar
 * uma gaveta do zero.
 */
export function GavetaFiltros({
  totalAtivos,
  totalPlanos,
  aoLimpar,
  ...painel
}: GavetaFiltrosProps) {
  const [aberta, definirAberta] = useState(false)

  const rotuloPlanos = totalPlanos === 1 ? 'Ver 1 plano' : `Ver ${totalPlanos} planos`

  return (
    <Dialog open={aberta} onOpenChange={definirAberta}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full justify-between rounded-none border-2 border-traco bg-card px-[13px] text-[14px] font-bold"
        >
          <span className="flex items-center gap-2">
            <Funnel size={16} weight="bold" aria-hidden="true" />
            Filtros
          </span>
          {totalAtivos > 0 && (
            <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {totalAtivos} {totalAtivos === 1 ? 'ativo' : 'ativos'}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className={CLASSE_GAVETA}>
        <DialogTitle className="border-b-2 border-traco px-[13px] py-3 font-display text-[17px] font-bold">
          Filtros
        </DialogTitle>

        <div className="overflow-y-auto px-[13px] py-3">
          {/* `comBusca={false}`: a busca fica na PÁGINA, acima do botão que
              abre esta gaveta. Dois campos com o mesmo valor dariam a quem
              usa leitor de tela dois controles indistinguíveis pelo nome. */}
          <PainelFiltros {...painel} comBusca={false} />
        </div>

        <div className="flex gap-2 border-t-2 border-traco px-[13px] py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              aoLimpar()
              definirAberta(false)
            }}
            className="min-h-11 grow rounded-none border-2 border-traco bg-card text-[13.5px] font-bold"
          >
            Limpar
          </Button>
          <Button
            type="button"
            onClick={() => definirAberta(false)}
            className="min-h-11 grow rounded-none bg-primary text-[13.5px] font-bold text-primary-foreground"
          >
            {rotuloPlanos}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [x] **Step 5: Exportar pelo índice da fatia**

```ts
export { GavetaFiltros } from './GavetaFiltros'
```

- [x] **Step 6: Executar e confirmar que passa**

```bash
cd planoteca-web && npx vitest run src/features/filtrar-planos/GavetaFiltros.test.tsx
```

Esperado: `8 passed`.

- [x] **Step 7: Confirmar que nenhuma dependência entrou**

```bash
cd planoteca-web && git diff --stat package.json package-lock.json
```

Esperado: saída vazia. A restrição global da spec diz "sem dependência nova no
front"; qualquer linha aqui significa que a gaveta virou biblioteca.

- [x] **Step 8: Commitar**

```bash
git add planoteca-web/src/components/ui/dialog.tsx planoteca-web/src/features/filtrar-planos
git commit -m "feat(biblioteca): gaveta de filtro no celular sobre o Dialog"
```

---

### Task 11: A Biblioteca em duas colunas

> **Nota de 2026-08-26.** Outra sessão envolveu `PaginaBiblioteca` em `<Container className="py-8">` de `components/container`. Preserve esse envoltório ao reescrever a página. Confira o `git diff` do arquivo antes do Step 1.

**Papel:** analise
**Verificação:** `cd planoteca-web && npm run lint && npx vitest run src/pages/biblioteca && npm run build`

**Fontes:**
- `planoteca-web/src/pages/biblioteca/PaginaBiblioteca.tsx` — o layout atual: header, filtros, lista, paginação
- `planoteca-web/src/features/filtrar-planos/FiltrosPlanos.tsx` — o componente que sai; os comentários de acessibilidade que ficam
- `planoteca-web/src/features/filtrar-planos/useFiltroPlanos.ts` — o contrato de seleção que a coluna consome, sem alteração
- `planoteca-web/src/app/shell/LayoutPublico.tsx` — largura de 1180px e padding por breakpoint
- `design/2026-08-26-filtros-biblioteca-opcoes.html` — o desenho aprovado da opção B, desktop e celular
- `planoteca-web/scripts/verifica-tokens.mjs` — o que o lint reprova em classe e cor

**Files:**
- Modify: `planoteca-web/src/pages/biblioteca/PaginaBiblioteca.tsx`
- Delete: `src/features/filtrar-planos/FiltrosPlanos.tsx`
- Modify: `planoteca-web/src/features/filtrar-planos/index.ts`
- Test: `planoteca-web/src/pages/biblioteca/PaginaBiblioteca.test.tsx`

**Interfaces:**
- Consumes: `PainelFiltros`, `SelecaoAtiva`, `GavetaFiltros`, `useFacetas`.

- [x] **Step 1: Ajustar os testes de página que dependem do chip**

Os testes de `PaginaBiblioteca.test.tsx` acham componente e metodologia por
`getByRole('button', { name: 'Matemática' })`. Componente virou caixa de marcar;
série continua botão. Nos dez casos afetados, troque:

```tsx
// antes
await usuario.click(screen.getByRole('button', { name: 'Matemática' }))
// depois
await usuario.click(await screen.findByRole('checkbox', { name: /Matemática/ }))
```

E a asserção de estado, que era sobre `aria-pressed`, passa a ser sobre marcado:

```tsx
// antes
expect(screen.getByRole('button', { name: 'Matemática' })).toHaveAttribute(
  'aria-pressed',
  'true',
)
// depois
expect(await screen.findByRole('checkbox', { name: /Matemática/ })).toBeChecked()
```

Série NÃO se altera: ela continua `Chip` com `aria-pressed`, e as buscas por
`getByRole('button', { name: '6º ano do Ensino Fundamental' })` seguem válidas.

Acrescente um caso novo, que prova o RF-08 dentro da página:

```tsx
it('a pílula da seleção some quando o item é desmarcado', async () => {
  const usuario = userEvent.setup()
  renderizar()

  await usuario.click(await screen.findByRole('checkbox', { name: /Matemática/ }))
  expect(
    await screen.findByRole('button', { name: 'Remover Matemática' }),
  ).toBeInTheDocument()

  await usuario.click(screen.getByRole('button', { name: 'Remover Matemática' }))
  expect(screen.queryByRole('button', { name: 'Remover Matemática' })).not.toBeInTheDocument()
  expect(await screen.findByText('14 planos')).toBeInTheDocument()
})
```

- [x] **Step 2: Executar e confirmar a falha**

```bash
cd planoteca-web && npx vitest run src/pages/biblioteca
```

Esperado: falha em cada caso que busca `checkbox`. A página ainda desenha
`FiltrosPlanos`, e a mensagem é `Unable to find an accessible element with the
role "checkbox"`.

- [x] **Step 3: Reescrever a página em duas colunas**

O grid é `grid-cols-[272px_minmax(0,1fr)] max-lg:grid-cols-1` (RF-05). O `minmax(0,1fr)` e não
`1fr`: sem ele, um título longo de plano estoura a coluna. O mínimo implícito
de uma faixa de grid é `auto`, e não zero.

```tsx
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft'
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight'
import { useId } from 'react'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'
import { FACETAS_VAZIAS, useFacetas, usePlanos } from '@/entities/plano'
import { useVocabulario } from '@/entities/vocabulario'
import { Button } from '@/components/ui/button'
import { CampoBusca } from '@/components/ui/campo-busca'
import {
  GavetaFiltros,
  PainelFiltros,
  SelecaoAtiva,
  TAMANHO_PAGINA,
  useFiltroPlanos,
} from '@/features/filtrar-planos'
import { FichaPlano } from './FichaPlano'

/**
 * O estado vazio. Distingue "nada casa com o filtro" de "a biblioteca está
 * vazia": a primeira é um beco com saída (afrouxar o recorte), a segunda
 * não, e um conselho de "limpe os filtros" para quem não filtrou nada só
 * confundiria.
 *
 * **Não repete o botão "Limpar filtros".** As pílulas de seleção ficam logo
 * acima e já o mostram sempre que há recorte ativo; um segundo botão com o
 * mesmo nome dois blocos abaixo dá a quem usa leitor de tela dois controles
 * indistinguíveis pelo nome, e a quem enxerga a dúvida de se fazem a mesma
 * coisa. O texto aponta para o botão que já existe.
 */
function VazioBiblioteca({ temFiltro }: { temFiltro: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 border-2 border-traco bg-card px-6 py-12 text-center">
      <h2 className="text-lg">
        {temFiltro ? 'Nenhum plano com esses filtros' : 'A biblioteca ainda está vazia'}
      </h2>
      <p className="max-w-[46ch] text-muted-foreground">
        {temFiltro
          ? 'Afrouxe o recorte: desligue a série ou o componente, busque por um termo mais curto, ou use "Limpar filtros" acima.'
          : 'Assim que os primeiros planos forem publicados, eles aparecem aqui.'}
      </p>
    </div>
  )
}

/**
 * A Biblioteca — a tela principal da Planoteca, contra
 * `GET /api/v1/lesson-plans`.
 *
 * ── O layout de duas colunas ─────────────────────────────────────────────
 *
 * A partir de `lg` (1024px) o filtro é uma coluna de 272px à esquerda, e os
 * planos ocupam o resto DO TOPO. Antes ele era uma faixa horizontal acima da
 * lista, e o primeiro plano só aparecia depois de uns 300px de chip — num
 * monitor baixo, abaixo da dobra. A coluna resolve isso e escala: quarenta
 * metodologias são rolagem dentro dela, não altura da página.
 *
 * Abaixo de `lg` a coluna não cabe, e vira gaveta (`GavetaFiltros`). A busca
 * NÃO entra na gaveta: ela fica na página, porque digitar é o primeiro gesto
 * de quem chega procurando assunto, e não vale um toque a mais.
 *
 * Paginação e filtro são do SERVIDOR — `usePlanos` refaz a busca a cada
 * mudança de `filtro`, e o filtro inteiro vive na URL (`useFiltroPlanos`).
 * Numa biblioteca isso não é detalhe técnico: "manda o link desse filtro"
 * é como um professor passa uma seleção para outro.
 *
 * Duas armadilhas do back-end, ambas absorvidas por `cliente.listar`
 * (`shared/api/cliente.ts`) antes de chegar aqui: a lista vem **204 sem
 * corpo** quando o total é zero, e o total vem no cabeçalho
 * **`X-Total-Count`**, não no corpo. A paginação abaixo depende do segundo.
 *
 * A faixa de contagem lê o total da LISTAGEM, e não das facetas (RF-05). Os
 * dois números respondem perguntas diferentes: a listagem diz quantos planos
 * a seleção devolve; as facetas dizem quantos cada item devolveria.
 */
export function PaginaBiblioteca({ cliente }: { cliente: Cliente }) {
  const {
    filtro,
    busca,
    definirBusca,
    pagina,
    componentesIds,
    seriesIds,
    metodologiasIds,
    alternarComponente,
    alternarSerie,
    alternarMetodologia,
    irParaPagina,
    limpar,
    temFiltro,
  } = useFiltroPlanos()

  const idBusca = useId()

  // O vocabulário alimenta os itens. Carrega em paralelo com os planos, e
  // tem cache de uma hora — ver `useVocabulario`.
  const { vocabulario } = useVocabulario(cliente)
  const consulta = usePlanos(cliente, filtro)
  // As contagens por item. Consulta IRMÃ da de planos, com chave própria:
  // as duas respondem perguntas diferentes sobre o mesmo recorte.
  const consultaFacetas = useFacetas(cliente, filtro)
  const facetas = consultaFacetas.data ?? FACETAS_VAZIAS
  const porPagina = TAMANHO_PAGINA

  const itens = consulta.data?.itens ?? []
  const total = consulta.data?.total ?? 0
  const temPaginaAnterior = pagina > 1
  const temProximaPagina = pagina * porPagina < total
  const totalAtivos = componentesIds.length + seriesIds.length + metodologiasIds.length

  const propriedadesDoPainel = {
    pesquisa: busca,
    aoMudarPesquisa: definirBusca,
    vocabulario,
    facetas,
    componentesIds,
    aoAlternarComponente: alternarComponente,
    seriesIds,
    aoAlternarSerie: alternarSerie,
    metodologiasIds,
    aoAlternarMetodologia: alternarMetodologia,
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px]">Biblioteca</h1>
        <p className="text-muted-foreground">
          Prontos para levar para a sala. Filtre por série, componente ou metodologia.
        </p>
      </header>

      {/* Breakpoint DESCENDO, como na landing e no Blog: a forma larga é a
          regra, e `max-lg` é a exceção. Misturar as duas direções no mesmo
          repositório é o que faz uma tela destoar da outra sem ninguém saber
          dizer por quê. */}
      <div className="grid grid-cols-[272px_minmax(0,1fr)] items-start gap-6 max-lg:grid-cols-1">
        {/* A coluna do desktop. `aside` e não `div`: é conteúdo
            complementar à lista, e o leitor de tela o anuncia como
            landmark, o que dá um atalho para pular o filtro. */}
        <aside
          aria-label="Filtros"
          className="border-2 border-traco bg-card p-[13px] max-lg:hidden"
        >
          <PainelFiltros {...propriedadesDoPainel} />
        </aside>

        {/* Abaixo de `lg`: a busca na página, a gaveta atrás do botão. */}
        <div className="flex flex-col gap-2 lg:hidden">
          <label htmlFor={idBusca} className="sr-only">
            Buscar por assunto, autoria ou objeto de conhecimento
          </label>
          <CampoBusca
            id={idBusca}
            value={busca}
            onChange={(evento) => definirBusca(evento.target.value)}
            placeholder="Assunto, autoria ou objeto de conhecimento"
          />
          <GavetaFiltros
            {...propriedadesDoPainel}
            totalAtivos={totalAtivos}
            totalPlanos={total}
            aoLimpar={limpar}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <SelecaoAtiva
            vocabulario={vocabulario}
            componentesIds={componentesIds}
            seriesIds={seriesIds}
            metodologiasIds={metodologiasIds}
            aoAlternarComponente={alternarComponente}
            aoAlternarSerie={alternarSerie}
            aoAlternarMetodologia={alternarMetodologia}
            aoLimpar={limpar}
          />

          {/* `bg-inverso-bg`, o token que a landing criou para bloco escuro
              público — hero, faixa do Blog, rodapé. `bg-foreground` era o
              preto de texto usado como fundo, e ficava um tom fora dos
              outros blocos escuros da mesma navegação. */}
          <div className="flex items-center justify-between gap-3 bg-inverso-bg px-[13px] py-2.5 text-inverso-ink">
            {/* `aria-live="polite"`: a contagem muda por causa de um toque
                em OUTRO elemento, e o foco continua na caixa ou na célula —
                sem isto, quem usa leitor de tela não saberia que o resultado
                mudou. */}
            <span aria-live="polite" className="font-mono text-[12.5px] font-semibold">
              {total} {total === 1 ? 'plano' : 'planos'}
            </span>
            <span className="text-[12.5px] font-medium opacity-70">
              ordenados pelos mais recentes
            </span>
          </div>

          {consulta.isError ? (
            <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-6 text-err">
              {mensagemDe(consulta.error)}
            </p>
          ) : consulta.isPending ? (
            // Sem `role="status"` de propósito: outro provedor já usa esse
            // role para o aviso de expiração, e dois landmarks iguais
            // simultâneos tornam `getByRole('status')` ambíguo em qualquer
            // teste que monte esta página dentro da sessão.
            <p className="px-2 py-6 text-muted-foreground">Carregando planos…</p>
          ) : itens.length === 0 ? (
            <VazioBiblioteca temFiltro={temFiltro} />
          ) : (
            <>
              {/* `ul`/`li` e não um `div` de cards: é uma lista, e o leitor
                  de tela anuncia quantos itens são antes de percorrer. A
                  `FichaPlano` é um `article`, que aninha dentro do `li` sem
                  conflito.

                  Duas colunas até `xl` e três a partir daí (RF-05): com a
                  coluna de filtro comendo 272px, três fichas antes de 1280px
                  espremeriam o título em quatro linhas. */}
              <ul
                aria-label="Planos de aula"
                className="grid list-none grid-cols-2 gap-3 p-0 max-sm:grid-cols-1"
              >
                {itens.map((plano) => (
                  <li key={plano.id}>
                    <FichaPlano plano={plano} />
                  </li>
                ))}
              </ul>

              <nav
                aria-label="Paginação"
                className="flex items-center justify-between gap-3 border-t-2 border-traco pt-3"
              >
                <span className="font-mono text-[12px] text-muted-foreground">
                  Página {pagina} de {Math.max(1, Math.ceil(total / porPagina))}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!temPaginaAnterior}
                    onClick={() => irParaPagina(pagina - 1)}
                    className="min-h-11 gap-1 rounded-none border-2 border-traco"
                  >
                    <CaretLeft size={14} weight="bold" />
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!temProximaPagina}
                    onClick={() => irParaPagina(pagina + 1)}
                    className="min-h-11 gap-1 rounded-none border-2 border-traco"
                  >
                    Próxima
                    <CaretRight size={14} weight="bold" />
                  </Button>
                </div>
              </nav>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

Atenção ao `hidden lg:block` do `aside` e ao `lg:hidden` da gaveta. Os dois
painéis existem na árvore ao mesmo tempo, o que faria `getByRole('checkbox')`
achar dois elementos. Não faz, porque a gaveta só monta o painel quando o
`Dialog` abre — o Radix não renderiza o conteúdo fechado.

- [x] **Step 4: Remover `FiltrosPlanos`**

```bash
cd planoteca-web && git rm src/features/filtrar-planos/FiltrosPlanos.tsx
```

E tire a linha correspondente de `src/features/filtrar-planos/index.ts`, que
fica:

```ts
export { PainelFiltros } from './PainelFiltros'
export { SelecaoAtiva } from './SelecaoAtiva'
export { GavetaFiltros } from './GavetaFiltros'
export { useFiltroPlanos, TAMANHO_PAGINA } from './useFiltroPlanos'
```

- [x] **Step 5: Confirmar que ninguém mais importa o componente removido**

```bash
cd planoteca-web && npx tsc --noEmit -p tsconfig.json
```

Esperado: nenhuma saída. Um erro `Cannot find module './FiltrosPlanos'` significa
que outra tela ainda o consome, e ela precisa passar a `PainelFiltros`.

- [x] **Step 6: Executar o portão de front**

```bash
cd planoteca-web && npm run lint && npx vitest run src/pages/biblioteca && npm run build
```

Esperado: código 0 nos três. `useFiltroPlanos.test.tsx` continua verde sem
alteração. A restrição global diz que o hook não se altera, e nada nesta task
o tocou.

- [x] **Step 7: Commitar**

```bash
git add planoteca-web/src
git commit -m "feat(biblioteca): filtro em coluna lateral, gaveta no celular"
```

---

### Task 12: O caminho de ponta a ponta, com o celular

**Papel:** escrita
**Verificação:** `cd planoteca-web && npx playwright test e2e/biblioteca.spec.ts`

**Fontes:**
- `planoteca-web/e2e/biblioteca.spec.ts` — os três testes e os seletores que se alteram
- `planoteca-web/e2e/simulacao.ts` — o roteador do Playwright e a lógica de filtro da simulação
- `design/2026-08-26-filtros-biblioteca-opcoes.html` — o desenho aprovado da opção B, desktop e celular

**Files:**
- Modify: `planoteca-web/e2e/biblioteca.spec.ts`

**Interfaces:**
- Consumes: a tela da Task 11 e o handler de facetas da Task 5.

- [ ] **Step 1: Trocar os seletores de componente e metodologia**

Nos dois primeiros testes, componente virou caixa de marcar. Série continua
botão. As trocas, uma a uma:

```ts
// antes
await page.getByRole('button', { name: 'Matemática' }).click()
// depois
await page.getByRole('checkbox', { name: /Matemática/ }).click()
```

```ts
// antes
await expect(page.getByRole('button', { name: 'Matemática' })).toHaveAttribute(
  'aria-pressed',
  'true',
)
// depois
await expect(page.getByRole('checkbox', { name: /Matemática/ })).toBeChecked()
```

E o mesmo par para "Língua Portuguesa". As buscas por
`'6º ano do Ensino Fundamental'` ficam como estão: é a régua, e ela continua
`button` com `aria-pressed`.

O comentário de cabeçalho do primeiro teste cita `subject=math`, que não existe
mais desde que o vocabulário virou GUID. Corrija-o para dizer que a
querystring carrega o id do vocabulário.

- [ ] **Step 2: Escrever o teste de 390px**

Ele cobre o RF-11 inteiro. Acrescente ao fim de `e2e/biblioteca.spec.ts`:

```ts
/**
 * A gaveta no celular.
 *
 * 390px é a largura do desenho de origem, e a que a maioria dos professores
 * usa. Abaixo de `lg` a coluna de filtro não cabe, e a única porta para o
 * recorte é o botão "Filtros" — se ele parar de abrir, filtrar deixa de
 * existir nessa largura, e nenhum teste de desktop denunciaria.
 */
test('no celular, a gaveta filtra e a pílula fica visível com ela fechada', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await instalarSimulacao(page)

  await page.goto('/biblioteca')
  await expect(page.getByText('14 planos')).toBeVisible()

  // A coluna do desktop não está à vista nesta largura.
  await expect(page.getByRole('complementary', { name: 'Filtros' })).toBeHidden()

  await page.getByRole('button', { name: /Filtros/ }).click()
  const gaveta = page.getByRole('dialog')
  await expect(gaveta).toBeVisible()

  // Marcar aplica na hora: o rodapé já mostra o total novo antes de fechar.
  await gaveta.getByRole('checkbox', { name: /Matemática/ }).check()
  await expect(page).toHaveURL(/componente=20000000-0000-0000-0000-000000000001/)

  // A fixture cicla cinco componentes por índice sobre 14 planos, então
  // Matemática (índice 0) casa com os planos 1, 6 e 11.
  await page.getByRole('button', { name: 'Ver 3 planos' }).click()
  await expect(gaveta).toBeHidden()

  // Com a gaveta fechada, a pílula é a única leitura da seleção — é a razão
  // de ela existir (RF-08).
  await expect(page.getByRole('button', { name: 'Remover Matemática' })).toBeVisible()
  await expect(page.getByText('3 planos')).toBeVisible()

  // O ✕ da pílula desfaz sem reabrir a gaveta.
  await page.getByRole('button', { name: 'Remover Matemática' }).click()
  await expect(page.getByText('14 planos')).toBeVisible()
})
```

- [ ] **Step 3: Executar e confirmar que passa**

```bash
cd planoteca-web && npx playwright test e2e/biblioteca.spec.ts
```

Esperado: `4 passed`. Se a gaveta abrir e o `checkbox` não for achado, confira
se o handler de facetas entrou ANTES do `match` de `/lesson-plans/:id` em
`e2e/simulacao.ts`. Sem ele a coluna monta, mas a chamada de facetas devolve
501 e a consulta fica em erro.

- [ ] **Step 4: Confirmar que a guarda do acervo público continua verde**

```bash
cd planoteca-web && npx vitest run src/app/rotas/guarda.test.tsx
```

Esperado: o bloco "o acervo é público" verde. Nenhum passo do teste de 390px faz
login, e é assim que ele fica.

- [ ] **Step 5: Commitar**

```bash
git add planoteca-web/e2e
git commit -m "test(biblioteca): cobre a gaveta de filtro em 390px"
```

---

### Task 13: O portão inteiro

**Papel:** busca
**Verificação:** `cd planoteca-web && npm run lint && npm run test && npm run build && npm run e2e`

**Fontes:**
- `planoteca-web/scripts/verifica-tokens.mjs` — o que o lint reprova em classe e cor
- `CLAUDE.md` — o portão antes de dizer "pronto"

**Files:**
- Modify: nenhum, se tudo passar.

**Interfaces:**
- Consumes: tudo o que as Tasks 5 a 12 entregaram.

- [ ] **Step 1: Executar o portão de front, na ordem**

```bash
cd planoteca-web && npm run lint && npm run test && npm run build && npm run e2e
```

Esperado: código 0 nos quatro. A ordem importa: o `lint` inclui
`verifica-tokens`. Uma classe crua reprovada ali é mais barata de achar antes
de a suíte inteira executar.

- [ ] **Step 2: Executar o detector de plástico nos arquivos novos**

```bash
cd planoteca-web && python ~/.claude/skills/sem-plastico/scripts/detectar.py \
  src/features/filtrar-planos/PainelFiltros.tsx \
  src/features/filtrar-planos/GrupoFiltro.tsx \
  src/features/filtrar-planos/ReguaSeries.tsx \
  src/features/filtrar-planos/SelecaoAtiva.tsx \
  src/features/filtrar-planos/GavetaFiltros.tsx \
  src/features/filtrar-planos/EtiquetaGrupo.tsx \
  src/components/ui/caixa-marcar.tsx \
  src/pages/biblioteca/PaginaBiblioteca.tsx
```

Esperado: código 0. O bloco de sigla do `GrupoFiltro` é o caso limite. O
quadrado pequeno de fundo sólido passa de propósito, porque é swatch de cor,
não ícone em caixinha. Se o detector o acusar mesmo assim, a diretiva de
escape vai na linha anterior, com o motivo escrito.

- [ ] **Step 3: Confirmar que nenhuma dependência entrou**

```bash
cd planoteca-web && git diff --stat main -- package.json package-lock.json
```

Esperado: saída vazia. A gaveta reusa o Radix Dialog que já estava lá.

- [ ] **Step 4: Confirmar que o hook do filtro não se alterou**

```bash
cd planoteca-web && git diff --stat main -- src/features/filtrar-planos/useFiltroPlanos.ts src/features/filtrar-planos/useFiltroPlanos.test.tsx
```

Esperado: saída vazia. É restrição global da spec: a URL continua a fonte da
verdade. A coluna só consome o contrato que o hook já expunha.

- [ ] **Step 5: Confirmar que o acervo continua público**

```bash
cd planoteca-web && npx vitest run src/app/rotas/guarda.test.tsx
```

Esperado: o bloco "o acervo é público" verde. Nenhuma peça desta entrega entrou
em `RotaProtegida`, e o endpoint de facetas nasceu sem `[Authorize]`.

- [ ] **Step 6: Commitar o que sobrar**

```bash
git add planoteca-web
git commit -m "chore(biblioteca): fecha o portão da coluna de filtro"
```

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
