using BuildingBlocks.CQRS;
using Orders.API.Domain;

namespace Orders.API.Orders.GetOrdersByCustomer
{
    public record GetOrdersByCustomerQuery(string CustomerId) : IQuery<List<Order>>;
}
