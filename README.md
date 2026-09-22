# Clean Architecture Template (.NET)

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
  Application/      CQRS commands/queries (MediatR), validation (FluentValidation), mapping (AutoMapper),
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
- ASP.NET Core Identity for auth, exposed through a thin controller layer with a consistent API exception filter.
- Angular client app under `WebUI/ClientApp`, generated against the API via NSwag.
- Unit tests for domain rules and application handlers, plus integration tests that exercise the EF Core stack against a real (test) database.
- An in-app **Architecture** page (`/architecture` in the client) covering the same layer diagram and design decisions as this README, for anyone running the app rather than reading the repo.

## Running it

```bash
cd CleanArchitectureTemplate
dotnet restore
dotnet ef database update -p src/Infrastructure -s src/WebUI
dotnet run --project src/WebUI
```

The Angular client builds automatically on `dotnet run` via `Microsoft.AspNetCore.SpaServices.AngularCli`; for frontend-only iteration, `cd src/WebUI/ClientApp && npm install --legacy-peer-deps && npm start`. This is an Angular 10 app (`@angular/cli` pinned to `~10.1.7` to match) — on Node 17+ its webpack version needs `NODE_OPTIONS=--openssl-legacy-provider` set before `ng build`/`ng serve`, since Node's newer OpenSSL defaults broke webpack 4's hashing.

## Tests

```bash
dotnet test
```
