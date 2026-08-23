using FluentAssertions;
using SaraivaTech.Planoteca.Domain.Base;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Base
{
    public class ResultTest
    {
        #region Result

        [Fact]
        public void Success_SemValor_RetornaIsSuccessTrueSemErro()
        {
            var result = Result.Success();

            result.IsSuccess.Should().BeTrue();
            result.Error.Should().BeNull();
        }

        [Fact]
        public void Failure_ComMensagem_UsaCodigoDefaultError()
        {
            var result = Result.Failure("mensagem de erro");

            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Code.Should().Be("ERROR");
            result.Error!.Message.Should().Be("mensagem de erro");
        }

        [Fact]
        public void Failure_ComCodigoEMensagem_UsaCodigoInformado()
        {
            var result = Result.Failure("NOT_FOUND", "nao encontrado");

            result.IsSuccess.Should().BeFalse();
            result.Error!.Code.Should().Be("NOT_FOUND");
            result.Error!.Message.Should().Be("nao encontrado");
        }

        #endregion

        #region Result<T>

        [Fact]
        public void GenericSuccess_ComValor_RetornaIsSuccessTrueEValuePreenchido()
        {
            var result = Result<string>.Success("valor");

            result.IsSuccess.Should().BeTrue();
            result.Value.Should().Be("valor");
            result.Error.Should().BeNull();
        }

        [Fact]
        public void GenericFailure_ComMensagem_ValueFicaDefaultENaoLancaExcecao()
        {
            var result = Result<string>.Failure("mensagem de erro");

            result.IsSuccess.Should().BeFalse();
            result.Value.Should().BeNull();
            result.Error!.Code.Should().Be("ERROR");
            result.Error!.Message.Should().Be("mensagem de erro");
        }

        [Fact]
        public void GenericFailure_ComCodigoEMensagem_UsaCodigoInformado()
        {
            var result = Result<string>.Failure("NOT_FOUND", "nao encontrado");

            result.IsSuccess.Should().BeFalse();
            result.Error!.Code.Should().Be("NOT_FOUND");
            result.Error!.Message.Should().Be("nao encontrado");
        }

        #endregion
    }
}
