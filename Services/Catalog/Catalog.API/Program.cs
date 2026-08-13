using Catalog.API.Behaviors;
using Catalog.API.Exceptions;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMemoryCache();

builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
    cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
});

builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);
builder.Services.AddExceptionHandler<CustomExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddCarter();

builder.Services.AddMarten(opts =>
{
    opts.Connection(
        builder.Configuration.GetConnectionString("CatalogDb")!);
})
.UseLightweightSessions();

// Permitir que React (Netlify o Localhost) consuma Catalog.API sin bloqueos de CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Activa el manejador global de excepciones.
app.UseExceptionHandler();

// Permite peticiones CORS usando la política definida
app.UseCors("ReactApp");

app.MapCarter();

app.Run();