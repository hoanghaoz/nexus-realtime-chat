using ErrorOr;
using FluentValidation;
using NexusChat.Application.DTOs.Media;
using NexusChat.Application.Interfaces.ConversationRepository;
using NexusChat.Application.Interfaces.Media;
using NexusChat.Application.Interfaces.Message;
using NexusChat.Domain.Entity;
using NexusChat.Domain.Entity.EmbeddedObject;
using NexusChat.Domain.Enum;

namespace NexusChat.Application.Services;

public class MediaService (
    IUploadService uploadService,
    IMessageRepository messageRepository,
    IConversationRepository conversationRepository,
    IValidator<UploadMediaRequestDto> uploadMediaRequestValidator) 
    : IMediaService
{
    public async Task<ErrorOr<List<GetMediaResponseDto>>> GetConversationMediaAsync(string conversationId, string userId, GetMediaRequestDto request,
        CancellationToken token)
    {
        // Check user is a member of the conversation
        var isMember = await conversationRepository.IsUserInConversationAsync(conversationId, userId, token);
        if (!isMember)
        {
            return Error.Unauthorized("Media.AccessDenied", "You do not have permission to access media in this conversation.");
        }
        
        // Calculate pagination parameters
        int skip = (request.Page - 1) * request.PageSize;
        
        var mediaList = await messageRepository.GetMediaByConversationIdAsync(
            conversationId, 
            request.Type, 
            skip, 
            request.PageSize, 
            token);
        
        return mediaList;
    }

    public async Task<ErrorOr<UploadMediaResponseDto>> UploadMediaAsync(string conversationId, string userId, Stream stream, string filename, long fileSize,
        CancellationToken token)
    {
        var validationResult = await uploadMediaRequestValidator.ValidateAsync(
            new UploadMediaRequestDto(filename, fileSize, stream),
            token);
        if (!validationResult.IsValid)
        {
            return validationResult.Errors
                .Select(error => Error.Validation(error.ErrorCode, error.ErrorMessage))
                .ToList();
        }
        // Check user is member in conversation
        var isMember = await conversationRepository.IsUserInConversationAsync(conversationId, userId, token);
        if (!isMember)
        {
            return Error.Unauthorized("Media.Unauthorized", "You are not a member of this conversation.");
        }

        var uploadResult = await uploadService.UploadMediaAsync(stream, filename, fileSize, token);
        if (uploadResult.IsError) return uploadResult.Errors;

        var fileType = ResolveFileType(filename);
        var message = new Message
        {
            Id = Guid.NewGuid().ToString(),
            ConversationId = conversationId,
            FromUserId = userId,
            Content = null,
            IsPending = true,
            Attachments =
            [
                new FileAttachment
                {
                    FileName = filename,
                    FileSize = fileSize,
                    FileUrl = uploadResult.Value,
                    FileType = fileType,
                    CreatedAt = DateTime.UtcNow
                }
            ],
            CreatedAt = DateTime.UtcNow
        };

        await messageRepository.AddAsync(message, token);

        return new UploadMediaResponseDto(
            message.Id,
            uploadResult.Value,
            filename,
            fileSize,
            fileType,
            message.IsPending);
    }

    private static FileType ResolveFileType(string filename)
    {
        var extension = Path.GetExtension(filename).ToLowerInvariant();
        return extension switch
        {
            ".jpg" or ".jpeg" or ".png" or ".gif" or ".bmp" or ".webp" => FileType.Image,
            ".mp4" or ".avi" or ".mov" or ".wmv" or ".flv" or ".mkv" or ".webm" => FileType.Video,
            ".mp3" or ".wav" or ".ogg" or ".m4a" or ".aac" or ".flac" => FileType.Audio,
            _ => FileType.Document
        };
    }
}
