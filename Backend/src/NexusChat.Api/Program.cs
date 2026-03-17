using Microsoft.AspNetCore.Diagnostics;
using NexusChat.Api.Middlewares;
using NexusChat.Application.DependencyInjection;
using NexusChat.Infrastructure.DependencyInjection;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddInfrastructureService(builder.Configuration);
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseExceptionHandler();
app.MapOpenApi();
app.MapScalarApiReference();
app.MapControllers(); // use Scalar for API docs

// app.UseHttpsRedirection();
app.Run();

