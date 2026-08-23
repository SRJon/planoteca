using System.Linq;
using FluentAssertions;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Dominio
{
    public class ModeloDominioTest
    {
        /// <summary>
        /// RF-10 — o teste que prova que o acervo real cabe.
        ///
        /// Reproduz o relato "Escape Room: Missão Termoscópio", da p. 12 do
        /// e-book da SEDU: Química, 2ª série (turmas I01 e I02), integral,
        /// com DUAS metodologias e NENHUM código BNCC. Nenhuma dessas quatro
        /// características cabia no modelo anterior.
        /// </summary>
        [Fact]
        public void Plano_do_acervo_real_cabe_no_modelo()
        {
            var quimica = new Componente
            {
                Nome = "Química",
                Sigla = "QU",
                Cor = "comp-natureza",
                Area = "Ciências da Natureza e suas Tecnologias",
            };
            var segundaSerie = new Serie
            {
                Nome = "2ª série",
                Etapa = EtapaEnsino.Medio,
                RotuloCompleto = "2ª série do Ensino Médio",
                Sigla = "2ªEM",
                Ordem = 6,
            };
            var storytelling = new Metodologia { Nome = "Storytelling", Tipo = TipoMetodologia.Metodologia };
            var escapeRoom = new Metodologia { Nome = "Escape Room", Tipo = TipoMetodologia.Metodologia };

            var plano = new Plano
            {
                Titulo = "Escape Room: Missão Termoscópio — O Enigma das Escalas Perdidas",
                Autoria = "Anna Ruth de Souza e Souza",
                ObjetosConhecimento = "Escalas Termométricas.",
                Modalidade = "Integral",
                TurmaOrigem = "2ª série I01 e 2ª série I02",
                Objetivo = "Promover a aprendizagem ativa por meio de um jogo de Escape Room.",
                ExpectativasAprendizagem = "Fazer conversões entre diversas escalas de temperatura.",
                Recursos = "Cartões de pistas, lápis, projetor, celular, QR Codes, timer, notebook.",
                ArquivoUrl = "/arquivos/termoscopio.pdf",
                Situacao = SituacaoPlano.Publicado,
            };

            plano.Componentes.Add(new PlanoComponente { Componente = quimica, EPrincipal = true });
            plano.Series.Add(new PlanoSerie { Serie = segundaSerie });
            plano.Metodologias.Add(new PlanoMetodologia { Metodologia = storytelling });
            plano.Metodologias.Add(new PlanoMetodologia { Metodologia = escapeRoom });
            plano.Etapas.Add(new EtapaPlano
            {
                Ordem = 1,
                Titulo = "Início da Missão: O Mistério do Termoscópio",
                Descricao = "Contextualize a missão por meio de uma narrativa desafiadora.",
            });
            plano.Etapas.Add(new EtapaPlano
            {
                Ordem = 2,
                Titulo = "Formação das Equipes de Cientistas",
                Descricao = "Divida a turma em equipes.",
            });

            plano.Metodologias.Should().HaveCount(2, "RF-04: o relato usa Storytelling E Escape Room");
            plano.CodigosBncc.Should().BeEmpty("RF-05: nenhum relato analisado traz código BNCC");
            plano.Etapas.OrderBy(e => e.Ordem).First().Ordem.Should().Be(1, "RF-06");
            plano.Componentes.Single(c => c.EPrincipal).Componente!.Nome.Should().Be("Química", "RF-04b");
        }

        /// <summary>RF-04a — o caso que motivou a ligação N:N de série.</summary>
        [Fact]
        public void Plano_atende_mais_de_uma_serie()
        {
            var oitavo = new Serie
            {
                Nome = "8º ano",
                Etapa = EtapaEnsino.FundamentalAnosFinais,
                RotuloCompleto = "8º ano do Ensino Fundamental",
                Sigla = "8º",
                Ordem = 3,
            };
            var nono = new Serie
            {
                Nome = "9º ano",
                Etapa = EtapaEnsino.FundamentalAnosFinais,
                RotuloCompleto = "9º ano do Ensino Fundamental",
                Sigla = "9º",
                Ordem = 4,
            };

            var plano = new Plano { Titulo = "Sequência didática de duas séries" };
            plano.Series.Add(new PlanoSerie { Serie = oitavo });
            plano.Series.Add(new PlanoSerie { Serie = nono });

            plano.Series.Should().HaveCount(2);
            plano.Series.Select(s => s.Serie!.Ordem).Should().BeEquivalentTo(new[] { 3, 4 });
        }

        /// <summary>RF-04b — prática interdisciplinar tem um componente principal.</summary>
        [Fact]
        public void Plano_interdisciplinar_tem_um_principal_e_secundarios_filtraveis()
        {
            var arte = new Componente
            {
                Nome = "Arte",
                Sigla = "AR",
                Cor = "comp-linguagens",
                Area = "Linguagens e suas Tecnologias",
            };
            var historia = new Componente
            {
                Nome = "História",
                Sigla = "HI",
                Cor = "comp-humanas",
                Area = "Ciências Humanas e Sociais Aplicadas",
            };

            var plano = new Plano { Titulo = "Prática interdisciplinar" };
            plano.Componentes.Add(new PlanoComponente { Componente = historia, EPrincipal = true });
            plano.Componentes.Add(new PlanoComponente { Componente = arte, EPrincipal = false });

            plano.Componentes.Should().HaveCount(2);
            plano.Componentes.Count(c => c.EPrincipal).Should().Be(1, "o card tem UM bloco de cor");
            plano.Componentes.Should().Contain(c => c.Componente!.Nome == "Arte",
                "buscar por Arte precisa achar a prática em que Arte é secundária");
        }

        [Fact]
        public void Post_nasce_pendente()
        {
            new Post().Situacao.Should().Be(SituacaoPost.Pendente, "RF-11");
        }

        [Fact]
        public void Pessoa_nasce_professor()
        {
            new Pessoa().Papel.Should().Be(PapelPessoa.Professor,
                "quem se cadastra sozinho não vira administrador");
        }

        [Fact]
        public void Plano_nasce_rascunho()
        {
            new Plano().Situacao.Should().Be(SituacaoPlano.Rascunho,
                "catalogar não é publicar");
        }

        [Fact]
        public void Devolver_e_recusar_exigem_comentario_de_moderacao()
        {
            SituacaoPost.ExigemComentario.Should().BeEquivalentTo(
                new[] { SituacaoPost.Devolvido, SituacaoPost.Recusado },
                "RF-11: devolver sem dizer o motivo transforma moderação em silêncio");
        }
    }
}
