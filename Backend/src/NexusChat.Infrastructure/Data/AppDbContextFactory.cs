using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace NexusChat.Infrastructure.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        // Automatically load environment variables from .env file
        Env.TraversePath().Load();
        
        var connectionString = Environment.GetEnvironmentVariable("DEFAULT_CONNECTION");

        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException("Connection string 'DEFAULT_CONNECTION' not found in environment variables.");
        }

        // Configure DbContextOptions với Npgsql và retry logic below
        var builder = new DbContextOptionsBuilder<AppDbContext>();

        return new AppDbContext(builder.Options);
    }
}