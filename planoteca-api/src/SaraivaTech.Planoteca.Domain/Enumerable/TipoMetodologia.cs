namespace SaraivaTech.Planoteca.Domain.Enumerable
{
    /// <summary>Os valores aceitos em <see cref="Entities.Metodologia.Tipo"/>.</summary>
    public static class TipoMetodologia
    {
        public const string Metodologia = "metodologia";
        public const string Tecnica = "tecnica";
        public const string Ferramenta = "ferramenta";

        public static readonly string[] Todos = [Metodologia, Tecnica, Ferramenta];
    }
}
