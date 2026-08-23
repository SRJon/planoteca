using FluentAssertions;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Resources;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Base
{
    public class LocalizedEnumAttributeTest
    {
        [Fact]
        public void Description_ChaveOuResourceNaoEncontrado_RetornaFormatoFallback()
        {
            // ValidationMessages nao corresponde ao .resx embutido (Validations) - exercita o fallback
            var attribute = new LocalizedEnumAttribute("ChaveQueNaoExiste", typeof(ValidationMessages));

            attribute.Description.Should().Be("[[ChaveQueNaoExiste]]");
        }
    }
}
