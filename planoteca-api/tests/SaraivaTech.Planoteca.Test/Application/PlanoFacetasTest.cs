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
    /// A tradução da contagem de domínio para o corpo de
    /// `GET /lesson-plans/facets`.
    ///
    /// A regra do RF-02 mora no repositório, contra o banco real. O que
    /// sobra aqui é o que este teste cobre: nenhum grupo se perde e nenhum
    /// total se troca no caminho.
    /// </summary>
    public class PlanoFacetasTest
    {
        private readonly IPlanoRepository _repositorio = Substitute.For<IPlanoRepository>();
        private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
        private readonly IArmazenamentoArquivo _armazenamento = Substitute.For<IArmazenamentoArquivo>();

        private PlanoAppService Servico() =>
            new(_repositorio, new PlanoMapper(new VocabularioMapper()), _uow, _armazenamento);

        [Fact]
        public async Task ObterFacetasAsync_traduz_os_tres_grupos()
        {
            var serie = Guid.NewGuid();
            var componente = Guid.NewGuid();
            var metodologia = Guid.NewGuid();

            _repositorio.ContarFacetasAsync(Arg.Any<FiltroPlano>()).Returns(new ContagemFacetas
            {
                Series = [new FacetaContada(serie, 12)],
                Componentes = [new FacetaContada(componente, 9)],
                Metodologias = [new FacetaContada(metodologia, 5)],
            });

            var facetas = await Servico().ObterFacetasAsync(new FiltroPlano());

            facetas.Series.Should().ContainSingle()
                .Which.Should().BeEquivalentTo(new { Id = serie, Total = 12 });
            facetas.Componentes.Should().ContainSingle()
                .Which.Should().BeEquivalentTo(new { Id = componente, Total = 9 });
            facetas.Metodologias.Should().ContainSingle()
                .Which.Should().BeEquivalentTo(new { Id = metodologia, Total = 5 });
        }

        [Fact]
        public async Task ObterFacetasAsync_devolve_grupo_vazio_sem_nulo()
        {
            _repositorio.ContarFacetasAsync(Arg.Any<FiltroPlano>()).Returns(new ContagemFacetas());

            var facetas = await Servico().ObterFacetasAsync(new FiltroPlano());

            // Lista vazia, e não `null`: o front lê `facetas.series.length`
            // sem guarda, e um nulo no JSON viraria erro de tela.
            facetas.Series.Should().BeEmpty();
            facetas.Componentes.Should().BeEmpty();
            facetas.Metodologias.Should().BeEmpty();
        }

        [Fact]
        public async Task ObterFacetasAsync_repassa_o_recorte_ao_repositorio()
        {
            var componente = Guid.NewGuid();
            _repositorio.ContarFacetasAsync(Arg.Any<FiltroPlano>()).Returns(new ContagemFacetas());

            var filtro = new FiltroPlano
            {
                Busca = "juros",
                ComponentesIds = [componente],
                DuracaoMaxima = 3,
            };

            await Servico().ObterFacetasAsync(filtro);

            await _repositorio.Received(1).ContarFacetasAsync(Arg.Is<FiltroPlano>(f =>
                f.Busca == "juros" &&
                f.ComponentesIds.Length == 1 &&
                f.DuracaoMaxima == 3 &&
                !f.IncluirRascunhos));
        }
    }
}
