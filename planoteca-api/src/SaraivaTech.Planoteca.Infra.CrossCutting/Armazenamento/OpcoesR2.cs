using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

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

        /// <summary>
        /// O que está preenchido mas ERRADO, em português de gente.
        ///
        /// `EstaConfigurado` só vê se o campo tem algo dentro. Isso deixou
        /// passar um `AccountId` preenchido com a URL inteira do campo "S3
        /// API" do painel da Cloudflare, em vez dos 32 caracteres do
        /// identificador — e o defeito só apareceu no navegador de quem
        /// tentou catalogar, como `https://https//conta.r2...com/bucket.r2...`
        /// e um `ERR_NAME_NOT_RESOLVED` ilegível.
        ///
        /// Configuração errada precisa falhar no ARRANQUE, dizendo o que
        /// corrigir. Descobrir pelo console do navegador de outra pessoa é
        /// tarde demais.
        /// </summary>
        public IReadOnlyList<string> Problemas()
        {
            var problemas = new List<string>();

            // O Account ID é hexadecimal de 32 caracteres. Quem copia o campo
            // "S3 API" inteiro traz `https://`, o domínio e o bucket junto.
            if (!string.IsNullOrWhiteSpace(AccountId) &&
                !Regex.IsMatch(AccountId, "^[0-9a-fA-F]{32}$"))
            {
                problemas.Add(
                    "Armazenamento:R2:AccountId precisa ser só o identificador de 32 caracteres " +
                    "da conta, sem `https://`, sem `.r2.cloudflarestorage.com` e sem o bucket. " +
                    $"Recebido: `{AccountId}`.");
            }

            // A URL pública é o oposto: precisa ser URL absoluta, e a barra
            // final duplicaria a barra ao concatenar a chave do arquivo.
            if (!string.IsNullOrWhiteSpace(UrlPublicaBase))
            {
                if (!Uri.TryCreate(UrlPublicaBase, UriKind.Absolute, out var url) ||
                    (url.Scheme != Uri.UriSchemeHttp && url.Scheme != Uri.UriSchemeHttps))
                {
                    problemas.Add(
                        "Armazenamento:R2:UrlPublicaBase precisa ser uma URL absoluta começando " +
                        $"em http:// ou https://. Recebido: `{UrlPublicaBase}`.");
                }
                else if (UrlPublicaBase.EndsWith('/'))
                {
                    problemas.Add(
                        "Armazenamento:R2:UrlPublicaBase não pode terminar em barra — a chave do " +
                        "arquivo já começa com uma.");
                }
            }

            // O bucket é nome, não caminho nem URL.
            if (!string.IsNullOrWhiteSpace(Bucket) &&
                (Bucket.Contains('/') || Bucket.Contains(':')))
            {
                problemas.Add(
                    $"Armazenamento:R2:Bucket precisa ser só o nome do bucket. Recebido: `{Bucket}`.");
            }

            return problemas;
        }
    }
}
