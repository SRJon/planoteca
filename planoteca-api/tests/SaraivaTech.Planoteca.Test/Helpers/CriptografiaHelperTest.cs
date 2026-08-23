using FluentAssertions;
using SaraivaTech.Planoteca.Application.Core.Helpers;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Helpers
{
    public class CriptografiaHelperTest
    {
        private const string Key = "0123456789ABCDEF";

        [Fact]
        public void EncryptAes_RetornaBase64UrlSafeSemPadding()
        {
            var encrypted = CriptografiaHelper.EncryptAes("teste", Key);

            encrypted.Should().NotContain("+").And.NotContain("/").And.NotEndWith("=");
        }

        [Fact]
        public void DecryptAes_Roundtrip_ReinsereHifenDoisCaracteresDoFinal()
        {
            var encrypted = CriptografiaHelper.EncryptAes("1234567", Key);

            var decrypted = CriptografiaHelper.DecryptAes(encrypted, Key);

            decrypted.Should().Be("12345-67");
        }

        [Fact]
        public void DecryptAes_TextoMenorQueTres_NaoInsereHifen()
        {
            var encrypted = CriptografiaHelper.EncryptAes("ab", Key);

            var decrypted = CriptografiaHelper.DecryptAes(encrypted, Key);

            decrypted.Should().Be("ab");
        }
    }
}
