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
    /// A moderação do blog contra o PostgreSQL real.
    ///
    /// O caso que estes testes protegem apareceu em produção: o
    /// administrador escreveu um texto e tentou aprovar o PRÓPRIO texto. A
    /// tela devolveu "The instance of entity type 'Pessoa' cannot be tracked
    /// because another instance with the same key value for {'Id'} is already
    /// being tracked".
    ///
    /// Duas coisas se somavam. `ObterAsync` traz `Include(p => p.Autor)`,
    /// porque a tela mostra quem escreveu; e o `PapelClaimsMiddleware` já
    /// deixou a Pessoa de quem faz a requisição rastreada, para injetar o
    /// papel. Quando as duas são a MESMA pessoa, salvar o post anexava uma
    /// segunda instância de Pessoa ao contexto.
    ///
    /// Um moderador que só aprova texto dos outros nunca esbarraria nisso —
    /// é por isso que o teste faz questão de usar a mesma pessoa nos dois
    /// papéis.
    /// </summary>
    [Collection("banco-real")]
    public class PostModeracaoTest : BaseBancoReal
    {
        private async Task<Pessoa> PessoaDeTesteAsync()
        {
            var pessoa = new Pessoa
            {
                Id = Guid.NewGuid(),
                Email = $"{Guid.NewGuid():N}@teste.local",
                Nome = $"{MarcaTeste} Autor",
                Papel = PapelPessoa.Administrador,
                Ativo = true,
                CriadoEm = DateTime.UtcNow,
            };
            Contexto.Set<Pessoa>().Add(pessoa);
            await Contexto.SaveChangesAsync();
            return pessoa;
        }

        private async Task<Post> PostPendenteAsync(Guid autorId)
        {
            var post = new Post
            {
                Id = Guid.NewGuid(),
                Titulo = $"{MarcaTeste} texto",
                Corpo = "Corpo de teste",
                AutorId = autorId,
                Situacao = SituacaoPost.Pendente,
                CriadoEm = DateTime.UtcNow,
            };
            Contexto.Set<Post>().Add(post);
            await Contexto.SaveChangesAsync();
            return post;
        }

        [SkippableFact]
        public async Task Moderador_publica_o_proprio_texto()
        {
            var pessoa = await PessoaDeTesteAsync();
            var post = await PostPendenteAsync(pessoa.Id);
            Contexto.ChangeTracker.Clear();

            // O middleware roda ANTES do controller e deixa a Pessoa
            // rastreada. Sem esta linha o teste passa mesmo com o defeito.
            var repositorio = new PostRepository(new UoWFalso(Contexto));

            // A ORDEM importa, e é a ordem da requisição real: o middleware
            // roda ANTES do controller. Carregar a Pessoa depois do post
            // esconderia o defeito, porque não haveria uma segunda instância
            // a anexar no momento do carregamento.
            await Contexto.Set<Pessoa>().FirstAsync(p => p.Id == pessoa.Id);
            Contexto.ChangeTracker.Entries<Pessoa>().Should().HaveCount(1);

            var paraEscrita = await repositorio.ObterParaEscritaAsync(post.Id);

            // Com `Include(Autor)`, este carregamento traz uma SEGUNDA Pessoa
            // — e é aí que o EF recusa. Sem ele, continua havendo uma só.
            Contexto.ChangeTracker.Entries<Pessoa>().Should().HaveCount(1,
                "carregar o post para escrita não pode anexar uma segunda instância de Pessoa");
            paraEscrita.Should().NotBeNull();

            paraEscrita!.Situacao = SituacaoPost.Publicado;
            paraEscrita.ModeradoPorId = pessoa.Id;
            paraEscrita.ModeradoEm = DateTime.UtcNow;
            paraEscrita.PublicadoEm = DateTime.UtcNow;

            // Antes da correção, esta linha lançava InvalidOperationException.
            // `Update` de propósito: é o que o serviço fazia, e é onde o
            // defeito nascia. Com o post rastreado e sem autor no grafo, ele
            // vira operação inofensiva; com `AsNoTracking().Include(Autor)`,
            // anexava uma segunda Pessoa e lançava.
            repositorio.Update(paraEscrita);
            var gravadas = await Contexto.SaveChangesAsync();
            gravadas.Should().BeGreaterThan(0);

            Contexto.ChangeTracker.Clear();
            var salvo = await Contexto.Set<Post>().FirstAsync(p => p.Id == post.Id);
            salvo.Situacao.Should().Be(SituacaoPost.Publicado);
            salvo.ModeradoPorId.Should().Be(pessoa.Id);

            await LimparAsync(post.Id, pessoa.Id);
        }

        [SkippableFact]
        public async Task Post_para_escrita_nao_traz_o_autor()
        {
            var pessoa = await PessoaDeTesteAsync();
            var post = await PostPendenteAsync(pessoa.Id);
            Contexto.ChangeTracker.Clear();

            var repositorio = new PostRepository(new UoWFalso(Contexto));
            var paraEscrita = await repositorio.ObterParaEscritaAsync(post.Id);

            // O autor ausente é o mecanismo inteiro da correção: sem ele no
            // grafo, não há segunda instância de Pessoa a anexar.
            paraEscrita.Should().NotBeNull();
            paraEscrita!.Autor.Should().BeNull();

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
