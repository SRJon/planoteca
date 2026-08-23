# Imagem da API para o Render.
#
# Duas correções em relação ao Dockerfile do boilerplate:
#
# 1. O caminho do projeto era `/src/SaraivaTech.Planoteca.Api`, sem a pasta
#    `src/` intermediária — não bate com a estrutura do repositório, e o
#    build falhava logo no `restore`.
# 2. Faltava fixar a porta. O Render injeta `PORT` e espera que a aplicação
#    escute nela; sem isto o ASP.NET sobe em 8080 e o serviço nunca responde
#    ao health check, aparecendo como "deploy failed" sem causa aparente.

# ── Build ────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Os arquivos de projeto primeiro, sozinhos: o `restore` só é refeito quando
# uma dependência muda, e não a cada alteração de código. Numa máquina de CI
# gratuita, isso é a diferença entre um build de 40 segundos e um de 4
# minutos.
COPY Directory.Build.props Directory.Packages.props ./
COPY src/SaraivaTech.Planoteca.Api/*.csproj                src/SaraivaTech.Planoteca.Api/
COPY src/SaraivaTech.Planoteca.Application/*.csproj        src/SaraivaTech.Planoteca.Application/
COPY src/SaraivaTech.Planoteca.Application.Core/*.csproj   src/SaraivaTech.Planoteca.Application.Core/
COPY src/SaraivaTech.Planoteca.Domain/*.csproj             src/SaraivaTech.Planoteca.Domain/
COPY src/SaraivaTech.Planoteca.Domain.Core/*.csproj        src/SaraivaTech.Planoteca.Domain.Core/
COPY src/SaraivaTech.Planoteca.Infra.Data/*.csproj         src/SaraivaTech.Planoteca.Infra.Data/
COPY src/SaraivaTech.Planoteca.Infra.CrossCutting/*.csproj src/SaraivaTech.Planoteca.Infra.CrossCutting/
RUN dotnet restore src/SaraivaTech.Planoteca.Api/SaraivaTech.Planoteca.Api.csproj

COPY src/ src/
RUN dotnet publish src/SaraivaTech.Planoteca.Api/SaraivaTech.Planoteca.Api.csproj \
    -c Release -o /app/publish /p:UseAppHost=false --no-restore

# ── Runtime ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production

# Sem esta linha a API morre no arranque, ANTES da primeira linha de código
# nosso, com "The configured user limit (128) on the number of inotify
# instances has been reached".
#
# O host do .NET monta um FileSystemWatcher por arquivo de configuração para
# recarregar em tempo real quando o arquivo muda. Num contêiner isso é
# vigilância inútil — o sistema de arquivos é imutável e nada muda em
# execução — e o limite de inotify do Render é baixo demais para ela.
ENV DOTNET_hostBuilder__reloadConfigOnChange=false

EXPOSE 8080

# `sh -c` porque a expansão de `$PORT` precisa de um shell — a forma exec
# pura passaria a string literal `$PORT` para o ASP.NET. O Render define a
# variável; localmente cai em 8080.
ENTRYPOINT ["sh", "-c", "dotnet SaraivaTech.Planoteca.Api.dll --urls http://0.0.0.0:${PORT:-8080}"]
