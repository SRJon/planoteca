using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Domain.Repositories.Interfaces
{
    /// <summary>O recorte que a Biblioteca aplica. Todo campo é opcional: a
    /// tela abre sem filtro nenhum, e o professor vai estreitando.</summary>
    public class FiltroPlano
    {
        /// <summary>Busca textual livre. Varre título e objetos de
        /// conhecimento — que é o eixo real do acervo, já que os relatos não
        /// trazem código BNCC.</summary>
        public string? Busca { get; set; }

        /// <summary>OU dentro do grupo: casa com QUALQUER um dos ids da
        /// lista. Vazio (o padrão) significa "sem filtro", não "nenhum
        /// resultado" — o repositório só aplica a cláusula quando a lista tem
        /// item.</summary>
        public Guid[] ComponentesIds { get; set; } = Array.Empty<Guid>();
        public Guid[] SeriesIds { get; set; } = Array.Empty<Guid>();
        public Guid[] MetodologiasIds { get; set; } = Array.Empty<Guid>();

        /// <summary>Duração em aulas, como intervalo fechado.</summary>
        public int? DuracaoMinima { get; set; }
        public int? DuracaoMaxima { get; set; }

        /// <summary>Quando falso, devolve só planos publicados. É o padrão, e
        /// a listagem pública NUNCA deve passar `true` aqui.</summary>
        public bool IncluirRascunhos { get; set; }

        public int Pagina { get; set; } = 1;
        public int TamanhoPagina { get; set; } = 12;
    }

    public interface IPlanoRepository : IRepository<Plano>
    {
        /// <summary>A listagem da Biblioteca, com o total para a paginação.</summary>
        Task<(IEnumerable<Plano> Itens, int Total)> BuscarAsync(FiltroPlano filtro);

        /// <summary>Um plano com tudo que a ficha mostra: etapas ordenadas,
        /// componentes, séries, metodologias e códigos BNCC.</summary>
        Task<Plano?> ObterCompletoAsync(Guid id, bool incluirRascunho = false);
    }
}
