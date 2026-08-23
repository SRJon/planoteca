---
name: camada-gateways
description: Cria um Gateway HTTP (integração com API externa) — interface + contratos de request/response no Domain e implementação concreta em Infra.Data/Gateways, com HttpClient tipado registrado no DI. Use ao integrar o projeto com qualquer serviço HTTP de terceiros (Sankhya, ERP, gateway de pagamento, etc.).
---

# /camada-gateways

Cria a integração com uma API externa seguindo o padrão de **Gateway** deste boilerplate. Toda requisição HTTP de saída do projeto passa por um Gateway — nunca instancie `HttpClient` direto num AppService, Service ou Controller.

## Gateway a criar

$ARGUMENTS

---

## Contexto do projeto

O padrão espelha a organização de repositórios: **contrato no Domain, implementação na Infra.Data**.

| Artefato | Local | Namespace |
|---|---|---|
| Interface | `src/SaraivaTech.Planoteca.Domain/Gateways/Interfaces/IXxxGateway.cs` | `SaraivaTech.Planoteca.Domain.Gateways.Interfaces` |
| Request | `src/SaraivaTech.Planoteca.Domain/Gateways/Requests/XxxYyyRequest.cs` | `SaraivaTech.Planoteca.Domain.Gateways.Requests` |
| Response | `src/SaraivaTech.Planoteca.Domain/Gateways/Responses/XxxYyyResponse.cs` | `SaraivaTech.Planoteca.Domain.Gateways.Responses` |
| Implementação | `src/SaraivaTech.Planoteca.Infra.Data/Gateways/XxxGateway.cs` | `SaraivaTech.Planoteca.Infra.Data.Gateways` |

Regras:

- **Um arquivo por request/response**, nomeado `{Gateway}{Operação}Request` / `{Gateway}{Operação}Response` (ex.: `SankhyaLoginRequest`, `SankhyaLoginResponse`). São POCOs de transporte — sem lógica, sem herdar `Entity`.
- **Nunca vaze o contrato externo para dentro do domínio.** Requests/Responses são a fronteira; quem consome o gateway (AppService) traduz para Entity/DTO.
- O gateway recebe **`HttpClient` no construtor** (typed client). Não injete `IHttpClientFactory`, não use `new HttpClient()` — o typed client já resolve socket exhaustion e permite plugar Polly.
- **`BaseAddress` e credenciais vêm de configuração** (`appsettings.json` → seção `Gateways:{Nome}`), nunca hardcoded. Segredos vão em `user-secrets`/variável de ambiente.
- Métodos são **sempre `async`** e recebem `CancellationToken cancellationToken = default` como último parâmetro.
- Serialização via `System.Net.Http.Json` (`PostAsJsonAsync`/`ReadFromJsonAsync`) — não traga Newtonsoft.
- O registro no DI fica em `DependencyInjectionBootStrapper.RegisterGateways` (ver skill `camada-infra-crosscutting`).

## Passos

### PASSO 1 — Leia a referência

Leia o gateway de exemplo já implementado:
- `src/SaraivaTech.Planoteca.Domain/Gateways/Interfaces/ISankhyaGateway.cs`
- `src/SaraivaTech.Planoteca.Domain/Gateways/Requests/SankhyaLoginRequest.cs`
- `src/SaraivaTech.Planoteca.Domain/Gateways/Responses/SankhyaLoginResponse.cs`
- `src/SaraivaTech.Planoteca.Infra.Data/Gateways/SankhyaGateway.cs`

### PASSO 2 — Contratos no Domain

`Gateways/Requests/XxxOperacaoRequest.cs`:

```csharp
namespace SaraivaTech.Planoteca.Domain.Gateways.Requests
{
    public class XxxOperacaoRequest
    {
        public string Campo { get; set; }
    }
}
```

`Gateways/Responses/XxxOperacaoResponse.cs`:

```csharp
namespace SaraivaTech.Planoteca.Domain.Gateways.Responses
{
    public class XxxOperacaoResponse
    {
        public string Retorno { get; set; }
    }
}
```

### PASSO 3 — Interface no Domain

`Gateways/Interfaces/IXxxGateway.cs`:

```csharp
using System.Threading;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Domain.Gateways.Requests;
using SaraivaTech.Planoteca.Domain.Gateways.Responses;

namespace SaraivaTech.Planoteca.Domain.Gateways.Interfaces
{
    public interface IXxxGateway
    {
        Task<XxxOperacaoResponse> OperacaoAsync(XxxOperacaoRequest request, CancellationToken cancellationToken = default);
    }
}
```

### PASSO 4 — Implementação em Infra.Data

`Gateways/XxxGateway.cs`:

