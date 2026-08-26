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

    /// <summary>Um item de vocabulário e quantos planos ele responde dentro
    /// do recorte. `record struct` porque é par de valor sem identidade — não
    /// há nada a rastrear nem a comparar por referência.</summary>
    public readonly record struct FacetaContada(Guid Id, int Total);

    /// <summary>As três contagens de uma consulta só.
    ///
    /// Três listas num tipo, e não três chamadas, porque a tela desenha as
    /// três de uma vez: uma ida por grupo faria três viagens ao Render
    /// gratuito a cada teclada da busca.
    ///
    /// Tipo de domínio, e não `FacetasDto`: o repositório não conhece a camada
    /// de aplicação. A tradução é do AppService.</summary>
    public class ContagemFacetas
    {
        public IReadOnlyList<FacetaContada> Series { get; init; } = [];
        public IReadOnlyList<FacetaContada> Componentes { get; init; } = [];
        public IReadOnlyList<FacetaContada> Metodologias { get; init; } = [];
    }

    public interface IPlanoRepository : IRepository<Plano>
    {
        /// <summary>A listagem da Biblioteca, com o total para a paginação.</summary>
        Task<(IEnumerable<Plano> Itens, int Total)> BuscarAsync(FiltroPlano filtro);

        /// <summary>Um plano com tudo que a ficha mostra: etapas ordenadas,
        /// componentes, séries, metodologias e códigos BNCC.</summary>
        Task<Plano?> ObterCompletoAsync(Guid id, bool incluirRascunho = false);

        /// <summary>Quantos planos cada item do vocabulário responde.
        ///
        /// A contagem de um grupo IGNORA a seleção do próprio grupo, e aplica
        /// a dos outros dois mais a busca e a duração (RF-02). É o que faz o
        /// número ao lado de "História" dizer "quantos planos eu ganho se
        /// marcar isto", em vez de repetir o total já filtrado.
        ///
        /// `Pagina` e `TamanhoPagina` do filtro são ignorados: a contagem é do
        /// recorte inteiro, não da página à vista.</summary>
        Task<ContagemFacetas> ContarFacetasAsync(FiltroPlano filtro);
    }
}
