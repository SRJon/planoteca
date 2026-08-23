using System.Collections.Generic;
using Riok.Mapperly.Abstractions;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Application.Mappers
{
    /// <summary>
    /// Entidade de vocabulário para DTO. Mapeamento direto: os nomes batem, e
    /// o Mapperly gera o código em tempo de compilação, sem reflexão.
    /// </summary>
    [Mapper]
    public partial class VocabularioMapper
    {
        public partial ComponenteDto ParaDto(Componente entidade);
        public partial SerieDto ParaDto(Serie entidade);
        public partial MetodologiaDto ParaDto(Metodologia entidade);

        public partial List<ComponenteDto> ParaDto(IEnumerable<Componente> entidades);
        public partial List<SerieDto> ParaDto(IEnumerable<Serie> entidades);
        public partial List<MetodologiaDto> ParaDto(IEnumerable<Metodologia> entidades);
    }
}
