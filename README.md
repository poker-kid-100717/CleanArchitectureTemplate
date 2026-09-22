# Clean Architecture Template (.NET)

A from-scratch build-out of the **Clean Architecture** pattern for ASP.NET Core, used as a working reference for the conventions I default to on real projects: strict dependency direction, CQRS with MediatR, and a thin API layer.

This is a reference/learning project, not a product — the domain (a Todo list app) is intentionally simple so the architecture stays the focus. I use this as the pattern I reach for when standing up a new service: the same layering shows up (in adapted form) in the production systems on my resume.

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

## Running it

```bash
cd CleanArchitectureTemplate
dotnet restore
dotnet ef database update -p src/Infrastructure -s src/WebUI
dotnet run --project src/WebUI
```

The Angular client builds automatically on `dotnet run` via `Microsoft.AspNetCore.SpaServices.AngularCli`; for frontend-only iteration, `cd src/WebUI/ClientApp && npm install && npm start`.

## Tests

```bash
dotnet test
```
