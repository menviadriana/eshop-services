using BuildingBlocks.CQRS;
using BuildingBlocks.Exceptions;
using Orders.API.Data;
using Orders.API.Domain;

namespace Orders.API.Orders.GetOrderById
{
    public class GetOrderByIdQueryHandler(IOrderRepository orderRepository)
        : IQueryHandler<GetOrderByIdQuery, Order>
    {
        public async Task<Order> Handle(
            GetOrderByIdQuery query,
            CancellationToken cancellationToken)
        {
            var order = await orderRepository.GetByIdAsync(query.Id, cancellationToken);

            if (order is null)
            {
                throw new NotFoundException("Order", query.Id);
            }

            return order;
        }
    }
}
