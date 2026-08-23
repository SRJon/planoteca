using SaraivaTech.Planoteca.Domain.Base;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    /// <summary>
    /// Um componente curricular, agrupado por área do conhecimento.
    ///
    /// Cor e Sigla são obrigatórias porque a ficha da Biblioteca desenha um
    /// bloco chapado com a sigla de duas letras — um componente sem cor
    /// nasceria com bloco transparente. A garantia saiu do compilador (era
    /// union em TypeScript) e virou restrição de banco.
    /// </summary>
    public class Componente : Entity
    {
        public string Area { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string Sigla { get; set; } = string.Empty;
        public string Cor { get; set; } = string.Empty;
        public int Ordem { get; set; }
        public bool Ativo { get; set; } = true;
    }
}
