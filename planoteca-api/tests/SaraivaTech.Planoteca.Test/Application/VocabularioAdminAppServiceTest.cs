#nullable enable

using System;
using System.Threading.Tasks;
using FluentAssertions;
using NSubstitute;
using SaraivaTech.Planoteca.Application.Core.Services;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Mappers;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Application
{
    /// <summary>
    /// As regras de recusa da gestão de vocabulário: cor fora do tema, nome
    /// repetido dentro do tipo, etapa e tipo desconhecidos. Um teste por
    /// regra de RF-10, mais o caminho feliz — a mensagem exata é o contrato
    /// que a tela mostra ao administrador.
    /// </summary>
    public class VocabularioAdminAppServiceTest
    {
        private readonly IVocabularioRepository _repositorio = Substitute.For<IVocabularioRepository>();
        private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();

        private VocabularioAdminAppService CriarSut() => new(_repositorio, _uow, new VocabularioMapper());

        [Fact]
        public async Task CriarComponenteAsync_recusa_cor_fora_do_tema()
        {
            var sut = CriarSut();
            var entrada = new ComponenteEntradaDto
            {
                Nome = "Filosofia", Area = "Ciências Humanas",
                Sigla = "FI", Cor = "comp-roxo",
            };

            var resultado = await sut.CriarComponenteAsync(entrada);

            resultado.IsSuccess.Should().BeFalse();
            resultado.Error!.Message.Should().Be("A cor precisa ser um token que o tema conhece.");
        }

        [Fact]
        public async Task CriarComponenteAsync_recusa_nome_repetido()
        {
            _repositorio.ExisteComponenteComNomeAsync("Filosofia", null).Returns(true);
            var sut = CriarSut();
            var entrada = new ComponenteEntradaDto
            {
                Nome = "Filosofia", Area = "Ciências Humanas",
                Sigla = "FI", Cor = "comp-humanas",
            };

            var resultado = await sut.CriarComponenteAsync(entrada);

            resultado.IsSuccess.Should().BeFalse();
            resultado.Error!.Message.Should().Be("Já existe um item com este nome.");
        }

        [Fact]
        public async Task CriarComponenteAsync_grava_quando_a_entrada_e_valida()
        {
            _repositorio.ExisteComponenteComNomeAsync("Filosofia", null).Returns(false);
            var sut = CriarSut();
            var entrada = new ComponenteEntradaDto
            {
                Nome = "Filosofia", Area = "Ciências Humanas",
                Sigla = "FI", Cor = "comp-humanas",
            };

            var resultado = await sut.CriarComponenteAsync(entrada);

            resultado.IsSuccess.Should().BeTrue();
            _repositorio.Received(1).Insert(Arg.Is<Componente>(c =>
                c.Nome == "Filosofia" && c.Cor == "comp-humanas" && c.Ativo));
        }

        [Fact]
        public async Task AlterarComponenteAsync_aceita_o_proprio_nome()
        {
            var id = Guid.NewGuid();
            _repositorio.ComponentePorIdAsync(id).Returns(new Componente
            {
                Nome = "Filosofia", Area = "Ciências Humanas",
                Sigla = "FI", Cor = "comp-humanas",
            });
            _repositorio.ExisteComponenteComNomeAsync("Filosofia", id).Returns(false);
            var sut = CriarSut();
            var entrada = new ComponenteEntradaDto
            {
                Nome = "Filosofia", Area = "Ciências Humanas",
                Sigla = "FI", Cor = "comp-humanas",
            };

            var resultado = await sut.AlterarComponenteAsync(id, entrada);

            resultado.IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task AlterarComponenteAsync_recusa_id_que_nao_existe()
        {
            var id = Guid.NewGuid();
            _repositorio.ComponentePorIdAsync(id).Returns((Componente?)null);
            var sut = CriarSut();
            var entrada = new ComponenteEntradaDto
            {
                Nome = "Filosofia", Area = "Ciências Humanas",
                Sigla = "FI", Cor = "comp-humanas",
            };

            var resultado = await sut.AlterarComponenteAsync(id, entrada);

            resultado.IsSuccess.Should().BeFalse();
            resultado.Error!.Message.Should().Be("Componente não encontrado.");
        }

        [Fact]
        public async Task CriarSerieAsync_recusa_etapa_desconhecida()
        {
            var sut = CriarSut();
            var entrada = new SerieEntradaDto
            {
                Nome = "4ª série", Etapa = "superior",
                RotuloCompleto = "4ª série do superior", Sigla = "4S",
            };

            var resultado = await sut.CriarSerieAsync(entrada);

            resultado.IsSuccess.Should().BeFalse();
            resultado.Error!.Message.Should().Be("A etapa é fundamental ou médio.");
        }

        [Fact]
        public async Task CriarMetodologiaAsync_recusa_tipo_desconhecido()
        {
            var sut = CriarSut();
            var entrada = new MetodologiaEntradaDto { Nome = "Escape Room", Tipo = "dinamica" };

            var resultado = await sut.CriarMetodologiaAsync(entrada);

            resultado.IsSuccess.Should().BeFalse();
            resultado.Error!.Message.Should().Be("O tipo é metodologia, técnica ou ferramenta.");
        }

        [Fact]
        public async Task ObterTudoAsync_devolve_o_inativo()
        {
            _repositorio.ComponentesTodosAsync().Returns([
                new Componente { Nome = "Filosofia", Cor = "comp-humanas", Sigla = "FI", Ativo = false },
            ]);
            var sut = CriarSut();

            var vocabulario = await sut.ObterTudoAsync();

            vocabulario.Componentes.Should().ContainSingle(c => !c.Ativo);
        }

        // A recusa por tamanho tem frase propria. Um nome de 90 caracteres
        // nao esta faltando, e a frase do vazio mandaria o administrador
        // procurar o campo que ele acabou de preencher.
        [Fact]
        public async Task CriarComponenteAsync_recusa_nome_longo_com_a_frase_do_tamanho()
        {
            var sut = CriarSut();
            var entrada = new ComponenteEntradaDto
            {
                Nome = new string('a', 81), Area = "Ciências Humanas",
                Sigla = "FI", Cor = "comp-humanas",
            };

            var resultado = await sut.CriarComponenteAsync(entrada);

            resultado.IsSuccess.Should().BeFalse();
            resultado.Error!.Message.Should().Be("O nome passa de 80 caracteres.");
        }

        // Na CRIACAO o `exceto` vai nulo. O teste fixa que ele chega assim ao
        // repositorio: e o argumento que o repositorio converte para
        // `Guid.Empty`, porque `Id != NULL` em SQL nunca casa e faria a regra
        // de nome repetido aceitar toda criacao.
        [Fact]
        public async Task CriarComponenteAsync_consulta_o_nome_sem_excecao_de_id()
        {
            _repositorio.ExisteComponenteComNomeAsync("Filosofia", null).Returns(false);
            var sut = CriarSut();
            var entrada = new ComponenteEntradaDto
            {
                Nome = "Filosofia", Area = "Ciências Humanas",
                Sigla = "FI", Cor = "comp-humanas",
            };

            await sut.CriarComponenteAsync(entrada);

            await _repositorio.Received(1).ExisteComponenteComNomeAsync("Filosofia", null);
        }

        // A ordem da serie e CALCULADA, e nao digitada. `serie.ordem` e UNIQUE
        // no banco: pedir o numero a quem cadastra e pedir que ele adivinhe
        // qual esta livre, e punir o palpite errado com a excecao crua do EF
        // Core — que foi exatamente o defeito relatado.
        [Fact]
        public async Task CriarSerieAsync_calcula_a_ordem_no_fim_da_etapa()
        {
            _repositorio.UltimaOrdemDaEtapaAsync(EtapaEnsino.FundamentalAnosFinais).Returns(4);
            _repositorio.SeriesComOrdemAPartirDeAsync(5).Returns([]);
            var sut = CriarSut();
            var entrada = new SerieEntradaDto
            {
                Nome = "5º ano",
                Etapa = EtapaEnsino.FundamentalAnosFinais,
                RotuloCompleto = "5º ano do Ensino Fundamental",
                Sigla = "5º",
            };

            var resultado = await sut.CriarSerieAsync(entrada);

            resultado.IsSuccess.Should().BeTrue();
            _repositorio.Received(1).Insert(Arg.Is<Serie>(x => x.Ordem == 5));
        }

        // As posteriores abrem espaco, do MAIOR para o menor. Em ordem
        // crescente cada uma colidiria com a seguinte, e o indice e unico.
        [Fact]
        public async Task CriarSerieAsync_desloca_as_series_posteriores()
        {
            var medio = new Serie { Nome = "1ª série", Etapa = EtapaEnsino.Medio, Ordem = 5 };
            _repositorio.UltimaOrdemDaEtapaAsync(EtapaEnsino.FundamentalAnosFinais).Returns(4);
            _repositorio.SeriesComOrdemAPartirDeAsync(5).Returns([medio]);
            var sut = CriarSut();
            var entrada = new SerieEntradaDto
            {
                Nome = "5º ano",
                Etapa = EtapaEnsino.FundamentalAnosFinais,
                RotuloCompleto = "5º ano do Ensino Fundamental",
                Sigla = "5º",
            };

            await sut.CriarSerieAsync(entrada);

            medio.Ordem.Should().Be(6);
        }

        // Etapa vazia comeca em 1. `MaxAsync` sobre colecao vazia estoura, e o
        // repositorio devolve zero por `DefaultIfEmpty`.
        [Fact]
        public async Task CriarSerieAsync_comeca_em_1_quando_a_etapa_esta_vazia()
        {
            _repositorio.UltimaOrdemDaEtapaAsync(EtapaEnsino.Medio).Returns(0);
            _repositorio.SeriesComOrdemAPartirDeAsync(1).Returns([]);
            var sut = CriarSut();
            var entrada = new SerieEntradaDto
            {
                Nome = "1ª série",
                Etapa = EtapaEnsino.Medio,
                RotuloCompleto = "1ª série do Ensino Médio",
                Sigla = "1ªEM",
            };

            await sut.CriarSerieAsync(entrada);

            _repositorio.Received(1).Insert(Arg.Is<Serie>(x => x.Ordem == 1));
        }

        [Fact]
        public async Task CriarComponenteAsync_calcula_a_ordem_no_fim_da_area()
        {
            _repositorio.UltimaOrdemDaAreaAsync("Ciências Humanas").Returns(2);
            var sut = CriarSut();
            var entrada = new ComponenteEntradaDto
            {
                Nome = "Filosofia", Area = "Ciências Humanas",
                Sigla = "FI", Cor = "comp-humanas",
            };

            await sut.CriarComponenteAsync(entrada);

            _repositorio.Received(1).Insert(Arg.Is<Componente>(c => c.Ordem == 3));
        }

        // Alterar o rotulo nao mexe na posicao. Antes o `PUT` reenviava a
        // ordem do formulario, e cada alteracao podia reescrever a sequencia.
        [Fact]
        public async Task AlterarSerieAsync_preserva_a_ordem()
        {
            var id = Guid.NewGuid();
            var serie = new Serie
            {
                Nome = "6º ano", Etapa = EtapaEnsino.FundamentalAnosFinais,
                RotuloCompleto = "6º ano do Ensino Fundamental", Sigla = "6º", Ordem = 3,
            };
            _repositorio.SeriePorIdAsync(id).Returns(serie);
            var sut = CriarSut();
            var entrada = new SerieEntradaDto
            {
                Nome = "6º ano do Fundamental",
                Etapa = EtapaEnsino.FundamentalAnosFinais,
                RotuloCompleto = "6º ano do Ensino Fundamental",
                Sigla = "6º",
            };

            var resultado = await sut.AlterarSerieAsync(id, entrada);

            resultado.IsSuccess.Should().BeTrue();
            serie.Ordem.Should().Be(3);
        }

        // Na ALTERACAO o proprio id vai como excecao, senao o item colidiria
        // com o proprio nome e nenhuma alteracao passaria.
        [Fact]
        public async Task AlterarComponenteAsync_consulta_o_nome_excetuando_o_proprio_id()
        {
            var id = Guid.NewGuid();
            _repositorio.ComponentePorIdAsync(id).Returns(new Componente
            {
                Nome = "Filosofia", Area = "Ciências Humanas",
                Sigla = "FI", Cor = "comp-humanas",
            });
            var sut = CriarSut();
            var entrada = new ComponenteEntradaDto
            {
                Nome = "Filosofia", Area = "Ciências Humanas",
                Sigla = "FI", Cor = "comp-humanas",
            };

            await sut.AlterarComponenteAsync(id, entrada);

            await _repositorio.Received(1).ExisteComponenteComNomeAsync("Filosofia", id);
        }
    }
}
