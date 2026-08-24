#nullable enable

using System;
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

        /// <summary>Ativo e inativo, para a tela de gestão do administrador.</summary>
        Task<IEnumerable<Componente>> ComponentesTodosAsync();
        Task<IEnumerable<Serie>> SeriesTodasAsync();
        Task<IEnumerable<Metodologia>> MetodologiasTodasAsync();

        /// <summary>Busca por id RASTREADA — sem `AsNoTracking` — porque o
        /// `Commit` do UnitOfWork persiste o que o contexto rastreia, e a
        /// alteração grava direto na entidade devolvida aqui.</summary>
        Task<Componente?> ComponentePorIdAsync(Guid id);
        Task<Serie?> SeriePorIdAsync(Guid id);
        Task<Metodologia?> MetodologiaPorIdAsync(Guid id);

        /// <summary>`exceto` é o id de quem está sendo alterado, para que
        /// manter o próprio nome não conte como repetição.</summary>
        Task<bool> ExisteComponenteComNomeAsync(string nome, Guid? exceto);

        /// <summary>A chave natural da série é (Etapa, Nome): "1ª série"
        /// existe no Fundamental e no Médio sem ser repetição.</summary>
        Task<bool> ExisteSerieComNomeAsync(string nome, string etapa, Guid? exceto);

        /// <summary>A maior ordem em uso na etapa, ou zero quando ela está
        /// vazia.
        ///
        /// `serie.ordem` é UNIQUE no banco (`VocabularioMap.SerieMap`): a
        /// ordem global 1..7 é o que lista Fundamental e Médio numa sequência
        /// só. Por isso ela é CALCULADA, e não digitada — pedir o número a
        /// quem cadastra é pedir que adivinhe qual está livre, e punir o
        /// palpite errado com a exceção crua do EF Core.</summary>
        Task<int> UltimaOrdemDaEtapaAsync(string etapa);

        /// <summary>As séries com ordem a partir de um valor, para abrir espaço
        /// quando uma série nova entra no meio da sequência.</summary>
        Task<IEnumerable<Serie>> SeriesComOrdemAPartirDeAsync(int ordem);

        /// <summary>A maior ordem em uso na área, ou zero quando ela está
        /// vazia. Componente não tem índice único em ordem — aqui o cálculo
        /// existe só para o campo sumir do formulário, como na série.</summary>
        Task<int> UltimaOrdemDaAreaAsync(string area);
        Task<bool> ExisteMetodologiaComNomeAsync(string nome, Guid? exceto);

        void Insert(Componente componente);
        void Insert(Serie serie);
        void Insert(Metodologia metodologia);
    }
}
