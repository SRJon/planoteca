namespace SaraivaTech.Planoteca.Domain.Enumerable
{
    /// <summary>
    /// Os quatro tokens de cor aceitos em <see cref="Entities.Componente.Cor"/>.
    ///
    /// Lista fechada, de propósito: o Tailwind só gera classe escrita
    /// literalmente no fonte, então um token fora desta lista produziria um
    /// bloco sem cor no card. A metade gêmea desta lista mora em
    /// `planoteca-web/src/entities/vocabulario/modelo.ts`
    /// (`CORES_COMPONENTE`) — as duas precisam concordar, e alterar uma sem
    /// a outra é o defeito que este comentário existe para evitar.
    /// </summary>
    public static class CorComponente
    {
        public const string Linguagens = "comp-linguagens";
        public const string Matematica = "comp-matematica";
        public const string Natureza = "comp-natureza";
        public const string Humanas = "comp-humanas";

        public static readonly string[] Todas =
            [Linguagens, Matematica, Natureza, Humanas];
    }
}
