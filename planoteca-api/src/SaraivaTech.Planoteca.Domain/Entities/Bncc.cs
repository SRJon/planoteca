using System;
using SaraivaTech.Planoteca.Domain.Base;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Um código de habilidade da BNCC ligado a um plano — `EF09MA05`.
    ///
    /// A relação é 0..N e OPCIONAL. Nenhum dos relatos analisados traz
    /// código; exigir um na catalogação inviabilizaria o povoamento do
    /// acervo, que é manual e feito dezenas de vezes seguidas.
    /// </summary>
    public class Bncc : Entity
    {
        public Guid PlanoId { get; set; }
        public Plano? Plano { get; set; }
        public string Codigo { get; set; } = string.Empty;
    }
}
