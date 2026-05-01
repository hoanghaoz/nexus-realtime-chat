using FluentValidation;
using NexusChat.Application.DTOs.Media;

namespace NexusChat.Application.Validation;

public class UploadMediaRequestValidator : AbstractValidator<UploadMediaRequestDto>
{
    public UploadMediaRequestValidator()
    {
        RuleFor(x => x.FileName)
            .NotEmpty()
            .WithErrorCode("Media.InvalidFileName")
            .WithMessage("File name is required.");

        RuleFor(x => x.FileSize)
            .GreaterThan(0)
            .WithErrorCode("Media.InvalidFileSize")
            .WithMessage("File size must be greater than zero.");

        RuleFor(x => x.Stream)
            .NotNull()
            .WithErrorCode("Media.InvalidStream")
            .WithMessage("File stream is required.")
            .Must(stream => stream is not null && stream.CanRead)
            .WithErrorCode("Media.InvalidStream")
            .WithMessage("File stream is not readable.");
        // Check format file 
        RuleFor(x => x.FileName)
            .Must(BeAValidExtension)
            .When(x => !string.IsNullOrEmpty(x.FileName))
            .WithErrorCode("Media.UnsupportedExtension")
            .WithMessage("Unsupported file extension");
        // Check size of file is uploaded 
        RuleFor(x => x.FileSize)
            .Must((dto, size) => HaveValidSizeForItsType(dto.FileName, size))
            .When(x => !string.IsNullOrEmpty(x.FileName) && BeAValidExtension(x.FileName))
            .WithErrorCode("Media.FileSizeExceeded")
            .WithMessage(dto => GetSizeErrorMessage(dto.FileName));
    }

    private bool BeAValidExtension(string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext is ".jpg" or ".jpeg" or ".png" or ".gif" or ".bmp" or ".webp" // image 
            or ".mp4" or ".avi" or ".mov" or ".wmv" or ".flv" or ".mkv" or ".webm" // video
            or ".mp3" or ".wav" or ".m4a" or ".aac" or ".flac" or ".ogg" // audio
            or ".pdf" or ".doc" or ".docx" or ".xls" or ".xlsx" or ".ppt" // document
            or ".pptx" or ".txt" or ".zip" or ".rar"; // document
    }

    private bool HaveValidSizeForItsType(string fileName, long fileSize)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();

        // Switch Expression to check file size based on extension 
        return ext switch
        {
            ".jpg" or ".jpeg" or ".png" or ".gif" or ".bmp" or ".webp" => fileSize <= 5 * 1024 * 1024, // 5MB
            ".mp4" or ".avi" or ".mov" or ".wmv" or ".flv" or ".mkv" or ".webm" => fileSize <= 50 * 1024 * 1024, // 50MB
            ".mp3" or ".wav" or ".m4a" or ".aac" or ".flac" or ".ogg" => fileSize <= 15 * 1024 * 1024, // 15MB
            ".pdf" or ".doc" or ".docx" or ".xls" or ".xlsx" or ".ppt" or ".pptx"
                or ".txt" or ".zip" or ".rar" => fileSize <= 20 * 1024 * 1024, // 20MB
            _ => false
        };
    }

    private string GetSizeErrorMessage(string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();

        // Return directly error message based on file extension using Switch Expression
        return ext switch
        {
            ".jpg" or ".jpeg" or ".png" or ".gif" or ".bmp" or ".webp" => "Image is uploaded must not exceed 5MB.",
            ".mp4" or ".avi" or ".mov" or ".wmv" or ".flv" or ".mkv" or ".webm" =>
                "Video is uploaded must not exceed 50MB.",
            ".mp3" or ".wav" or ".m4a" or ".aac" or ".flac" or ".ogg" => "Audio is uploaded must be exceed 15MB",
            ".pdf" or ".doc" or ".docx" or ".xls" or ".xlsx" or ".ppt" or ".pptx" or ".txt" or ".zip" or ".rar" =>
                "Document is uploaded must not exceed 20MB.",
            _ => "Unsupported file type."
        };
    }
}