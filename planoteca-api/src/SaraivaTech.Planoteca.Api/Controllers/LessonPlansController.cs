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
                ComponentesIds = requisicao.ComponenteId ?? Array.Empty<Guid>(),
                SeriesIds = requisicao.SerieId ?? Array.Empty<Guid>(),
                MetodologiasIds = requisicao.MetodologiaId ?? Array.Empty<Guid>(),
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

        /// <summary>Quantos planos cada item do vocabulário responde, no
        /// recorte atual.
        ///
        /// `[AllowAnonymous]` pela mesma razão da listagem: a coluna de filtro
        /// é parte da Biblioteca, e a Biblioteca é pública. Ver o comentário
        /// no alto desta classe antes de acrescentar `[Authorize]`.
        /// </summary>
        [HttpGet("facets")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(FacetasDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> Facetas([FromQuery] FiltroPlanoRequest requisicao)
        {
            var filtro = new FiltroPlano
            {
                Busca = requisicao.Busca,
                ComponentesIds = requisicao.ComponenteId ?? Array.Empty<Guid>(),
                SeriesIds = requisicao.SerieId ?? Array.Empty<Guid>(),
                MetodologiasIds = requisicao.MetodologiaId ?? Array.Empty<Guid>(),
                DuracaoMinima = requisicao.DuracaoMinima,
                DuracaoMaxima = requisicao.DuracaoMaxima,
                // `Pagina` e `TamanhoPagina` ficam de fora de propósito
                // (RF-01): a contagem é do recorte inteiro. Copiá-los daria um
                // número que muda ao virar a página.
                IncluirRascunhos = false,
            };

            // 200 com as três listas vazias quando nada casa, e não 204: a
            // coluna de filtro precisa desenhar os itens com zero. Um corpo
            // ausente faria a tela alternar entre com e sem filtro a cada
            // teclada da busca.
            return Ok(await _app.ObterFacetasAsync(filtro));
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

        // `Guid[]`, não `Guid?`: `?serie=a&serie=b` liga ao array pela MESMA
        // chave repetida — é assim que o model binder do ASP.NET lê uma lista
        // simples da querystring, sem precisar de convenção `serie[0]=a`.
        [FromQuery(Name = "componente")] public Guid[]? ComponenteId { get; set; }
        [FromQuery(Name = "serie")] public Guid[]? SerieId { get; set; }
        [FromQuery(Name = "metodologia")] public Guid[]? MetodologiaId { get; set; }
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
