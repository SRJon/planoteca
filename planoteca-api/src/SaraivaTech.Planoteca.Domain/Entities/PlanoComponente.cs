using System;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Ligação plano-componente, com um principal.
    ///
    /// EPrincipal existe porque o card da Biblioteca tem UM bloco de cor com
    /// a sigla de duas letras — é a assinatura da direção visual. Um plano
    /// com três componentes iguais deixaria o card sem saber que cor usar.
    /// O principal manda na cor; os demais aparecem na ficha e continuam
    /// filtráveis.
    ///
    /// Não herda Entity: a chave é composta (PlanoId, ComponenteId).
    /// </summary>
    public class PlanoComponente
    {
        public Guid PlanoId { get; set; }
        public Plano? Plano { get; set; }
        public Guid ComponenteId { get; set; }
        public Componente? Componente { get; set; }
        public bool EPrincipal { get; set; }
    }
}
