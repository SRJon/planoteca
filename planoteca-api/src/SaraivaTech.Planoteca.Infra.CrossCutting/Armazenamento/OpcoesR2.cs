namespace SaraivaTech.Planoteca.Infra.CrossCutting.Armazenamento
{
    /// <summary>
    /// A configuração do Cloudflare R2, lida da seção `Armazenamento:R2`.
    ///
    /// Nenhum destes valores vai versionado. Em desenvolvimento moram em
    /// `appsettings.Local.json` (gitignored); em produção, em variável de
    /// ambiente do Render:
    ///
    /// <code>
    /// Armazenamento__R2__AccountId=...
    /// Armazenamento__R2__AccessKey=...
    /// Armazenamento__R2__SecretKey=...
    /// Armazenamento__R2__Bucket=planoteca-planos
    /// Armazenamento__R2__UrlPublicaBase=https://arquivos.planoteca.example
    /// </code>
    /// </summary>
    public class OpcoesR2
    {
        public const string Secao = "Armazenamento:R2";

        public string AccountId { get; set; } = string.Empty;
        public string AccessKey { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public string Bucket { get; set; } = string.Empty;

        /// <summary>
        /// O domínio por onde o professor baixa o PDF.
        ///
        /// É SEPARADO do endpoint de escrita de propósito: a leitura passa por
        /// um domínio público do R2 (ou um domínio próprio na frente dele), e
        /// a escrita vai para `https://{AccountId}.r2.cloudflarestorage.com`,
        /// que exige assinatura. Confundir os dois publica um link que ninguém
        /// consegue abrir.
        /// </summary>
        public string UrlPublicaBase { get; set; } = string.Empty;

        /// <summary>Validade da URL de upload. Curta de propósito: ela é uma
        /// permissão de escrita circulando fora do servidor.</summary>
        public int MinutosValidadeUpload { get; set; } = 15;

        /// <summary>
        /// `true` quando há o mínimo para falar com o R2.
        ///
        /// Existe para a API subir SEM credencial: em desenvolvimento a
        /// catalogação nem sempre é o que se está mexendo, e derrubar o
        /// processo inteiro por falta de uma chave de upload seria hostil. O
        /// registro no contêiner decide entre a implementação real e a que
        /// recusa com mensagem clara.
        /// </summary>
        public bool EstaConfigurado() =>
            !string.IsNullOrWhiteSpace(AccountId) &&
            !string.IsNullOrWhiteSpace(AccessKey) &&
            !string.IsNullOrWhiteSpace(SecretKey) &&
            !string.IsNullOrWhiteSpace(Bucket) &&
            !string.IsNullOrWhiteSpace(UrlPublicaBase);
    }
}
