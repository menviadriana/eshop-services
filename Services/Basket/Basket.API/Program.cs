using Basket.API.Data;
using Basket.API.Models;
using BuildingBlocks.Behaviors;
using BuildingBlocks.Exceptions.Handler;
using Carter;
using Marten;
using Microsoft.Extensions.Caching.Distributed;

var builder = WebApplication.CreateBuilder(args);

var assembly = typeof(Program).Assembly;

// Agregar servicios al contenedor
builder.Services.AddCarter();

builder.Services.AddMediatR(conf =>
{
    conf.RegisterServicesFromAssembly(assembly);
    conf.AddOpenBehavior(typeof(ValidationBehavior<,>));
    conf.AddOpenBehavior(typeof(LoggingBehavior<,>));
});

builder.Services.AddMarten(opt =>
{
    opt.Connection(
        builder.Configuration.GetConnectionString("Database")!);

    opt.Schema
        .For<ShoppingCart>()
        .Identity(x => x.UserName);
})
.UseLightweightSessions();

builder.Services.AddScoped<IBasketRepository, BasketRepository>();

// Utilizamos el patrón Decorator mediante Scrutor.
builder.Services.Decorate<IBasketRepository, CachedBasketRepository>();

// Configuramos Redis para caché distribuida.
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration =
        builder.Configuration.GetConnectionString("Redis");
});

// Configuramos el manejador global de excepciones.
builder.Services.AddExceptionHandler<CustomExceptionHandler>();
builder.Services.AddProblemDetails();

// Permitimos que React consuma Basket.API.
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Agregamos puntos de salud.
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configuramos las excepciones.
app.UseExceptionHandler();

// Permitimos las solicitudes desde React.
app.UseCors("ReactApp");

// Configuramos los endpoints.
app.MapCarter();

// Endpoint de salud.
app.MapHealthChecks("/health");

app.Run();