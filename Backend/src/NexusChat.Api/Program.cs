using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using NexusChat.Api.Hubs;
using NexusChat.Api.Middlewares;
using NexusChat.Api.Services;
using NexusChat.Application.DependencyInjection;
using NexusChat.Application.Interfaces.FriendRequests;
using NexusChat.Application.Interfaces.Hubs;
using NexusChat.Infrastructure.Data.Configuration;
using NexusChat.Infrastructure.DependencyInjection;
using NexusChat.Infrastructure.Media;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddControllers()
    .AddJsonOptions(options => { options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()); });
builder.Services.AddProblemDetails();
builder.Services.Configure<ApiBehaviorOptions>(options => { options.SuppressModelStateInvalidFilter = true; });
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddInfrastructureService(builder.Configuration);
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.Configure<CloudinarySetting>(builder.Configuration.GetSection("Cloudinary"));
builder.Services.AddScoped<IRealtimeNotification, SignalRNotificationService>();
builder.Services.AddHybridCache(options =>
{
    options.DefaultEntryOptions = new HybridCacheEntryOptions
    {
        // memory-cache expiration
        // memory-cache expiration must be less than redis-cache
        LocalCacheExpiration = TimeSpan.FromMinutes(10),
        // redis cache expiration
        Expiration = TimeSpan.FromMinutes(10)
    };
});
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ??
                                   throw new InvalidOperationException("JWT_KEY is null"))
        ),
        ClockSkew = TimeSpan.Zero // set clock skew to zero to prevent token expiration issues
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/chat"))
                context.Token = accessToken;

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddRateLimiter(options =>
{
    // return 429 Too Many Requests when the client exceeds the rate limit
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter = $"{retryAfter.TotalSeconds}";
            var problemDetailsFactory = context.HttpContext.RequestServices
                                            .GetService<ProblemDetailsFactory>() ??
                                        throw new InvalidOperationException(
                                            "ProblemDetailsFactory is null");
            var problemDetails = problemDetailsFactory
                .CreateProblemDetails(
                    context.HttpContext,
                    StatusCodes.Status429TooManyRequests,
                    "Too many requests",
                    detail: $"Please retry after {retryAfter.TotalSeconds} seconds");

            await context.HttpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        }
    };
    // this is for heavy-load api
    options.AddConcurrencyLimiter("concurrency", option =>
    {
        option.PermitLimit = 20;
        option.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        option.QueueLimit = 0;
    });

    options.AddPolicy("limit-per-user", httpContext =>
    {
        var userId = httpContext.User.FindFirstValue("userId");
        if (!string.IsNullOrEmpty(userId))
            return RateLimitPartition.GetTokenBucketLimiter(
                userId,
                _ => new TokenBucketRateLimiterOptions
                {
                    TokenLimit = 10,
                    TokensPerPeriod = 3,
                    ReplenishmentPeriod = TimeSpan.FromMinutes(1)
                });

        return RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });
});
// Connect between Interface and Impliment of Notification
builder.Services.AddScoped<INotificationService, NotificationService>();

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();
    await MongoIndexConfig.CreateIndexAsync(database);
}

// Configure the HTTP request pipeline.
app.UseExceptionHandler();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapOpenApi();
app.MapScalarApiReference();
app.MapControllers(); // use Scalar for API docs
app.MapHub<ChatHub>("/hubs/chat");
app.Run();