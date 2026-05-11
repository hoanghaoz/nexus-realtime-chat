using FluentValidation;
using NexusChat.Application.DTOs.ChatBot;

namespace NexusChat.Application.Validation;

public class ChatRequestDtoValidation : AbstractValidator<ChatBotRequestDto>
{
    public ChatRequestDtoValidation()
    {
        RuleFor(message => message.Content)
            .NotEmpty()
            .WithMessage("Content cannot be empty")
            .MaximumLength(1000)
            .WithMessage("Content cannot be longer than 1000 characters");
    }
}