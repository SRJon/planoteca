#!/usr/bin/env bash
set -uo pipefail

# Evita que o Git Bash (MSYS) "coma" a barra dos argumentos estilo Windows
# (/k:, /d:), interpretando-os como caminho Unix. Escopo local a este script.
export MSYS_NO_PATHCONV=1

# Defina SONAR_HOST_URL, SONAR_PROJECT_KEY e SONAR_TOKEN no ambiente para
# habilitar a analise. Sem as tres variaveis o passo e ignorado.
if [ -z "${SONAR_HOST_URL:-}" ] || [ -z "${SONAR_PROJECT_KEY:-}" ] || [ -z "${SONAR_TOKEN:-}" ]; then
  echo "Sonar nao configurado (SONAR_HOST_URL, SONAR_PROJECT_KEY, SONAR_TOKEN) - ignorando."
  exit 0
fi

dotnet tool restore

if ! dotnet sonarscanner begin /k:"$SONAR_PROJECT_KEY" /d:sonar.host.url="$SONAR_HOST_URL" /d:sonar.token="$SONAR_TOKEN" \
  /d:sonar.cs.opencover.reportsPaths="**/TestResults/coverage.opencover.xml" \
  /d:sonar.coverage.exclusions="src/*.Api/**/*,src/*.Application/**/*,src/*.Infra.Data/**/*,src/*.Infra.CrossCutting/**/*"; then
  echo "Nao foi possivel iniciar a analise do Sonar (servidor fora do ar?) - ignorando."
  exit 0
fi

dotnet build

dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=opencover /p:CoverletOutput=./TestResults/coverage.opencover.xml

dotnet sonarscanner end /d:sonar.token="$SONAR_TOKEN" || true

exit 0
