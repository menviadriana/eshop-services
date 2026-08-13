using BuildingBlocks.CQRS;
using Orders.API.Domain;

namespace Orders.API.Orders.UpdateOrderStatus
{
    public record UpdateOrderStatusCommand(string Id, OrderStatus NewStatus) : ICommand<Order>;
}
