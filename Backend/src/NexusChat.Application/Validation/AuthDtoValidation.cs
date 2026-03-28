using FluentValidation;
using NexusChat.Application.DTOs.Authentication;

namespace NexusChat.Application.Validation;

public class AuthDtoValidation : AbstractValidator<AuthDto>
{
    public AuthDtoValidation()
    {
        RuleFor(x => x.Username).NotEmpty().WithMessage("Username is required");
        
        RuleFor(x => x.Password).NotEmpty().WithMessage("Password is required");
    }
}