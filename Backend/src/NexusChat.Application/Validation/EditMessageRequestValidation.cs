using FluentValidation;
using FluentValidation.Validators;
using NexusChat.Application.DTOs;
using NexusChat.Application.DTOs.Message;

namespace NexusChat.Application.Validation;

public class EditMessageRequestValidation : AbstractValidator<EditMessageRequestDto>
{
    public EditMessageRequestValidation()
    {
        RuleFor(x => x.MessageId)
            .NotEmpty().WithMessage("MessageId is required.");

        RuleFor(x => x.NewContent)
            .NotEmpty().WithMessage("NewContent is required.");
    }
}