using BuildingBlocks.CQRS;
using Orders.API.Domain;

namespace Orders.API.Orders.GetAllOrders
{
    public record GetAllOrdersQuery() : IQuery<List<Order>>;
}
