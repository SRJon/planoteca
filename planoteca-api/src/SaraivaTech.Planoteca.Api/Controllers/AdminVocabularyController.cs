using System;
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
    /// A gestão do vocabulário: cadastrar e alterar componente, série e
    /// metodologia. `[Authorize]` na CLASSE — nenhuma rota deste controller
    /// escapa da policy, ao contrário de <see cref="VocabularyController"/>,
    /// que é pública por decisão de produto.
    ///
    /// Não existe exclusão física: desativar é `PUT` com `ativo`/`ativa` em
    /// `false`, o mesmo verbo que qualquer outra alteração.
    /// </summary>
    [ApiController]
    [ApiVersion("1")]
    [Route("api/v{version:apiVersion}/admin/vocabulary")]
    [Authorize(Policy = "Administrador")]
    public class AdminVocabularyController : ControllerBase
    {
        private readonly IVocabularioAdminAppService _app;

        public AdminVocabularyController(IVocabularioAdminAppService app)
        {
            _app = app;
        }

        /// <summary>As três listas, com o inativo à vista.</summary>
        [HttpGet]
        [ProducesResponseType(typeof(VocabularioDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> ObterTudo() => Ok(await _app.ObterTudoAsync());

        [HttpPost("components")]
        [ProducesResponseType(typeof(ComponenteDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CriarComponente([FromBody] ComponenteEntradaDto entrada)
        {
            var resultado = await _app.CriarComponenteAsync(entrada);

            if (!resultado.IsSuccess)
                return BadRequest(new Error
                {
                    status = StatusCodes.Status400BadRequest,
                    messages = new[] { resultado.Error!.Message },
                });

            return CreatedAtAction(nameof(ObterTudo), new { }, resultado.Value);
        }

        [HttpPut("components/{id:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AlterarComponente(Guid id, [FromBody] ComponenteEntradaDto entrada)
        {
            var resultado = await _app.AlterarComponenteAsync(id, entrada);

            if (!resultado.IsSuccess)
                return BadRequest(new Error
                {
                    status = StatusCodes.Status400BadRequest,
                    messages = new[] { resultado.Error!.Message },
                });

            return NoContent();
        }

        [HttpPost("grades")]
        [ProducesResponseType(typeof(SerieDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CriarSerie([FromBody] SerieEntradaDto entrada)
        {
            var resultado = await _app.CriarSerieAsync(entrada);

            if (!resultado.IsSuccess)
                return BadRequest(new Error
                {
                    status = StatusCodes.Status400BadRequest,
                    messages = new[] { resultado.Error!.Message },
                });

            return CreatedAtAction(nameof(ObterTudo), new { }, resultado.Value);
        }

        [HttpPut("grades/{id:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AlterarSerie(Guid id, [FromBody] SerieEntradaDto entrada)
        {
            var resultado = await _app.AlterarSerieAsync(id, entrada);

            if (!resultado.IsSuccess)
                return BadRequest(new Error
                {
                    status = StatusCodes.Status400BadRequest,
                    messages = new[] { resultado.Error!.Message },
                });

            return NoContent();
        }

        [HttpPost("methodologies")]
        [ProducesResponseType(typeof(MetodologiaDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CriarMetodologia([FromBody] MetodologiaEntradaDto entrada)
        {
            var resultado = await _app.CriarMetodologiaAsync(entrada);

            if (!resultado.IsSuccess)
                return BadRequest(new Error
                {
                    status = StatusCodes.Status400BadRequest,
                    messages = new[] { resultado.Error!.Message },
                });

            return CreatedAtAction(nameof(ObterTudo), new { }, resultado.Value);
        }

        [HttpPut("methodologies/{id:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AlterarMetodologia(Guid id, [FromBody] MetodologiaEntradaDto entrada)
        {
            var resultado = await _app.AlterarMetodologiaAsync(id, entrada);

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
