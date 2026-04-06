FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/NexusChat.Api/NexusChat.Api.csproj", "src/NexusChat.Api/"]
COPY ["src/NexusChat.Application/NexusChat.Application.csproj", "src/NexusChat.Application/"]
COPY ["src/NexusChat.Domain/NexusChat.Domain.csproj", "src/NexusChat.Domain/"]
COPY ["src/NexusChat.Infrastructure/NexusChat.Infrastructure.csproj", "src/NexusChat.Infrastructure/"]
RUN dotnet restore "src/NexusChat.Api/NexusChat.Api.csproj"
COPY . .
WORKDIR "/src/src/NexusChat.Api"
RUN dotnet build "./NexusChat.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./NexusChat.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "NexusChat.Api.dll"]
