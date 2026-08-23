using System.Linq;
using FluentAssertions;
using SaraivaTech.Planoteca.Domain.Enumerable;
using SaraivaTech.Planoteca.Infra.Data.Seed;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Dominio
{
    public class DadosIniciaisTest
    {
        [Fact]
        public void Metodologias_tem_41_linhas_nos_tres_tipos()
        {
            var todas = DadosIniciais.Metodologias();

            todas.Should().HaveCount(41, "o guia traz 16 metodologias, 13 técnicas e 12 ferramentas");
            todas.Count(x => x.Tipo == TipoMetodologia.Metodologia).Should().Be(16);
            todas.Count(x => x.Tipo == TipoMetodologia.Tecnica).Should().Be(13);
            todas.Count(x => x.Tipo == TipoMetodologia.Ferramenta).Should().Be(12);
        }

        [Fact]
        public void Metodologias_nao_repete_nome()
        {
            var nomes = DadosIniciais.Metodologias().Select(x => x.Nome.ToLowerInvariant());

            nomes.Should().OnlyHaveUniqueItems();
        }

        [Fact]
        public void Metodologias_traz_as_duas_do_relato_do_termoscopio()
        {
            var nomes = DadosIniciais.Metodologias().Select(x => x.Nome);

            nomes.Should().Contain("Storytelling");
            nomes.Should().Contain("Escape Room");
        }

        [Fact]
        public void Series_tem_sete_linhas_com_ordem_unica()
        {
            var series = DadosIniciais.Series();

            series.Should().HaveCount(7, "6º ao 9º ano e 1ª a 3ª série do Médio");
            series.Select(x => x.Ordem).Should().OnlyHaveUniqueItems();
            series.Select(x => x.Ordem).Should().BeInAscendingOrder();
        }

        [Fact]
        public void Series_desambigua_primeira_serie_entre_etapas()
        {
            var series = DadosIniciais.Series();
            var medio = series.Single(x => x.Nome == "1ª série" && x.Etapa == EtapaEnsino.Medio);

            medio.Rotulo.Should().Be("1ª série do Ensino Médio",
                "o nome sozinho é ambíguo — existe 1ª série no Fundamental e no Médio");
        }

        [Fact]
        public void Componentes_sempre_tem_cor_e_sigla_de_duas_letras()
        {
            foreach (var (_, _, nome, sigla, cor) in DadosIniciais.Componentes())
            {
                cor.Should().NotBeNullOrWhiteSpace($"{nome} nasceria com bloco transparente");
                sigla.Should().HaveLength(2, $"a sigla de {nome} tem largura fixa no card");
            }
        }

        [Fact]
        public void Componentes_cobre_o_que_o_acervo_real_traz()
        {
            var nomes = DadosIniciais.Componentes().Select(x => x.Nome);

            // As três que o modelo antigo, com "Ciências" genérico, não cobria.
            nomes.Should().Contain("Química");
            nomes.Should().Contain("Física");
            nomes.Should().Contain("Biologia");
        }

        [Fact]
        public void Componentes_nao_repete_sigla()
        {
            var siglas = DadosIniciais.Componentes().Select(x => x.Sigla);

            siglas.Should().OnlyHaveUniqueItems("a sigla identifica o componente no card");
        }
    }
}
