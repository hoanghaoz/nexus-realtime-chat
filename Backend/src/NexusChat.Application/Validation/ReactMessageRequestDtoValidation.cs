using FluentValidation;
using NexusChat.Application.DTOs.Message;

namespace NexusChat.Application.Validation;

public class ReactMessageRequestDtoValidation : AbstractValidator<ReactMessageRequestDto>
{
    public ReactMessageRequestDtoValidation()
    {
        RuleFor(x => x.MessageId)
            .NotEmpty().WithMessage("MessageId is required.");

        RuleFor(x => x.Emoji)
            .NotEmpty().WithMessage("Emoji is required.");
    }
}

