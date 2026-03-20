using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NexusChat.Application.Interfaces;
using NexusChat.Application.Interfaces.Authentication;
using NexusChat.Infrastructure.Authentication;
using NexusChat.Infrastructure.Repository;

namespace NexusChat.Infrastructure.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureService(this IServiceCollection services, IConfiguration configuration)
    {
        // register infrastructure services here, such as database context, repositories, etc.
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        return services;
    }
}