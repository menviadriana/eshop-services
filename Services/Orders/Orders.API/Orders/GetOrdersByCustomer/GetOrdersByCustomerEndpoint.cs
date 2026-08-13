using Carter;
using MediatR;
using Orders.API.Contracts;

namespace Orders.API.Orders.GetOrdersByCustomer
{
    public class GetOrdersByCustomerEndpoint : ICarterModule
    {
        public void AddRoutes(IEndpointRouteBuilder app)
        {
            app.MapGet("/api/orders/customer/{customerId}", async (
                string customerId,
                ISender sender) =>
            {
                var orders = await sender.Send(new GetOrdersByCustomerQuery(customerId));
                var response = orders.Select(OrderResponse.FromOrder).ToList();
                return Results.Ok(response);
            })
            .WithName("ConsultarOrdenesPorCliente")
            .Produces<List<OrderResponse>>(StatusCodes.Status200OK)
            .WithSummary("Listar las órdenes de un cliente")
            .WithDescription("Devuelve todas las órdenes generadas por un cliente, más recientes primero.");
        }
    }
}
