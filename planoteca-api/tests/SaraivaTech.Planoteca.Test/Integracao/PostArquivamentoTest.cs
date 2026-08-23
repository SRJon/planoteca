using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Infra.Data.Repositories;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Integracao
{
    /// <summary>
    /// Arquivar e desarquivar um texto do blog, contra o PostgreSQL real.
    ///
    /// Arquivar não é DELETE: o texto continua existindo, some do blog
    /// público e da fila de moderação (o repositório só devolve o que o
    /// filtro pede explicitamente — `BuscarAsync` nunca traz `Arquivado` sem
    /// que alguém peça `situacao=arquivado`), e volta ao clicar em
    /// desarquivar.
    /// </summary>
    [Collection("banco-real")]
    public class PostArquivamentoTest : BaseBancoReal
    {
        private async Task<Pessoa> PessoaDeTesteAsync()
        {
            var pessoa = new Pessoa
            {
                Id = Guid.NewGuid(),
                Email = $"{Guid.NewGuid():N}@teste.local",
                Nome = $"{MarcaTeste} Administrador",
                Papel = PapelPessoa.Administrador,
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
        public async Task Arquivar_tira_o_texto_do_blog_publico_e_da_fila_de_moderacao()
        {
            var pessoa = await PessoaDeTesteAsync();
            var post = await PostComSituacaoAsync(pessoa.Id, SituacaoPost.Publicado);
            Contexto.ChangeTracker.Clear();

            var repositorio = new PostRepository(new UoWFalso(Contexto));
            var paraEscrita = await repositorio.ObterParaEscritaAsync(post.Id);
            paraEscrita!.SituacaoAnterior = paraEscrita.Situacao;
            paraEscrita.Situacao = SituacaoPost.Arquivado;
            paraEscrita.ModeradoPorId = pessoa.Id;
            paraEscrita.ModeradoEm = DateTime.UtcNow;
            await Contexto.SaveChangesAsync();
            Contexto.ChangeTracker.Clear();

            // Some do blog público: a listagem pública só devolve o que o
            // filtro pede, e o padrão é PUBLICADO.
            var (publicos, _) = await repositorio.BuscarAsync(new FiltroPost());
            publicos.Should().NotContain(p => p.Id == post.Id);

            // Some da fila de moderação padrão (pendente) também — arquivado
            // só aparece se alguém pedir a situação explicitamente.
            var (pendentes, _) = await repositorio.BuscarAsync(
                new FiltroPost { Situacao = SituacaoPost.Pendente });
            pendentes.Should().NotContain(p => p.Id == post.Id);

            // Só aparece pedindo a situação explicitamente — é onde a aba
            // "Arquivados" do painel busca.
            var (arquivados, _) = await repositorio.BuscarAsync(
                new FiltroPost { Situacao = SituacaoPost.Arquivado });
            arquivados.Should().Contain(p => p.Id == post.Id);

            await LimparAsync(post.Id, pessoa.Id);
        }

        [SkippableFact]
        public async Task Desarquivar_devolve_o_texto_a_situacao_anterior()
        {
            var pessoa = await PessoaDeTesteAsync();
            var post = await PostComSituacaoAsync(pessoa.Id, SituacaoPost.Publicado);
            Contexto.ChangeTracker.Clear();

            var repositorio = new PostRepository(new UoWFalso(Contexto));

            // Arquiva.
            var paraArquivar = await repositorio.ObterParaEscritaAsync(post.Id);
            paraArquivar!.SituacaoAnterior = paraArquivar.Situacao;
            paraArquivar.Situacao = SituacaoPost.Arquivado;
            await Contexto.SaveChangesAsync();
            Contexto.ChangeTracker.Clear();

            // Desarquiva: reversível, um clique errado não destrói nada.
            var paraDesarquivar = await repositorio.ObterParaEscritaAsync(post.Id);
            paraDesarquivar!.Situacao = paraDesarquivar.SituacaoAnterior ?? SituacaoPost.Pendente;
            paraDesarquivar.SituacaoAnterior = null;
            await Contexto.SaveChangesAsync();

            Contexto.ChangeTracker.Clear();
            var salvo = await Contexto.Set<Post>().FirstAsync(p => p.Id == post.Id);
            salvo.Situacao.Should().Be(SituacaoPost.Publicado);
            salvo.SituacaoAnterior.Should().BeNull();

            await LimparAsync(post.Id, pessoa.Id);
        }

        [SkippableFact]
        public async Task Arquivar_nao_exige_comentario()
        {
            // Decisão do produto: arquivar é curadoria do acervo, não é
            // devolutiva ao autor (RF-11 cobre só devolver/recusar). O
            // `PostAppService.ArquivarAsync` não pede `Comentario` nenhum —
            // este teste prova que a gravação funciona sem ele.
            var pessoa = await PessoaDeTesteAsync();
            var post = await PostComSituacaoAsync(pessoa.Id, SituacaoPost.Publicado);
            Contexto.ChangeTracker.Clear();

            var repositorio = new PostRepository(new UoWFalso(Contexto));
            var paraEscrita = await repositorio.ObterParaEscritaAsync(post.Id);
            paraEscrita!.SituacaoAnterior = paraEscrita.Situacao;
            paraEscrita.Situacao = SituacaoPost.Arquivado;
            paraEscrita.ComentarioModeracao.Should().BeNull();
            var gravadas = await Contexto.SaveChangesAsync();
            gravadas.Should().BeGreaterThan(0);

            await LimparAsync(post.Id, pessoa.Id);
        }

        private async Task LimparAsync(Guid postId, Guid pessoaId)
        {
            Contexto.ChangeTracker.Clear();
            await Queryable.Where(Contexto.Set<Post>(), p => p.Id == postId).ExecuteDeleteAsync();
            await Queryable.Where(Contexto.Set<Pessoa>(), p => p.Id == pessoaId).ExecuteDeleteAsync();
        }
    }
}
