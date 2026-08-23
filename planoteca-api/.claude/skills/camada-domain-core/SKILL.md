---
name: camada-domain-core
description: Implementa o Service<TEntity> concreto e o AbstractValidator<T> (FluentValidation) de uma entidade no projeto Domain.Core (SaraivaTech.Planoteca.Domain.Core). Use ao adicionar regras de negócio ou validações a uma entidade.
---

# /camada-domain-core

Implementa a lógica de negócio e validação de uma entidade em `src/SaraivaTech.Planoteca.Domain.Core`. Pressupõe que a entidade e as interfaces já existem (skill `camada-domain`).

## O que criar

$ARGUMENTS

---

## Contexto do projeto

- `Base/Service.cs` (namespace `SaraivaTech.Planoteca.Domain.Base`) é a classe base abstrata: `Service<TEntity> : IService<TEntity>`. Todo método CRUD (`Insert`/`Update`/`Delete`, sync e async) já chama, antes de delegar ao `Repository`:
  ```csharp
  if (Context.ValidateEntity)
      Validator.Validate(obj, options => options.ThrowOnFailures().IncludeRuleSets("Insert")); // ou "Update"/"Delete"
  ```
- **Ponto crítico — RuleSets são obrigatórios**: como `IncludeRuleSets("Insert")` só executa regras dentro de um bloco `RuleSet("Insert", () => {...})`, um validator que só usa `RuleFor(...)` solto (fora de `RuleSet`) **não valida nada** quando chamado pelo `Service<T>` — as regras ficam no ruleset "default", que não é incluído. Sempre envolva as regras nos `RuleSet` correspondentes às operações que devem validá-las.

  > A entidade de referência `PersonSampleValidator` não segue essa prática (usa `RuleFor` solto) — é uma inconsistência conhecida do exemplo, não repita esse padrão em validators novos.

- Serviços concretos implementam a interface de domínio e herdam `Service<TEntity>`, setando `Validator` no construtor.
- **Sobre `Result<T>`**: `IService<T>`/`IRepository<T>` são contratos genéricos compartilhados por todas as entidades — não mude as assinaturas deles para `Result<TEntity>`, isso quebraria o `Service<TEntity>` base e todo repositório existente. Nesta camada, regras de negócio adicionais (dentro de `Insert`/`Update`/`Delete` sobrescritos) continuam lançando `FluentValidation.ValidationException` com uma mensagem clara — igual ao `Validator.Validate(...).ThrowOnFailures()` já faz para violação de campo. É consistente com o único exemplo real do boilerplate (`PersonSampleService.Insert` lança `ValidationException` para a regra "menor de idade").
  O `Result<T>` (`Domain.Base.Result`) entra na **fronteira do AppService** (camada `camada-application-core`), que captura essa exceção e a converte em `Result<Dto>.Failure(...)` antes de devolver ao Controller — assim a API expõe o padrão Result/Result<T> pedido pelo CLAUDE.md sem quebrar os contratos genéricos de domínio.

## Passos

### PASSO 1 — Leia a referência

Leia `Services/PersonSampleService.cs` e `Validations/PersonSampleValidator.cs`.

### PASSO 2 — Crie o validator em `Validations/NomeEntidadeValidator.cs`

Agrupe as regras em `RuleSet` nomeados de acordo com as operações do `Service<T>` (`Insert`, `Update`, `Delete`). Regras compartilhadas entre operações podem ser repetidas em mais de um `RuleSet`, ou extraídas para um método privado chamado dentro de cada bloco.

```csharp
using FluentValidation;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Resources;

namespace SaraivaTech.Planoteca.Domain.Core.Validations
{
    public class NomeEntidadeValidator : AbstractValidator<NomeEntidade>
    {
        public NomeEntidadeValidator()
        {
            RuleSet("Insert", () =>
            {
                RuleFor(c => c.Campo)
                    .NotEmpty().WithMessage(ValidationMessages.NomeEntidadeCampoRequired);
            });

            RuleSet("Update", () =>
            {
                RuleFor(c => c.Id)
                    .NotEmpty().WithMessage(ValidationMessages.NomeEntidadeIdRequired);
                RuleFor(c => c.Campo)
                    .NotEmpty().WithMessage(ValidationMessages.NomeEntidadeCampoRequired);
            });

            RuleSet("Delete", () =>
            {
                RuleFor(c => c.Id)
                    .NotEmpty().WithMessage(ValidationMessages.NomeEntidadeIdRequired);
            });
        }
    }
}
```

### PASSO 3 — Crie o serviço concreto em `Services/NomeEntidadeService.cs`

Só sobrescreva `Insert`/`Update`/`Delete` quando houver regra de negócio além da validação de campo (ex.: cálculo, valor default, checagem cruzada).

```csharp
using SaraivaTech.Planoteca.Domain.Base;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Core.Validations;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Domain.Services;

namespace SaraivaTech.Planoteca.Domain.Core
{
    public class NomeEntidadeService : Service<NomeEntidade>, INomeEntidadeService
    {
        public NomeEntidadeService(IUnitOfWork context, INomeEntidadeRepository rep) : base(context, rep)
        {
            Validator = new NomeEntidadeValidator();
        }

        // Exemplo de regra de negócio adicional:
        // public override NomeEntidade Insert(NomeEntidade obj)
        // {
        //     if (Context.ValidateEntity)
        //         Validator.Validate(obj, o => o.ThrowOnFailures().IncludeRuleSets("Insert"));
        //     if (/* condição de negócio inválida */)
        //         throw new FluentValidation.ValidationException("Mensagem clara da regra de negócio.");
        //     return Repository.Insert(obj);
        // }
    }
}
```

### Checklist

- [ ] Validator usa `RuleSet("Insert"/"Update"/"Delete", ...)` — nunca `RuleFor` solto se o `Service<T>` vai chamar `IncludeRuleSets`
- [ ] Mensagens vêm de `ValidationMessages`, nunca strings soltas
- [ ] Serviço concreto seta `Validator` no construtor
- [ ] Regras de negócio adicionais (fora de validação de campo) lançam `FluentValidation.ValidationException` com mensagem clara (não `Exception` genérica) — a conversão para `Result<T>` acontece no AppService, não aqui
- [ ] Nenhuma referência a DTO, HTTP ou EF Core nesta camada

## Próximo passo

Use a skill `camada-application` para criar o DTO, o mapper e a interface do AppService.
