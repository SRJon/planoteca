---
name: camada-application
description: Cria DTO (record), mapper Mapperly e a interface do AppService no projeto Application (SaraivaTech.Planoteca.Application). Use ao expor uma entidade de domínio como contrato de aplicação.
---

# /camada-application

Cria os contratos de aplicação de uma entidade em `src/SaraivaTech.Planoteca.Application`. Pressupõe que a entidade de domínio já existe (skill `camada-domain`).

## O que criar

$ARGUMENTS

---

## Contexto do projeto

- DTOs em `Dto/`: sempre **C# record** com parâmetros posicionais, doc XML (`<summary>`/`<param>` por campo) e `[Required]` do `System.ComponentModel.DataAnnotations` nos campos obrigatórios.
- Interface do AppService em `Services/IXxxAppService.cs`: **não é genérica**, escrita à mão por entidade. Sempre expõe uma propriedade pública do serviço de domínio (nome em camelCase, ex. `INomeEntidadeService nomeEntidadeService { get; set; }`) e os métodos CRUD usando DTOs, incluindo `GetAll(FilterDto, out int total)` (sync) e `GetAsync(bool? active, FilterDto)` retornando `Task<(IEnumerable<Dto> Items, int Total)>` (async).
- **Padrão Result nas operações de escrita**: por instrução do CLAUDE.md, `Insert`/`Update`/`Delete` — as operações que podem falhar por regra de negócio — devolvem `Result<NomeEntidadeDto>` (ou `Result` para `Delete`) em vez do DTO cru ou de deixar a exceção estourar até o controller. É aqui, na fronteira do AppService (não no `Service<TEntity>` genérico do domínio), que o `Result<T>` (`Domain.Base.Result`) entra — porque essa interface não é compartilhada por outras entidades, então mudar sua assinatura não quebra nada. Consultas (`GetById`/`GetAll`/`GetAsync`) continuam devolvendo o DTO cru (ou `null`/lista vazia) — não precisam de `Result<T>`, já que "não encontrado" não é uma falha de operação, é um resultado válido.
- Mapper em `Mappers/XxxMapper.cs` usando **Mapperly** (`Riok.Mapperly.Abstractions`), classe `partial` com `[Mapper]`: `ToEntity`, `ToDto`, `ToDtoList`. Use `[MapperIgnoreTarget(nameof(Entity.Id))]` em `ToEntity` para não sobrescrever o Id vindo do DTO em inserts (o Id é atribuído pelo `Entity` ou pelo controller/appservice em updates).
- `Base/AppService.cs` é a classe base abstrata: só guarda `protected IUnitOfWork UoW`.
- `Base/Error.cs` é o formato de erro padrão da API: `{ IEnumerable<string> messages; int status; }` — usado nos `[ProducesResponseType(typeof(Error), ...)]` do controller.
- `Base/FilterDto.cs` implementa `IFilterParameters`: `sort` com prefixo `-` vira `"campo desc"`; defaults são `sort="Id", page=1, per_page=int.MaxValue`. Não precisa recriar — é compartilhado por todas as entidades.

## Passos

### PASSO 1 — Leia a referência

Leia `Dto/PersonSampleDto.cs`, `Services/IPersonSampleAppService.cs` e `Mappers/PersonSampleMapper.cs`.

### PASSO 2 — Crie o DTO em `Dto/NomeEntidadeDto.cs`

```csharp
using System;
using System.ComponentModel.DataAnnotations;

namespace SaraivaTech.Planoteca.Application.Dto
{
    /// <summary>
    /// Objeto de transferência de dados para NomeEntidade
    /// </summary>
    /// <param name="Id">Id da entidade</param>
    /// <param name="Campo">Descrição do campo</param>
    public record NomeEntidadeDto(
        Guid Id,
        [Required]
        string Campo
    );
}
```

### PASSO 3 — Crie o mapper em `Mappers/NomeEntidadeMapper.cs`

```csharp
using System.Collections.Generic;
using Riok.Mapperly.Abstractions;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Application.Mappers;

[Mapper]
public partial class NomeEntidadeMapper
{
    [MapperIgnoreTarget(nameof(NomeEntidade.Id))]
    public partial NomeEntidade ToEntity(NomeEntidadeDto dto);

    public partial NomeEntidadeDto ToDto(NomeEntidade entity);

    public partial List<NomeEntidadeDto> ToDtoList(IEnumerable<NomeEntidade> entities);
}
```

### PASSO 4 — Crie a interface do AppService em `Services/INomeEntidadeAppService.cs`

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Application.Base;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Services;

namespace SaraivaTech.Planoteca.Application.Services
{
    public interface INomeEntidadeAppService
    {
        INomeEntidadeService nomeEntidadeService { get; set; }

        Result Delete(Guid id);
        NomeEntidadeDto GetById(Guid id);
        Result<NomeEntidadeDto> Insert(NomeEntidadeDto obj);
        Result<NomeEntidadeDto> Update(Guid id, NomeEntidadeDto obj);
        IEnumerable<NomeEntidadeDto> GetAll(FilterDto parameters, out int total);
        Task<(IEnumerable<NomeEntidadeDto> Items, int Total)> GetAsync(bool? active, FilterDto request);
    }
}
```

Ajuste a assinatura ao que a entidade realmente precisa (nem toda entidade precisa de filtro por `active`, por exemplo).

### Checklist

- [ ] DTO é `record`, com doc XML e `[Required]` nos campos obrigatórios
- [ ] Mapper usa `[Mapper]` + `partial class`, com `[MapperIgnoreTarget(nameof(Entity.Id))]` em `ToEntity`
- [ ] Interface do AppService expõe o serviço de domínio como propriedade pública
- [ ] `Insert`/`Update`/`Delete` retornam `Result<Dto>`/`Result`; consultas retornam o DTO cru
- [ ] Nenhuma implementação aqui — só contratos, DTOs e mapeamento (a implementação vai em `camada-application-core`)

> Nota: a interface de referência `IPersonSampleAppService` foi escrita antes desse padrão e devolve o DTO cru (lançando exceção em caso de falha). Não copie esse detalhe em entidades novas — siga `Result<T>` como acima.

## Próximo passo

Use a skill `camada-application-core` para implementar o `NomeEntidadeAppService` concreto.
