using System;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaraivaTech.Planoteca.Application.Base;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Services;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Infra.CrossCutting.Middleware;

namespace SaraivaTech.Planoteca.Api.Controllers
{
    /// <summary>
    /// Quem se cadastrou, e o controle de acesso sobre cada um — a mesa de
    /// trabalho de quem ADMINISTRA.
    ///
    /// Hoje o primeiro (e o segundo) administrador nascem por SQL, decisão
    /// deliberada e documentada no `CLAUDE.md`. Esta é a tela que permite
    /// promover o TERCEIRO em diante sem precisar de acesso ao banco.
    ///
    /// O papel vem do nosso banco, não do token do Firebase: o
    /// `PapelClaimsMiddleware` resolve a pessoa e injeta o claim que esta
    /// política exige.
    /// </summary>
    [ApiController]
    [ApiVersion("1")]
    [Route("api/v{version:apiVersion}/admin/people")]
    [Authorize(Policy = "Administrador")]
    public class AdminPessoasController : ControllerBase
    {
        private readonly IPessoaAdminAppService _app;

        public AdminPessoasController(IPessoaAdminAppService app)
        {
            _app = app;
        }

        /// <summary>Quem se cadastrou, com o que cada um escreveu.</summary>
        [HttpGet]
        [ProducesResponseType(typeof(PessoaAdminDto[]), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Listar(
            [FromQuery(Name = "q")] string? busca,
            [FromQuery(Name = "page")] int pagina = 1,
            [FromQuery(Name = "perPage")] int tamanhoPagina = 20)
        {
            var filtro = new FiltroPessoa
            {
                Busca = busca,
                Pagina = pagina,
                TamanhoPagina = tamanhoPagina is < 1 or > 100 ? 20 : tamanhoPagina,
            };

            var (itens, total) = await _app.ListarAsync(filtro);
            Response.Headers["X-Total-Count"] = total.ToString();
            return total == 0 ? NoContent() : Ok(itens);
        }

        /// <summary>Promove a administrador ou rebaixa a professor.
        ///
        /// Quem pede sai do CLAIM, nunca do corpo — é o que permite recusar
        /// auto-rebaixamento sem confiar em nada que o cliente mande.</summary>
        [HttpPost("{id:guid}/papel")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AlterarPapel(Guid id, [FromBody] AlterarPapelDto entrada)
        {
            var solicitanteId = User.PessoaId();
            if (solicitanteId is null)
                return Forbid();

            var resultado = await _app.AlterarPapelAsync(id, entrada.Papel, solicitanteId.Value);

            if (!resultado.IsSuccess)
                return BadRequest(new Error
                {
                    status = StatusCodes.Status400BadRequest,
                    messages = new[] { resultado.Error!.Message },
                });

            return NoContent();
        }

        /// <summary>Ativa ou desativa a conta.</summary>
        [HttpPost("{id:guid}/ativo")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AlterarAtivo(Guid id, [FromBody] AlterarAtivoDto entrada)
        {
            var solicitanteId = User.PessoaId();
            if (solicitanteId is null)
                return Forbid();

            var resultado = await _app.AlterarAtivoAsync(id, entrada.Ativo, solicitanteId.Value);

            if (!resultado.IsSuccess)
                return BadRequest(new Error
                {
                    status = StatusCodes.Status400BadRequest,
                    messages = new[] { resultado.Error!.Message },
                });

            return NoContent();
        }
    }
}
