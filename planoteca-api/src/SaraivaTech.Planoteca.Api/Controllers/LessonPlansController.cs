using System;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Services;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;

namespace SaraivaTech.Planoteca.Api.Controllers
{
    /// <summary>
    /// A Biblioteca.
    ///
    /// ── Por que NÃO existe `[Authorize]` nesta classe ────────────────────
    ///
    /// **Isto é decisão de produto, não esquecimento.** O acervo é público:
    /// navegar, filtrar, abrir a ficha e baixar o PDF não exigem conta. O
    /// professor chega pelo celular, com pressa, e qualquer porta entre ele e
    /// o arquivo derruba o uso.
    ///
    /// Quem for "corrigir" isto acrescentando `[Authorize]` vai quebrar a
    /// Biblioteca inteira. Ver a seção "As decisões que não se renegociam" no
    /// `CLAUDE.md` da raiz, e os testes que travam a regra em
    /// `planoteca-web/e2e/biblioteca.spec.ts`.
    ///
    /// A escrita é outra história: catalogar e assinar upload são de
    /// administrador, e ganham `[Authorize]` quando o login existir.
    /// </summary>
    [ApiController]
    [ApiVersion("1")]
    [Route("api/v{version:apiVersion}/lesson-plans")]
    [AllowAnonymous]
    public class LessonPlansController : ControllerBase
    {
        private readonly IPlanoAppService _app;

        public LessonPlansController(IPlanoAppService app)
        {
            _app = app;
        }

        /// <summary>A listagem, com filtro combinado e paginação.</summary>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(PlanoResumoDto[]), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Listar([FromQuery] FiltroPlanoRequest requisicao)
        {
            var filtro = new FiltroPlano
            {
                Busca = requisicao.Busca,
                ComponenteId = requisicao.ComponenteId,
                SerieId = requisicao.SerieId,
                MetodologiaId = requisicao.MetodologiaId,
                DuracaoMinima = requisicao.DuracaoMinima,
                DuracaoMaxima = requisicao.DuracaoMaxima,
                Pagina = requisicao.Pagina,
                TamanhoPagina = requisicao.TamanhoPagina,
                // NUNCA vem da requisição. Rascunho não é conteúdo público, e
                // deixar isto virar parâmetro abriria o acervo inteiro por
                // querystring.
                IncluirRascunhos = false,
            };

            var (itens, total) = await _app.ListarAsync(filtro);

            // O total vai no cabeçalho, não no corpo: é o contrato que o front
            // já consome (`X-Total-Count` em `shared/api/cliente.ts`).
            Response.Headers["X-Total-Count"] = total.ToString();

            // 204 quando o recorte não devolve nada — o mesmo comportamento
            // que o cliente HTTP do front já absorve.
            return total == 0 ? NoContent() : Ok(itens);
        }

        /// <summary>A ficha de um plano.</summary>
        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(PlanoDetalheDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Obter(Guid id)
        {
            // `incluirRascunho: false` fixo: um rascunho responde 404 para
            // quem não é administrador, e não 403. Dizer "existe, mas você não
            // pode ver" vaza a existência de plano não publicado.
            var plano = await _app.ObterAsync(id, incluirRascunho: false);
            return plano is null ? NotFound() : Ok(plano);
        }
    }

    /// <summary>Os parâmetros de filtro que a Biblioteca manda na querystring.</summary>
    public class FiltroPlanoRequest
    {
        [FromQuery(Name = "q")] public string? Busca { get; set; }
        [FromQuery(Name = "componente")] public Guid? ComponenteId { get; set; }
        [FromQuery(Name = "serie")] public Guid? SerieId { get; set; }
        [FromQuery(Name = "metodologia")] public Guid? MetodologiaId { get; set; }
        [FromQuery(Name = "duracaoMin")] public int? DuracaoMinima { get; set; }
        [FromQuery(Name = "duracaoMax")] public int? DuracaoMaxima { get; set; }
        [FromQuery(Name = "page")] public int Pagina { get; set; } = 1;

        private int _tamanhoPagina = 12;

        /// <summary>Teto de 100 por página. Sem ele, `perPage=100000` viraria
        /// uma consulta que derruba o plano gratuito do Render.</summary>
        [FromQuery(Name = "perPage")]
        public int TamanhoPagina
        {
            get => _tamanhoPagina;
            set => _tamanhoPagina = value switch
            {
                < 1 => 12,
                > 100 => 100,
                _ => value,
            };
        }
    }
}
