using BuildingBlocks.Behaviors;
using BuildingBlocks.Exceptions.Handler;
using Carter;
using FluentValidation;
using MongoDB.Driver;
using Orders.API.Clients;
using Orders.API.Data;
using Orders.API.Domain;
using Orders.API.Exceptions;

var builder = WebApplication.CreateBuilder(args);

var assembly = typeof(Program).Assembly;

// ---------- Carter + MediatR + FluentValidation (mismo patrón que Catalog/Basket) ----------
builder.Services.AddCarter();

builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(assembly);
    cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
    cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
});

builder.Services.AddValidatorsFromAssembly(assembly);

// ---------- MongoDB Atlas ----------
var mongoSettings = builder.Configuration
    .GetSection("MongoDb")
    .Get<MongoOrdersSettings>()
    ?? throw new InvalidOperationException(
        "Falta la sección 'MongoDb' en la configuración. Revisa appsettings.json o la variable de entorno MongoDb__ConnectionString.");

builder.Services.AddSingleton(mongoSettings);

builder.Services.AddSingleton<IMongoClient>(
    _ => new MongoClient(mongoSettings.ConnectionString));

builder.Services.AddSingleton(sp =>
{
    var client = sp.GetRequiredService<IMongoClient>();

    // El nombre de la base de datos viene incluido en la cadena de conexión
    // (ver .env -> MONGO_CONNECTION_STRING -> .../OrdersDb?...). Si no viene,
    // usamos "OrdersDb" como respaldo.
    var databaseName = MongoUrl.Create(mongoSettings.ConnectionString).DatabaseName;
    if (string.IsNullOrWhiteSpace(databaseName))
    {
        databaseName = "OrdersDb";
    }

    return client.GetDatabase(databaseName);
});

builder.Services.AddSingleton<IOrderRepository, OrderRepository>();

// ---------- Configuración de negocio ----------
var orderSettings = builder.Configuration
    .GetSection("OrderSettings")
    .Get<OrderSettings>()
    ?? new OrderSettings();

builder.Services.AddSingleton(orderSettings);

// ---------- Cliente HTTP hacia Basket.API ----------
var basketApiBaseUrl = builder.Configuration["BasketApi:BaseUrl"]
    ?? "http://localhost:6001";

builder.Services.AddHttpClient<IBasketApiClient, BasketApiClient>(client =>
{
    client.BaseAddress = new Uri(basketApiBaseUrl);
});

// ---------- Manejo de errores ----------
// Orden de registro importa: se intenta primero el handler específico de
// transición de estado (409) y si no aplica, cae al genérico de BuildingBlocks.
builder.Services.AddExceptionHandler<OrderStatusTransitionExceptionHandler>();
builder.Services.AddExceptionHandler<CustomExceptionHandler>();
builder.Services.AddProblemDetails();

// ---------- Swagger / OpenAPI (requisito del examen) ----------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Orders.API",
        Version = "v1",
        Description = "Microservicio de Órdenes de Compra - Examen práctico UTTT"
    });
});

// ---------- CORS para el frontend en React ----------
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

builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors("ReactApp");

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Orders.API v1");
});

// ---------- Índices de Mongo ----------
// Se crean (o confirman que ya existen) al arrancar. Si Mongo no responde en
// este momento, no tumbamos la app: solo lo dejamos en el log y seguimos
// (las peticiones normales igual fallarán con 500 si Mongo sigue caído,
// pero el servicio no se cae solo por esto).
try
{
    using var scope = app.Services.CreateScope();
    var database = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();
    var collection = database.GetCollection<Order>(mongoSettings.CollectionName);

    var idempotencyIndex = new CreateIndexModel<Order>(
        Builders<Order>.IndexKeys
            .Ascending(o => o.CustomerId)
            .Ascending(o => o.IdempotencyKey),
        new CreateIndexOptions<Order>
        {
            PartialFilterExpression = Builders<Order>.Filter.Exists(o => o.IdempotencyKey)
        });

    var customerIndex = new CreateIndexModel<Order>(
        Builders<Order>.IndexKeys.Ascending(o => o.CustomerId));

    await collection.Indexes.CreateManyAsync(new[] { idempotencyIndex, customerIndex });
}
catch (Exception ex)
{
    app.Logger.LogWarning(ex, "No se pudieron crear los índices de MongoDB al arrancar.");
}

app.MapCarter();
app.MapHealthChecks("/health");

app.Run();
