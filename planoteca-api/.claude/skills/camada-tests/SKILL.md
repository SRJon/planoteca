---
name: camada-tests
description: Cria testes de Service, Validator e AppService (xUnit + NSubstitute + AutoFixture/Bogus + FluentAssertions) para uma entidade em tests/SaraivaTech.Planoteca.Test. Use ao cobrir uma entidade nova ou uma regra de negócio nova com testes.
---

# /camada-tests

Cria os testes automatizados de uma entidade em `tests/SaraivaTech.Planoteca.Test`. Pressupõe que a entidade já está implementada em todas as camadas.

## O que testar

$ARGUMENTS

---

## Contexto do projeto

- Stack: **xUnit** (`[Fact]`/`[Theory]`/`[InlineData]`/`[MemberData]`) + **NSubstitute** (mocks) + **AutoFixture** com `AutoNSubstituteCustomization` (para autoconstruir a classe sob teste com os mocks já congelados) + **Bogus** (`Faker<T>`, para gerar dados válidos de teste) + **FluentAssertions** (`.Should()...`).
- Cobertura hoje existe **apenas** para `Domain.Core` (`Service<TEntity>` concreto) e `Validations` (`AbstractValidator<T>`) — não há convenção de teste de AppService, Controller ou Repository ainda no boilerplate. Ao testar essas camadas, você está estabelecendo o padrão, não copiando um exemplo existente; use os templates abaixo.
- **Ponto crítico para testes de Validator**: como a skill `camada-domain-core` recomenda `RuleSet("Insert"/"Update"/"Delete", ...)`, chamar `_validator.TestValidate(entity)` **sem** especificar o ruleset não executa nenhuma regra (rulesets nomeados só rodam quando incluídos explicitamente). Sempre passe `options => options.IncludeRuleSets("Insert")` (ou o ruleset relevante) no `TestValidate`.

## Passos

### PASSO 1 — Leia a referência

Leia `Services/PersonSampleServiceTest.cs` e `Validations/PersonSampleValidationTest.cs`.

### PASSO 2 — Teste do Service (`Services/NomeEntidadeServiceTest.cs`)

```csharp
using System;
using AutoFixture;
using AutoFixture.AutoNSubstitute;
using Bogus;
using FluentAssertions;
using NSubstitute;
using SaraivaTech.Planoteca.Domain.Core;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Services
{
    public class NomeEntidadeServiceTest
    {
        private readonly Faker _faker;
        private readonly NomeEntidade _entidade;
        private readonly IFixture _fixture;
        private readonly INomeEntidadeRepository _repository;
        private NomeEntidadeService _service;

        public NomeEntidadeServiceTest()
        {
            _faker = new Faker();
            _entidade = new Faker<NomeEntidade>()
                .RuleFor(u => u.Campo, (f, u) => f.Lorem.Word());

            _fixture = new Fixture().Customize(new AutoNSubstituteCustomization { ConfigureMembers = true });
            _repository = _fixture.Freeze<INomeEntidadeRepository>();
            _fixture.Freeze<IUnitOfWork>();
        }

        #region Insert

        [Fact]
        public void ValidateInsert_Success()
        {
            _repository.Insert(_entidade).Returns(x =>
            {
                _entidade.Id = _faker.Random.Guid();
                return _entidade;
            });
            _service = _fixture.Create<NomeEntidadeService>();

            var resultado = _service.Invoking(y => y.Insert(_entidade)).Should().NotThrow().Subject;

            resultado.Id.Should().NotBe(Guid.Empty);
        }

        #endregion
    }
}
```

Adapte as regiões (`#region Insert/Update/Delete`) e casos de teste às regras de negócio implementadas em `camada-domain-core`.

### PASSO 3 — Teste do Validator (`Validations/NomeEntidadeValidationTest.cs`)

