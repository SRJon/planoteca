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
    public class PostRepository : Repository<Post>, IPostRepository
    {
        public PostRepository(IUnitOfWork uow) : base(uow) { }

        public async Task<(IEnumerable<Post> Itens, int Total)> BuscarAsync(FiltroPost filtro)
        {
            var consulta = Context.Set<Post>().AsNoTracking().Include(p => p.Autor).AsQueryable();

            // Nulo significa "só publicados", e não "todos": a listagem
            // pública é quem mais chama este método, e o padrão precisa ser o
            // seguro. Quem quiser pendentes pede explicitamente.
            consulta = consulta.Where(p => p.Situacao == (filtro.Situacao ?? SituacaoPost.Publicado));

            if (filtro.AutorId.HasValue)
                consulta = consulta.Where(p => p.AutorId == filtro.AutorId);

            if (!string.IsNullOrWhiteSpace(filtro.Busca))
            {
                var termo = $"%{filtro.Busca.Trim()}%";
                consulta = consulta.Where(p =>
                    EF.Functions.ILike(p.Titulo, termo) ||
                    EF.Functions.ILike(p.Corpo, termo));
            }

            var total = await consulta.CountAsync();

            var pagina = filtro.Pagina < 1 ? 1 : filtro.Pagina;
            var tamanho = filtro.TamanhoPagina < 1 ? 12 : filtro.TamanhoPagina;

            var itens = await consulta
                // Publicado ordena pela publicação; pendente, pela criação —
                // e `PublicadoEm` é nulo nos pendentes, o que jogaria todos
                // para a mesma ponta. `CriadoEm` desempata e serve aos dois.
                .OrderByDescending(p => p.PublicadoEm ?? p.CriadoEm)
                .ThenBy(p => p.Id)
                .Skip((pagina - 1) * tamanho)
                .Take(tamanho)
                .ToListAsync();

            return (itens, total);
        }

        public async Task<Post?> ObterAsync(Guid id, bool incluirNaoPublicado = false)
        {
            var consulta = Context.Set<Post>().AsNoTracking().Include(p => p.Autor)
                .Where(p => p.Id == id);

            if (!incluirNaoPublicado)
                consulta = consulta.Where(p => p.Situacao == SituacaoPost.Publicado);

            return await consulta.FirstOrDefaultAsync();
        }

        /// <summary>
        /// Rastreado e SEM `Include(Autor)` — ver o contrato em
        /// `IPostRepository`. O post rastreado dispensa `Update`: alterar a
        /// propriedade e dar `Commit` basta, e nada mais é anexado.
        /// </summary>
        public async Task<Post?> ObterParaEscritaAsync(Guid id) =>
            await Context.Set<Post>().FirstOrDefaultAsync(p => p.Id == id);

        public async Task<int> ContarPendentesAsync() =>
            await Context.Set<Post>().CountAsync(p => p.Situacao == SituacaoPost.Pendente);

        public async Task IncrementarVisualizacaoAsync(Guid id) =>
            await Context.Set<Post>()
                .Where(p => p.Id == id && p.Situacao == SituacaoPost.Publicado)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.Visualizacoes, p => p.Visualizacoes + 1));
    }
}
