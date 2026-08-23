using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Domain.Services;

namespace SaraivaTech.Planoteca.Application.Services
{
    public interface IPlanoAppService
    {
        /// <summary>A listagem da Biblioteca. `Total` vai no `X-Total-Count`.</summary>
        Task<(IEnumerable<PlanoResumoDto> Itens, int Total)> ListarAsync(FiltroPlano filtro);

        /// <summary>A ficha. `null` quando não existe ou quando é rascunho e
        /// quem pede não é administrador.</summary>
        Task<PlanoDetalheDto?> ObterAsync(Guid id, bool incluirRascunho = false);

        /// <summary>Cataloga um plano novo. O arquivo já subiu para o R2.</summary>
        Task<Result<Guid>> CatalogarAsync(PlanoEntradaDto entrada, Guid? catalogadoPorId);

        /// <summary>Assina a URL para o navegador subir o PDF direto ao R2.</summary>
        Task<Result<UploadAssinado>> AssinarUploadAsync(string nomeArquivo, string tipoConteudo);

        /// <summary>Publica ou despublica um plano já catalogado.
        ///
        /// Despublicar não apaga: o plano volta a rascunho e some da
        /// Biblioteca, mas continua no acervo para ser corrigido. Apagar um
        /// plano que já circulou quebraria os links que professores
        /// compartilharam entre si.</summary>
        Task<Result> AlterarSituacaoAsync(Guid id, bool publicar);

        /// <summary>Remove um plano. Só para o que nunca foi publicado — o
        /// erro de catalogação que se percebe na hora.</summary>
        Task<Result> RemoverAsync(Guid id);
    }

    public interface IVocabularioAppService
    {
        /// <summary>As três listas numa chamada, para montar os filtros.</summary>
        Task<VocabularioDto> ObterAsync();
    }
}
