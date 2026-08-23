using FluentAssertions;
using SaraivaTech.Planoteca.Infra.CrossCutting.Armazenamento;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Application
{
    /// <summary>
    /// A configuração do R2, quando ela está preenchida mas errada.
    ///
    /// O caso que originou estes testes veio de produção: o `AccountId` foi
    /// preenchido com a URL inteira do campo "S3 API" do painel da
    /// Cloudflare. `EstaConfigurado` aprovou — o campo tinha conteúdo — e o
    /// erro só apareceu no console do navegador de quem tentou catalogar,
    /// como `https://https//conta.r2...com/bucket.r2...` seguido de
    /// `ERR_NAME_NOT_RESOLVED`.
    /// </summary>
    public class OpcoesR2Test
    {
        private static OpcoesR2 Validas() => new()
        {
            AccountId = "82239bd640441aebf4563ef546750a48",
            AccessKey = "chave",
            SecretKey = "segredo",
            Bucket = "planoteca-planos",
            UrlPublicaBase = "https://pub-ce892804cb5d495ea9c69a78df3974d7.r2.dev",
        };

        [Fact]
        public void Configuracao_correta_nao_tem_problema()
        {
            Validas().Problemas().Should().BeEmpty();
        }

        [Fact]
        public void Account_id_com_a_url_inteira_e_recusado()
        {
            // O valor exato que quebrou em produção.
            var opcoes = Validas();
            opcoes.AccountId =
                "https://82239bd640441aebf4563ef546750a48.r2.cloudflarestorage.com/planoteca-planos";

            opcoes.Problemas().Should().ContainSingle()
                .Which.Should().Contain("AccountId").And.Contain("32 caracteres");
        }

        [Fact]
        public void Account_id_curto_demais_e_recusado()
        {
            var opcoes = Validas();
            opcoes.AccountId = "82239bd6";

            opcoes.Problemas().Should().ContainSingle();
        }

        [Fact]
        public void Url_publica_sem_esquema_e_recusada()
        {
            var opcoes = Validas();
            opcoes.UrlPublicaBase = "pub-ce892804.r2.dev";

            opcoes.Problemas().Should().ContainSingle()
                .Which.Should().Contain("UrlPublicaBase");
        }

        [Fact]
        public void Url_publica_com_barra_final_e_recusada()
        {
            // A chave do arquivo já começa com barra; a dupla produz `//`.
            var opcoes = Validas();
            opcoes.UrlPublicaBase = "https://pub-ce892804.r2.dev/";

            opcoes.Problemas().Should().ContainSingle()
                .Which.Should().Contain("barra");
        }

        [Fact]
        public void Bucket_com_caminho_e_recusado()
        {
            var opcoes = Validas();
            opcoes.Bucket = "planoteca-planos/planos";

            opcoes.Problemas().Should().ContainSingle()
                .Which.Should().Contain("Bucket");
        }

        [Fact]
        public void Configuracao_vazia_nao_gera_problema_de_formato()
        {
            // Vazio é degradação deliberada: a API sobe sem R2, e
            // `ArmazenamentoNaoConfigurado` recusa cada operação com mensagem
            // clara. Só o preenchido-e-errado precisa derrubar o arranque.
            new OpcoesR2().Problemas().Should().BeEmpty();
        }
    }
}
