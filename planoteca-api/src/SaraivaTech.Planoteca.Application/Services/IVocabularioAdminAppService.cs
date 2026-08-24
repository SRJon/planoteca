using System;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Domain.Base;

namespace SaraivaTech.Planoteca.Application.Services
{
    /// <summary>A gestão do vocabulário: componente, série e metodologia,
    /// com o inativo à vista. Só o administrador enxerga isto — a rota
    /// pública continua em <see cref="IVocabularioAppService"/>, que só
    /// devolve ativo.</summary>
    public interface IVocabularioAdminAppService
    {
        /// <summary>As três listas completas, ativo e inativo juntos.</summary>
        Task<VocabularioDto> ObterTudoAsync();

        /// <summary>Recusa nome repetido dentro do tipo, cor fora do tema e
        /// ordem menor que 1.</summary>
        Task<Result<ComponenteDto>> CriarComponenteAsync(ComponenteEntradaDto entrada);

        /// <summary>Recusa id inexistente, além das mesmas regras da
        /// criação. Alterar mantendo o próprio nome é aceito.</summary>
        Task<Result> AlterarComponenteAsync(Guid id, ComponenteEntradaDto entrada);

        /// <summary>Recusa nome repetido dentro da mesma etapa, etapa fora
        /// das duas conhecidas e ordem menor que 1.</summary>
        Task<Result<SerieDto>> CriarSerieAsync(SerieEntradaDto entrada);

        Task<Result> AlterarSerieAsync(Guid id, SerieEntradaDto entrada);

        /// <summary>Recusa nome repetido dentro do tipo e tipo fora dos três
        /// conhecidos.</summary>
        Task<Result<MetodologiaDto>> CriarMetodologiaAsync(MetodologiaEntradaDto entrada);

        Task<Result> AlterarMetodologiaAsync(Guid id, MetodologiaEntradaDto entrada);
    }
}
