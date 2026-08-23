namespace SaraivaTech.Planoteca.Domain.Enumerable
{
    /// <summary>Os valores aceitos em <see cref="Entities.Plano.Situacao"/>.
    /// Rascunho permite catalogar sem publicar na hora.</summary>
    public static class SituacaoPlano
    {
        public const string Rascunho = "rascunho";
        public const string Publicado = "publicado";

        public static readonly string[] Todas = [Rascunho, Publicado];
    }
}
