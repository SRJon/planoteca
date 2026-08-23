namespace SaraivaTech.Planoteca.Domain.Enumerable
{
    /// <summary>Os dois papéis. Visitante não é papel: quem não tem conta
    /// navega, filtra e baixa igual, porque o acervo é público.</summary>
    public static class PapelPessoa
    {
        public const string Professor = "professor";
        public const string Administrador = "administrador";

        public static readonly string[] Todos = [Professor, Administrador];
    }
}
