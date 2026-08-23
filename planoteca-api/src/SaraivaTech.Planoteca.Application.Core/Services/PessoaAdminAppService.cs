using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Services;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Enumerable;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;

namespace SaraivaTech.Planoteca.Application.Core.Services
{
    public class PessoaAdminAppService : IPessoaAdminAppService
    {
        private readonly IPessoaRepository _repositorio;
        private readonly IUnitOfWork _uow;

        public PessoaAdminAppService(IPessoaRepository repositorio, IUnitOfWork uow)
        {
            _repositorio = repositorio;
            _uow = uow;
        }

        public async Task<(IEnumerable<PessoaAdminDto> Itens, int Total)> ListarAsync(FiltroPessoa filtro)
        {
            var (itens, total) = await _repositorio.BuscarAsync(filtro);
            var pessoas = itens.ToList();

            var contagens = await _repositorio.ContarPostsPorAutorAsync(pessoas.Select(p => p.Id));

            var dtos = pessoas.Select(p =>
            {
                var (publicados, pendentes) = contagens.TryGetValue(p.Id, out var c) ? c : (0, 0);
                return new PessoaAdminDto
                {
                    Id = p.Id,
                    Nome = p.Nome,
                    Email = p.Email,
                    Papel = p.Papel,
                    Ativo = p.Ativo,
                    CriadoEm = p.CriadoEm,
                    PostsPublicados = publicados,
                    PostsPendentes = pendentes,
                };
            }).ToList();

            return (dtos, total);
        }

        public async Task<Result> AlterarPapelAsync(Guid alvoId, string novoPapel, Guid solicitanteId)
        {
            if (!PapelPessoa.Todos.Contains(novoPapel))
                return Result.Failure("Papel inválido. É professor ou administrador.");

            // Ninguém remove o próprio acesso de administrador. Um admin que
            // se rebaixa sozinho pode deixar o sistema sem nenhum — e o único
            // conserto seria SQL.
            if (alvoId == solicitanteId)
                return Result.Failure("Você não pode alterar o próprio papel.");

            // `ObterParaEscritaAsync`, e não uma consulta com `AsNoTracking`:
            // o `PapelClaimsMiddleware` já deixa a Pessoa de quem faz a
            // requisição rastreada no contexto em toda chamada autenticada.
            // Como o alvo aqui nunca é o solicitante (guarda acima), a
            // colisão não pode ocorrer nesta operação — mas o padrão é o
            // mesmo em toda escrita de Pessoa, por consistência com
            // `AlterarAtivoAsync`, onde o alvo PODE ser o próprio contexto
            // rastreado.
            var pessoa = await _repositorio.ObterParaEscritaAsync(alvoId);
            if (pessoa is null) return Result.Failure("Pessoa não encontrada.");

            // Não pode restar zero administrador. Rebaixar o último é
            // recusado, mesmo que seja outra pessoa fazendo — conta antes de
            // gravar.
            if (pessoa.Papel == PapelPessoa.Administrador &&
                novoPapel == PapelPessoa.Professor)
            {
                var administradores = await _repositorio.ContarAdministradoresAtivosAsync();
                if (administradores <= 1)
                    return Result.Failure("Não é possível rebaixar o último administrador.");
            }

            pessoa.Papel = novoPapel;

            try
            {
                _uow.BeginTransaction();
                // Sem `Update`: a entidade já está rastreada.
                _uow.Commit();
                return Result.Success();
            }
            catch
            {
                _uow.Rollback();
                throw;
            }
        }

        public async Task<Result> AlterarAtivoAsync(Guid alvoId, bool ativo, Guid solicitanteId)
        {
            // Ninguém desativa a própria conta. Mesmo motivo do papel: um
            // administrador travado fora do próprio acesso não tem como se
            // destravar.
            if (alvoId == solicitanteId)
                return Result.Failure("Você não pode alterar o próprio acesso.");

            // Carregada rastreada, exatamente como em `AlterarPapelAsync` —
            // e aqui é onde a colisão com a Pessoa do `PapelClaimsMiddleware`
            // seria real se a guarda acima não existisse: o alvo poderia ser
            // a própria pessoa autenticada. Como a guarda impede isso, o
            // `ObterParaEscritaAsync` sempre traz uma Pessoa DIFERENTE da
            // rastreada pelo middleware, e não há conflito.
            var pessoa = await _repositorio.ObterParaEscritaAsync(alvoId);
            if (pessoa is null) return Result.Failure("Pessoa não encontrada.");

            // Não pode restar zero administrador: desativar o último também
            // é recusado.
            if (pessoa.Papel == PapelPessoa.Administrador && pessoa.Ativo && !ativo)
            {
                var administradores = await _repositorio.ContarAdministradoresAtivosAsync();
                if (administradores <= 1)
                    return Result.Failure("Não é possível desativar o último administrador.");
            }

            pessoa.Ativo = ativo;

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
    }
}
