using CleanArchitectureTemplate.Application;
using CleanArchitectureTemplate.Application.Common.Interfaces;
using CleanArchitectureTemplate.Infrastructure;
using CleanArchitectureTemplate.Infrastructure.Identity;
using CleanArchitectureTemplate.Infrastructure.Persistence;
using CleanArchitectureTemplate.WebUI.Filters;
using CleanArchitectureTemplate.WebUI.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NSwag;
using NSwag.Generation.Processors.Security;
using System;
using System.Linq;
using System.Threading.Tasks;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddDatabaseDeveloperPageExceptionFilter();

builder.Services.AddSingleton<ICurrentUserService, CurrentUserService>();
builder.Services.AddHttpContextAccessor();

builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>();

builder.Services.AddControllers(options =>
    options.Filters.Add<ApiExceptionFilterAttribute>());

// Validation runs in the MediatR pipeline (ValidationBehaviour), so turn off
// MVC's automatic 400 for invalid model state.
builder.Services.Configure<ApiBehaviorOptions>(options =>
    options.SuppressModelStateInvalidFilter = true);

builder.Services.AddProblemDetails();

// Include minimal-API endpoints (the Identity endpoints) in the OpenAPI document.
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddOpenApiDocument(configure =>
{
    configure.Title = "CleanArchitectureTemplate API";
    configure.AddSecurity("Bearer", Enumerable.Empty<string>(), new OpenApiSecurityScheme
    {
        Type = OpenApiSecuritySchemeType.Http,
        Scheme = "bearer",
        Description = "Access token from POST /api/Users/login."
    });

    configure.OperationProcessors.Add(new AspNetCoreOperationSecurityScopeProcessor("Bearer"));
});

var app = builder.Build();

// NSwag starts the app only to read its endpoints; it has no database.
if (!app.Environment.IsEnvironment("NSwag"))
{
    await InitialiseDatabaseAsync(app);
}

if (app.Environment.IsDevelopment())
{
    app.UseMigrationsEndPoint();
}
else
{
    app.UseExceptionHandler();
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHealthChecks("/health");
app.UseHttpsRedirection();
app.UseStaticFiles();

// Swagger UI over the spec NSwag generates into wwwroot/api/specification.json.
app.UseSwaggerUi(settings =>
{
    settings.Path = "/api";
    settings.DocumentPath = "/api/specification.json";
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Register, login (bearer token or cookie), refresh, and account endpoints.
var users = app.MapGroup("/api/Users").WithTags("Users");
users.MapIdentityApi<ApplicationUser>();

// MapIdentityApi has no logout; the Angular client signs in with a cookie
// and needs a way to clear it.
users.MapPost("/logout", async (SignInManager<ApplicationUser> signInManager) =>
{
    await signInManager.SignOutAsync();
    return Results.NoContent();
}).RequireAuthorization();

// Client-side routes fall through to the Angular app.
app.MapFallbackToFile("index.html");

app.Run();

static async Task InitialiseDatabaseAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;

    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();

        if (context.Database.IsSqlServer())
        {
            await context.Database.MigrateAsync();
        }

        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        await ApplicationDbContextSeed.SeedDefaultUserAsync(userManager, roleManager);
        await ApplicationDbContextSeed.SeedSampleDataAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();

        logger.LogError(ex, "An error occurred while migrating or seeding the database.");

        throw;
    }
}

// Exposes the entry point to WebApplicationFactory<Program> in the integration tests.
public partial class Program { }
