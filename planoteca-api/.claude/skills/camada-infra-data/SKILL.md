---
name: camada-infra-data
description: Cria o mapeamento EF Core (IEntityTypeConfiguration), o repositório concreto e a migration de uma entidade no projeto Infra.Data (SaraivaTech.Planoteca.Infra.Data). Use ao persistir uma nova entidade no banco.
---

# /camada-infra-data

Implementa a persistência de uma entidade em `src/SaraivaTech.Planoteca.Infra.Data`. Pressupõe que a entidade e a interface de repositório já existem (skill `camada-domain`).

## O que criar

$ARGUMENTS

---

## Contexto do projeto

- Mapeamento fluent API em `Mappings/NomeEntidadeMap.cs`, implementando `IEntityTypeConfiguration<TEntity>`. É descoberto automaticamente por `DatabaseContext.OnModelCreating` via `modelBuilder.ApplyConfigurationsFromAssembly(...)` — **não precisa registrar manualmente em nenhum lugar**.
- Convenção de nome de tabela: nome da entidade no plural (ex. `PersonSample` → tabela `PersonSamples`).
- Repositório concreto em `Repositories/NomeEntidadeRepository.cs`, herdando `Base/Repository.cs` (`Repository<TEntity> : IRepository<TEntity>`). A base já implementa todo o CRUD via EF Core (`Context.Set<TEntity>()`) — só implemente na classe concreta os métodos extras declarados na interface de domínio (`INomeEntidadeRepository`).
- `Repository<T>` expõe `protected DatabaseContext Context` — **use sempre `Context`**, nunca `Uow.Context`, dentro de repositórios concretos.
- `Repository<T>` **não chama `SaveChanges()`** — ele só marca a mudança no `DbContext` (`Add`/`Update`/`Remove`). A persistência de fato ocorre em `UoW.Commit()`.
- Integrações HTTP com APIs externas **também moram neste projeto**, em `Gateways/` (implementam interfaces de `Domain.Gateways.Interfaces`). Não é assunto desta skill — use `camada-gateways`.
- Para consultas paginadas/filtradas customizadas, use Dapper via a propriedade `Connection` (`IDbConnection`) herdada da base, com o truque `COUNT(1) OVER ()` para trazer o total de registros na mesma query (evita um round-trip extra de `COUNT(*)`).

## Passos

### PASSO 1 — Leia a referência

Leia `Mappings/PersonSampleMap.cs` e `Repositories/PersonSampleRepository.cs`.

### PASSO 2 — Crie o mapeamento em `Mappings/NomeEntidadeMap.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaraivaTech.Planoteca.Domain.Entities;

namespace SaraivaTech.Planoteca.Infra.Data.Mappings
{
    public class NomeEntidadeMap : IEntityTypeConfiguration<NomeEntidade>
    {
        public void Configure(EntityTypeBuilder<NomeEntidade> builder)
        {
            builder.ToTable("NomeEntidades");
            builder.HasKey(p => p.Id);

            builder.Property(p => p.Campo).IsRequired().HasColumnType("varchar(50)").HasMaxLength(50);
        }
    }
}
```

### PASSO 3 — Crie o repositório em `Repositories/NomeEntidadeRepository.cs`

Se a interface de domínio não declarou métodos extras, o corpo fica vazio (todo CRUD já vem de `Repository<T>`):

```csharp
using SaraivaTech.Planoteca.Domain.Base.Interfaces;
using SaraivaTech.Planoteca.Domain.Entities;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Infra.Data.Base;

namespace SaraivaTech.Planoteca.Infra.Data.Repositories
{
    public class NomeEntidadeRepository : Repository<NomeEntidade>, INomeEntidadeRepository
    {
        public NomeEntidadeRepository(IUnitOfWork context) : base(context)
        {
        }
    }
}
```

Se a interface declarou paginação customizada, implemente com Dapper, seguindo o padrão de `PersonSampleRepository.Get`/`GetAsync` (janela `COUNT(1) OVER ()`, `OFFSET`/`FETCH NEXT`, `sort` já formatado pelo `FilterDto`).

### PASSO 4 — Gere a migration

Rode a partir da raiz da solução:

```bash
dotnet ef migrations add AddNomeEntidade --project src/SaraivaTech.Planoteca.Infra.Data --startup-project src/SaraivaTech.Planoteca.Api
dotnet ef database update --project src/SaraivaTech.Planoteca.Infra.Data --startup-project src/SaraivaTech.Planoteca.Api
```

### Checklist

- [ ] `NomeEntidadeMap` implementa `IEntityTypeConfiguration<NomeEntidade>` (descoberto automaticamente, sem registro manual)
- [ ] Repositório usa `Context` (não `Uow.Context`) e herda `Repository<T>`
- [ ] Nenhuma chamada a `SaveChanges` no repositório
- [ ] Migration gerada e aplicada

## Próximo passo

Use a skill `camada-infra-crosscutting` para registrar repositório/serviço/mapper/AppService no `DependencyInjectionBootStrapper`.
