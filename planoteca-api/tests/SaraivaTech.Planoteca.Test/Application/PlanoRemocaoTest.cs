using System;
using System.Threading.Tasks;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SaraivaTech.Planoteca.Application.Core.Services;
using SaraivaTech.Planoteca.Application.Mappers;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Domain.Services;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Application
{
    /// <summary>
    /// Remover um plano tira o PDF do R2 junto.
    ///
    /// Não tirava: `RemoverAsync` apagava só a linha do banco, e o arquivo
    /// ficava no armazenamento para sempre. A operação de remoção existia na
    /// interface e o armazenamento já estava injetado no serviço — era um fio
    /// pronto que ninguém tinha conectado.
    /// </summary>
    public class PlanoRemocaoTest
    {
        private const string UrlBase = "https://pub-exemplo.r2.dev";
        private const string Chave = "planos/2026/08/plano-abc123.pdf";

        private readonly IPlanoRepository _repositorio = Substitute.For<IPlanoRepository>();
        private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
        private readonly IArmazenamentoArquivo _armazenamento = Substitute.For<IArmazenamentoArquivo>();

        private PlanoAppService Servico() =>
            new(_repositorio, new PlanoMapper(new VocabularioMapper()), _uow, _armazenamento);

        private Plano Rascunho() => new()
        {
            Id = Guid.NewGuid(),
            Titulo = "Plano de teste",
            Situacao = SituacaoPlano.Rascunho,
            ArquivoUrl = $"{UrlBase}/{Chave}",
        };

        [Fact]
        public async Task Remover_apaga_o_arquivo_no_armazenamento()
        {
            var plano = Rascunho();
            _repositorio.ObterCompletoAsync(plano.Id, true).Returns(plano);
            _armazenamento.ChaveDaUrl(plano.ArquivoUrl).Returns(Chave);

            var resultado = await Servico().RemoverAsync(plano.Id);

            resultado.IsSuccess.Should().BeTrue();
            await _armazenamento.Received(1).RemoverAsync(Chave);
        }

        [Fact]
        public async Task Plano_publicado_nao_e_removido_nem_perde_o_arquivo()
        {
            var plano = Rascunho();
            plano.Situacao = SituacaoPlano.Publicado;
            _repositorio.ObterCompletoAsync(plano.Id, true).Returns(plano);

            var resultado = await Servico().RemoverAsync(plano.Id);

            resultado.IsSuccess.Should().BeFalse();
            // O arquivo de um plano publicado precisa sobreviver à tentativa:
            // o link já circulou entre professores.
            await _armazenamento.DidNotReceive().RemoverAsync(Arg.Any<string>());
        }

        [Fact]
        public async Task Falha_ao_apagar_o_arquivo_nao_derruba_a_remocao()
        {
            var plano = Rascunho();
            _repositorio.ObterCompletoAsync(plano.Id, true).Returns(plano);
            _armazenamento.ChaveDaUrl(plano.ArquivoUrl).Returns(Chave);
            _armazenamento.RemoverAsync(Chave).ThrowsAsync(new InvalidOperationException("R2 fora"));

            var resultado = await Servico().RemoverAsync(plano.Id);

            // O plano já saiu do acervo, que é o que a pessoa pediu. Devolver
            // erro depois disso faria parecer que nada aconteceu, e o clique
            // repetido não teria mais o que remover. O pior caso é um órfão
            // no R2 — invisível, e que custa centavos.
            resultado.IsSuccess.Should().BeTrue();
            _uow.Received(1).Commit();
        }

        [Fact]
        public async Task Url_de_outro_armazenamento_nao_apaga_nada()
        {
            var plano = Rascunho();
            plano.ArquivoUrl = "https://outro-servidor.example/arquivo.pdf";
            _repositorio.ObterCompletoAsync(plano.Id, true).Returns(plano);
            // `ChaveDaUrl` devolve nulo para URL que não é deste bucket.
            _armazenamento.ChaveDaUrl(plano.ArquivoUrl).Returns((string?)null);

            var resultado = await Servico().RemoverAsync(plano.Id);

            resultado.IsSuccess.Should().BeTrue();
            // Inventar uma chave aqui apagaria o objeto ERRADO.
            await _armazenamento.DidNotReceive().RemoverAsync(Arg.Any<string>());
        }
    }
}
