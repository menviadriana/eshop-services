using BuildingBlocks.CQRS;
using Orders.API.Data;
using Orders.API.Domain;

namespace Orders.API.Orders.GetAllOrders
{
    public class GetAllOrdersQueryHandler(IOrderRepository orderRepository)
        : IQueryHandler<GetAllOrdersQuery, List<Order>>
    {
        public Task<List<Order>> Handle(GetAllOrdersQuery query, CancellationToken cancellationToken)
        {
            return orderRepository.GetAllAsync(cancellationToken);
        }
    }
}
