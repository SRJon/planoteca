namespace SaraivaTech.Planoteca.Domain.Enumerable
{
    /// <summary>O ciclo de moderação do blog.</summary>
    public static class SituacaoPost
    {
        public const string Pendente = "pendente";
        public const string Publicado = "publicado";
        public const string Devolvido = "devolvido";
        public const string Recusado = "recusado";

        public static readonly string[] Todas = [Pendente, Publicado, Devolvido, Recusado];

        /// <summary>As situações que exigem `ComentarioModeracao` (RF-11).</summary>
        public static readonly string[] ExigemComentario = [Devolvido, Recusado];
    }
}
