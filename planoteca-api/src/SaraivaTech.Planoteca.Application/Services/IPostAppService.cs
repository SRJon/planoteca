using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;

namespace SaraivaTech.Planoteca.Application.Services
{
    public interface IPostAppService
    {
        Task<(IEnumerable<PostResumoDto> Itens, int Total)> ListarAsync(FiltroPost filtro);

        /// <summary>`null` quando não existe, ou quando não está publicado e
        /// quem pede não tem direito de ver.</summary>
        Task<PostDetalheDto?> ObterAsync(Guid id, bool incluirNaoPublicado = false);

        /// <summary>Escreve um texto novo. Nasce pendente, sempre.</summary>
        Task<Result<Guid>> EscreverAsync(PostEntradaDto entrada, Guid autorId);

        /// <summary>Publica, devolve ou recusa.</summary>
        Task<Result> ModerarAsync(Guid id, ModeracaoDto decisao, Guid moderadorId);

        /// <summary>Quantos aguardam moderação — o número que abre o painel.</summary>
        Task<int> ContarPendentesAsync();
    }
}
