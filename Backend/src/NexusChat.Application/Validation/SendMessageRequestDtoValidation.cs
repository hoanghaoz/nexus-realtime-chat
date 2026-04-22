using FluentValidation;
using NexusChat.Application.DTOs.Message;

namespace NexusChat.Application.Validation;

public class SendMessageRequestDtoValidation : AbstractValidator<SendMessageRequestDto>
{
    public SendMessageRequestDtoValidation()
    {
        RuleFor(x => x.ConversationId)
            .NotEmpty().WithMessage("ConversationId is required.");

        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.Content) || x.Attachments is { Count: > 0 })
            .WithMessage("Message must include content or at least one attachment.");

        RuleFor(x => x.MentionedUsersId)
            .Must(x => x != null && x.Distinct().Count() == x.Count)
            .WithMessage("Mentioned userid must be unique.")
            .When(x => x.MentionedUsersId != null);

        RuleForEach(x => x.MentionedUsersId)
            .NotEmpty().WithMessage("Mentioned user id is required.")
            .When(x => x.MentionedUsersId != null);
    }
}