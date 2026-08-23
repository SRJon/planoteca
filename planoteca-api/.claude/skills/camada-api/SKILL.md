---
name: camada-api
description: Cria o Controller REST (e opcionalmente as McpTools) de uma entidade no projeto Api (SaraivaTech.Planoteca.Api). Use ao expor uma entidade via endpoint HTTP.
---

# /camada-api

Cria o Controller (e, opcionalmente, a exposição via MCP) de uma entidade em `src/SaraivaTech.Planoteca.Api`. Pressupõe que o AppService já existe (skill `camada-application-core`). É a última camada do fluxo de criação de uma entidade.

## O que criar

$ARGUMENTS

---

## Contexto do projeto

- Controllers em `Controllers/NomeEntidadeController.cs`: `[ApiController] [ApiVersion("1")] [Route("api/v{version:apiVersion}/nome-entidades")]` (rota em **kebab-case plural**), herdando `ControllerBase`. Injeta só `INomeEntidadeAppService` (nunca o serviço de domínio diretamente).
- `[Authorize]` vem comentado no exemplo de referência (auth desabilitada no sample) — siga o padrão do controller mais recente do projeto quanto a isso; não assuma que deve estar sempre comentado.
- Toda action tem doc XML completo (`<summary>`, `<remarks>`, `<param>`, `<response code="...">`) e `[ProducesResponseType(typeof(...), code)]` para cada código de resposta possível, usando `Error` (`Application.Base.Error`) nos casos de erro.
- `Insert`/`Update`/`Delete` no AppService devolvem `Result<Dto>`/`Result` (ver `camada-application-core`) — o Controller precisa checar `IsSuccess` e mapear falha para `400 BadRequest` com o `Error` padrão.
- `Get`/`GetAll` seguem o padrão de paginação: header `X-Total-Count` com o total, `204 NoContent` quando `total == 0`, senão `200 Ok(result)`.

## Passos

### PASSO 1 — Leia a referência

Leia `Controllers/PersonSampleController.cs`.

### PASSO 2 — Crie `Controllers/NomeEntidadeController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using SaraivaTech.Planoteca.Application.Base;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Services;

namespace SaraivaTech.Planoteca.Api.Controllers
{
    [ApiController]
    [ApiVersion("1")]
    [Route("api/v{version:apiVersion}/nome-entidades")]
    public class NomeEntidadeController : ControllerBase
    {
        private INomeEntidadeAppService NomeEntidadeAppService { get; }

        public NomeEntidadeController(INomeEntidadeAppService nomeEntidadeAppService)
        {
            NomeEntidadeAppService = nomeEntidadeAppService;
        }

        /// <summary>
        ///     Deletar uma entidade pelo ID
        /// </summary>
        /// <param name="id">Id da entidade</param>
        /// <response code="204">Sucesso, entidade deletada!</response>
        /// <response code="400">Uma validação de negócio não foi atendida.</response>
        /// <response code="500">Oops! algum problema ocorreu no servidor.</response>
        [HttpDelete("{id}")]
        [ProducesResponseType(typeof(void), 204)]
        [ProducesResponseType(typeof(Error), 400)]
        [ProducesResponseType(typeof(Error), 500)]
        public ActionResult Delete(Guid id)
        {
            var result = NomeEntidadeAppService.Delete(id);
            if (!result.IsSuccess)
                return BadRequest(new Error { messages = new[] { result.Error!.Message }, status = 400 });

            return NoContent();
        }

        /// <summary>
        ///     Filtrar/buscar entidades
        /// </summary>
        /// <param name="active">Parametro para limitar somente registros ativos</param>
        /// <param name="request">Filtros</param>
        /// <response code="200">Lista de entidades!</response>
        /// <response code="500">Oops! algum problema ocorreu no servidor.</response>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<NomeEntidadeDto>), 200)]
        [ProducesResponseType(typeof(Error), 500)]
        public async Task<ActionResult> Get([FromQuery] bool? active, [FromQuery] FilterDto request)
        {
            var (result, total) = await NomeEntidadeAppService.GetAsync(active, request);
            if (total == 0)
                return NoContent();

            Response.Headers.Append("X-Total-Count", total.ToString());
            return Ok(result);
        }

