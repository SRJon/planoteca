using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Services;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Enumerable;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;

namespace SaraivaTech.Planoteca.Application.Core.Services
{
    public class PostAppService : IPostAppService
    {
        private readonly IPostRepository _repositorio;
        private readonly IUnitOfWork _uow;

        public PostAppService(IPostRepository repositorio, IUnitOfWork uow)
        {
            _repositorio = repositorio;
            _uow = uow;
        }

        private static PostResumoDto ParaResumo(Post p) => new()
        {
            Id = p.Id,
            Titulo = p.Titulo,
            Resumo = p.Resumo,
            AutorId = p.AutorId,
            AutorNome = p.Autor?.Nome ?? "Autor não identificado",
            Situacao = p.Situacao,
            PublicadoEm = p.PublicadoEm,
            CriadoEm = p.CriadoEm,
            ComentarioModeracao = p.ComentarioModeracao,
            Visualizacoes = p.Visualizacoes,
        };

        public async Task<(IEnumerable<PostResumoDto> Itens, int Total)> ListarAsync(FiltroPost filtro)
        {
            var (itens, total) = await _repositorio.BuscarAsync(filtro);
            return (itens.Select(ParaResumo).ToList(), total);
        }

        public async Task<PostDetalheDto?> ObterAsync(Guid id, bool incluirNaoPublicado = false)
        {
            var post = await _repositorio.ObterAsync(id, incluirNaoPublicado);
            if (post is null) return null;

            var resumo = ParaResumo(post);
            return new PostDetalheDto
            {
                Id = resumo.Id,
                Titulo = resumo.Titulo,
                Resumo = resumo.Resumo,
                AutorId = resumo.AutorId,
                AutorNome = resumo.AutorNome,
                Situacao = resumo.Situacao,
                PublicadoEm = resumo.PublicadoEm,
                CriadoEm = resumo.CriadoEm,
                ComentarioModeracao = resumo.ComentarioModeracao,
                Corpo = post.Corpo,
            };
        }

        public async Task<Result<Guid>> EscreverAsync(PostEntradaDto entrada, Guid autorId)
        {
            if (string.IsNullOrWhiteSpace(entrada.Titulo))
                return Result<Guid>.Failure("O texto precisa de um título.");

            if (string.IsNullOrWhiteSpace(entrada.Corpo))
                return Result<Guid>.Failure("O texto está vazio.");

            var post = new Post
            {
                AutorId = autorId,
                Titulo = entrada.Titulo.Trim(),
                Resumo = entrada.Resumo?.Trim(),
                Corpo = entrada.Corpo.Trim(),
                // Nasce PENDENTE, sempre. Não há caminho de escrita que crie
                // um texto já publicado — nem para professor veterano, nem
                // para o administrador que escreve. Quem publica é a
                // moderação.
                Situacao = SituacaoPost.Pendente,
                CriadoEm = DateTime.UtcNow,
            };

            try
            {
                _uow.BeginTransaction();
                _repositorio.Insert(post);
                _uow.Commit();
                return Result<Guid>.Success(post.Id);
            }
            catch
            {
                _uow.Rollback();
                throw;
            }
        }

        public async Task<Result> ModerarAsync(Guid id, ModeracaoDto decisao, Guid moderadorId)
        {
            if (!SituacaoPost.Todas.Contains(decisao.Situacao) ||
                decisao.Situacao == SituacaoPost.Pendente)
            {
                return Result.Failure(
                    "Decisão inválida. Um texto é publicado, devolvido ou recusado.");
            }

            // RF-11: devolver ou recusar exige o motivo. Sem ele, o professor
            // reescreve o mesmo texto sem saber o que corrigir, e a moderação
            // vira um silêncio que ninguém sabe interpretar.
            if (SituacaoPost.ExigemComentario.Contains(decisao.Situacao) &&
                string.IsNullOrWhiteSpace(decisao.Comentario))
            {
                return Result.Failure("Diga ao autor por que o texto foi devolvido ou recusado.");
            }

            // `ObterParaEscritaAsync`, e não `ObterAsync`: aquele traz o
            // `Autor` junto para a tela, e salvar o objeto com o autor
            // pendurado anexava uma segunda instância de Pessoa ao contexto.
            // O `PapelClaimsMiddleware` já rastreia a Pessoa de quem faz a
            // requisição — quando o moderador modera o PRÓPRIO texto, o EF
            // recusava com "cannot be tracked because another instance with
            // the same key value is already being tracked".
            var post = await _repositorio.ObterParaEscritaAsync(id);
            if (post is null) return Result.Failure("Texto não encontrado.");

            post.Situacao = decisao.Situacao;
            post.ComentarioModeracao = decisao.Comentario?.Trim();
            post.ModeradoPorId = moderadorId;
            post.ModeradoEm = DateTime.UtcNow;
            // `PublicadoEm` só é gravado ao publicar, e não é limpo ao
            // devolver: um texto publicado e depois devolvido preserva a data
            // da primeira publicação, que é informação, não sujeira.
            if (decisao.Situacao == SituacaoPost.Publicado && post.PublicadoEm is null)
                post.PublicadoEm = DateTime.UtcNow;

            try
            {
                _uow.BeginTransaction();
                // Sem `Update`: a entidade já está rastreada, e o
                // change tracker viu as alterações acima. Chamar `Update`
                // aqui anexaria o grafo de novo, que é justamente o defeito.
                _uow.Commit();
                return Result.Success();
            }
            catch
            {
                _uow.Rollback();
                throw;
            }
        }

        public async Task<Result> ArquivarAsync(Guid id, Guid administradorId)
        {
            var post = await _repositorio.ObterParaEscritaAsync(id);
            if (post is null) return Result.Failure("Texto não encontrado.");

            if (post.Situacao == SituacaoPost.Arquivado)
                return Result.Failure("Este texto já está arquivado.");

            // Nenhum comentário aqui, de propósito: arquivar não é devolutiva
            // ao autor (RF-11 cobre publicar/devolver/recusar) — é curadoria
            // do acervo, uma decisão do administrador sobre o que fica no ar,
            // sem prestação de contas ao autor.
            post.SituacaoAnterior = post.Situacao;
            post.Situacao = SituacaoPost.Arquivado;
            post.ModeradoPorId = administradorId;
            post.ModeradoEm = DateTime.UtcNow;

            try
            {
                _uow.BeginTransaction();
                _uow.Commit();
                return Result.Success();
            }
            catch
            {
                _uow.Rollback();
                throw;
            }
        }

        public async Task<Result> DesarquivarAsync(Guid id, Guid administradorId)
        {
            var post = await _repositorio.ObterParaEscritaAsync(id);
            if (post is null) return Result.Failure("Texto não encontrado.");

            if (post.Situacao != SituacaoPost.Arquivado)
                return Result.Failure("Este texto não está arquivado.");

            // Reversível: um clique errado não destrói o trabalho de outra
            // pessoa. Volta exatamente para onde estava — publicado continua
            // publicado, devolvido continua devolvido.
            post.Situacao = post.SituacaoAnterior ?? SituacaoPost.Pendente;
            post.SituacaoAnterior = null;
            post.ModeradoPorId = administradorId;
            post.ModeradoEm = DateTime.UtcNow;

            try
            {
                _uow.BeginTransaction();
                _uow.Commit();
                return Result.Success();
            }
            catch
            {
                _uow.Rollback();
                throw;
            }
        }

        public Task<int> ContarPendentesAsync() => _repositorio.ContarPendentesAsync();

        public Task IncrementarVisualizacaoAsync(Guid id) => _repositorio.IncrementarVisualizacaoAsync(id);
    }
}
