---
name: camada-domain
description: Cria entidades, interfaces de repositório/serviço, enums e mensagens de validação no projeto Domain (SaraivaTech.Planoteca.Domain). Use ao adicionar uma nova entidade de negócio ou um novo contrato de repositório/serviço.
---

# /camada-domain

Cria os artefatos de domínio de uma nova entidade em `src/SaraivaTech.Planoteca.Domain`. Esta é sempre a **primeira** camada a implementar — as demais dependem dela.

## O que criar

$ARGUMENTS

---

## Contexto do projeto

- Entidades em `Entities/`, sempre herdando `Base/Entity.cs` (classe abstrata que já gera `Guid Id` no construtor — **nunca** declare `Id` de novo).
- Interfaces de repositório em `Repositories/Interfaces/`, sempre estendendo `IRepository<TEntity>` (`Base/Interfaces/IRepository.cs`).
- Interfaces de serviço de domínio em `Services/`, sempre estendendo `IService<TEntity>` (`Base/Interfaces/IService.cs`).
- Contratos de integração HTTP em `Gateways/Interfaces/` (+ `Gateways/Requests/` e `Gateways/Responses/`) — o Domain declara a interface, a Infra.Data implementa. Não é assunto desta skill: use `camada-gateways`.
- Enums em `Enumerable/` (não "Enums") — use `[EnumMember(Value = "...")]` em cada membro.
- Mensagens de validação em `Resources/ValidationMessages.cs` (propriedades estáticas que chamam `GetString(...)`) + as chaves reais em `Resources/Validations.resx` (padrão pt-BR) e `Validations.en.resx` (inglês).
- `Base/Result.cs` já existe (`Result`, `Result<T>`, `ResultError`) — é o padrão oficial do projeto (ver CLAUDE.md) para retornos de operação que podem falhar. **Não lance exceções para erros de regra de negócio esperados** (ex.: "menor de idade", "registro duplicado") — devolva `Result<T>.Failure(...)`. Reserve exceptions para falhas realmente excepcionais (infraestrutura, bugs).

  > Nota: a entidade de referência `PersonSample` foi escrita antes desse padrão ser formalizado e lança `ValidationException` diretamente em vez de usar `Result<T>`. Não copie esse detalhe — para entidades novas, siga o `Result<T>`.

## Passos

### PASSO 1 — Leia a entidade de referência

Leia `Entities/PersonSample.cs`, `Repositories/Interfaces/IPersonSampleRepository.cs` e `Services/IPersonSampleService.cs` para o formato exato.

### PASSO 2 — Crie a entidade em `Entities/NomeEntidade.cs`

```csharp
using SaraivaTech.Planoteca.Domain.Base;

namespace SaraivaTech.Planoteca.Domain.Entities
{
    public class NomeEntidade : Entity
    {
        public string Campo { get; set; }
        // demais propriedades — POCO simples, sem atributos de validação ou de EF aqui
    }
}
```

### PASSO 3 — Crie enums (se necessário) em `Enumerable/NomeEnum.cs`

```csharp
using System.Runtime.Serialization;

namespace SaraivaTech.Planoteca.Domain.Enumerable
{
    public enum NomeEnum
    {
        [EnumMember(Value = "VALOR_A")]
        ValorA = 1,

        [EnumMember(Value = "VALOR_B")]
        ValorB = 2
    }
}
```

### PASSO 4 — Crie a interface de repositório em `Repositories/Interfaces/INomeEntidadeRepository.cs`

Só adicione métodos além do CRUD herdado se a entidade precisar de consultas específicas (ex.: paginação com filtro custom via Dapper — ver skill `camada-infra-data`).

```csharp
using System.Collections.Generic;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Domain.Repositories.Interfaces
{
    public interface INomeEntidadeRepository : IRepository<NomeEntidade>
    {
        // métodos específicos, se houver — ex:
        // IEnumerable<NomeEntidade> Get(bool? active, string sort, int page, int perPage, out int total);
        // Task<(IEnumerable<NomeEntidade> Items, int Total)> GetAsync(bool? active, string sort, int page, int perPage);
    }
}
```

### PASSO 5 — Crie a interface de serviço de domínio em `Services/INomeEntidadeService.cs`

Geralmente é um marker interface vazio — o CRUD já vem de `IService<T>`.

```csharp
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Domain.Services
{
    public interface INomeEntidadeService : IService<NomeEntidade>
    {
    }
}
```

### PASSO 6 — Adicione as mensagens de validação

1. Em `Resources/ValidationMessages.cs`, adicione uma propriedade por regra:
```csharp
public static string NomeEntidadeCampoRequired => GetString("NomeEntidadeCampoRequired");
```
2. Em `Resources/Validations.resx` (e opcionalmente `.en.resx`), adicione a entrada correspondente:
```xml
<data name="NomeEntidadeCampoRequired" xml:space="preserve">
  <value>Por favor, informe o campo.</value>
</data>
```

### Checklist

- [ ] Entidade herda `Entity`, sem declarar `Id`
- [ ] Interface de repositório estende `IRepository<T>`
- [ ] Interface de serviço estende `IService<T>`
- [ ] Enums (se houver) em `Enumerable/` com `[EnumMember]`
- [ ] Mensagens de validação adicionadas em `ValidationMessages.cs` **e** nos `.resx`
- [ ] Nenhuma lógica de persistência, mapeamento ou HTTP nesta camada

## Próximo passo

Depois de criar o domínio, use a skill `camada-domain-core` para implementar o `Service<TEntity>` concreto e o `AbstractValidator<T>`.
