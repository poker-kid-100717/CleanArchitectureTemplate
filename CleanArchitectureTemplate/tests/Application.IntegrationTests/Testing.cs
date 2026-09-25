using CleanArchitectureTemplate.Application.Common.Interfaces;
using CleanArchitectureTemplate.Infrastructure.Identity;
using CleanArchitectureTemplate.Infrastructure.Persistence;
using MediatR;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;
using NUnit.Framework;
using Respawn;
using Respawn.Graph;
using System;
using System.Linq;
using System.Threading.Tasks;
using Testcontainers.MsSql;

/// <summary>
/// Runs the application (via WebApplicationFactory) against a real SQL Server
/// in Docker. The app applies its migrations on startup; Respawn wipes the
/// data between tests.
/// </summary>
[SetUpFixture]
public class Testing
{
    private const string SqlServerImage = "mcr.microsoft.com/mssql/server:2022-latest";

    private static MsSqlContainer _database;
    private static WebApplicationFactory<Program> _factory;
    private static IServiceScopeFactory _scopeFactory;
    private static Respawner _respawner;
    private static string _connectionString;
    private static string _currentUserId;

    [OneTimeSetUp]
    public async Task RunBeforeAnyTests()
    {
        _database = new MsSqlBuilder(SqlServerImage).Build();
        await _database.StartAsync();

        _connectionString = new SqlConnectionStringBuilder(_database.GetConnectionString())
        {
            InitialCatalog = "CleanArchitectureTemplateTestDb"
        }.ConnectionString;

        // Read by Program at startup, before the factory's own overrides apply.
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", _connectionString);
        Environment.SetEnvironmentVariable("UseInMemoryDatabase", "false");

        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<ICurrentUserService>();
                services.AddTransient(_ =>
                    Mock.Of<ICurrentUserService>(s => s.UserId == _currentUserId));
            });
        });

        _scopeFactory = _factory.Services.GetRequiredService<IServiceScopeFactory>();

        _respawner = await Respawner.CreateAsync(_connectionString, new RespawnerOptions
        {
            TablesToIgnore = new Table[] { "__EFMigrationsHistory" }
        });
    }

    public static async Task<TResponse> SendAsync<TResponse>(IRequest<TResponse> request)
    {
        using var scope = _scopeFactory.CreateScope();

        var mediator = scope.ServiceProvider.GetRequiredService<ISender>();

        return await mediator.Send(request);
    }

    public static async Task SendAsync(IRequest request)
    {
        using var scope = _scopeFactory.CreateScope();

        var mediator = scope.ServiceProvider.GetRequiredService<ISender>();

        await mediator.Send(request);
    }

    public static async Task<string> RunAsDefaultUserAsync()
    {
        return await RunAsUserAsync("test@local", "Testing1234!", new string[] { });
    }

    public static async Task<string> RunAsAdministratorAsync()
    {
        return await RunAsUserAsync("administrator@local", "Administrator1234!", new[] { "Administrator" });
    }

    public static async Task<string> RunAsUserAsync(string userName, string password, string[] roles)
    {
        using var scope = _scopeFactory.CreateScope();

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var user = new ApplicationUser { UserName = userName, Email = userName };

        var result = await userManager.CreateAsync(user, password);

        if (roles.Any())
        {
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            foreach (var role in roles)
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }

            await userManager.AddToRolesAsync(user, roles);
        }

        if (result.Succeeded)
        {
            _currentUserId = user.Id;

            return _currentUserId;
        }

        var errors = string.Join(Environment.NewLine, result.ToApplicationResult().Errors);

        throw new Exception($"Unable to create {userName}.{Environment.NewLine}{errors}");
    }

    public static async Task ResetState()
    {
        await _respawner.ResetAsync(_connectionString);
        _currentUserId = null;
    }

    public static async Task<TEntity> FindAsync<TEntity>(params object[] keyValues)
        where TEntity : class
    {
        using var scope = _scopeFactory.CreateScope();

        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        return await context.FindAsync<TEntity>(keyValues);
    }

    public static async Task AddAsync<TEntity>(TEntity entity)
        where TEntity : class
    {
        using var scope = _scopeFactory.CreateScope();

        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        context.Add(entity);

        await context.SaveChangesAsync();
    }

    public static async Task<int> CountAsync<TEntity>() where TEntity : class
    {
        using var scope = _scopeFactory.CreateScope();

        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        return await context.Set<TEntity>().CountAsync();
    }

    [OneTimeTearDown]
    public async Task RunAfterAnyTests()
    {
        if (_factory != null)
        {
            await _factory.DisposeAsync();
        }

        if (_database != null)
        {
            await _database.DisposeAsync();
        }
    }
}
