namespace SaraivaTech.Planoteca.Domain.Enumerable
{
    /// <summary>
    /// Os valores aceitos em <see cref="Entities.Serie.Etapa"/>.
    ///
    /// Constantes de string, e não enum: a coluna é `text` no banco, e o
    /// valor viaja para o front no JSON do vocabulário. Um enum obrigaria
    /// conversor nas duas pontas sem ganhar nada.
    /// </summary>
    public static class EtapaEnsino
    {
        public const string FundamentalAnosFinais = "fundamental_anos_finais";
        public const string Medio = "medio";

        public static readonly string[] Todas = [FundamentalAnosFinais, Medio];
    }
}
