using BuildingBlocks.CQRS;
using Orders.API.Domain;

namespace Orders.API.Orders.GetOrderById
{
    public record GetOrderByIdQuery(string Id) : IQuery<Order>;
}
