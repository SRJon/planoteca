using System.Collections.Generic;
using FluentAssertions;
using FluentValidation;
using SaraivaTech.Planoteca.Domain.Core.Validations;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Dominio
{
    /// <summary>
    /// O anexo do plano é OPCIONAL.
    ///
    /// Havia um `NotEmpty()` sobre `ArquivoUrl` no RuleSet "Insert", e ele
    /// recusava plano que o acervo quer ter. Um plano sem anexo entra e
    /// aparece na Biblioteca como qualquer outro — o que some é o botão de
    /// download, decisão que mora na interface, não aqui.
    /// </summary>
    public class PlanoAnexoOpcionalTest
    {
        private static readonly PlanoValidator Validador = new();

        /// <summary>O mínimo que as demais regras exigem, sem anexo.</summary>
        private static Plano PlanoCompleto(string? arquivoUrl)
        {
            var plano = new Plano
            {
                Titulo = "Escape Room: Missão Termoscópio",
                Autoria = "Anna Ruth de Souza e Souza",
                ObjetosConhecimento = "Escalas Termométricas.",
                Objetivo = "Promover a aprendizagem ativa por meio de um jogo.",
                ExpectativasAprendizagem = "Fazer conversões entre escalas de temperatura.",
                ArquivoUrl = arquivoUrl,
                Situacao = SituacaoPlano.Rascunho,
            };

            plano.Componentes.Add(new PlanoComponente { EPrincipal = true });
            plano.Series.Add(new PlanoSerie());
            return plano;
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void Plano_sem_anexo_passa_no_validador(string? arquivoUrl)
        {
            var resultado = Validador.Validate(
                PlanoCompleto(arquivoUrl),
                opcoes => opcoes.IncludeRuleSets("Insert"));

            resultado.IsValid.Should().BeTrue(
                "o anexo é opcional: plano sem arquivo entra no acervo");
            resultado.Errors.Should().NotContain(
                e => e.PropertyName == nameof(Plano.ArquivoUrl),
                "não deve sobrar nenhuma regra sobre o anexo");
        }

        [Fact]
        public void Plano_com_anexo_continua_valido()
        {
            var resultado = Validador.Validate(
                PlanoCompleto("https://pub-exemplo.r2.dev/planos/2026/08/plano-abc.png"),
                opcoes => opcoes.IncludeRuleSets("Insert"));

            resultado.IsValid.Should().BeTrue();
        }

        /// <summary>
        /// O anexo saiu, o RESTO não. Uma remoção que tivesse levado junto as
        /// outras regras passaria despercebida pelos testes acima.
        /// </summary>
        [Fact]
        public void As_demais_regras_continuam_de_pe()
        {
            var plano = PlanoCompleto(null);
            plano.Titulo = string.Empty;
            plano.Componentes = new List<PlanoComponente>();

            var resultado = Validador.Validate(plano, opcoes => opcoes.IncludeRuleSets("Insert"));

            resultado.IsValid.Should().BeFalse();
            resultado.Errors.Should().Contain(e => e.PropertyName == nameof(Plano.Titulo));
            resultado.Errors.Should().Contain(e => e.PropertyName == nameof(Plano.Componentes));
        }
    }
}
