using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Http;

using SaraivaTech.Planoteca.Infra.Data.Context;

using SaraivaTech.Planoteca.Infra.Data.UoW;
using SaraivaTech.Planoteca.Domain.Repositories.Interfaces;
using SaraivaTech.Planoteca.Infra.Data.Repositories;
using SaraivaTech.Planoteca.Infra.CrossCutting.Armazenamento;
using SaraivaTech.Planoteca.Application.Services;
using SaraivaTech.Planoteca.Application.Core.Services;
using SaraivaTech.Planoteca.Application.Mappers;
using SaraivaTech.Planoteca.Domain.Services;
using Microsoft.Extensions.Options;
using SaraivaTech.Planoteca.Domain.Base.Interfaces;

using Npgsql;
using Serilog;
using SaraivaTech.Planoteca.Infra.CrossCutting.Middleware;
using System;
using System.Linq;

namespace SaraivaTech.Planoteca.Infra.CrossCutting.IoC
{
    public static class DependencyInjectionBootStrapper
    {


        public static void RegisterAllClasses(this IServiceCollection services, IConfiguration configuration)
        {


            RegisterDataBase(services, configuration);
            RegisterLog(services, configuration);

            RegisterRepositories(services);

            RegisterServices(services);
            RegisterAppServices(services);
            RegisterMappers(services);

            RegisterAppicationCache(services);
            RegisterUnitOfWork(services);
            RegisterArmazenamento(services, configuration);


        }


        public static void RegisterDataBase(IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            services.AddScoped<IDbConnection, NpgsqlConnection>(_ =>
                new NpgsqlConnection(connectionString));

            // ATENÇÃO (manter em sincronia): esta wiring — UseNpgsql +
            // UseSnakeCaseNamingConvention — é DUPLICADA no design-time, em
            // `Infra.Data/Context/DatabaseContextFactory.cs`. Mudou provider ou
            // convenção aqui? Atualize lá também, ou as migrations geradas
            // deixam de bater com o modelo que roda em produção.
            services.AddDbContext<DatabaseContext>(options =>
            {
                options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention();
            });

            services.AddScoped<DbContext>(provider => provider.GetService<DatabaseContext>());


        }

        /// <summary>
        /// O armazenamento do PDF.
        ///
        /// Escolhe entre o R2 e o substituto conforme a configuração PRESENTE,
        /// e não conforme o ambiente: a API precisa subir na máquina de quem
        /// não tem conta na Cloudflare, e precisa FALHAR ALTO em produção se
        /// alguém esquecer a variável. `ArmazenamentoNaoConfigurado` lança em
        /// toda operação, com a mensagem dizendo o que falta.
        /// </summary>
        public static void RegisterArmazenamento(IServiceCollection services, IConfiguration configuration)
        {
            var opcoes = new OpcoesR2();
            configuration.GetSection(OpcoesR2.Secao).Bind(opcoes);
            services.Configure<OpcoesR2>(configuration.GetSection(OpcoesR2.Secao));

            // Preenchido mas ERRADO é pior que vazio: vazio degrada com
            // mensagem clara, errado produz uma URL quebrada que só aparece
            // no console do navegador de quem tentou catalogar. Aqui a API
            // recusa subir, dizendo qual variável corrigir.
            var problemas = opcoes.Problemas();
            if (problemas.Count > 0)
            {
                throw new InvalidOperationException(
                    "Configuração do Cloudflare R2 inválida:" + Environment.NewLine +
                    string.Join(Environment.NewLine, problemas.Select(p => "  - " + p)));
            }

            if (opcoes.EstaConfigurado())
                services.AddSingleton<IArmazenamentoArquivo, ArmazenamentoR2>();
            else
                services.AddSingleton<IArmazenamentoArquivo, ArmazenamentoNaoConfigurado>();
        }

        public static void RegisterRepositories(IServiceCollection services)
        {
            services.AddScoped<IPlanoRepository, PlanoRepository>();
            services.AddScoped<IVocabularioRepository, VocabularioRepository>();
            services.AddScoped<IPostRepository, PostRepository>();
            services.AddScoped<IPessoaRepository, PessoaRepository>();
        }

        public static void RegisterServices(IServiceCollection services)
        {


            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

            services.AddScoped<InterceptorHandlingMiddleware>();
            services.AddScoped<PapelClaimsMiddleware>();
        }

        public static void RegisterAppServices(IServiceCollection services)
        {
            services.AddScoped<IPlanoAppService, PlanoAppService>();
            services.AddScoped<IVocabularioAppService, VocabularioAppService>();
            services.AddScoped<IPostAppService, PostAppService>();
            services.AddScoped<ISessaoAppService, SessaoAppService>();
            services.AddScoped<IPessoaAdminAppService, PessoaAdminAppService>();
            // Singleton: a configuração da allowlist (`HtmlSanitizerService`)
            // não guarda estado por requisição — reconstruí-la a cada
            // requisição só custaria CPU sem ganhar nada.
            services.AddSingleton<IHtmlSanitizerService, HtmlSanitizerService>();
        }




        public static void RegisterMappers(IServiceCollection services)
        {
            services.AddScoped<VocabularioMapper>();
            services.AddScoped<PlanoMapper>();
        }

        public static void RegisterLog(IServiceCollection services, IConfiguration configuration)
        {
            var log = new LoggerConfiguration()
                            .ReadFrom.Configuration(configuration)
                            .Enrich.WithProcessId()
                            .Enrich.FromLogContext()
                            .CreateLogger();

            services.AddSingleton<ILogger>(log);
        }

        public static void RegisterAppicationCache(IServiceCollection services)
        {
            services.AddSingleton<IMemoryCache>(new MemoryCache(new MemoryCacheOptions() { SizeLimit = 5000 }));
        }

        public static void RegisterUnitOfWork(IServiceCollection services)
        {
            services.AddScoped<IUnitOfWork, UnitOfWork>();
        }



    }
}