import { Container } from "@cloudflare/containers";

export interface Env {
  ASSETS: Fetcher;
  API: DurableObjectNamespace<TodoApi>;
  DATABASE_URL?: string;
}

export class TodoApi extends Container<Env> {
  defaultPort = 8080;
  sleepAfter = "10m";
  pingEndpoint = "localhost/health";

  constructor(ctx: DurableObjectState<{}>, env: Env) {
    super(ctx, env);
    this.envVars = {
      ASPNETCORE_ENVIRONMENT: "Production",
      // DATABASE_URL is a SQL Server connection string (for example Azure SQL Database); the API
      // migrates and seeds it on startup. Without it the API runs on EF Core's in-memory provider.
      ...(env.DATABASE_URL
        ? { UseInMemoryDatabase: "false", ConnectionStrings__DefaultConnection: env.DATABASE_URL }
        : { UseInMemoryDatabase: "true" }),
    };
  }
}

const api = (env: Env) => env.API.getByName("api");

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api" || url.pathname.startsWith("/api/") || url.pathname === "/health") {
      return api(env).fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
