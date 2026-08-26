using System;
using System.Threading.Tasks;
using FluentAssertions;
using NSubstitute;
using SaraivaTech.Planoteca.Application.Core.Services;
using SaraivaTech.Planoteca.Application.Mappers;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Domain.Services;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Application
{
    /// <summary>
    /// O acervo passou a receber imagem além de PDF.
    ///
    /// A lista continua FECHADA, e é isso que estes testes protegem: o
    /// `Content-Type` entra na assinatura da URL, então afrouxá-la é afrouxar
    /// o que pode ser gravado no bucket.
    /// </summary>
    public class PlanoUploadTipoTest
    {
        private readonly IPlanoRepository _repositorio = Substitute.For<IPlanoRepository>();
        private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
        private readonly IArmazenamentoArquivo _armazenamento = Substitute.For<IArmazenamentoArquivo>();

        private PlanoAppService Servico() =>
            new(_repositorio, new PlanoMapper(new VocabularioMapper()), _uow, _armazenamento);

        public PlanoUploadTipoTest()
        {
            _armazenamento
                .AssinarUploadAsync(Arg.Any<string>(), Arg.Any<string>())
                .Returns(new UploadAssinado(
                    "https://upload.example/assinado",
                    "https://pub-exemplo.r2.dev/planos/2026/08/arquivo",
                    "planos/2026/08/arquivo",
                    DateTime.UtcNow.AddMinutes(10)));
        }

        [Theory]
        [InlineData("application/pdf")]
        [InlineData("image/jpeg")]
        [InlineData("image/png")]
        [InlineData("image/webp")]
        public async Task Tipo_aceito_recebe_url_assinada(string tipoConteudo)
        {
            var resultado = await Servico().AssinarUploadAsync("cartaz.bin", tipoConteudo);

            resultado.IsSuccess.Should().BeTrue($"{tipoConteudo} está na lista de aceitos");
            await _armazenamento.Received(1).AssinarUploadAsync("cartaz.bin", tipoConteudo);
        }

        [Theory]
        [InlineData("application/zip")]
        [InlineData("image/svg+xml")]
        [InlineData("text/html")]
        public async Task Tipo_fora_da_lista_e_recusado_antes_de_assinar(string tipoConteudo)
        {
            var resultado = await Servico().AssinarUploadAsync("qualquer.bin", tipoConteudo);

            resultado.IsSuccess.Should().BeFalse();
            resultado.Error!.Message.Should().Contain(tipoConteudo);

            // A recusa acontece ANTES de assinar. Uma URL assinada já emitida
            // valeria mesmo com a resposta de erro.
            await _armazenamento.DidNotReceive()
                .AssinarUploadAsync(Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public async Task Nome_de_arquivo_vazio_e_recusado()
        {
            var resultado = await Servico().AssinarUploadAsync("  ", "image/png");

            resultado.IsSuccess.Should().BeFalse();
        }
    }
}
