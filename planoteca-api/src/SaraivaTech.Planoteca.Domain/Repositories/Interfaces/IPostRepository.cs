using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Domain.Repositories.Interfaces
{
    /// <summary>O recorte da listagem de textos do blog.</summary>
    public class FiltroPost
    {
        public string? Busca { get; set; }

        /// <summary>Quando nulo, a consulta devolve só os PUBLICADOS. É o
        /// padrão seguro: a listagem pública nunca deve passar outra coisa.</summary>
        public string? Situacao { get; set; }

        /// <summary>Só os textos deste autor. É como o professor acompanha o
        /// que enviou — inclusive o que foi devolvido, que ninguém mais vê.</summary>
        public Guid? AutorId { get; set; }

        public int Pagina { get; set; } = 1;
        public int TamanhoPagina { get; set; } = 12;
    }

    public interface IPostRepository : IRepository<Post>
    {
        Task<(IEnumerable<Post> Itens, int Total)> BuscarAsync(FiltroPost filtro);

        /// <summary>Um texto com o autor carregado. `incluirNaoPublicado`
        /// libera rascunho e devolvido — só para o próprio autor ou para um
        /// administrador.</summary>
        Task<Post?> ObterAsync(Guid id, bool incluirNaoPublicado = false);

        /// <summary>Quantos textos aguardam moderação. É o número que o
        /// painel administrativo mostra primeiro: o briefing diz que ele
        /// "mostra antes o que precisa de atenção".</summary>
        Task<int> ContarPendentesAsync();
    }
}
