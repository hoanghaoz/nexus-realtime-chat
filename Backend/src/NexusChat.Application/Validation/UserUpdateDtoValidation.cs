using System.Data;
using FluentValidation;
using NexusChat.Application.DTOs.Users;

namespace NexusChat.Application.Validation;

public class UserUpdateDtoValidation : AbstractValidator<UserUpdateDto>
{
    public  UserUpdateDtoValidation()
    {
        RuleFor(x => x.Username).NotEmpty().WithMessage("Username is required");
    }
}