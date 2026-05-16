using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;

namespace NexusChat.Infrastructure.DependencyInjection;

public static class AiServiceInjection
{
    public static IServiceCollection AddAiServices(this IServiceCollection services, IConfiguration configuration)
    {
        var provider = configuration["Chatbot:ActiveProvider"] ?? "Gemini";

        var model = configuration[$"Chatbot:{provider}:Model"] ?? 
                    throw new InvalidOperationException($"Model configuration for provider '{provider}' is missing.");
        
        var apiKey = configuration[$"Chatbot:{provider}:ApiKey"] ?? 
                     throw new InvalidOperationException($"API key configuration for provider '{provider}' is missing.");

        if (provider == "Ollama")
        {
            var url = configuration[$"Chatbot:{provider}:Url"] ?? 
                      throw new InvalidOperationException($"Url configuration for provider '{provider}' is missing.");
            var endpoint = new Uri(url);
            services.AddOpenAIChatCompletion(
                model,
                apiKey: apiKey,
                endpoint: endpoint);
        }
        else
        {
            services.AddGoogleAIGeminiChatCompletion(
                model,
                apiKey);
        }

        services.AddKernel();
        return services;
    }
}