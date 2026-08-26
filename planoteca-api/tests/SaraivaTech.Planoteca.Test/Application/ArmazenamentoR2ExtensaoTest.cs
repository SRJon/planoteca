using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Options;
using SaraivaTech.Planoteca.Infra.CrossCutting.Armazenamento;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Application
{
    /// <summary>
    /// A extensão da chave no bucket.
    ///
    /// Ela vinha do nome do arquivo e, quando esse nome não servia, caía num
    /// `.pdf` FIXO. Isso passou a estar errado quando o acervo aceitou
    /// imagem: um PNG gravado como `.pdf` chegaria ao professor com o nome
    /// errado, e nenhum leitor o abriria. Agora quem decide, nesse caso, é o
    /// tipo de conteúdo.
    ///
    /// Não há rede aqui: assinar URL no SDK da AWS é cálculo local, e a
    /// credencial abaixo é de mentira de propósito.
    /// </summary>
    public class ArmazenamentoR2ExtensaoTest
    {
        private const string UrlBase = "https://pub-exemplo.r2.dev";

        private static ArmazenamentoR2 Armazenamento() => new(Options.Create(new OpcoesR2
        {
            AccountId = "82239bd640441aebf4563ef546750a48",
            AccessKey = "chave-de-teste",
            SecretKey = "segredo-de-teste",
            Bucket = "planoteca-planos",
            UrlPublicaBase = UrlBase,
        }));

        private static async Task<string> ChaveDe(string nomeArquivo, string tipoConteudo)
        {
            using var armazenamento = Armazenamento();
            var assinado = await armazenamento.AssinarUploadAsync(nomeArquivo, tipoConteudo);
            return assinado.Chave;
        }

        [Theory]
        [InlineData("application/pdf", ".pdf")]
        [InlineData("image/jpeg", ".jpg")]
        [InlineData("image/png", ".png")]
        [InlineData("image/webp", ".webp")]
        public async Task Nome_sem_extensao_usa_a_extensao_do_tipo(string tipoConteudo, string esperada)
        {
            // "captura de tela" chega do celular sem extensão nenhuma.
            var chave = await ChaveDe("captura de tela", tipoConteudo);

            chave.Should().EndWith(esperada);
        }

        [Fact]
        public async Task Imagem_nao_vira_pdf_a_forca()
        {
            var chave = await ChaveDe("foto", "image/png");

            // O defeito exato que este teste existe para impedir.
            chave.Should().NotEndWith(".pdf");
        }

        [Theory]
        [InlineData("plano.png", "image/png", ".png")]
        [InlineData("relato.pdf", "application/pdf", ".pdf")]
        public async Task Extensao_utilizavel_do_nome_continua_valendo(
            string nomeArquivo, string tipoConteudo, string esperada)
        {
            var chave = await ChaveDe(nomeArquivo, tipoConteudo);

            chave.Should().EndWith(esperada);
        }

        [Fact]
        public async Task Nome_hostil_nao_escapa_do_prefixo()
        {
            // Nome de arquivo vindo do navegador é entrada não confiável.
            var chave = await ChaveDe("../../etc/passwd", "image/png");

            chave.Should().StartWith("planos/").And.NotContain("..");
        }
    }
}
