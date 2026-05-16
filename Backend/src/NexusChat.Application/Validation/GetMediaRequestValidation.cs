using FluentValidation;
using NexusChat.Application.DTOs.Media;

namespace NexusChat.Application.Validation;

public class GetMediaRequestValidator : AbstractValidator<GetMediaRequestDto>
{
    public GetMediaRequestValidator()
    {
        // Validate that Page is greater than or equal to 1
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page must be greater than or equal to 1");

        // Validate that PageSize is between 1 and 100
        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize must be between 1 and 100");

        // Validate Type Media
        RuleFor(x => x.Type)
            .Must(t => string.IsNullOrWhiteSpace(t)
                       || new[] { "image", "video", "audio", "document", "file" }
                           .Contains(t.Trim().ToLowerInvariant()))
            .WithMessage("Type is not valid. Allowed values are 'image', 'video', 'audio', 'document', 'file' or empty.");
    }
}