        /// <summary>
        ///     Recuperar uma entidade pelo ID
        /// </summary>
        /// <param name="id">Id da entidade</param>
        /// <response code="200">Entidade!</response>
        /// <response code="404">Entidade não encontrada.</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(NomeEntidadeDto), 200)]
        [ProducesResponseType(typeof(Error), 404)]
        public ActionResult GetById(Guid id)
        {
            var ret = NomeEntidadeAppService.GetById(id);
            return ret == null ? NotFound() : Ok(ret);
        }

        /// <summary>
        ///     Criar uma nova entidade
        /// </summary>
        /// <param name="value">Dados da entidade</param>
        /// <response code="201">Entidade criada!</response>
        /// <response code="400">Uma validação de negócio não foi atendida.</response>
        [HttpPost]
        [ProducesResponseType(typeof(NomeEntidadeDto), 201)]
        [ProducesResponseType(typeof(Error), 400)]
        public ActionResult Post([FromBody] NomeEntidadeDto value)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = NomeEntidadeAppService.Insert(value);
            if (!result.IsSuccess)
                return BadRequest(new Error { messages = new[] { result.Error!.Message }, status = 400 });

            return Created("", result.Value);
        }

        /// <summary>
        ///     Atualizar entidade
        /// </summary>
        /// <param name="id">Id da entidade</param>
        /// <param name="value">Dados da entidade</param>
        /// <response code="200">Entidade atualizada!</response>
        /// <response code="400">Uma validação de negócio não foi atendida.</response>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(NomeEntidadeDto), 200)]
        [ProducesResponseType(typeof(Error), 400)]
        public ActionResult Put(Guid id, [FromBody] NomeEntidadeDto value)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = NomeEntidadeAppService.Update(id, value);
            if (!result.IsSuccess)
                return BadRequest(new Error { messages = new[] { result.Error!.Message }, status = 400 });

            return Ok(result.Value);
        }
    }
}
```

### PASSO 3 (opcional) — Exponha via MCP Tools

Se a entidade fizer sentido como ferramenta consumível por agentes de IA (normalmente para consultas), crie `McpTools/NomeEntidadeMcpTools.cs`. Isso é **opcional** — nem toda entidade precisa disso; avalie com o usuário se a entidade deve ser exposta dessa forma antes de criar.

```csharp
using System.ComponentModel;
using SaraivaTech.Planoteca.Application.Base;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Services;
using ModelContextProtocol.Server;

namespace SaraivaTech.Planoteca.Api.McpTools;

[McpServerToolType]
public sealed class NomeEntidadeMcpTools(INomeEntidadeAppService appService)
{
    [McpServerTool(ReadOnly = true)]
    [Description("Busca uma entidade pelo seu ID (Guid).")]
    public NomeEntidadeDto? GetNomeEntidadeById(
        [Description("ID (Guid) da entidade")] Guid id)
        => appService.GetById(id);

    [McpServerTool(ReadOnly = true)]
    [Description("Lista e filtra entidades com suporte a paginação, ordenação e filtro. " +
        "O parâmetro filter aceita o formato Chave:operador:Valor — operadores: ':=:' (igual), ':like:' (contém).")]
    public async Task<NomeEntidadeListResult> GetNomeEntidades(
        [Description("Número da página (inicia em 1)")] int page = 1,
        [Description("Quantidade de registros por página")] int perPage = 50,
        [Description("Campo de ordenação. Prefixe com '-' para ordem decrescente.")] string sort = "Id",
        [Description("Filtro no formato Chave:operador:Valor")] string filter = "")
    {
        var filterDto = new FilterDto { page = page, per_page = perPage, sort = sort, filter = filter };
        var (items, total) = await appService.GetAsync(null, filterDto);
        return new NomeEntidadeListResult(items, total);
    }
}

public record NomeEntidadeListResult(IEnumerable<NomeEntidadeDto> Items, int Total);
```

Só exponha ações somente-leitura (`ReadOnly = true`) por padrão — escrita via MCP exige avaliação extra de segurança que está fora do escopo desta skill.

### Checklist

- [ ] Rota em kebab-case plural, `[ApiVersion("1")]`
- [ ] Injeta só o AppService, nunca o serviço de domínio
- [ ] `Insert`/`Update`/`Delete` verificam `result.IsSuccess` e devolvem `400` com `Error` em caso de falha
- [ ] Doc XML e `[ProducesResponseType]` em todas as actions
- [ ] Decidiu (com o usuário, se não for óbvio) se a entidade também precisa de `McpTools`

## Próximo passo

Use a skill `camada-tests` para cobrir a nova entidade com testes automatizados.
