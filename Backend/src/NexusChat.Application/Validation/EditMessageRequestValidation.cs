using FluentValidation;
using NexusChat.Application.DTOs.Message;

namespace NexusChat.Application.Validation;

public class EditMessageRequestValidation : AbstractValidator<EditMessageRequestDto>
{
    public EditMessageRequestValidation()
    {
        RuleFor(x => x.NewContent)
            .NotEmpty().WithMessage("NewContent is required.");
    }
}