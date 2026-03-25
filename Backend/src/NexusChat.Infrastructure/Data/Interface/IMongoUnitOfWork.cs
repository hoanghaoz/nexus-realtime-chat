using MongoDB.Driver;
using NexusChat.Application.Interfaces.Common;

namespace NexusChat.Infrastructure.Data.Interface;

public interface IMongoUnitOfWork : IUnitOfWork
{
    IClientSessionHandle? SessionHandle { get; }
}