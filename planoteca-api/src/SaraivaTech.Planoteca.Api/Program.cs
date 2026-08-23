using SaraivaTech.Planoteca.Api;
using SaraivaTech.Planoteca.Api.Filters;
using SaraivaTech.Planoteca.Application.Base;
using SaraivaTech.Planoteca.Infra.CrossCutting.IoC;
using SaraivaTech.Planoteca.Infra.CrossCutting.Middleware;
using SaraivaTech.Planoteca.Infra.Data.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Scalar.AspNetCore;
using Dapper;

// O banco é Postgres com nomes em snake_case (UseSnakeCaseNamingConvention, em
// `DependencyInjectionBootStrapper.RegisterDataBase`), e as entidades C# usam
// PascalCase. Sem esta linha o Dapper não liga `data_criacao` a `DataCriacao` e
// devolve a propriedade NULA — sem erro, sem aviso. É global e precisa rodar
// antes da primeira consulta.
DefaultTypeMap.MatchNamesWithUnderscores = true;

var builder = WebApplication.CreateBuilder(args);

// `appsettings.Local.json` — gitignored, com a senha real do banco e as chaves
// do R2. O host do ASP.NET carrega `appsettings.json` e
// `appsettings.{Ambiente}.json` sozinho, mas NÃO este: ele é convenção nossa, e
// precisa ser declarado.
//
// Sem esta linha a API sobe lendo `appsettings.Development.json`, cuja senha é o
// literal `{SUA_SENHA}` — e toda consulta morre com "Failed to connect", que não
// diz nada sobre a causa. O mesmo defeito existia no design-time
// (`DatabaseContextFactory`) e foi corrigido lá também.
//
// Entra DEPOIS dos demais para ter precedência, e antes das variáveis de
// ambiente, que vencem tudo — é como o Render injeta os segredos de produção.
builder.Configuration
    .AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: false)
    .AddEnvironmentVariables();

builder.Services.AddProblemDetails();
builder.Services.AddControllers(options =>
{
    options.Filters.Add<StandardErrorResultFilter>();
    options.Filters.Add(new ProducesAttribute("application/json", "application/xml"));
    options.ReturnHttpNotAcceptable = true;
    options.OutputFormatters.Add(new Microsoft.AspNetCore.Mvc.Formatters.XmlDataContractSerializerOutputFormatter());
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    options.JsonSerializerOptions.WriteIndented = false;
    options.JsonSerializerOptions.AllowTrailingCommas = false;
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    options.JsonSerializerOptions.Converters.Add(new SaraivaTech.Planoteca.Api.Converters.EmptyStringGuidConverter());
    options.JsonSerializerOptions.Converters.Add(new SaraivaTech.Planoteca.Api.Converters.EmptyStringNullableGuidConverter());
    options.JsonSerializerOptions.Converters.Add(new SaraivaTech.Planoteca.Api.Converters.DateTimeConverter());
    options.JsonSerializerOptions.Converters.Add(new SaraivaTech.Planoteca.Api.Converters.NullableDateTimeConverter());
    options.JsonSerializerOptions.Converters.Add(new SaraivaTech.Planoteca.Api.Provider.JsonStringEnumMemberConverter());
});

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var messages = context.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .ToList();

        var error = new Error { status = 400, messages = messages };
        return new BadRequestObjectResult(error);
    };
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.RegisterApiVersioning();
builder.Services.RegisterOpenApi();

builder.Services.RegisterResponseCompression();
builder.Services.RegisterCors(builder.Environment.IsDevelopment(), builder.Configuration);
builder.Services.RegisterAuthentication(builder.Configuration);
builder.Services.RegisterAllClasses(builder.Configuration);

builder.Services.AddMcpServer()
    .WithHttpTransport(options => options.Stateless = true)
    .WithToolsFromAssembly();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// ── O schema, aplicado no arranque ───────────────────────────────────────
//
// O Render não oferece passo de release: não há onde rodar
// `dotnet ef database update` entre o build e o start. Aplicar aqui é o que
// mantém o banco em dia sem um segundo serviço só para isso.
//
// `Migrate` é idempotente — em todo arranque seguinte ele não encontra
// migration pendente e não faz nada. A primeira consulta do Neon depois da
// hibernação demora alguns segundos, e é por isso que este bloco fica antes
// de a aplicação aceitar tráfego.
using (var escopo = app.Services.CreateScope())
{
    var contexto = escopo.ServiceProvider.GetRequiredService<DatabaseContext>();
    await contexto.Database.MigrateAsync();
}

app.UseMiddleware<InterceptorHandlingMiddleware>();
if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseCors("RecoveryPolicy");
app.UseAuthentication();
// ENTRE autenticação e autorização, e não em outro lugar: ele lê o principal
// que a autenticação montou e injeta o claim `papel` que a política
// "Administrador" exige. Antes do `UseAuthentication` não haveria principal;
// depois do `UseAuthorization` a política já teria decidido sem o claim.
app.UseMiddleware<PapelClaimsMiddleware>();
app.UseAuthorization();

app.MapControllers();
app.MapMcp("/mcp");
await app.RunAsync();
