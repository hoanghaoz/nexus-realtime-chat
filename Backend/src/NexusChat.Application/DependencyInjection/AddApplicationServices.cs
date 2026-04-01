using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using NexusChat.Application.Interfaces;
using NexusChat.Application.Interfaces.Authentication;
using NexusChat.Application.Interfaces.UserService;
using NexusChat.Application.Services;
using NexusChat.Application.Services.UserUpdateService.cs;

namespace NexusChat.Application.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services,IConfiguration configuration)
    {
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        services.AddScoped<IAuthService,AuthService>();
        services.AddScoped<IUserUpdateService,UserUpdateService>();
        return services;
    }
}