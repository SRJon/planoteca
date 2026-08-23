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
    /// O Blog, do lado de quem LÊ.
    ///
    /// Público, como a Biblioteca: ler relato de sala de aula não exige
    /// conta. Só devolve texto publicado — pendente, devolvido e recusado não
    /// existem para quem chega de fora.
    /// </summary>
    [ApiController]
    [ApiVersion("1")]
    [Route("api/v{version:apiVersion}/posts")]
    [AllowAnonymous]
    public class PostsController : ControllerBase
    {
        private readonly IPostAppService _app;

        public PostsController(IPostAppService app)
        {
            _app = app;
        }

        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(PostResumoDto[]), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Listar(
            [FromQuery(Name = "q")] string? busca,
            [FromQuery(Name = "page")] int pagina = 1,
            [FromQuery(Name = "perPage")] int tamanhoPagina = 12)
        {
            var filtro = new FiltroPost
            {
                Busca = busca,
                Pagina = pagina,
                TamanhoPagina = tamanhoPagina is < 1 or > 100 ? 12 : tamanhoPagina,
                // `Situacao` fica NULO de propósito: o repositório trata nulo
                // como "só publicados". Deixar isto virar parâmetro abriria a
                // fila de moderação inteira por querystring.
            };

            var (itens, total) = await _app.ListarAsync(filtro);
            Response.Headers["X-Total-Count"] = total.ToString();
            return total == 0 ? NoContent() : Ok(itens);
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(PostDetalheDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Obter(Guid id)
        {
            // 404, e não 403, para texto não publicado: dizer "existe, mas
            // você não pode ver" vaza a existência de um rascunho alheio.
            var post = await _app.ObterAsync(id, incluirNaoPublicado: false);
            return post is null ? NotFound() : Ok(post);
        }

        /// <summary>
        /// Soma uma leitura ao contador. Público e anônimo — a mesma regra
        /// de ler o texto: contar não pode exigir o que ler não exige.
        ///
        /// Não guarda quem chamou: nenhum IP, nenhum identificador. Quem
        /// evita chamada repetida é o FRONT, com uma marca no
        /// `localStorage` do navegador — o servidor não tem, e não precisa
        /// ter, como saber se é a mesma pessoa de novo.
        ///
        /// Sempre 204, mesmo para id inexistente ou não publicado: o
        /// repositório filtra por `Situacao == Publicado` no UPDATE, então a
        /// chamada é inofensiva quando não há o que incrementar. Devolver
        /// 404 aqui distinguiria "existe mas não publicado" de "não existe",
        /// e essa distinção não serve a nada nesta rota.
        /// </summary>
        [HttpPost("{id:guid}/visualizacao")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> RegistrarVisualizacao(Guid id)
        {
            await _app.IncrementarVisualizacaoAsync(id);
            return NoContent();
        }
    }

    /// <summary>
    /// O Blog, do lado de quem ESCREVE e de quem MODERA.
    ///
    /// Dois níveis de exigência na mesma classe:
    ///
    /// - **Escrever** e **ver os próprios textos** pedem só `[Authorize]`:
    ///   qualquer professor cadastrado escreve.
    /// - **Moderar** e **ver a fila alheia** pedem o papel de administrador.
    ///
    /// O autor e o moderador saem do CLAIM, nunca do corpo — um id vindo do
    /// cliente deixaria qualquer pessoa escrever em nome de outra.
    /// </summary>
    [ApiController]
    [ApiVersion("1")]
    [Route("api/v{version:apiVersion}/admin/posts")]
    [Authorize]
    public class AdminPostsController : ControllerBase
    {
        private readonly IPostAppService _app;

        public AdminPostsController(IPostAppService app)
        {
            _app = app;
        }

        /// <summary>A fila de moderação. O painel abre por ela.</summary>
        [HttpGet]
        [ProducesResponseType(typeof(PostResumoDto[]), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Listar(
            [FromQuery(Name = "situacao")] string? situacao,
            [FromQuery(Name = "page")] int pagina = 1,
            [FromQuery(Name = "perPage")] int tamanhoPagina = 12)
        {
            // Professor vê só os PRÓPRIOS textos; administrador vê a fila
            // inteira. O recorte é imposto AQUI, e não aceito por parâmetro:
            // um `?autor=` vindo do cliente deixaria qualquer professor ler
            // os rascunhos alheios.
            var autorId = User.EhAdministrador() ? null : User.PessoaId();

            var filtro = new FiltroPost
            {
                Situacao = situacao ?? SaraivaTech.Planoteca.Domain.Enumerable.SituacaoPost.Pendente,
                AutorId = autorId,
                Pagina = pagina,
                TamanhoPagina = tamanhoPagina is < 1 or > 100 ? 12 : tamanhoPagina,
            };

            var (itens, total) = await _app.ListarAsync(filtro);
            Response.Headers["X-Total-Count"] = total.ToString();
            return total == 0 ? NoContent() : Ok(itens);
        }

        /// <summary>Quantos aguardam moderação.</summary>
        [HttpGet("pendentes/contagem")]
        [Authorize(Policy = "Administrador")]
        [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
        public async Task<IActionResult> ContarPendentes() =>
            Ok(new { total = await _app.ContarPendentesAsync() });

        /// <summary>Lê um texto não publicado — para moderar, é preciso ler.</summary>
        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(PostDetalheDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Obter(Guid id)
        {
            var post = await _app.ObterAsync(id, incluirNaoPublicado: true);
            if (post is null) return NotFound();

            // Um professor só lê o próprio texto não publicado. 404 e não
            // 403: dizer "existe, mas não é seu" vaza o rascunho alheio.
            if (!User.EhAdministrador() && post.AutorId != User.PessoaId()) return NotFound();

            return Ok(post);
        }

        /// <summary>Escreve um texto. Nasce pendente.</summary>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Escrever([FromBody] PostEntradaDto entrada)
        {
            var autorId = User.PessoaId();
            if (autorId is null)
                return Forbid();

            var resultado = await _app.EscreverAsync(entrada, autorId.Value);

            if (!resultado.IsSuccess)
                return BadRequest(new Error
                {
                    status = StatusCodes.Status400BadRequest,
                    messages = new[] { resultado.Error!.Message },
                });

            return CreatedAtAction(nameof(Obter), new { id = resultado.Value, version = "1" },
                new { id = resultado.Value });
        }

        /// <summary>Publica, devolve ou recusa.</summary>
        [HttpPost("{id:guid}/moderacao")]
        [Authorize(Policy = "Administrador")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Moderar(Guid id, [FromBody] ModeracaoDto decisao)
        {
            var moderadorId = User.PessoaId();
            if (moderadorId is null)
                return Forbid();

            var resultado = await _app.ModerarAsync(id, decisao, moderadorId.Value);

            if (!resultado.IsSuccess)
                return BadRequest(new Error
                {
                    status = StatusCodes.Status400BadRequest,
                    messages = new[] { resultado.Error!.Message },
                });

            return NoContent();
        }

        /// <summary>Tira o texto do ar: some do blog público e da fila de
        /// moderação. Não é DELETE — reversível por `Desarquivar`. Curadoria
        /// do acervo, então não exige comentário (RF-11 é sobre devolutiva
        /// ao autor, e arquivar não é isso).</summary>
        [HttpPost("{id:guid}/arquivamento")]
        [Authorize(Policy = "Administrador")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Arquivar(Guid id)
        {
            var administradorId = User.PessoaId();
            if (administradorId is null)
                return Forbid();

            var resultado = await _app.ArquivarAsync(id, administradorId.Value);

            if (!resultado.IsSuccess)
                return BadRequest(new Error
                {
                    status = StatusCodes.Status400BadRequest,
                    messages = new[] { resultado.Error!.Message },
                });

            return NoContent();
        }

        /// <summary>Devolve um texto arquivado ao fluxo, na situação em que
        /// estava antes de arquivar.</summary>
        [HttpDelete("{id:guid}/arquivamento")]
        [Authorize(Policy = "Administrador")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Desarquivar(Guid id)
        {
            var administradorId = User.PessoaId();
            if (administradorId is null)
                return Forbid();

            var resultado = await _app.DesarquivarAsync(id, administradorId.Value);

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
