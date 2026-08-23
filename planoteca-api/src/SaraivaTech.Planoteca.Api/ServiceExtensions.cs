using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

using Polly;
using Polly.CircuitBreaker;
using Polly.Extensions.Http;
using SaraivaTech.Planoteca.Api.Provider;
using SaraivaTech.Planoteca.Domain.Enumerable;
using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using OpenTelemetry.Trace;
using OpenTelemetry.Metrics;
using Microsoft.AspNetCore.OpenApi;
using Asp.Versioning;

namespace SaraivaTech.Planoteca.Api
{
    public static class ServiceExtensions
    {
        public static void RegisterOpenTelemetry(this IServiceCollection services)
        {
            services.AddOpenTelemetry()
                .WithTracing(tracing =>
                {
                    tracing
                        .AddAspNetCoreInstrumentation()
                        .AddHttpClientInstrumentation()
                        .AddConsoleExporter();
                })
                .WithMetrics(metrics =>
                {
                    metrics
                        .AddHttpClientInstrumentation()
                        .AddConsoleExporter();
                });
        }
        public static void RegisterOpenApi(this IServiceCollection services)
        {
            services.AddOpenApi("v1", options =>
            {
                options.AddDocumentTransformer((document, context, cancellationToken) =>
                {
                    // O nome sai do assembly em vez de literal. O New-Project.ps1
                    // renomeia namespaces e arquivos, mas nao alcancaria "SaraivaTech
                    // Default" escrito com espaco: todo projeto gerado publicaria a
                    // documentacao com o nome do boilerplate. Derivar do assembly
                    // mantem o titulo certo sem depender do script de geracao.
                    // O assembly ja termina em ".Api" (SaraivaTech.Planoteca.Api); o
                    // sufixo sai para o titulo nao ficar "...Api API".
                    var nomeProjeto = typeof(ServiceExtensions).Assembly.GetName().Name ?? "API";
                    if (nomeProjeto.EndsWith(".Api", StringComparison.Ordinal))
                    {
                        nomeProjeto = nomeProjeto[..^4];
                    }

                    document.Info = new()
                    {
                        Title = $"{nomeProjeto} API",
                        Version = "v1",
                        Description = $"API do projeto {nomeProjeto}"
                    };

                    document.Components ??= new OpenApiComponents();
                    if (document.Components.SecuritySchemes == null)
                    {
                        document.Components.SecuritySchemes = new Dictionary<string, IOpenApiSecurityScheme>();
                    }
                    
                    var securityScheme = new OpenApiSecurityScheme
                    {
                        Type = SecuritySchemeType.Http,
                        Scheme = "bearer",
                        BearerFormat = "JWT",
                        In = ParameterLocation.Header,
                        Description = "Insira o token JWT aqui"
                    };

                    document.Components.SecuritySchemes["Bearer"] = securityScheme;

                    return Task.CompletedTask;
                });
            });
        }

        /// <summary>
        /// Validação do token do Firebase Authentication.
        ///
        /// ── Por que estes valores, e não outros ─────────────────────────
        ///
        /// O Firebase emite JWT assinado, e os endereços de validação são
        /// derivados do ID do projeto — não há segredo a guardar no
        /// back-end para VALIDAR (só para administrar, o que não fazemos):
        ///
        /// - `Authority`: `https://securetoken.google.com/{projectId}`
        /// - `Audience`: o próprio `{projectId}`
        /// - `Issuer`: igual à Authority
        ///
        /// O `Authority` é o que faz o ASP.NET buscar as chaves públicas do
        /// Google sozinho e mantê-las atualizadas — elas rodam periodicamente,
        /// e fixar uma chave quebraria a autenticação sem aviso.
        ///
        /// Sem `Firebase:ProjectId` configurado, a autenticação NÃO é
        /// registrada: a API sobe e as rotas públicas continuam funcionando.
        /// É o mesmo princípio do armazenamento — quem mexe na Biblioteca não
        /// deveria precisar de um projeto no Firebase para rodar o projeto.
        /// </summary>
        public static void RegisterAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            var projectId = configuration["Firebase:ProjectId"];

