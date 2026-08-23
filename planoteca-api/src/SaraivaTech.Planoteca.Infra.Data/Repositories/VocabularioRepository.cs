using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Infra.Data.Context;

namespace SaraivaTech.Planoteca.Infra.Data.Repositories
{
    /// <summary>
    /// Leitura do vocabulário. Não herda `Repository&lt;T&gt;` porque não é de
    /// UMA entidade: serve as três tabelas de classificação, e não escreve.
    /// </summary>
    public class VocabularioRepository : IVocabularioRepository
    {
        private readonly DatabaseContext _context;

        public VocabularioRepository(IUnitOfWork uow)
        {
            _context = (DatabaseContext)uow.Context;
        }

        public async Task<IEnumerable<Componente>> ComponentesAtivosAsync() =>
            await _context.Set<Componente>()
                .AsNoTracking()
                .Where(c => c.Ativo)
                // Por área e depois por ordem: é como o e-book da SEDU
                // organiza os relatos, e como o filtro agrupa na tela.
                .OrderBy(c => c.Area)
                .ThenBy(c => c.Ordem)
                .ToListAsync();

        public async Task<IEnumerable<Serie>> SeriesAtivasAsync() =>
            await _context.Set<Serie>()
                .AsNoTracking()
                .Where(s => s.Ativa)
                // `Ordem` é global (1..7) exatamente para esta linha existir
                // sem regra de desempate entre Fundamental e Médio.
                .OrderBy(s => s.Ordem)
                .ToListAsync();

        public async Task<IEnumerable<Metodologia>> MetodologiasAtivasAsync() =>
            await _context.Set<Metodologia>()
                .AsNoTracking()
                .Where(m => m.Ativa)
                .OrderBy(m => m.Tipo)
                .ThenBy(m => m.Nome)
                .ToListAsync();
    }
}
