namespace SaraivaTech.Planoteca.Domain.Enumerable
{
    /// <summary>O ciclo de moderação do blog.</summary>
    public static class SituacaoPost
    {
        public const string Pendente = "pendente";
        public const string Publicado = "publicado";
        public const string Devolvido = "devolvido";
        public const string Recusado = "recusado";

        /// <summary>Fora do ar por decisão do administrador. Não é DELETE:
        /// o texto continua existindo, reversível, só some do blog público e
        /// da fila de moderação. É curadoria do acervo, não devolutiva ao
        /// autor — por isso não entra em `ExigemComentario`.</summary>
        public const string Arquivado = "arquivado";

        public static readonly string[] Todas = [Pendente, Publicado, Devolvido, Recusado, Arquivado];

        /// <summary>As situações que exigem `ComentarioModeracao` (RF-11).</summary>
        public static readonly string[] ExigemComentario = [Devolvido, Recusado];
    }
}
