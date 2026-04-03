using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using NexusChat.Application.Interfaces.Authentication;
using NexusChat.Application.Interfaces.Common;
using NexusChat.Application.Interfaces.FriendRequests;
using NexusChat.Application.Interfaces.UserRepository;
using NexusChat.Infrastructure.Authentication;
using NexusChat.Infrastructure.Data.Configuration;
using NexusChat.Infrastructure.Data.Interface;
using NexusChat.Infrastructure.Repository;
using NexusChat.Infrastructure.Repository.Common;

namespace NexusChat.Infrastructure.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureService(this IServiceCollection services, IConfiguration configuration)
    {
        MongoMappingConfig.Register();
        // register infrastructure services here, such as database context, repositories, etc.
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddSingleton<IMongoClient>(new MongoClient(connectionString));
        services.AddSingleton<IMongoDatabase>(p =>
            p.GetRequiredService<IMongoClient>().GetDatabase("NexusChat")); 
        
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        
        services.AddScoped<IMongoUnitOfWork>(p => (IMongoUnitOfWork)p.GetRequiredService<IUnitOfWork>());
        
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        
        services.AddScoped<ITokenService,TokenService>();

        services.AddScoped<IUserRepository, UserRepository>();
        
        services.AddScoped<IFriendRequestRepository, FriendRequestRepository>();
        return services;
    }
}