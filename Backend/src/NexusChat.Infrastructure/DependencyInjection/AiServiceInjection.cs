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
                     throw new InvalidOperationException(
                         $"API key configuration for provider '{provider}' is missing.");

        switch (provider)
        {
            case "Ollama":
                var url = configuration[$"Chatbot:{provider}:Url"] ??
                          throw new InvalidOperationException(
                              $"Url configuration for provider '{provider}' is missing.");
                var endpoint = new Uri(url);
                services.AddOpenAIChatCompletion(
                    model,
                    apiKey: apiKey,
                    endpoint: endpoint);
                break;
            case "Gemini":
                services.AddGoogleAIGeminiChatCompletion(
                    model,
                    apiKey);
                break;

            case "Groq":
                var groqUrl = configuration[$"Chatbot:{provider}:Url"] ??
                              throw new InvalidOperationException(
                                  $"GroqUrl configuration for provider '{provider}' is missing.");
                services.AddOpenAIChatCompletion(model, apiKey: apiKey, endpoint: new Uri(groqUrl));
                break;
            
            case "ChatGPT":
                var gptUrl = configuration[$"Chatbot:{provider}:Url"] ?? throw new InvalidOperationException(
                    $"ChatGPT Url configuration for provider '{provider}' is missing.");
                var token = configuration[$"Chatbot:{provider}:Token"] ?? throw new InvalidOperationException(
                    $"ChatGPT Token configuration for provider '{provider}' is missing.");
                services.AddOpenAIChatCompletion(modelId: model, apiKey: token, endpoint: new Uri(gptUrl));
                break;
            default:
                var defaultUrl = configuration[$"Chatbot:{provider}:Url"] ??
                                 throw new InvalidOperationException(
                                     $"GroqUrl configuration for provider '{provider}' is missing.");
                services.AddOpenAIChatCompletion(model, apiKey: apiKey, endpoint: new Uri(defaultUrl));
                break;
        }

        services.AddKernel();
        return services;
    }
}