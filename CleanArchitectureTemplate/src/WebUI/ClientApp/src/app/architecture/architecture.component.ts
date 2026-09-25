import { Component } from '@angular/core';

interface ArchLayer {
  name: string;
  note: string;
}

interface ArchDecision {
  choice: string;
  instead: string;
  why: string;
}

@Component({
  selector: 'app-architecture',
  templateUrl: './architecture.component.html',
  styleUrl: './architecture.component.scss'
})
export class ArchitectureComponent {
  readonly layers: ArchLayer[] = [
    { name: 'Domain', note: 'Entities, value objects, domain events — no outward dependencies' },
    { name: 'Application', note: 'CQRS handlers, validation, query projections, interfaces Infrastructure implements' },
    { name: 'Infrastructure', note: 'EF Core, Identity, file export, external services' },
    { name: 'WebUI', note: 'ASP.NET Core API + this Angular client, wired together via DI' }
  ];

  readonly decisions: ArchDecision[] = [
    {
      choice: 'CQRS with MediatR for every use case',
      instead: 'a conventional service layer with multi-purpose service classes',
      why: 'Each handler stays single-purpose and testable in isolation, and cross-cutting concerns (validation, logging, performance, authorization) attach as pipeline behaviours instead of being re-implemented per method. I default to this once a domain has more than a handful of use cases; for a 3-endpoint CRUD app the pipeline machinery isn’t worth it.'
    },
    {
      choice: 'IApplicationDbContext exposing DbSet<T> directly',
      instead: 'a generic IRepository<T> wrapper over EF Core',
      why: 'EF Core’s DbContext already is a unit-of-work; a generic repository on top of it usually just renames Where() calls without adding real substitutability. I only introduce a repository interface when there’s an actual second implementation to swap in — the object-storage utility in my other repos is that case, where the backing store legitimately varies.'
    },
    {
      choice: 'Five MediatR pipeline behaviours (validation, logging, performance, authorization, exception handling) ahead of every handler',
      instead: 'handling each concern inline, per handler',
      why: 'A new contributor adding an endpoint gets validation, logging, and auth enforcement for free, structurally, instead of relying on them remembering to add it. The cost is indirection — tracing a request means reading the pipeline, not just the handler, which is a real tradeoff on a small team.'
    },
    {
      choice: 'Explicit LINQ projections on each DTO',
      instead: 'AutoMapper convention mapping with ProjectTo',
      why: 'The projection is plain code the compiler checks and EF Core translates to SQL, so only the needed columns are read. It also removed a dependency that had moved to a commercial license, with every remaining free version carrying an open high-severity advisory. For a few DTOs, hand-written projections are less code than the mapping configuration was.'
    }
  ];
}
