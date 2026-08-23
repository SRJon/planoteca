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
    public class PessoaRepository : Repository<Pessoa>, IPessoaRepository
    {
        public PessoaRepository(IUnitOfWork uow) : base(uow) { }

        public async Task<Pessoa?> PorFirebaseUidAsync(string firebaseUid) =>
            await Context.Set<Pessoa>().FirstOrDefaultAsync(p => p.FirebaseUid == firebaseUid);

        /// <summary>
        /// O e-mail é comparado em minúsculas dos dois lados.
        ///
        /// `EmailUsuario@escola.br` e `emailusuario@escola.br` são a mesma
        /// caixa postal, e o Firebase devolve o que a pessoa digitou. Sem
        /// normalizar, o mesmo professor viraria dois cadastros.
        /// </summary>
        public async Task<Pessoa?> PorEmailAsync(string email) =>
            await Context.Set<Pessoa>()
                .FirstOrDefaultAsync(p => p.Email.ToLower() == email.ToLower());

        public async Task<(IEnumerable<Pessoa> Itens, int Total)> BuscarAsync(FiltroPessoa filtro)
        {
            var consulta = Context.Set<Pessoa>().AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(filtro.Busca))
            {
                var termo = $"%{filtro.Busca.Trim()}%";
                consulta = consulta.Where(p =>
                    EF.Functions.ILike(p.Nome, termo) ||
                    EF.Functions.ILike(p.Email, termo));
            }

            var total = await consulta.CountAsync();

            var pagina = filtro.Pagina < 1 ? 1 : filtro.Pagina;
            var tamanho = filtro.TamanhoPagina < 1 ? 20 : filtro.TamanhoPagina;

            var itens = await consulta
                .OrderBy(p => p.Nome)
                .ThenBy(p => p.Id)
                .Skip((pagina - 1) * tamanho)
                .Take(tamanho)
                .ToListAsync();

            return (itens, total);
        }

        /// <summary>
        /// Rastreada e sem consulta extra — ver o contrato em
        /// `IPessoaRepository`. Dispensa `Update`: alterar a propriedade e
        /// dar `Commit` basta.
        /// </summary>
        public async Task<Pessoa?> ObterParaEscritaAsync(Guid id) =>
            await Context.Set<Pessoa>().FirstOrDefaultAsync(p => p.Id == id);

        public async Task<int> ContarAdministradoresAtivosAsync() =>
            await Context.Set<Pessoa>()
                .CountAsync(p => p.Papel == PapelPessoa.Administrador && p.Ativo);

        /// <summary>
        /// Quantos textos cada pessoa escreveu, por situação — só o que o
        /// painel precisa (publicados e pendentes), sem tocar em nenhum
        /// arquivo da fatia `Post`: a consulta usa `Context.Set&lt;Post&gt;()`
        /// genérico, do mesmo jeito que os outros repositórios já fazem.
        /// </summary>
        public async Task<Dictionary<Guid, (int Publicados, int Pendentes)>> ContarPostsPorAutorAsync(
            IEnumerable<Guid> autorIds)
        {
            var ids = autorIds.ToList();
            if (ids.Count == 0) return new Dictionary<Guid, (int, int)>();

            var contagens = await Context.Set<Post>()
                .Where(p => ids.Contains(p.AutorId) &&
                    (p.Situacao == SituacaoPost.Publicado || p.Situacao == SituacaoPost.Pendente))
                .GroupBy(p => p.AutorId)
                .Select(g => new
                {
                    AutorId = g.Key,
                    Publicados = g.Count(p => p.Situacao == SituacaoPost.Publicado),
                    Pendentes = g.Count(p => p.Situacao == SituacaoPost.Pendente),
                })
                .ToListAsync();

            return contagens.ToDictionary(c => c.AutorId, c => (c.Publicados, c.Pendentes));
        }
    }
}
