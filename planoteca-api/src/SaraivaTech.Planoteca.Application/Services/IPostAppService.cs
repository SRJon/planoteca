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

        /// <summary>Tira o texto do ar: some do blog público e da fila de
        /// moderação. Não exige comentário — arquivar é curadoria do
        /// acervo, não devolutiva ao autor.</summary>
        Task<Result> ArquivarAsync(Guid id, Guid administradorId);

        /// <summary>Devolve um texto arquivado ao fluxo, na situação em que
        /// estava antes de ser arquivado.</summary>
        Task<Result> DesarquivarAsync(Guid id, Guid administradorId);

        /// <summary>Quantos aguardam moderação — o número que abre o painel.</summary>
        Task<int> ContarPendentesAsync();

        /// <summary>Soma uma leitura ao contador do texto. Público e
        /// anônimo — ler não exige conta, e o contador não guarda quem leu.
        /// Silencioso quando o texto não existe ou não está publicado: o
        /// front chama isso depois de já ter mostrado o texto, e uma falha
        /// aqui não pode incomodar quem só quer ler.</summary>
        Task IncrementarVisualizacaoAsync(Guid id);
    }
}
