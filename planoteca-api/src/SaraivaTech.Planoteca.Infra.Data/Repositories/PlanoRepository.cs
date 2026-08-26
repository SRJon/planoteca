using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Infra.Data.Base;

namespace SaraivaTech.Planoteca.Infra.Data.Repositories
{
    /// <summary>
    /// A consulta da Biblioteca.
    ///
    /// É LINQ do EF Core, e não SQL cru no Dapper, de propósito: o filtro tem
    /// seis dimensões opcionais e combináveis, e montar isso com concatenação
    /// de string vira `WHERE 1=1 AND ...` — a forma que sempre acaba com um
    /// parâmetro esquecido. O provider do Npgsql traduz o `IQueryable` para
    /// SQL parametrizado, e o filtro que não veio simplesmente não entra na
    /// árvore.
    /// </summary>
    public class PlanoRepository : Repository<Plano>, IPlanoRepository
    {
        public PlanoRepository(IUnitOfWork uow) : base(uow) { }

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

        public async Task<(IEnumerable<Plano> Itens, int Total)> BuscarAsync(FiltroPlano filtro)
        {
            // `Nenhum`: a listagem aplica os três grupos. Só a faceta exclui um.
            var consulta = Recorte(filtro, GrupoVocabulario.Nenhum);

            var total = await consulta.CountAsync();

            var pagina = filtro.Pagina < 1 ? 1 : filtro.Pagina;
            var tamanho = filtro.TamanhoPagina < 1 ? 12 : filtro.TamanhoPagina;

            var itens = await consulta
                // Mais recente primeiro. `ThenBy(Id)` desempata: sem ele, dois
                // planos publicados no mesmo instante podem trocar de lugar
                // entre páginas, e o professor vê o mesmo card duas vezes.
                .OrderByDescending(p => p.PublicadoEm)
                .ThenBy(p => p.Id)
                .Skip((pagina - 1) * tamanho)
                .Take(tamanho)
                .Include(p => p.Componentes).ThenInclude(c => c.Componente)
                .Include(p => p.Series).ThenInclude(s => s.Serie)
                .Include(p => p.Metodologias).ThenInclude(m => m.Metodologia)
                .ToListAsync();

            return (itens, total);
        }

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

        public async Task<Plano?> ObterCompletoAsync(Guid id, bool incluirRascunho = false)
        {
            var consulta = Context.Set<Plano>().AsNoTracking().Where(p => p.Id == id);

            if (!incluirRascunho)
                consulta = consulta.Where(p => p.Situacao == SituacaoPlano.Publicado);

            return await consulta
                .Include(p => p.Componentes).ThenInclude(c => c.Componente)
                .Include(p => p.Series).ThenInclude(s => s.Serie)
                .Include(p => p.Metodologias).ThenInclude(m => m.Metodologia)
                .Include(p => p.Etapas.OrderBy(e => e.Ordem))
                .Include(p => p.CodigosBncc)
                .FirstOrDefaultAsync();
        }
    }
}
