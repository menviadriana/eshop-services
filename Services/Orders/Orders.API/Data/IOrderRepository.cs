using Orders.API.Domain;

namespace Orders.API.Data
{
    public interface IOrderRepository
    {
        Task<Order?> GetByIdAsync(string id, CancellationToken cancellationToken);

        Task<Order?> GetByIdempotencyKeyAsync(
            string customerId,
            string idempotencyKey,
            CancellationToken cancellationToken);

        Task<List<Order>> GetByCustomerIdAsync(
            string customerId,
            CancellationToken cancellationToken);

        // Historial global: todas las órdenes, de cualquier cliente.
        // Se limita a las últimas 200 para no traer una colección entera
        // a memoria si el proyecto crece.
        Task<List<Order>> GetAllAsync(CancellationToken cancellationToken);

        Task CreateAsync(Order order, CancellationToken cancellationToken);

        Task<bool> UpdateStatusAsync(
            string id,
            OrderStatus newStatus,
            CancellationToken cancellationToken);
    }
}
