using FluentValidation;
using NexusChat.Application.DTOs.Conversation;

namespace NexusChat.Application.Validation;

public class SearchConversationRequestDtoValidation : AbstractValidator<SearchConversationRequestDto>
{
    public SearchConversationRequestDtoValidation()
    {
        RuleFor(x => x.Keyword)
            .NotEmpty()
            .WithMessage("Keyword is required for search.")
            .MinimumLength(1)
            .WithMessage("Keyword must be at least 1 character.")
            .MaximumLength(100)
            .WithMessage("Keyword must not exceed 100 characters.");
    }
}

