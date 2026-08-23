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

            var post = await _repositorio.ObterAsync(id, incluirNaoPublicado: true);
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
                _repositorio.Update(post);
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
    }
}
