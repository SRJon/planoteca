using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;

namespace SaraivaTech.Planoteca.Application.Services
{
    /// <summary>O painel de pessoas: quem se cadastrou, e o controle de
    /// acesso sobre cada uma. Só o administrador enxerga isto.</summary>
    public interface IPessoaAdminAppService
    {
        Task<(IEnumerable<PessoaAdminDto> Itens, int Total)> ListarAsync(FiltroPessoa filtro);

        /// <summary>Promove a administrador ou rebaixa a professor.
        ///
        /// Recusa quando `alvoId` é a própria pessoa que pede (`solicitanteId`),
        /// e recusa rebaixar o último administrador ativo.</summary>
        Task<Result> AlterarPapelAsync(Guid alvoId, string novoPapel, Guid solicitanteId);

        /// <summary>Ativa ou desativa a conta.
        ///
        /// Recusa quando `alvoId` é a própria pessoa que pede, e recusa
        /// desativar o último administrador ativo.</summary>
        Task<Result> AlterarAtivoAsync(Guid alvoId, bool ativo, Guid solicitanteId);
    }
}
