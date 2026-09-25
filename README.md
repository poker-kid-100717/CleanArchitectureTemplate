# Clean Architecture Template (.NET)

[![CI](https://github.com/poker-kid-100717/CleanArchitectureTemplate/actions/workflows/ci.yml/badge.svg)](https://github.com/poker-kid-100717/CleanArchitectureTemplate/actions/workflows/ci.yml)

A from-scratch build-out of the **Clean Architecture** pattern for ASP.NET Core, used as a working reference for the conventions I default to on real projects: strict dependency direction, CQRS with MediatR, and a thin API layer.

This is a reference/learning project, not a product — the domain (a Todo list app) is intentionally simple so the architecture stays the focus.

## Applied in production, not just referenced here

This isn't a pattern I only know from a template. The same Domain/Application/Infrastructure/API separation shows up, adapted to the constraints of each job, in real systems I've shipped:

- **Kenworth Truck Co.** — designed ASP.NET Core services with Clean Architecture, dependency injection, and repository patterns specifically to improve maintainability and testability of workflow-heavy operational applications.
- **Global Holdings** — architected reusable ASP.NET Core APIs on the same layering to keep business logic decoupled from persistence, across services handling large-file ingestion and background processing.
- **WorkLens** (github.com/poker-kid-100717/WorkLens) — my public job-intelligence platform uses this same Core/Infrastructure/API boundary in a live Angular + ASP.NET Core + SQL Server stack, not a toy domain.

This repo is where I keep the pattern isolated and current so I'm not re-deriving it from scratch on every new service — the CQRS/MediatR/FluentValidation plumbing here is the same shape I bring to a new project on day one.

## Layering

```
src/
  Domain/          Entities, value objects, domain events, enums — no dependencies on anything else
  Application/      CQRS commands/queries (MediatR), validation (FluentValidation), LINQ projections to DTOs,
                     interfaces that Infrastructure implements
  Infrastructure/    EF Core persistence, Identity, file export, external services
  WebUI/             ASP.NET Core Web API + Angular client app, wires everything together via DI
tests/
  Domain.UnitTests/
  Application.UnitTests/
  Application.IntegrationTests/
```

The dependency rule is enforced by project references: `Domain` has none, `Application` depends only on `Domain`, `Infrastructure` and `WebUI` depend inward. Nothing in `Domain` or `Application` knows EF Core, SQL Server, or ASP.NET Core exist.

## What's implemented

- CQRS handlers for Todo Lists/Items (commands + queries) via MediatR, with a validation pipeline behaviour (FluentValidation) and a logging/performance behaviour running ahead of every request.
- EF Core (SQL Server) persistence with migrations, entity configurations, and a database seeder.
- ASP.NET Core Identity with its built-in API endpoints under `/api/Users` (register, login, refresh, account). The Angular client logs in with a cookie; other callers can ask for a bearer token. A consistent API exception filter maps application exceptions to problem details.
- Angular client under `WebUI/ClientApp`: standalone components, signals, zoneless change detection, and a typed API client that NSwag generates from the OpenAPI spec.
- Unit tests for domain rules and application behaviours, plus integration tests that run the real application against SQL Server 2022 in Docker (Testcontainers), resetting data between tests with Respawn.
- An in-app **Architecture** page (`/architecture` in the client) covering the same layer diagram and design decisions as this README, for anyone running the app rather than reading the repo.

## Stack

- **.NET 10**, ASP.NET Core, EF Core 10 on **SQL Server**
- **MediatR 12.5** and **FluentValidation 12** in the Application layer
- **Angular 22** with Bootstrap 5 and ng-bootstrap
- **NUnit 4**, FluentAssertions 7, Moq, Respawn, Testcontainers
- **GitHub Actions**: build, tests (including SQL Server integration tests), migration drift check, Angular build and tests

MediatR (13+) and FluentAssertions (8+) now need commercial licenses, so both stay on their last Apache-2.0 releases. AutoMapper was removed rather than pinned. Its free versions all carry an unpatched high-severity advisory (CVE-2026-32933), and explicit projections replace it with less code.

## Running it

Prerequisites: .NET 10 SDK, Node.js 22.22.3+ (or 24), and a SQL Server instance.

```bash
# SQL Server in Docker (or point ConnectionStrings:DefaultConnection at your own)
docker run -d --name sql -e ACCEPT_EULA=Y -e 'MSSQL_SA_PASSWORD=Your_password123' -p 1433:1433 mcr.microsoft.com/mssql/server:2022-latest
export ConnectionStrings__DefaultConnection='Server=localhost,1433;Database=CleanArchitectureDb;User Id=sa;Password=Your_password123;TrustServerCertificate=True'

cd CleanArchitectureTemplate
dotnet run --project src/WebUI           # applies migrations and seeds on startup (https://localhost:5001)
cd src/WebUI/ClientApp && npm ci && npm start   # Angular dev server on http://localhost:4200, proxying /api to the API
```

The default connection string targets SQL Server LocalDB, so on Windows you can skip the Docker step. The seed creates `administrator@localhost` / `Administrator1!` and a sample list. API docs are served at `/api`.

`dotnet publish` builds the Angular app and ships it in `wwwroot`, so the published site serves the SPA and the API from one host. Debug builds regenerate `wwwroot/api/specification.json` and `ClientApp/src/app/web-api-client.ts` with NSwag.

## Tests

```bash
cd CleanArchitectureTemplate
dotnet test                      # needs Docker running for the SQL Server integration tests
cd src/WebUI/ClientApp && npx ng test --watch=false
```
