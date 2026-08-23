---
name: camada-infra-crosscutting
description: Registra repositório, serviço de domínio, AppService e mapper de uma entidade no DependencyInjectionBootStrapper (SaraivaTech.Planoteca.Infra.CrossCutting). Use sempre que uma interface nova precisar ser resolvida via DI.
---

# /camada-infra-crosscutting

Registra os componentes de uma entidade no container de DI, em `src/SaraivaTech.Planoteca.Infra.CrossCutting/IoC/DependencyInjectionBootStrapper.cs`. É um passo puramente mecânico — sem essas 4 linhas a aplicação falha ao iniciar (dependência não resolvida) mesmo com todo o resto implementado corretamente.

## O que registrar

$ARGUMENTS

---

## Contexto do projeto

- Arquivo único e estático: `DependencyInjectionBootStrapper`, com um método por tipo de registro, todos chamados a partir de `RegisterAllClasses`.
- **Todo registro é `AddScoped`** — não use `AddSingleton`/`AddTransient` para repositórios/serviços/AppServices/mappers (o `UnitOfWork`/`DbContext` são scoped por requisição).
- Cada entidade nova exige exatamente 4 linhas, uma em cada método:

```csharp
public static void RegisterRepositories(IServiceCollection services)
{
    services.AddScoped<IPersonSampleRepository, PersonSampleRepository>();
    services.AddScoped<INomeEntidadeRepository, NomeEntidadeRepository>(); // nova linha
}

public static void RegisterServices(IServiceCollection services)
{
    services.AddScoped<IPersonSampleService, PersonSampleService>();
    services.AddScoped<INomeEntidadeService, NomeEntidadeService>(); // nova linha
    // ... resto do método sem alteração (HttpContextAccessor, middleware)
}

public static void RegisterAppServices(IServiceCollection services)
{
    services.AddScoped<IPersonSampleAppService, PersonSampleAppService>();
    services.AddScoped<INomeEntidadeAppService, NomeEntidadeAppService>(); // nova linha
}

public static void RegisterMappers(IServiceCollection services)
{
    services.AddScoped<PersonSampleMapper>();
    services.AddScoped<NomeEntidadeMapper>(); // nova linha
}
```

- **Gateways HTTP não seguem esse padrão de 4 linhas.** Eles vão em `RegisterGateways(services, configuration)`, com `AddHttpClient<I, Impl>` (typed client) em vez de `AddScoped` — o typed client já registra a interface e injeta o `HttpClient` gerenciado, então **não** adicione um `AddScoped` junto:

```csharp
public static void RegisterGateways(IServiceCollection services, IConfiguration configuration)
{
    services.AddHttpClient<ISankhyaGateway, SankhyaGateway>(client =>
    {
        client.BaseAddress = new Uri(configuration["Gateways:Sankhya:BaseUrl"]);
    });
}
```

  Ver skill `camada-gateways` para o gateway completo.

- Adicione os `using` necessários no topo do arquivo se os namespaces ainda não estiverem importados (`SaraivaTech.Planoteca.Domain.Repositories.Interfaces`, `SaraivaTech.Planoteca.Infra.Data.Repositories`, `SaraivaTech.Planoteca.Domain.Services`, `SaraivaTech.Planoteca.Domain.Core`, `SaraivaTech.Planoteca.Application.Services`, `SaraivaTech.Planoteca.Application.Core.Services`, `SaraivaTech.Planoteca.Application.Mappers`).
- Não crie um bootstrapper novo nem duplique `RegisterAllClasses` — sempre edite o arquivo existente.

## Checklist

- [ ] Linha adicionada em `RegisterRepositories`
- [ ] Linha adicionada em `RegisterServices`
- [ ] Linha adicionada em `RegisterAppServices`
- [ ] Linha adicionada em `RegisterMappers`
- [ ] Se houver gateway HTTP novo: `AddHttpClient<I, Impl>` em `RegisterGateways` (sem `AddScoped` duplicado)
- [ ] Projeto compila (`dotnet build`) — erro de DI só aparece em runtime, então rode a API ou os testes de integração para confirmar

## Próximo passo

Use a skill `camada-api` para criar o Controller (e opcionalmente o McpTools) que expõe a entidade via HTTP.
