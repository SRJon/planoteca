#nullable enable

using System;
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

        // A leitura completa repete a ordenação da leitura de ativos: a tela
        // de gestão espera a mesma organização visual que a Biblioteca usa,
        // só que com o inativo junto.
        public async Task<IEnumerable<Componente>> ComponentesTodosAsync() =>
            await _context.Set<Componente>()
                .AsNoTracking()
                .OrderBy(c => c.Area)
                .ThenBy(c => c.Ordem)
                .ToListAsync();

        public async Task<IEnumerable<Serie>> SeriesTodasAsync() =>
            await _context.Set<Serie>()
                .AsNoTracking()
                .OrderBy(s => s.Ordem)
                .ToListAsync();

        public async Task<IEnumerable<Metodologia>> MetodologiasTodasAsync() =>
            await _context.Set<Metodologia>()
                .AsNoTracking()
                .OrderBy(m => m.Tipo)
                .ThenBy(m => m.Nome)
                .ToListAsync();

        // Sem `AsNoTracking`: o `Commit` do UnitOfWork persiste o que o
        // contexto rastreia, e o AppService altera a entidade devolvida aqui
        // diretamente, sem chamar `Update` — o mesmo padrão de
        // `PessoaAdminAppService.AlterarPapelAsync`.
        public async Task<Componente?> ComponentePorIdAsync(Guid id) =>
            await _context.Set<Componente>().FirstOrDefaultAsync(c => c.Id == id);

        public async Task<Serie?> SeriePorIdAsync(Guid id) =>
            await _context.Set<Serie>().FirstOrDefaultAsync(s => s.Id == id);

        public async Task<Metodologia?> MetodologiaPorIdAsync(Guid id) =>
            await _context.Set<Metodologia>().FirstOrDefaultAsync(m => m.Id == id);

        // `exceto` recebe o id do proprio item numa alteracao, para ele nao
        // colidir com o proprio nome. Ele vira `Guid.Empty` quando ausente, e
        // NAO entra na consulta como `Id != null`: em SQL, comparar com NULL
        // devolve UNKNOWN, a linha nunca casa, e a regra passaria a aceitar
        // nome repetido em toda criacao — falha silenciosa que o mock do
        // teste de unidade nao alcanca.
        //
        // A comparacao ignora caixa porque "Filosofia" e "filosofia" sao o
        // mesmo componente para quem le o filtro da Biblioteca.

        public async Task<bool> ExisteComponenteComNomeAsync(string nome, Guid? exceto) =>
            await _context.Set<Componente>()
                .AsNoTracking()
                .AnyAsync(c => c.Nome.ToLower() == nome.ToLower()
                            && c.Id != (exceto ?? Guid.Empty));

        public async Task<bool> ExisteSerieComNomeAsync(string nome, string etapa, Guid? exceto) =>
            await _context.Set<Serie>()
                .AsNoTracking()
                .AnyAsync(s => s.Nome.ToLower() == nome.ToLower()
                            && s.Etapa == etapa
                            && s.Id != (exceto ?? Guid.Empty));

        // `MaxAsync` sobre coleção vazia estoura; `Select` mais `DefaultIfEmpty`
        // devolve zero, e a primeira série da etapa nasce com ordem 1.
        public async Task<int> UltimaOrdemDaEtapaAsync(string etapa) =>
            await _context.Set<Serie>()
                .AsNoTracking()
                .Where(s => s.Etapa == etapa)
                .Select(s => s.Ordem)
                .DefaultIfEmpty(0)
                .MaxAsync();

        // Rastreadas de propósito: quem chama as desloca e persiste no mesmo
        // `Commit`.
        public async Task<IEnumerable<Serie>> SeriesComOrdemAPartirDeAsync(int ordem) =>
            await _context.Set<Serie>()
                .Where(s => s.Ordem >= ordem)
                .OrderByDescending(s => s.Ordem)
                .ToListAsync();

        public async Task<int> UltimaOrdemDaAreaAsync(string area) =>
            await _context.Set<Componente>()
                .AsNoTracking()
                .Where(c => c.Area == area)
                .Select(c => c.Ordem)
                .DefaultIfEmpty(0)
                .MaxAsync();

        public async Task<bool> ExisteMetodologiaComNomeAsync(string nome, Guid? exceto) =>
            await _context.Set<Metodologia>()
                .AsNoTracking()
                .AnyAsync(m => m.Nome.ToLower() == nome.ToLower()
                            && m.Id != (exceto ?? Guid.Empty));

        public void Insert(Componente componente) => _context.Set<Componente>().Add(componente);

        public void Insert(Serie serie) => _context.Set<Serie>().Add(serie);

        public void Insert(Metodologia metodologia) => _context.Set<Metodologia>().Add(metodologia);
    }
}
