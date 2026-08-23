using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SaraivaTech.Planoteca.Application.Core.Services;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Infra.Data.Repositories;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Integracao
{
    /// <summary>
    /// O painel de pessoas contra o PostgreSQL real.
    ///
    /// O caso que mais importa aqui é o administrador alterando a PRÓPRIA
    /// conta: o `PapelClaimsMiddleware` já deixa a Pessoa de quem faz a
    /// requisição rastreada no contexto em TODA chamada autenticada — é
    /// exatamente o cenário que fez `PostModeracaoTest` nascer, e aqui o
    /// caminho é ainda mais quente porque a entidade alterada É a Pessoa que
    /// o middleware rastreou.
    /// </summary>
    [Collection("banco-real")]
    public class PessoaAdminTest : BaseBancoReal
    {
        private async Task<Pessoa> PessoaDeTesteAsync(string papel = PapelPessoa.Professor, bool ativo = true)
        {
            var pessoa = new Pessoa
            {
                Id = Guid.NewGuid(),
                Email = $"{Guid.NewGuid():N}@teste.local",
                Nome = $"{MarcaTeste} Pessoa",
                Papel = papel,
                Ativo = ativo,
                CriadoEm = DateTime.UtcNow,
            };
            Contexto.Set<Pessoa>().Add(pessoa);
            await Contexto.SaveChangesAsync();
            return pessoa;
        }

        [SkippableFact]
        public async Task Administrador_promove_professor_a_administrador()
        {
            var admin = await PessoaDeTesteAsync(PapelPessoa.Administrador);
            var professor = await PessoaDeTesteAsync(PapelPessoa.Professor);
            Contexto.ChangeTracker.Clear();

            var repositorio = new PessoaRepository(new UoWFalso(Contexto));
            var servico = new PessoaAdminAppService(repositorio, new UoWDeTeste(Contexto));

            var resultado = await servico.AlterarPapelAsync(professor.Id, PapelPessoa.Administrador, admin.Id);

            resultado.IsSuccess.Should().BeTrue();

            Contexto.ChangeTracker.Clear();
            var salvo = await Contexto.Set<Pessoa>().FirstAsync(p => p.Id == professor.Id);
            salvo.Papel.Should().Be(PapelPessoa.Administrador);

            await LimparAsync(admin.Id, professor.Id);
        }

        [SkippableFact]
        public async Task Administrador_rebaixa_outro_administrador_quando_ha_mais_de_um()
        {
            var admin1 = await PessoaDeTesteAsync(PapelPessoa.Administrador);
            var admin2 = await PessoaDeTesteAsync(PapelPessoa.Administrador);
            Contexto.ChangeTracker.Clear();

            var repositorio = new PessoaRepository(new UoWFalso(Contexto));
            var servico = new PessoaAdminAppService(repositorio, new UoWDeTeste(Contexto));

            var resultado = await servico.AlterarPapelAsync(admin2.Id, PapelPessoa.Professor, admin1.Id);

            resultado.IsSuccess.Should().BeTrue();

            Contexto.ChangeTracker.Clear();
            var salvo = await Contexto.Set<Pessoa>().FirstAsync(p => p.Id == admin2.Id);
            salvo.Papel.Should().Be(PapelPessoa.Professor);

            await LimparAsync(admin1.Id, admin2.Id);
        }

        /// <summary>
        /// O caso de fato: o administrador logado tenta se rebaixar. A Pessoa
        /// dele é carregada ANTES — simulando o `PapelClaimsMiddleware` — e
        /// fica rastreada no mesmo contexto usado pelo AppService, exatamente
        /// como acontece numa requisição real.
        /// </summary>
        [SkippableFact]
        public async Task Administrador_nao_consegue_rebaixar_a_si_mesmo()
        {
            var admin = await PessoaDeTesteAsync(PapelPessoa.Administrador);
            var outroAdmin = await PessoaDeTesteAsync(PapelPessoa.Administrador);
            Contexto.ChangeTracker.Clear();

            // Simula o middleware: a Pessoa de quem pede fica rastreada antes
            // do AppService rodar.
            await Contexto.Set<Pessoa>().FirstAsync(p => p.Id == admin.Id);
            Contexto.ChangeTracker.Entries<Pessoa>().Should().HaveCount(1);

            var repositorio = new PessoaRepository(new UoWFalso(Contexto));
            var servico = new PessoaAdminAppService(repositorio, new UoWDeTeste(Contexto));

            // Não pode lançar "cannot be tracked", e não pode ter sucesso.
            SaraivaTech.Planoteca.Domain.Base.Result resultado = null;
            var acao = async () => resultado = await servico.AlterarPapelAsync(admin.Id, PapelPessoa.Professor, admin.Id);
            await acao.Should().NotThrowAsync();

            resultado!.IsSuccess.Should().BeFalse();

            Contexto.ChangeTracker.Clear();
            var salvo = await Contexto.Set<Pessoa>().FirstAsync(p => p.Id == admin.Id);
            salvo.Papel.Should().Be(PapelPessoa.Administrador, "auto-rebaixamento é recusado, nunca gravado");

            await LimparAsync(admin.Id, outroAdmin.Id);
        }

        [SkippableFact]
        public async Task Administrador_nao_consegue_desativar_a_propria_conta()
        {
            var admin = await PessoaDeTesteAsync(PapelPessoa.Administrador);
            var outroAdmin = await PessoaDeTesteAsync(PapelPessoa.Administrador);
            Contexto.ChangeTracker.Clear();

            // Mesma simulação do middleware.
            await Contexto.Set<Pessoa>().FirstAsync(p => p.Id == admin.Id);

            var repositorio = new PessoaRepository(new UoWFalso(Contexto));
            var servico = new PessoaAdminAppService(repositorio, new UoWDeTeste(Contexto));

            SaraivaTech.Planoteca.Domain.Base.Result resultado = null;
            var acao = async () => resultado = await servico.AlterarAtivoAsync(admin.Id, false, admin.Id);
            await acao.Should().NotThrowAsync();

            resultado!.IsSuccess.Should().BeFalse();

            Contexto.ChangeTracker.Clear();
            var salvo = await Contexto.Set<Pessoa>().FirstAsync(p => p.Id == admin.Id);
            salvo.Ativo.Should().BeTrue("auto-desativação é recusada, nunca gravada");

            await LimparAsync(admin.Id, outroAdmin.Id);
        }

        /// <summary>
        /// Isola o cenário desativando temporariamente qualquer outro
        /// administrador que já exista no banco de teste — sem isso, a
        /// contagem "resta zero administrador" dependeria de quantos
        /// administradores de seed já estão lá, e o teste ficaria não
        /// determinístico. Reativa tudo no fim, marcado por `LimparAsync`
        /// não bastar aqui: os outros administradores não são desta suíte.
        /// </summary>
        [SkippableFact]
        public async Task Rebaixar_o_ultimo_administrador_e_recusado()
        {
            var unicoAdmin = await PessoaDeTesteAsync(PapelPessoa.Administrador);
            var professor = await PessoaDeTesteAsync(PapelPessoa.Professor);

            var outrosAdminsIds = await Contexto.Set<Pessoa>()
                .Where(p => p.Papel == PapelPessoa.Administrador && p.Ativo && p.Id != unicoAdmin.Id)
                .Select(p => p.Id)
                .ToListAsync();

            if (outrosAdminsIds.Count > 0)
            {
                await Queryable.Where(Contexto.Set<Pessoa>(), p => outrosAdminsIds.Contains(p.Id))
                    .ExecuteUpdateAsync(s => s.SetProperty(p => p.Ativo, false));
            }

            Contexto.ChangeTracker.Clear();

            try
            {
                var repositorio = new PessoaRepository(new UoWFalso(Contexto));
                var servico = new PessoaAdminAppService(repositorio, new UoWDeTeste(Contexto));

                var solicitanteId = Guid.NewGuid();
                var resultado = await servico.AlterarPapelAsync(unicoAdmin.Id, PapelPessoa.Professor, solicitanteId);

                resultado.IsSuccess.Should().BeFalse();

                Contexto.ChangeTracker.Clear();
                var salvo = await Contexto.Set<Pessoa>().FirstAsync(p => p.Id == unicoAdmin.Id);
                salvo.Papel.Should().Be(PapelPessoa.Administrador);
            }
            finally
            {
                if (outrosAdminsIds.Count > 0)
                {
                    Contexto.ChangeTracker.Clear();
                    await Queryable.Where(Contexto.Set<Pessoa>(), p => outrosAdminsIds.Contains(p.Id))
                        .ExecuteUpdateAsync(s => s.SetProperty(p => p.Ativo, true));
                }
            }

            await LimparAsync(unicoAdmin.Id, professor.Id);
        }

        [SkippableFact]
        public async Task Listagem_traz_a_contagem_de_posts_por_situacao()
        {
            var autor = await PessoaDeTesteAsync();
            var publicado = new Post
            {
                Id = Guid.NewGuid(),
                Titulo = $"{MarcaTeste} publicado",
                Corpo = "corpo",
                AutorId = autor.Id,
                Situacao = SituacaoPost.Publicado,
                CriadoEm = DateTime.UtcNow,
            };
            var pendente = new Post
            {
                Id = Guid.NewGuid(),
                Titulo = $"{MarcaTeste} pendente",
                Corpo = "corpo",
                AutorId = autor.Id,
                Situacao = SituacaoPost.Pendente,
                CriadoEm = DateTime.UtcNow,
            };
            Contexto.Set<Post>().AddRange(publicado, pendente);
            await Contexto.SaveChangesAsync();
            Contexto.ChangeTracker.Clear();

            var repositorio = new PessoaRepository(new UoWFalso(Contexto));
            var servico = new PessoaAdminAppService(repositorio, new UoWDeTeste(Contexto));

            var (itens, _) = await servico.ListarAsync(new FiltroPessoa { Busca = autor.Nome });

            var dto = itens.Should().ContainSingle(p => p.Id == autor.Id).Subject;
            dto.PostsPublicados.Should().Be(1);
            dto.PostsPendentes.Should().Be(1);

            Contexto.ChangeTracker.Clear();
            await Queryable.Where(Contexto.Set<Post>(), p => p.Id == publicado.Id || p.Id == pendente.Id)
                .ExecuteDeleteAsync();
            await LimparAsync(autor.Id, autor.Id);
        }

        private async Task LimparAsync(Guid pessoaId1, Guid pessoaId2)
        {
            Contexto.ChangeTracker.Clear();
            await Queryable.Where(Contexto.Set<Pessoa>(), p => p.Id == pessoaId1 || p.Id == pessoaId2)
                .ExecuteDeleteAsync();
        }
    }
}
