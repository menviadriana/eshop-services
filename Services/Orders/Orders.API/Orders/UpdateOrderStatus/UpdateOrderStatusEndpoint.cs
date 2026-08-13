using BuildingBlocks.Exceptions;
using Carter;
using MediatR;
using Orders.API.Contracts;
using Orders.API.Domain;

namespace Orders.API.Orders.UpdateOrderStatus
{
    public record UpdateOrderStatusRequest(string Status);

    public class UpdateOrderStatusEndpoint : ICarterModule
    {
        public void AddRoutes(IEndpointRouteBuilder app)
        {
            app.MapPatch("/api/orders/{id}/status", async (
                string id,
                UpdateOrderStatusRequest request,
                ISender sender) =>
            {
                if (!Enum.TryParse<OrderStatus>(request.Status, ignoreCase: true, out var newStatus))
                {
                    throw new BadRequestException(
                        $"'{request.Status}' no es un estado válido. Usa Pending, Confirmed o Cancelled.");
                }

                var order = await sender.Send(new UpdateOrderStatusCommand(id, newStatus));
                return Results.Ok(OrderResponse.FromOrder(order));
            })
            .WithName("ActualizarEstadoOrden")
            .Produces<OrderResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .WithSummary("Cambiar el estado de una orden")
            .WithDescription(
                "Transiciones válidas: Pending -> Confirmed y Pending -> Cancelled. " +
                "Cualquier otra combinación responde 409 Conflict.");
        }
    }
}
