using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

using System;

using System.Collections.Generic;
using System.IO;
using System.Text;

namespace SaraivaTech.Planoteca.Infra.Data.Context
{
    public class DatabaseContextFactory : IDesignTimeDbContextFactory<DatabaseContext>
    {
        public DatabaseContext CreateDbContext(string[] args)
        {
            // A cadeia de configuração espelha a do runtime (`Program.cs`), e
            // não só `appsettings.json`: aquele arquivo NÃO tem connection
            // string, de propósito — a senha real nunca vai versionada. Sem os
            // overrides abaixo, `dotnet ef database update` falha com
            // "The ConnectionString property has not been initialized",
            // que é o erro que este bloco existe para não deixar acontecer.
            //
            // `appsettings.Local.json` é gitignored e tem a precedência maior.
            // Variável de ambiente vence tudo, para o pipeline de CI.
            var ambiente = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";

            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
                .AddJsonFile($"appsettings.{ambiente}.json", optional: true, reloadOnChange: false)
                .AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: false)
                .AddEnvironmentVariables()
                .Build();

            var optionsBuilder = new DbContextOptionsBuilder<DatabaseContext>();

            // ATENÇÃO (manter em sincronia): DUPLICA a wiring de runtime, em
            // `Infra.CrossCutting/IoC/DependencyInjectionBootStrapper.cs`
            // (RegisterDataBase). Provider e convenção de nome precisam ser os
            // mesmos nos dois lugares — divergir aqui faz `dotnet ef migrations`
            // gerar um modelo que não é o que a aplicação usa.
            optionsBuilder
                .UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
                .UseSnakeCaseNamingConvention();

            // Pass a dummy TenantProvider for Design Time
            var context = new DatabaseContext(optionsBuilder.Options);

            return context;
        }
    }
}