```csharp
using Bogus;
using FluentValidation.TestHelper;
using SaraivaTech.Planoteca.Domain.Core.Validations;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Resources;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Validations
{
    public class NomeEntidadeValidationTest
    {
        private readonly NomeEntidade _entidade;
        private readonly NomeEntidadeValidator _validator;

        public NomeEntidadeValidationTest()
        {
            _entidade = new Faker<NomeEntidade>()
                .RuleFor(u => u.Campo, (f, u) => f.Lorem.Word());

            _validator = new NomeEntidadeValidator();
        }

        #region Campo

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void ValidateCampo_CampoNullEmpty_Message(string campo)
        {
            _entidade.Campo = campo;
            // sempre especifique o RuleSet — regras nomeadas não rodam por padrão
            var resultado = _validator.TestValidate(_entidade, o => o.IncludeRuleSets("Insert"));
            resultado.ShouldHaveValidationErrorFor(e => e.Campo)
                .WithErrorMessage(ValidationMessages.NomeEntidadeCampoRequired);
        }

        [Fact]
        public void ValidateCampo_Campo_Success()
        {
            var resultado = _validator.TestValidate(_entidade, o => o.IncludeRuleSets("Insert"));
            resultado.ShouldNotHaveValidationErrorFor(e => e.Campo);
        }

        #endregion
    }
}
```

### PASSO 4 — Teste do AppService (`Services/NomeEntidadeAppServiceTest.cs`)

Como não há convenção existente, siga este template: mocke `INomeEntidadeService`, `INomeEntidadeRepository`, `IUnitOfWork` e o mapper concreto (mapper Mapperly não precisa de mock — é rápido o bastante para usar a instância real), e assertivas sobre `Result<T>.IsSuccess`/`Result<T>.Error`.

```csharp
using System;
using AutoFixture;
using AutoFixture.AutoNSubstitute;
using FluentAssertions;
using FluentValidation;
using NSubstitute;
using SaraivaTech.Planoteca.Application.Core.Services;
using SaraivaTech.Planoteca.Application.Dto;
using SaraivaTech.Planoteca.Application.Mappers;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Domain.Services;
using Serilog;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Services
{
    public class NomeEntidadeAppServiceTest
    {
        private readonly IFixture _fixture;
        private readonly INomeEntidadeService _service;
        private readonly NomeEntidadeAppService _appService;

        public NomeEntidadeAppServiceTest()
        {
            _fixture = new Fixture().Customize(new AutoNSubstituteCustomization { ConfigureMembers = true });
            _fixture.Freeze<IUnitOfWork>();
            _fixture.Freeze<INomeEntidadeRepository>();
            _fixture.Inject(new NomeEntidadeMapper());
            _fixture.Inject(Substitute.For<ILogger>().ForContext<NomeEntidadeAppService>());
            _service = _fixture.Freeze<INomeEntidadeService>();

            _appService = _fixture.Create<NomeEntidadeAppService>();
        }

        [Fact]
        public void Insert_RegraDeNegocioViolada_RetornaFailure()
        {
            _service.Insert(Arg.Any<NomeEntidade>()).Throws(new ValidationException("mensagem de negócio"));

            var resultado = _appService.Insert(new NomeEntidadeDto(Guid.Empty, "Valor"));

            resultado.IsSuccess.Should().BeFalse();
            resultado.Error!.Message.Should().Be("mensagem de negócio");
        }

        [Fact]
        public void Insert_Valido_RetornaSuccess()
        {
            _service.Insert(Arg.Any<NomeEntidade>()).Returns(x => x.Arg<NomeEntidade>());

            var resultado = _appService.Insert(new NomeEntidadeDto(Guid.Empty, "Valor"));

            resultado.IsSuccess.Should().BeTrue();
        }
    }
}
```

### Sobre testes de Controller, Repository e Gateway

Não existe convenção estabelecida para essas camadas no boilerplate — não invente uma automaticamente. O `SaraivaTech.Planoteca.Test.csproj` restringe a cobertura a Domain/Domain.Core/Application.Core (`<Include>`) e **nem referencia Infra.Data ou Api** — Api/Infra são tratados como plumbing de propósito.

Se o usuário pedir explicitamente testes de Controller (ex. `WebApplicationFactory`), de Repository (integração contra banco real/Testcontainers) ou de Gateway (`HttpMessageHandler` stub), pergunte qual abordagem prefere antes de adicionar `ProjectReference`, mexer no `<Include>` de cobertura ou introduzir uma dependência de teste nova.

`IXxxGateway`, por outro lado, é interface do Domain — nos testes de AppService mocke normalmente com NSubstitute, sem nada de HTTP envolvido.

### Checklist

- [ ] Teste de Service cobre `Insert`/`Update`/`Delete` (casos de sucesso e de regra de negócio violada)
- [ ] Teste de Validator sempre passa `IncludeRuleSets(...)` explicitamente
- [ ] Teste de AppService cobre `Result.IsSuccess`/`Result.Error` para os casos de falha esperada
- [ ] Nenhum teste depende de banco real (tudo mockado via NSubstitute/AutoFixture)
