using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using NexusChat.Application.Interfaces;
using NexusChat.Application.Interfaces.Authentication;
using NexusChat.Application.Interfaces.ConversationService;
using NexusChat.Application.Interfaces.FriendRequests;
using NexusChat.Application.Interfaces.Message;
using NexusChat.Application.Interfaces.RoomService;
using NexusChat.Application.Interfaces.FriendService;
using NexusChat.Application.Interfaces.UserService;
using NexusChat.Application.Services;
using System.Reflection;

namespace NexusChat.Application.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services,IConfiguration configuration)
    {
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        services.AddScoped<IAuthService,AuthService>();
        services.AddScoped<IUserUpdateService,UserUpdateService>();
        services.AddScoped<IFriendRequestService, FriendRequestService>();
        services.AddScoped<IUserProfileService, UserProfileService>();
        services.AddScoped<IUserSearchService, UserSearchService>();
        services.AddScoped<IMessageService, MessageService>();
        services.AddScoped<IGroupService, GroupService>();
        services.AddScoped<IFriendListService, FriendListService>();
        services.AddScoped<IConversationService, ConversationService >();
        return services;
    }
}