using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaraivaTech.Planoteca.Application.Base;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Services;

namespace SaraivaTech.Planoteca.Api.Controllers
{
    /// <summary>
    /// Quem sou eu, na Planoteca.
    ///
    /// NÃO existe endpoint de login: quem autentica é o Firebase, no
    /// navegador. O front manda o token dele no `Authorization`, e esta rota
    /// devolve a pessoa como a Planoteca a conhece — com o PAPEL, que o
    /// Firebase não sabe.
    ///
    /// É também onde o cadastro nasce: o primeiro acesso de alguém cria o
    /// registro como professor.
    /// </summary>
    [ApiController]
    [ApiVersion("1")]
    [Route("api/v{version:apiVersion}/auth")]
    public class AuthController : ControllerBase
    {
        private readonly ISessaoAppService _app;

        public AuthController(ISessaoAppService app)
        {
            _app = app;
        }

        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(SessaoDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> Eu()
        {
            var resultado = await _app.ResolverAsync(User);

            if (!resultado.IsSuccess)
                return StatusCode(StatusCodes.Status403Forbidden, new Error
                {
                    status = StatusCodes.Status403Forbidden,
                    messages = new[] { resultado.Error!.Message },
                });

            return Ok(resultado.Value);
        }
    }
}
