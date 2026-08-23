using System.Collections.Generic;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Domain.Repositories.Interfaces
{
    /// <summary>
    /// O vocabulário que classifica um plano.
    ///
    /// Uma interface para as três tabelas, e não três repositórios, porque
    /// elas sempre viajam juntas: a Biblioteca monta os filtros numa chamada
    /// só (`GET /api/v1/vocabulary`), e o formulário de catalogação carrega as
    /// três listas de uma vez. Separar renderia três round-trips para
    /// alimentar uma tela.
    /// </summary>
    public interface IVocabularioRepository
    {
        /// <summary>Só os ativos, ordenados. Um item desativado some do filtro
        /// mas continua válido nos planos que já o citam — por isso é
        /// desativação, e não exclusão.</summary>
        Task<IEnumerable<Componente>> ComponentesAtivosAsync();
        Task<IEnumerable<Serie>> SeriesAtivasAsync();
        Task<IEnumerable<Metodologia>> MetodologiasAtivasAsync();
    }
}
