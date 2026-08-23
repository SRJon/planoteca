using System;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Domain.Services;

namespace SaraivaTech.Planoteca.Infra.CrossCutting.Armazenamento
{
    /// <summary>
    /// O que ocupa o lugar do R2 enquanto não há credencial.
    ///
    /// Existe para a API SUBIR sem chave de armazenamento. Quem está mexendo
    /// na Biblioteca — que é leitura pública e não toca em upload — não
    /// deveria precisar de conta na Cloudflare para rodar o projeto.
    ///
    /// O que ele NÃO faz é fingir que funcionou. Toda operação lança, com a
    /// mensagem dizendo exatamente qual configuração falta. Um substituto que
    /// devolvesse uma URL falsa gravaria `ArquivoUrl` apontando para o nada, e
    /// o defeito só apareceria quando um professor clicasse em "Baixar plano".
    /// </summary>
    public class ArmazenamentoNaoConfigurado : IArmazenamentoArquivo
    {
        private const string Mensagem =
            "O armazenamento de arquivos não está configurado. " +
            "Preencha `Armazenamento:R2` (AccountId, AccessKey, SecretKey, Bucket, UrlPublicaBase) " +
            "em `appsettings.Local.json` ou nas variáveis de ambiente do Render.";

        public Task<UploadAssinado> AssinarUploadAsync(string nomeArquivo, string tipoConteudo) =>
            throw new InvalidOperationException(Mensagem);

        public Task RemoverAsync(string chave) =>
            throw new InvalidOperationException(Mensagem);

        public string UrlPublica(string chave) =>
            throw new InvalidOperationException(Mensagem);
    }
}
