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

        RuleForEach(x => x.Attachments).ChildRules(attachment =>
        {
            attachment.RuleFor(a => a.FileUrl)
                .NotEmpty().WithMessage("Attachment file URL is required.");

            attachment.RuleFor(a => a.FileName)
                .NotEmpty().WithMessage("Attachment file name is required.");

            attachment.RuleFor(a => a.FileSize)
                .NotNull().WithMessage("Attachment file size is required.")
                .LessThanOrEqualTo(25*1024*1024).WithMessage("Attachment file size must be less than or equal to 25MB.")
                .GreaterThanOrEqualTo(0).WithMessage("Attachment file size cannot be negative.");

            attachment.RuleFor(a => a.Type)
                .NotNull().WithMessage("Attachment file type is required.")
                .IsInEnum().WithMessage("Attachment file type is not valid.");
        }).When(x => x.Attachments != null);
        
        RuleFor(x => x.MentionedUsersId)
            .Must(x => x != null && x.Distinct().Count() == x.Count).WithMessage("Mentioned userid must be unique.")
            .WithMessage("Mentioned user ids cannot contain empty or whitespace strings.");
        
        RuleForEach(x => x.MentionedUsersId)
            .NotEmpty().WithMessage("Mentioned user id is required.")
            .When(x => x.MentionedUsersId != null);
    }
}

