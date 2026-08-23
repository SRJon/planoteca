using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Services;

namespace SaraivaTech.Planoteca.Api.Controllers
{
    /// <summary>
    /// O vocabulário que classifica um plano: componentes, séries e
    /// metodologias.
    ///
    /// Público pelo mesmo motivo da Biblioteca: são os rótulos dos FILTROS, e
    /// um visitante anônimo precisa deles para usar o acervo. Sem esta rota, a
    /// tela abriria com as listas vazias.
    ///
    /// Esta rota é o que substitui as listas fechadas em TypeScript do front.
    /// Enquanto o front tiver `COMPONENTES` e `ANOS` como union e o banco
    /// tiver tabela, os dois divergem em silêncio: o administrador cadastra
    /// Filosofia e a Biblioteca não a mostra.
    /// </summary>
    [ApiController]
    [ApiVersion("1")]
    [Route("api/v{version:apiVersion}/vocabulary")]
    [AllowAnonymous]
    public class VocabularyController : ControllerBase
    {
        private readonly IVocabularioAppService _app;

        public VocabularyController(IVocabularioAppService app)
        {
            _app = app;
        }

        /// <summary>As três listas numa resposta.</summary>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(VocabularioDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> Obter() => Ok(await _app.ObterAsync());
    }
}
