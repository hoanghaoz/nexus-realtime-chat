using FluentValidation;
using NexusChat.Application.DTOs.Message;

namespace NexusChat.Application.Validation;

public class MessageRequestDtoValidation : AbstractValidator<GetMessageRequestDto>
{
    public MessageRequestDtoValidation()
    {
        RuleFor(x => x.ConversationId)
            .NotEmpty().WithMessage("ConversationId is required.");
    }
}