            // A POLÍTICA é registrada sempre, mesmo sem Firebase configurado.
            // Sem isto, uma rota com `[Authorize(Policy = "Administrador")]`
            // responde 500 — "policy not found" —, e um 500 numa rota
            // protegida parece defeito de servidor quando é só configuração
            // faltando.
            services.AddAuthorization(options =>
            {
                // O papel vem do NOSSO banco, não do token. O
                // `PapelClaimsMiddleware` injeta o claim depois de resolver a
                // pessoa; ver o cabeçalho dele.
                options.AddPolicy("Administrador", policy =>
                    policy.RequireClaim("papel", PapelPessoa.Administrador));
            });

            if (string.IsNullOrWhiteSpace(projectId))
            {
                // Sem projeto configurado não há chave para validar token
                // nenhum. Registra-se mesmo assim um esquema JWT SEM
                // authority: ele rejeita qualquer token e responde 401, que é
                // a resposta honesta — "você não está autenticado" —, em vez
                // de um 500 que sugere defeito de servidor.
                //
                // As rotas públicas seguem de pé: quem mexe na Biblioteca não
                // precisa de um projeto no Firebase para rodar o projeto.
                services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidateLifetime = false,
                        // Sem chave de assinatura conhecida, toda validação
                        // falha — que é o comportamento desejado aqui.
                        ValidateIssuerSigningKey = true,
                        RequireSignedTokens = true,
                    };
                });
                return;
            }

            var authority = $"https://securetoken.google.com/{projectId}";

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.Authority = authority;
                options.Audience = projectId;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = authority,
                    ValidateAudience = true,
                    ValidAudience = projectId,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    // O relógio do servidor e o do Google podem divergir
                    // alguns segundos. O padrão do .NET é 5 minutos, o que é
                    // generoso demais para um token de 1 hora.
                    ClockSkew = TimeSpan.FromSeconds(30),
                };
            });

        }

        public static void RegisterResponseCompression(this IServiceCollection services)
        {
            services.AddResponseCompression(options =>
            {
                options.Providers.Add<BrotlinConfigureProvider>();
                options.Providers.Add<GzipCompressionProvider>();

                options.EnableForHttps = true;
            });
        }

        public static void RegisterApiVersioning(this IServiceCollection services)
        {
            services.AddApiVersioning(options =>
            {
                options.DefaultApiVersion = new ApiVersion(1, 0);
                options.ReportApiVersions = true;
                options.AssumeDefaultVersionWhenUnspecified = true;
            })
            .AddApiExplorer(options =>
            {
                options.GroupNameFormat = "'v'VVV";
                options.SubstituteApiVersionInUrl = true;
            });
        }

        /// <summary>
        /// O CORS da API.
        ///
        /// Em desenvolvimento, qualquer origem: o front roda em porta variável
        /// e o e2e sobe em outra.
        ///
        /// Em produção, a lista vem de `Cors:OrigensPermitidas` — no Render,
        /// a variável `Cors__OrigensPermitidas__0`. O domínio do front NÃO
        /// pode ficar no código: ele nasce no primeiro deploy do Vercel, e
        /// muda quando o domínio próprio entrar.
        ///
        /// Lista vazia em produção significa nenhuma origem permitida. É
        /// restritivo de propósito: um front que não carrega denuncia a
        /// variável esquecida, enquanto um curinga a esconderia.
        /// </summary>
        public static void RegisterCors(
            this IServiceCollection services,
            bool isDevelopment,
            IConfiguration configuration)
        {
            var origens = configuration
                .GetSection("Cors:OrigensPermitidas")
                .Get<string[]>() ?? [];

            services.AddCors(options =>
            {
                options.AddPolicy("RecoveryPolicy", builder =>
                {
                    if (isDevelopment)
                    {
                        builder.AllowAnyOrigin(); //NOSONAR
                    }
                    else
                    {
                        // `AllowCredentials` está AUSENTE de propósito: o token
                        // do Firebase viaja no cabeçalho `Authorization`, não
                        // em cookie. Pedir credencial aqui só ampliaria a
                        // superfície sem que nada a use.
                        builder.WithOrigins(origens);
                    }

                    builder
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .WithExposedHeaders("X-Total-Count");
                });
            });
        }




       
    }
}
