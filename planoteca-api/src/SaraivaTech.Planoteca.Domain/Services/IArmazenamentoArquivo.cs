using System;
using System.Threading.Tasks;

namespace SaraivaTech.Planoteca.Domain.Services
{
    /// <summary>O que a API devolve para o navegador subir o arquivo sozinho.</summary>
    /// <param name="UrlUpload">URL assinada, de uso único, para o `PUT` do arquivo.</param>
    /// <param name="UrlPublica">Onde o arquivo vai responder depois de subir. É
    /// esta que vai para `Plano.ArquivoUrl`.</param>
    /// <param name="Chave">O caminho do objeto dentro do bucket.</param>
    /// <param name="ExpiraEm">Quando a URL de upload deixa de valer.</param>
    public record UploadAssinado(string UrlUpload, string UrlPublica, string Chave, DateTime ExpiraEm);

    /// <summary>
    /// Onde o PDF do plano mora.
    ///
    /// ── Por que URL pré-assinada, e não upload pela API ──────────────────
    ///
    /// O arquivo vai do NAVEGADOR direto para o armazenamento. A API só
    /// assina a URL e guarda o endereço final.
    ///
    /// A razão é a hospedagem: o back-end roda no plano gratuito do Render,
    /// com memória apertada e sistema de arquivos efêmero. Um PDF de 100 MB
    /// atravessando o processo consumiria a memória inteira, e gravá-lo em
    /// disco seria inútil — o próximo deploy apaga.
    ///
    /// ── Por que existe esta interface, e não uma classe do R2 ────────────
    ///
    /// O `Domain` não conhece Cloudflare, nem AWS, nem `HttpClient`. A
    /// implementação vive em `Infra`, e trocar de provedor não encosta em
    /// nenhuma regra de negócio. Serve também aos testes, que usam um
    /// substituto sem rede.
    /// </summary>
    public interface IArmazenamentoArquivo
    {
        /// <summary>
        /// Assina uma URL para o navegador subir o arquivo.
        /// </summary>
        /// <param name="nomeArquivo">O nome original, usado só para derivar a
        /// extensão e um nome legível. NUNCA vira a chave direto: nome de
        /// arquivo vindo do navegador é entrada não confiável.</param>
        /// <param name="tipoConteudo">O `Content-Type` que o navegador vai
        /// enviar. Entra na assinatura, então o upload falha se ele mentir.</param>
        Task<UploadAssinado> AssinarUploadAsync(string nomeArquivo, string tipoConteudo);

        /// <summary>Remove o objeto. Usado quando a catalogação é cancelada e
        /// o arquivo já subiu — senão o bucket acumula órfão.</summary>
        Task RemoverAsync(string chave);

        /// <summary>
        /// A chave de volta, a partir da URL pública guardada em
        /// `plano.arquivo_url`.
        ///
        /// O banco guarda a URL, não a chave — é ela que a interface usa para
        /// o download. Mas remover o objeto exige a chave, e reconstruí-la
        /// com um `Split('/')` no serviço amarraria a camada de aplicação ao
        /// formato da URL. Quem monta é quem sabe desmontar.
        ///
        /// `null` quando a URL não pertence a este armazenamento — um plano
        /// antigo apontando para outro lugar, ou uma URL colada à mão. Nesse
        /// caso não há o que remover, e inventar uma chave apagaria o objeto
        /// errado.
        /// </summary>
        string? ChaveDaUrl(string urlPublica);

        /// <summary>A URL pública de leitura de uma chave. Anônima, sem token:
        /// baixar plano não exige conta.</summary>
        string UrlPublica(string chave);
    }
}
