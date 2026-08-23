using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;
using SaraivaTech.Planoteca.Infra.Data.Repositories;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Integracao
{
    /// <summary>
    /// O contador de visualizações do blog, contra o PostgreSQL real.
    ///
    /// `IncrementarVisualizacaoAsync` é um UPDATE atômico
    /// (`visualizacoes = visualizacoes + 1`), não um read-modify-write via
    /// change tracker — é o que garante que duas chamadas concorrentes não
    /// se pisem. O "não conta duas vezes em 24h" é responsabilidade do
    /// FRONT (marca em `localStorage`); o servidor não sabe, e não precisa
    /// saber, quem já leu.
    /// </summary>
    [Collection("banco-real")]
    public class PostVisualizacaoTest : BaseBancoReal
    {
        private async Task<Pessoa> PessoaDeTesteAsync()
        {
            var pessoa = new Pessoa
            {
                Id = Guid.NewGuid(),
                Email = $"{Guid.NewGuid():N}@teste.local",
                Nome = $"{MarcaTeste} Autor",
                Papel = PapelPessoa.Professor,
                Ativo = true,
                CriadoEm = DateTime.UtcNow,
            };
            Contexto.Set<Pessoa>().Add(pessoa);
            await Contexto.SaveChangesAsync();
            return pessoa;
        }

        private async Task<Post> PostComSituacaoAsync(Guid autorId, string situacao)
        {
            var post = new Post
            {
                Id = Guid.NewGuid(),
                Titulo = $"{MarcaTeste} texto",
                Corpo = "Corpo de teste",
                AutorId = autorId,
                Situacao = situacao,
                PublicadoEm = situacao == SituacaoPost.Publicado ? DateTime.UtcNow : null,
                CriadoEm = DateTime.UtcNow,
            };
            Contexto.Set<Post>().Add(post);
            await Contexto.SaveChangesAsync();
            return post;
        }

        [SkippableFact]
        public async Task Incrementa_a_visualizacao_de_um_texto_publicado()
        {
            var pessoa = await PessoaDeTesteAsync();
            var post = await PostComSituacaoAsync(pessoa.Id, SituacaoPost.Publicado);
            Contexto.ChangeTracker.Clear();

            var repositorio = new PostRepository(new UoWFalso(Contexto));
            await repositorio.IncrementarVisualizacaoAsync(post.Id);
            await repositorio.IncrementarVisualizacaoAsync(post.Id);

            Contexto.ChangeTracker.Clear();
            var salvo = await Contexto.Set<Post>().FirstAsync(p => p.Id == post.Id);
            salvo.Visualizacoes.Should().Be(2);

            await LimparAsync(post.Id, pessoa.Id);
        }

        [SkippableFact]
        public async Task Nao_incrementa_texto_nao_publicado()
        {
            // Contar leitura de rascunho, devolvido ou arquivado não faz
            // sentido: quem chama esta rota com o id de um texto assim está
            // fora do fluxo normal de leitura (que só existe para publicado).
            var pessoa = await PessoaDeTesteAsync();
            var post = await PostComSituacaoAsync(pessoa.Id, SituacaoPost.Pendente);
            Contexto.ChangeTracker.Clear();

            var repositorio = new PostRepository(new UoWFalso(Contexto));
            await repositorio.IncrementarVisualizacaoAsync(post.Id);

            Contexto.ChangeTracker.Clear();
            var salvo = await Contexto.Set<Post>().FirstAsync(p => p.Id == post.Id);
            salvo.Visualizacoes.Should().Be(0);

            await LimparAsync(post.Id, pessoa.Id);
        }

        [SkippableFact]
        public async Task Incrementar_id_inexistente_nao_lanca()
        {
            // A falha do incremento não pode derrubar a leitura do texto: o
            // controller chama isso depois de já ter servido o corpo, e um
            // id qualquer (inclusive forjado) não pode lançar exceção.
            var repositorio = new PostRepository(new UoWFalso(Contexto));
            var acao = async () => await repositorio.IncrementarVisualizacaoAsync(Guid.NewGuid());

            await acao.Should().NotThrowAsync();
        }

        private async Task LimparAsync(Guid postId, Guid pessoaId)
        {
            Contexto.ChangeTracker.Clear();
            await Queryable.Where(Contexto.Set<Post>(), p => p.Id == postId).ExecuteDeleteAsync();
            await Queryable.Where(Contexto.Set<Pessoa>(), p => p.Id == pessoaId).ExecuteDeleteAsync();
        }
    }
}
