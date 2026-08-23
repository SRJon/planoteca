---
name: camada-application-core
description: Implementa o AppService concreto (orquestração de caso de uso, transação via UoW, tradução de falhas para Result<T>) no projeto Application.Core (SaraivaTech.Planoteca.Application.Core). Use ao implementar a lógica de uma interface IXxxAppService.
---

# /camada-application-core

Implementa a classe concreta do AppService em `src/SaraivaTech.Planoteca.Application.Core`. Pressupõe que DTO, mapper e interface do AppService já existem (skill `camada-application`) e que o serviço/repositório de domínio já existem (skills `camada-domain` e `camada-domain-core`).

## O que criar

$ARGUMENTS

---

## Contexto do projeto

- Classe concreta `NomeEntidadeAppService : AppService, INomeEntidadeAppService`, herdando `Base/AppService.cs` (só expõe `protected IUnitOfWork UoW`).
- Injeta no construtor: `IUnitOfWork`, o mapper (`NomeEntidadeMapper`), o serviço de domínio (`INomeEntidadeService`), o repositório (`INomeEntidadeRepository`, quando a consulta paginada precisa ir direto ao repositório) e `Serilog.ILogger` (`logger.ForContext<NomeEntidadeAppService>()`).
- **Toda escrita** (`Insert`/`Update`/`Delete`) segue o padrão transacional: `UoW.BeginTransaction()` → operação → `UoW.Commit()`; em caso de exceção, `UoW.Rollback()`. Lembre: `Repository<T>` **não chama `SaveChanges`** — isso só acontece dentro de `UoW.Commit()`.
- **Tradução de falhas para `Result<T>`**: capture a `FluentValidation.ValidationException` lançada pelo domínio (validação de campo ou regra de negócio — ver `camada-domain-core`) e converta em `Result<Dto>.Failure(ex.Message)`. Qualquer outra exceção não prevista deve continuar subindo (`throw`, nunca `throw ex`) para ser tratada pelo `StandardErrorResultFilter` da API como erro 500.
- Consultas (`GetById`/`GetAll`/`GetAsync`) mapeiam o resultado do domínio/repositório para DTO via o mapper injetado e não usam `Result<T>` — devolvem `null`/lista vazia quando não há dado, deixando o Controller decidir o código HTTP (`NotFound`/`NoContent`).

  > Nota: a referência `PersonSampleAppService.GetById` captura `Exception` genérica e devolve `null` silenciosamente, escondendo o erro real. Não repita isso — deixe exceções inesperadas subirem; só devolva `null` quando o domínio realmente não encontrou o registro (`obj == null`).

## Passos

### PASSO 1 — Leia a referência

Leia `Services/PersonSampleAppService.cs`.

### PASSO 2 — Implemente `Services/NomeEntidadeAppService.cs`

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentValidation;
using SaraivaTech.Planoteca.Application.Base;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Mappers;
using SaraivaTech.Planoteca.Application.Services;
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Domain.Services;
using Serilog;

namespace SaraivaTech.Planoteca.Application.Core.Services
{
    public class NomeEntidadeAppService : AppService, INomeEntidadeAppService
    {
        private readonly INomeEntidadeRepository _nomeEntidadeRepository;
        private readonly ILogger _logger;
        private readonly NomeEntidadeMapper _mapper;

        public NomeEntidadeAppService(IUnitOfWork uoW, NomeEntidadeMapper mapper, INomeEntidadeService nomeEntidadeService,
            INomeEntidadeRepository nomeEntidadeRepository, ILogger logger) : base(uoW)
        {
            _mapper = mapper;
            this.nomeEntidadeService = nomeEntidadeService;
            _nomeEntidadeRepository = nomeEntidadeRepository;
            _logger = logger.ForContext<NomeEntidadeAppService>();
        }

        public INomeEntidadeService nomeEntidadeService { get; set; }

        public Result<NomeEntidadeDto> Insert(NomeEntidadeDto obj)
        {
            try
            {
                UoW.BeginTransaction();
                var entity = nomeEntidadeService.Insert(_mapper.ToEntity(obj));
                UoW.Commit();

                return Result<NomeEntidadeDto>.Success(_mapper.ToDto(entity));
            }
            catch (ValidationException ex)
            {
                UoW.Rollback();
                return Result<NomeEntidadeDto>.Failure(ex.Message);
            }
            catch
            {
                UoW.Rollback();
                throw;
            }
        }

        public Result<NomeEntidadeDto> Update(Guid id, NomeEntidadeDto obj)
        {
            try
            {
                UoW.BeginTransaction();

                var entity = _mapper.ToEntity(obj);
                entity.Id = id;
                entity = nomeEntidadeService.Update(entity);

                UoW.Commit();
                return Result<NomeEntidadeDto>.Success(_mapper.ToDto(entity));
            }
            catch (ValidationException ex)
            {
                UoW.Rollback();
                return Result<NomeEntidadeDto>.Failure(ex.Message);
            }
            catch
            {
                UoW.Rollback();
                throw;
            }
        }

        public Result Delete(Guid id)
        {
            try
            {
                UoW.BeginTransaction();
                var obj = nomeEntidadeService.GetById(id);
                nomeEntidadeService.Delete(obj);
                UoW.Commit();

                return Result.Success();
            }
            catch (ValidationException ex)
            {
                UoW.Rollback();
                return Result.Failure(ex.Message);
            }
            catch
            {
                UoW.Rollback();
                throw;
            }
        }

        public NomeEntidadeDto GetById(Guid id)
        {
            var obj = nomeEntidadeService.GetById(id);
            return obj == null ? null : _mapper.ToDto(obj);
        }

        public IEnumerable<NomeEntidadeDto> GetAll(FilterDto parameters, out int total)
        {
            var allItems = _nomeEntidadeRepository
                .GetAll(x => true, parameters, new[] { "Campo" });
            total = allItems.Count();
            var query = allItems
                .Skip((parameters.page - 1) * parameters.per_page)
                .Take(parameters.per_page)
                .ToList();

            return _mapper.ToDtoList(query);
        }

        public async Task<(IEnumerable<NomeEntidadeDto> Items, int Total)> GetAsync(bool? active, FilterDto request)
        {
            var (items, total) = await _nomeEntidadeRepository.GetAsync(active, request.sort, request.page, request.per_page);
            return (_mapper.ToDtoList(items), total);
        }
    }
}
```

Ajuste os métodos de consulta ao que a interface (`camada-application`) realmente declarou — nem toda entidade precisa de `Get` filtrado por `active`, `GetAll` paginado por filtro dinâmico e `GetAsync` ao mesmo tempo.

### Checklist

- [ ] `Insert`/`Update`/`Delete` envolvem `UoW.BeginTransaction()`/`UoW.Commit()`/`UoW.Rollback()`
- [ ] `ValidationException` do domínio é convertida em `Result<T>.Failure(...)` / `Result.Failure(...)`
- [ ] Exceções não previstas usam `throw` (nunca `throw ex`) e não são engolidas
- [ ] Consultas devolvem DTO cru / `null`, sem `Result<T>`
- [ ] Logger criado com `logger.ForContext<NomeEntidadeAppService>()`

## Próximo passo

Use a skill `camada-infra-data` para implementar o repositório concreto e o mapeamento EF Core, e `camada-infra-crosscutting` para registrar tudo no DI.
