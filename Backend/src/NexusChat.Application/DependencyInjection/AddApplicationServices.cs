using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NexusChat.Application.Interfaces.Authentication;
using NexusChat.Application.Interfaces.ChatBot;
using NexusChat.Application.Interfaces.ConversationService;
using NexusChat.Application.Interfaces.FriendService;
using NexusChat.Application.Interfaces.MessageInterface;
using NexusChat.Application.Interfaces.UserService;
using NexusChat.Application.Services;

namespace NexusChat.Application.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IUserSearchService, UserSearchService>();
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserUpdateService, UserUpdateService>();
        services.AddScoped<IFriendRequestService, FriendRequestService>();
        services.AddScoped<IUserProfileService, UserProfileService>();
        services.AddScoped<IUserSearchService, UserSearchService>();
        services.AddScoped<IFriendListService, FriendListService>();
        services.AddScoped<IConversationService, ConversationService>();
        services.AddScoped<IGroupService, GroupService>();
        services.AddScoped<IMessageService, MessageService>();
        services.AddScoped<IChatBotService, ChatBotService>();
        services.AddSingleton<IChatBotQueue,ChatBotQueue>();
        return services;
    }
}