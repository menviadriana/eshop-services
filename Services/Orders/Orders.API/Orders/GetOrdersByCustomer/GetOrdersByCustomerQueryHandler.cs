using BuildingBlocks.CQRS;
using Orders.API.Data;
using Orders.API.Domain;

namespace Orders.API.Orders.GetOrdersByCustomer
{
    public class GetOrdersByCustomerQueryHandler(IOrderRepository orderRepository)
        : IQueryHandler<GetOrdersByCustomerQuery, List<Order>>
    {
        public Task<List<Order>> Handle(
            GetOrdersByCustomerQuery query,
            CancellationToken cancellationToken)
        {
            // No lanzamos NotFoundException si no hay órdenes: un cliente sin
            // compras todavía es un caso válido, responde 200 con lista vacía.
            return orderRepository.GetByCustomerIdAsync(query.CustomerId, cancellationToken);
        }
    }
}
