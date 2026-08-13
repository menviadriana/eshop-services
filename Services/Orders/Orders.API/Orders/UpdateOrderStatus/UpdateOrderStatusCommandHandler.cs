using BuildingBlocks.CQRS;
using BuildingBlocks.Exceptions;
using Orders.API.Data;
using Orders.API.Domain;
using Orders.API.Exceptions;

namespace Orders.API.Orders.UpdateOrderStatus
{
    public class UpdateOrderStatusCommandHandler(IOrderRepository orderRepository)
        : ICommandHandler<UpdateOrderStatusCommand, Order>
    {
        public async Task<Order> Handle(
            UpdateOrderStatusCommand command,
            CancellationToken cancellationToken)
        {
            var order = await orderRepository.GetByIdAsync(command.Id, cancellationToken);

            if (order is null)
            {
                throw new NotFoundException("Order", command.Id);
            }

            // Regla de negocio del examen: una orden Cancelled no puede volver
            // a Confirmed, y en general solo se permite Pending -> Confirmed
            // y Pending -> Cancelled. La regla vive en Order.CanTransitionTo,
            // no aquí, para que cualquier otro lugar del código la reutilice
            // igual (una sola fuente de verdad).
            if (!Order.CanTransitionTo(order.Status, command.NewStatus))
            {
                throw new InvalidOrderStatusTransitionException(
                    order.Status.ToString(),
                    command.NewStatus.ToString());
            }

            await orderRepository.UpdateStatusAsync(command.Id, command.NewStatus, cancellationToken);

            order.Status = command.NewStatus;
            return order;
        }
    }
}
