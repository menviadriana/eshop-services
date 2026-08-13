using Carter;
using MediatR;
using Orders.API.Contracts;

namespace Orders.API.Orders.GetAllOrders
{
    public class GetAllOrdersEndpoint : ICarterModule
    {
        public void AddRoutes(IEndpointRouteBuilder app)
        {
            app.MapGet("/api/orders", async (ISender sender) =>
            {
                var orders = await sender.Send(new GetAllOrdersQuery());
                var response = orders.Select(OrderResponse.FromOrder).ToList();
                return Results.Ok(response);
            })
            .WithName("ConsultarHistorialGlobal")
            .Produces<List<OrderResponse>>(StatusCodes.Status200OK)
            .WithSummary("Listar el historial global de órdenes")
            .WithDescription(
                "Devuelve las últimas 200 órdenes de TODOS los clientes, más recientes primero. " +
                "Pensado para una vista tipo 'panel' donde cualquier usuario puede ver el historial " +
                "completo del sistema (no hay control de acceso por rol en este proyecto).");
        }
    }
}
