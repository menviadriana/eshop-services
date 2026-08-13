using Carter;
using MediatR;
using Orders.API.Contracts;

namespace Orders.API.Orders.CreateOrder
{
    public record CreateOrderRequest(string CustomerId, string BasketId);

    public class CreateOrderEndpoint : ICarterModule
    {
        private const string IdempotencyHeaderName = "Idempotency-Key";

        public void AddRoutes(IEndpointRouteBuilder app)
        {
            app.MapPost("/api/orders", async (
                CreateOrderRequest request,
                HttpRequest httpRequest,
                ISender sender) =>
            {
                string? idempotencyKey = httpRequest.Headers.TryGetValue(
                    IdempotencyHeaderName,
                    out var headerValue)
                    ? headerValue.ToString()
                    : null;

                var command = new CreateOrderCommand(
                    request.CustomerId,
                    request.BasketId,
                    idempotencyKey);

                var result = await sender.Send(command);

                var response = OrderResponse.FromOrder(result.Order);

                // Si fue una repetición idempotente, respondemos 200 (no se creó
                // nada nuevo). Si fue una orden nueva, respondemos 201 Created,
                // como pide el examen.
                return result.WasIdempotentReplay
                    ? Results.Ok(response)
                    : Results.Created($"/api/orders/{response.Id}", response);
            })
            .WithName("CrearOrden")
            .Produces<OrderResponse>(StatusCodes.Status201Created)
            .Produces<OrderResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .WithSummary("Crear una orden de compra")
            .WithDescription(
                "Genera una orden a partir del carrito del cliente en Basket.API. " +
                "Acepta el header opcional 'Idempotency-Key' para evitar duplicados " +
                "ante reintentos de la misma solicitud.");
        }
    }
}
