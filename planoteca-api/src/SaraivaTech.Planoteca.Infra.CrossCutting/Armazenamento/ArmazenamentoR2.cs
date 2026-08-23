using System;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using SaraivaTech.Planoteca.Domain.Services;

namespace SaraivaTech.Planoteca.Infra.CrossCutting.Armazenamento
{
    /// <summary>
    /// Armazenamento no Cloudflare R2, pelo protocolo S3.
    ///
    /// O R2 fala S3, então o SDK da AWS serve — com dois ajustes:
    /// `ServiceURL` apontando para o endpoint da conta, e
    /// `ForcePathStyle`, porque o R2 não usa bucket como subdomínio.
    /// </summary>
    public class ArmazenamentoR2 : IArmazenamentoArquivo, IDisposable
    {
        private readonly OpcoesR2 _opcoes;
        private readonly IAmazonS3 _cliente;

        public ArmazenamentoR2(IOptions<OpcoesR2> opcoes)
        {
            _opcoes = opcoes.Value;

            _cliente = new AmazonS3Client(
                _opcoes.AccessKey,
                _opcoes.SecretKey,
                new AmazonS3Config
                {
                    ServiceURL = $"https://{_opcoes.AccountId}.r2.cloudflarestorage.com",
                    // O R2 endereça por caminho (`/bucket/chave`), não por
                    // subdomínio como a AWS. Sem isto, toda requisição vai
                    // para um host que não existe.
                    ForcePathStyle = true,
                    // O R2 ignora região, mas o SDK exige uma declarada.
                    AuthenticationRegion = "auto",
                });
        }

        public async Task<UploadAssinado> AssinarUploadAsync(string nomeArquivo, string tipoConteudo)
        {
            var chave = MontarChave(nomeArquivo);
            var expira = DateTime.UtcNow.AddMinutes(_opcoes.MinutosValidadeUpload);

            var pedido = new GetPreSignedUrlRequest
            {
                BucketName = _opcoes.Bucket,
                Key = chave,
                Verb = HttpVerb.PUT,
                Expires = expira,
                // O tipo entra na ASSINATURA: se o navegador enviar outro, o
                // R2 recusa. É o que impede a URL de virar um canal para subir
                // qualquer coisa.
                ContentType = tipoConteudo,
            };

            var url = await _cliente.GetPreSignedURLAsync(pedido);

            return new UploadAssinado(url, UrlPublica(chave), chave, expira);
        }

        public async Task RemoverAsync(string chave)
        {
            await _cliente.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = _opcoes.Bucket,
                Key = chave,
            });
        }

        public string UrlPublica(string chave) =>
            $"{_opcoes.UrlPublicaBase.TrimEnd('/')}/{chave}";

        /// <summary>O inverso exato de `UrlPublica`. Ver o contrato na
        /// interface.</summary>
        public string? ChaveDaUrl(string urlPublica)
        {
            if (string.IsNullOrWhiteSpace(urlPublica)) return null;

            var prefixo = _opcoes.UrlPublicaBase.TrimEnd('/') + "/";
            if (!urlPublica.StartsWith(prefixo, StringComparison.OrdinalIgnoreCase))
                return null;

            var chave = urlPublica[prefixo.Length..];
            return string.IsNullOrWhiteSpace(chave) ? null : chave;
        }

        /// <summary>
        /// A chave do objeto no bucket.
        ///
        /// O nome que vem do navegador é entrada NÃO CONFIÁVEL: pode trazer
        /// `../`, caractere de controle, ou 300 caracteres de acento. Ele
        /// serve só para duas coisas — a extensão e um trecho legível, ambos
        /// higienizados. A unicidade vem de um GUID, nunca do nome.
        ///
        /// O prefixo por ano e mês não é enfeite: é o que mantém a listagem do
        /// bucket navegável depois de mil planos.
        /// </summary>
        private static string MontarChave(string nomeArquivo)
        {
            var agora = DateTime.UtcNow;
            var extensao = Path.GetExtension(nomeArquivo);
            extensao = Regex.IsMatch(extensao ?? string.Empty, @"^\.[A-Za-z0-9]{1,8}$")
                ? extensao!.ToLowerInvariant()
                : ".pdf";

            var semExtensao = Path.GetFileNameWithoutExtension(nomeArquivo) ?? string.Empty;
            var legivel = Regex.Replace(semExtensao, @"[^A-Za-z0-9]+", "-").Trim('-').ToLowerInvariant();
            if (legivel.Length > 60) legivel = legivel[..60];
            if (string.IsNullOrEmpty(legivel)) legivel = "plano";

            return $"planos/{agora:yyyy}/{agora:MM}/{legivel}-{Guid.NewGuid():N}{extensao}";
        }

        public void Dispose()
        {
            _cliente?.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
