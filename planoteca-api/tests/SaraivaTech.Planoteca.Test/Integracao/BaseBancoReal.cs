using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SaraivaTech.Planoteca.Infra.Data.Context;
using Xunit;

namespace SaraivaTech.Planoteca.Test.Integracao
{
    /// <summary>
    /// Base dos testes que precisam de um PostgreSQL de verdade.
    ///
    /// Por que banco real e não `InMemory`: metade do que estes testes provam
    /// simplesmente não existe no provider em memória — `ILIKE`, o índice
    /// único parcial do componente principal, o `on delete cascade` das
    /// etapas. Um teste verde contra `InMemory` diria muito pouco sobre o que
    /// roda em produção.
    ///
    /// Quando o banco não está de pé, os testes são PULADOS, não falham. A
    /// suíte precisa rodar na máquina de quem não subiu o Docker, e um
    /// `dotnet test` vermelho por falta de infraestrutura treina a pessoa a
    /// ignorar vermelho.
    /// </summary>
    public abstract class BaseBancoReal : IDisposable
    {
        protected readonly DatabaseContext Contexto;

        /// <summary>Prefixo dos dados que cada teste cria, para a limpeza
        /// achar o que é seu e não encostar no seed.</summary>
        protected const string MarcaTeste = "[teste-integracao]";

        protected BaseBancoReal()
        {
            var conexao = ConexaoDeTeste();
            Skip.If(conexao is null,
                "PostgreSQL de teste indisponível. Suba com `docker compose up -d db` na pasta planoteca-api.");

            var opcoes = new DbContextOptionsBuilder<DatabaseContext>()
                .UseNpgsql(conexao)
                .UseSnakeCaseNamingConvention()
                .Options;

            Contexto = new DatabaseContext(opcoes);
        }

        /// <summary>
        /// A connection string sai da mesma cadeia do design-time: variável de
        /// ambiente primeiro (para o CI), depois `appsettings.Local.json` da
        /// API. Devolve `null` quando não acha nada ou quando o banco não
        /// responde — e aí o teste é pulado.
        /// </summary>
        private static string? ConexaoDeTeste()
        {
            var doAmbiente = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
            if (!string.IsNullOrWhiteSpace(doAmbiente) && Responde(doAmbiente))
                return doAmbiente;

            var raiz = Directory.GetCurrentDirectory();
            for (var i = 0; i < 8 && raiz is not null; i++)
            {
                var candidato = Path.Combine(raiz, "src", "SaraivaTech.Planoteca.Api", "appsettings.Local.json");
                if (File.Exists(candidato))
                {
                    var config = new ConfigurationBuilder().AddJsonFile(candidato).Build();
                    var doArquivo = config.GetConnectionString("DefaultConnection");
                    return !string.IsNullOrWhiteSpace(doArquivo) && Responde(doArquivo) ? doArquivo : null;
                }
                raiz = Directory.GetParent(raiz)?.FullName;
            }

            return null;
        }

        private static bool Responde(string conexao)
        {
            try
            {
                using var c = new Npgsql.NpgsqlConnection(conexao);
                c.Open();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public void Dispose()
        {
            Contexto?.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
