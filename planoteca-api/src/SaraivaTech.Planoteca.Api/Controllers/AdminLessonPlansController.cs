using System;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaraivaTech.Planoteca.Application.Base;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Services;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Domain.Services;
using SaraivaTech.Planoteca.Infra.CrossCutting.Middleware;

namespace SaraivaTech.Planoteca.Api.Controllers
{
    /// <summary>
    /// A catalogação e a gestão do acervo — a mesa de trabalho de quem o
    /// MANTÉM.
    ///
    /// Exige o papel de ADMINISTRADOR — o oposto de `LessonPlansController`,
    /// onde o anônimo é decisão de produto permanente.
    ///
    /// O papel vem do nosso banco, não do token do Firebase: o
    /// `PapelClaimsMiddleware` resolve a pessoa e injeta o claim que esta
    /// política exige. Ver o cabeçalho dele para o porquê da separação.
    /// </summary>
    [ApiController]
    [ApiVersion("1")]
    [Route("api/v{version:apiVersion}/admin/lesson-plans")]
    [Authorize(Policy = "Administrador")]
    public class AdminLessonPlansController : ControllerBase
    {
        private readonly IPlanoAppService _app;

        public AdminLessonPlansController(IPlanoAppService app)
        {
            _app = app;
        }

        /// <summary>
        /// Os planos, INCLUINDO rascunho. É a diferença desta listagem para a
        /// pública, e o que torna esta a tela onde o administrador confere uma
        /// leva antes de publicar.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(PlanoResumoDto[]), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Listar(
            [FromQuery(Name = "q")] string? busca,
            [FromQuery(Name = "page")] int pagina = 1,
            [FromQuery(Name = "perPage")] int tamanhoPagina = 20)
        {
            var filtro = new FiltroPlano
            {
                Busca = busca,
                Pagina = pagina,
                TamanhoPagina = tamanhoPagina is < 1 or > 100 ? 20 : tamanhoPagina,
                IncluirRascunhos = true,
            };

            var (itens, total) = await _app.ListarAsync(filtro);
            Response.Headers["X-Total-Count"] = total.ToString();
            return total == 0 ? NoContent() : Ok(itens);
        }

        /// <summary>
        /// Assina a URL para o navegador subir o PDF direto ao Cloudflare R2.
        ///
        /// O arquivo NÃO passa por aqui. A API só assina e devolve dois
        /// endereços: um para o `PUT` do navegador, outro para gravar em
        /// `arquivo_url`. Fazer o upload atravessar o processo consumiria a
        /// memória do plano gratuito do Render com um PDF de 100 MB, e o
        /// disco de lá é efêmero de qualquer forma.
        /// </summary>
        [HttpPost("upload-url")]
        [ProducesResponseType(typeof(UploadAssinado), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AssinarUpload([FromBody] UploadRequest requisicao)
        {
            var resultado = await _app.AssinarUploadAsync(requisicao.NomeArquivo, requisicao.TipoConteudo);

            // O modelo `Error` do projeto, e NÃO um objeto anônimo: o
            // `StandardErrorResultFilter` reescreve qualquer outra forma para
            // "An error occurred.", e a mensagem que diz o que fazer — qual
            // configuração falta, qual tipo de arquivo é aceito — se perde.
            if (!resultado.IsSuccess)
                return BadRequest(new Error
                {
                    status = StatusCodes.Status400BadRequest,
                    messages = new[] { resultado.Error!.Message },
                });

            return Ok(resultado.Value);
        }

        /// <summary>Cataloga um plano. O arquivo já subiu para o R2.</summary>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Catalogar([FromBody] PlanoEntradaDto entrada)
        {
            // Quem catalogou sai do CLAIM, e nunca do corpo da requisição:
            // um id vindo do cliente permitiria atribuir a catalogação a
            // outra pessoa.
            var resultado = await _app.CatalogarAsync(entrada, User.PessoaId());

            if (!resultado.IsSuccess)
                return BadRequest(new Error
                {
                    status = StatusCodes.Status400BadRequest,
                    messages = new[] { resultado.Error!.Message },
                });

            return CreatedAtAction(
                actionName: nameof(LessonPlansController.Obter),
                controllerName: "LessonPlans",
                routeValues: new { id = resultado.Value, version = "1" },
                value: new { id = resultado.Value });
        }

        /// <summary>Publica ou despublica um plano já catalogado.</summary>
        [HttpPost("{id:guid}/situacao")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AlterarSituacao(Guid id, [FromBody] SituacaoRequest requisicao)
        {
            var resultado = await _app.AlterarSituacaoAsync(id, requisicao.Publicar);

            if (!resultado.IsSuccess)
                return BadRequest(new Error
                {
                    status = StatusCodes.Status400BadRequest,
                    messages = new[] { resultado.Error!.Message },
                });

            return NoContent();
        }

        /// <summary>Remove um plano que nunca foi publicado.</summary>
        [HttpDelete("{id:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Remover(Guid id)
        {
            var resultado = await _app.RemoverAsync(id);

            if (!resultado.IsSuccess)
                return BadRequest(new Error
                {
                    status = StatusCodes.Status400BadRequest,
                    messages = new[] { resultado.Error!.Message },
                });

            return NoContent();
        }
    }

    /// <summary>O que o formulário manda para pedir a URL de upload.</summary>
    public class UploadRequest
    {
        public string NomeArquivo { get; set; } = string.Empty;

        /// <summary>O `Content-Type` que o navegador vai usar no `PUT`. Entra
        /// na assinatura, então o upload falha se ele mentir.</summary>
        public string TipoConteudo { get; set; } = "application/pdf";
    }

    /// <summary>Publicar ou despublicar.</summary>
    public class SituacaoRequest
    {
        public bool Publicar { get; set; }
    }
}
