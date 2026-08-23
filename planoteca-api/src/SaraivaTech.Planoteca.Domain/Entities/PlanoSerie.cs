using System;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Ligação plano-série. N:N porque um relato declara "2ª série I01 e 2ª
    /// série I02", e uma sequência didática que serve 8º e 9º ano é a norma.
    /// Com 1:1, catalogá-la exigiria duplicar o plano.
    ///
    /// Não herda Entity: a chave é composta.
    /// </summary>
    public class PlanoSerie
    {
        public Guid PlanoId { get; set; }
        public Plano? Plano { get; set; }
        public Guid SerieId { get; set; }
        public Serie? Serie { get; set; }
    }
}
