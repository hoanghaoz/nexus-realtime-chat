using FluentValidation;
using NexusChat.Application.DTOs.Message;

namespace NexusChat.Application.Validation;

public class MessageRequestDtoValidation : AbstractValidator<MessageRequestDto>
{
    public MessageRequestDtoValidation()
    {
        RuleFor(x => x.ConversationId)
            .NotEmpty().WithMessage("ConversationId is required.");

        RuleFor(x => x.Cursor)
            .Must(cursor => !cursor.HasValue || cursor.Value != default)
            .WithMessage("Cursor is invalid.");
    }
}

