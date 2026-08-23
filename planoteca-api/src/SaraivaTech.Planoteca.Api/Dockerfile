#See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["SaraivaTech.Planoteca.Api/SaraivaTech.Planoteca.Api.csproj", "SaraivaTech.Planoteca.Api/"]
RUN dotnet restore "SaraivaTech.Planoteca.Api/SaraivaTech.Planoteca.Api.csproj"
COPY . .
WORKDIR "/src/SaraivaTech.Planoteca.Api"
RUN dotnet build "SaraivaTech.Planoteca.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SaraivaTech.Planoteca.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SaraivaTech.Planoteca.Api.dll"]