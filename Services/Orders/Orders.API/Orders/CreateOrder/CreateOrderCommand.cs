using BuildingBlocks.CQRS;
using Orders.API.Domain;

namespace Orders.API.Orders.CreateOrder
{
    public record CreateOrderCommand(
        string CustomerId,
        string BasketId,
        string? IdempotencyKey) : ICommand<CreateOrderResult>;

    // WasIdempotentReplay = true significa que no se creó una orden nueva:
    // se encontró una orden previa con la misma Idempotency-Key y se devolvió esa.
    public record CreateOrderResult(Order Order, bool WasIdempotentReplay);
}
