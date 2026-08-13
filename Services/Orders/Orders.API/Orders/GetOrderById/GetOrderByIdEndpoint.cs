using Carter;
using MediatR;
using Orders.API.Contracts;

namespace Orders.API.Orders.GetOrderById
{
    public class GetOrderByIdEndpoint : ICarterModule
    {
        public void AddRoutes(IEndpointRouteBuilder app)
        {
            app.MapGet("/api/orders/{id}", async (string id, ISender sender) =>
            {
                var order = await sender.Send(new GetOrderByIdQuery(id));
                return Results.Ok(OrderResponse.FromOrder(order));
            })
            .WithName("ConsultarOrden")
            .Produces<OrderResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .WithSummary("Consultar una orden por Id")
            .WithDescription("Recupera el detalle completo de una orden a partir de su identificador.");
        }
    }
}
