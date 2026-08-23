using System;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>Ligação plano-metodologia. Um relato usa "Storytelling e
    /// Escape Room" — duas de uma vez. Não herda Entity: chave composta.</summary>
    public class PlanoMetodologia
    {
        public Guid PlanoId { get; set; }
        public Plano? Plano { get; set; }
        public Guid MetodologiaId { get; set; }
        public Metodologia? Metodologia { get; set; }
    }
}
