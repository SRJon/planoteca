using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Domain.Repositories.Interfaces
{
    /// <summary>O recorte da listagem de pessoas, para o painel administrativo.</summary>
    public class FiltroPessoa
    {
        /// <summary>Casa contra nome ou e-mail.</summary>
        public string? Busca { get; set; }

        public int Pagina { get; set; } = 1;
        public int TamanhoPagina { get; set; } = 20;
    }

    public interface IPessoaRepository : IRepository<Pessoa>
    {
        /// <summary>Acha pelo identificador do Firebase — o caminho normal de
        /// quem já entrou alguma vez.</summary>
        Task<Pessoa?> PorFirebaseUidAsync(string firebaseUid);

        /// <summary>
        /// Acha pelo e-mail.
        ///
        /// Serve a dois casos: o primeiro login de alguém que já foi
        /// cadastrado por SQL (o administrador inicial), e a troca de
        /// provedor — quem entrou com e-mail/senha e depois usa o Google
        /// recebe um `uid` novo do Firebase, mas continua sendo a mesma
        /// pessoa.
        /// </summary>
        Task<Pessoa?> PorEmailAsync(string email);

        /// <summary>A lista do painel administrativo, com busca e paginação.</summary>
        Task<(IEnumerable<Pessoa> Itens, int Total)> BuscarAsync(FiltroPessoa filtro);

        /// <summary>
        /// A pessoa para ESCRITA: rastreada, sem consulta extra.
        ///
        /// Mesmo padrão de `IPostRepository.ObterParaEscritaAsync` — aqui o
        /// risco é mais direto ainda: o `PapelClaimsMiddleware` já deixa a
        /// Pessoa de quem faz a requisição rastreada no contexto em TODA
        /// chamada autenticada. Quando o administrador altera a PRÓPRIA
        /// conta, `PorFirebaseUidAsync`/carregar de novo com `AsNoTracking`
        /// e depois `Update` colidiria com essa instância e o EF recusaria
        /// com "cannot be tracked". Como aqui o alvo é sempre a mesma
        /// entidade já rastreada (ou uma nova, sem grafo), basta reaproveitar
        /// o rastreamento existente — nunca chamar `Update`.
        /// </summary>
        Task<Pessoa?> ObterParaEscritaAsync(Guid id);

        /// <summary>Quantos administradores ATIVOS existem. Usado para recusar
        /// rebaixar ou desativar o último — sem isso o sistema fica sem
        /// ninguém capaz de promover alguém de volta, e o único conserto
        /// seria SQL.</summary>
        Task<int> ContarAdministradoresAtivosAsync();

        /// <summary>Quantos textos cada pessoa escreveu, por situação
        /// (publicados e pendentes) — para a coluna "o que escreveu" do
        /// painel administrativo. Não toca em nenhum arquivo da fatia
        /// `Post`.</summary>
        Task<Dictionary<Guid, (int Publicados, int Pendentes)>> ContarPostsPorAutorAsync(
            IEnumerable<Guid> autorIds);
    }
}
