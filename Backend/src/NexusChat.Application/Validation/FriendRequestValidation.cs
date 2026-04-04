using FluentValidation;
using NexusChat.Application.DTOs.FriendRequests;
using NexusChat.Application.DTOs.Hubs;

namespace NexusChat.Application.Validation;

public class CreateFriendRequestDtoValidation : AbstractValidator<CreateFriendRequestDto>
{
    public CreateFriendRequestDtoValidation()
    {
        RuleFor(x => x.ToUserId)
            .NotEmpty().WithMessage("You must specify a user id")
            .NotNull();
    }
}