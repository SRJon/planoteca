using SaraivaTech.Planoteca.Domain.Base;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Uma série da educação básica. "1ª série" existe no Fundamental e no
    /// Médio, então o nome sozinho não identifica: a chave natural é
    /// (Etapa, Nome), e a Ordem global permite listar da menor para a maior
    /// sem nenhuma regra de desempate na aplicação.
    /// </summary>
    public class Serie : Entity
    {
        public string Etapa { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string RotuloCompleto { get; set; } = string.Empty;
        public string Sigla { get; set; } = string.Empty;
        public int Ordem { get; set; }
        public bool Ativa { get; set; } = true;
    }
}