```csharp
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using SaraivaTech.Planoteca.Domain.Gateways.Interfaces;
using SaraivaTech.Planoteca.Domain.Gateways.Requests;
using SaraivaTech.Planoteca.Domain.Gateways.Responses;

namespace SaraivaTech.Planoteca.Infra.Data.Gateways
{
    public class XxxGateway : IXxxGateway
    {
        private readonly HttpClient _httpClient;

        public XxxGateway(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<XxxOperacaoResponse> OperacaoAsync(XxxOperacaoRequest request, CancellationToken cancellationToken = default)
        {
            var response = await _httpClient.PostAsJsonAsync("caminho/relativo", request, cancellationToken);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadFromJsonAsync<XxxOperacaoResponse>(cancellationToken: cancellationToken);
        }
    }
}
```

> O caminho passado ao `HttpClient` é **relativo** — a base vem do `BaseAddress` configurado no DI. Atenção à regra do .NET: `BaseAddress` deve terminar com `/` e o caminho relativo **não** deve começar com `/`, senão a base é descartada.

### PASSO 5 — Configuração

Em `src/SaraivaTech.Planoteca.Api/appsettings.json`, adicione a seção (com placeholder — a URL real vai em `appsettings.Local.json`/`user-secrets`/variável de ambiente):

```json
"Gateways": {
  "Xxx": {
    "BaseUrl": "https://xxx.example.com/"
  }
}
```

> Use uma URL **sintaticamente válida** como placeholder (`xxx.example.com`), não `https://<host>/` no estilo dos outros placeholders do arquivo. O lambda do `AddHttpClient` é lazy: um `<` no host só estoura (`UriFormatException`) quando alguém injeta o gateway, virando um erro confuso longe da causa.

### PASSO 6 — Registro no DI

Em `DependencyInjectionBootStrapper.RegisterGateways`, adicione uma linha:

```csharp
services.AddHttpClient<IXxxGateway, XxxGateway>(client =>
{
    client.BaseAddress = new Uri(configuration["Gateways:Xxx:BaseUrl"]);
});
```

`AddHttpClient<TInterface, TImplementation>` já registra a interface como transient e injeta o `HttpClient` gerenciado — **não** adicione um `AddScoped<IXxxGateway, XxxGateway>` junto.

Precisa de resiliência? O projeto já tem `Polly` e `Microsoft.Extensions.Http.Polly` no Infra.CrossCutting — encadeie no mesmo registro:

```csharp
services.AddHttpClient<IXxxGateway, XxxGateway>(...)
    .AddPolicyHandler(HttpPolicyExtensions.HandleTransientHttpError()
        .WaitAndRetryAsync(3, retry => TimeSpan.FromSeconds(Math.Pow(2, retry))));
```

### PASSO 7 — Consumo

Injete `IXxxGateway` no AppService (Application.Core), nunca no Controller nem no Domain Service. O AppService traduz a resposta externa para `Result<T>`:

```csharp
var response = await _xxxGateway.OperacaoAsync(new XxxOperacaoRequest { Campo = dto.Campo }, cancellationToken);
if (response is null)
    return Result<MeuDto>.Failure("Serviço externo indisponível");
```

## Sobre testes de Gateway

O `SaraivaTech.Planoteca.Test.csproj` **exclui Infra.Data da cobertura** de propósito (`<Include>` = Domain, Domain.Core, Application.Core — Api/Infra são plumbing) e nem referencia o projeto. Não adicione a referência por conta própria.

Se o usuário pedir teste de gateway explicitamente, a abordagem é um `HttpMessageHandler` stub passado ao `HttpClient` do construtor (sem rede real) — mas isso exige adicionar `ProjectReference` para `SaraivaTech.Planoteca.Infra.Data` no projeto de teste e ajustar o `<Include>`. Confirme com o usuário antes.

Nos testes de AppService, `IXxxGateway` é mockado normalmente com NSubstitute — é uma interface do Domain, sem nenhuma dependência de HTTP.

## Checklist

- [ ] Interface em `Domain/Gateways/Interfaces/`, requests em `Requests/`, responses em `Responses/`
- [ ] Implementação em `Infra.Data/Gateways/`, recebendo `HttpClient` no construtor
- [ ] Nenhum `new HttpClient()` em lugar nenhum
- [ ] `BaseUrl` em `appsettings.json` (seção `Gateways:{Nome}`), segredos fora do repositório
- [ ] `BaseAddress` termina com `/` e o caminho relativo não começa com `/`
- [ ] Registro via `AddHttpClient<I, Impl>` em `RegisterGateways` (sem `AddScoped` duplicado)
- [ ] Todos os métodos `async` com `CancellationToken`
- [ ] `dotnet build` sem erros
