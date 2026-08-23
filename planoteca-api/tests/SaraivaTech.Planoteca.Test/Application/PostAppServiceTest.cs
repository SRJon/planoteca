using System;
using System.Threading.Tasks;
using FluentAssertions;
using NSubstitute;
using SaraivaTech.Planoteca.Application.Core.Services;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Services;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Application
{
    /// <summary>
    /// `PostAppService` é o único caminho de escrita e leitura do corpo do
    /// blog — por isso é aqui, e não só no `HtmlSanitizerService` isolado,
    /// que a garantia "todo `Corpo` passa pelo sanitizador" é verificada.
    /// Um teste que só cobrisse o sanitizador não pegaria um AppService que
    /// esquecesse de chamá-lo.
    /// </summary>
    public class PostAppServiceTest
    {
        private readonly IPostRepository _repositorio = Substitute.For<IPostRepository>();
        private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
        // Sanitizador REAL, não mock: o que importa aqui é que o AppService
        // CHAMA a sanitização no caminho de escrita e no de leitura — usar o
        // `HtmlSanitizerService` de verdade prova o efeito ponta a ponta,
        // sem duplicar os casos de allowlist já cobertos em
        // `HtmlSanitizerServiceTest`.
        private readonly IHtmlSanitizerService _sanitizador = new HtmlSanitizerService();

        private PostAppService CriarSut() => new(_repositorio, _uow, _sanitizador);

        [Fact]
        public async Task EscreverAsync_sanitiza_o_corpo_antes_de_gravar()
        {
            var sut = CriarSut();
            var autorId = Guid.NewGuid();
            var entrada = new PostEntradaDto
            {
                Titulo = "Relato de sala",
                Corpo = "<p>Texto legítimo</p><script>alert(1)</script>",
            };

            var resultado = await sut.EscreverAsync(entrada, autorId);

            resultado.IsSuccess.Should().BeTrue();
            _repositorio.Received(1).Insert(Arg.Is<Post>(p =>
                p.Corpo == "<p>Texto legítimo</p>" && !p.Corpo.Contains("script")));
        }

        [Fact]
        public async Task EscreverAsync_recusa_corpo_que_so_tem_marcacao_perigosa()
        {
            // `<script>` sozinho sanitiza para string vazia — e "vazio depois
            // de sanitizar" precisa ser tratado como "texto vazio", a mesma
            // falha que um `Corpo` em branco já produz.
            var sut = CriarSut();
            var entrada = new PostEntradaDto
            {
                Titulo = "Relato de sala",
                Corpo = "<script>alert(1)</script>",
            };

            var resultado = await sut.EscreverAsync(entrada, Guid.NewGuid());

            resultado.IsSuccess.Should().BeFalse();
            _repositorio.DidNotReceive().Insert(Arg.Any<Post>());
        }

        [Fact]
        public async Task ObterAsync_sanitiza_o_corpo_de_um_post_gravado_antes_da_sanitizacao_existir()
        {
            // Simula um post legado: `Corpo` gravado direto no banco, sem
            // nunca ter passado pelo sanitizador (por exemplo, antes desta
            // mudança existir, ou por um INSERT manual). A leitura tem que
            // sanitizar de novo — confiar que "já está no banco" é seguro é
            // exatamente o furo que este teste fecha.
            var post = new Post
            {
                Id = Guid.NewGuid(),
                Titulo = "Post legado",
                Corpo = "<p>Relato</p><img src=x onerror=\"alert(1)\">",
                AutorId = Guid.NewGuid(),
                Autor = new Pessoa { Nome = "Professora Ana" },
                Situacao = SituacaoPost.Publicado,
                CriadoEm = DateTime.UtcNow,
            };
            _repositorio.ObterAsync(post.Id, Arg.Any<bool>()).Returns(post);

            var sut = CriarSut();
            var detalhe = await sut.ObterAsync(post.Id);

            detalhe.Should().NotBeNull();
            detalhe!.Corpo.Should().Contain("<p>Relato</p>");
            detalhe.Corpo.Should().NotContain("onerror");
            detalhe.Corpo.Should().NotContain("<img");
        }
    }
}
