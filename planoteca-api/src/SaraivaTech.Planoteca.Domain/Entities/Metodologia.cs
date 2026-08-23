using SaraivaTech.Planoteca.Domain.Base;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Uma metodologia ativa, técnica ou ferramenta digital.
    ///
    /// Os três convivem numa tabela só, separados por Tipo, porque um plano
    /// os cita da mesma forma ("Storytelling e Escape Room") e o filtro da
    /// Biblioteca não distingue. Fonte guarda de onde a linha veio: as 41
    /// semeadas trazem 'guia-ugb-2020', e o que o administrador cadastrar
    /// depois fica nulo.
    /// </summary>
    public class Metodologia : Entity
    {
        public string Nome { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public string? Fonte { get; set; }
        public bool Ativa { get; set; } = true;
    }
}
