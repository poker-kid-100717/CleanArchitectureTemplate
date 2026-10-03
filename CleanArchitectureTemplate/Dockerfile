# API image for Cloudflare Containers. The Angular app is served by the Worker, so it is not built here.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/Domain/Domain.csproj src/Domain/
COPY src/Application/Application.csproj src/Application/
COPY src/Infrastructure/Infrastructure.csproj src/Infrastructure/
COPY src/WebUI/WebUI.csproj src/WebUI/
RUN dotnet restore src/WebUI/WebUI.csproj
COPY src/ src/
RUN dotnet publish src/WebUI/WebUI.csproj -c Release -o /app --no-restore /p:UseAppHost=false /p:SkipSpaBuild=true /p:SkipNSwag=true

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
ENV ASPNETCORE_URLS=http://+:8080 \
    DOTNET_RUNNING_IN_CONTAINER=true
WORKDIR /app
COPY --from=build /app .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "CleanArchitectureTemplate.WebUI.dll"]
