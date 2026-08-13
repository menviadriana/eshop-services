using BuildingBlocks.Exceptions;
using MongoDB.Driver;
using Orders.API.Domain;

namespace Orders.API.Data
{
    public class OrderRepository : IOrderRepository
    {
        private readonly IMongoCollection<Order> _orders;

        public OrderRepository(IMongoDatabase database, MongoOrdersSettings settings)
        {
            _orders = database.GetCollection<Order>(settings.CollectionName);
        }

        public async Task<Order?> GetByIdAsync(string id, CancellationToken cancellationToken)
        {
            try
            {
                return await _orders
                    .Find(o => o.Id == id)
                    .FirstOrDefaultAsync(cancellationToken);
            }
            catch (MongoException ex)
            {
                // No exponemos ex.Message (puede traer detalles del servidor/driver).
                // Solo logueamos internamente vía la excepción original -> ver CustomExceptionHandler.
                throw new InternalServerException(
                    "Ocurrió un error al consultar la orden.",
                    ex.Message);
            }
        }

        public async Task<Order?> GetByIdempotencyKeyAsync(
            string customerId,
            string idempotencyKey,
            CancellationToken cancellationToken)
        {
            try
            {
                return await _orders
                    .Find(o => o.CustomerId == customerId && o.IdempotencyKey == idempotencyKey)
                    .FirstOrDefaultAsync(cancellationToken);
            }
            catch (MongoException ex)
            {
                throw new InternalServerException(
                    "Ocurrió un error al validar la idempotencia.",
                    ex.Message);
            }
        }

        public async Task<List<Order>> GetByCustomerIdAsync(
            string customerId,
            CancellationToken cancellationToken)
        {
            try
            {
                return await _orders
                    .Find(o => o.CustomerId == customerId)
                    .SortByDescending(o => o.CreatedAt)
                    .ToListAsync(cancellationToken);
            }
            catch (MongoException ex)
            {
                throw new InternalServerException(
                    "Ocurrió un error al consultar las órdenes del cliente.",
                    ex.Message);
            }
        }

        public async Task<List<Order>> GetAllAsync(CancellationToken cancellationToken)
        {
            try
            {
                return await _orders
                    .Find(FilterDefinition<Order>.Empty)
                    .SortByDescending(o => o.CreatedAt)
                    .Limit(200)
                    .ToListAsync(cancellationToken);
            }
            catch (MongoException ex)
            {
                throw new InternalServerException(
                    "Ocurrió un error al consultar el historial global de órdenes.",
                    ex.Message);
            }
        }

        public async Task CreateAsync(Order order, CancellationToken cancellationToken)
        {
            try
            {
                await _orders.InsertOneAsync(order, cancellationToken: cancellationToken);
            }
            catch (MongoException ex)
            {
                throw new InternalServerException(
                    "Ocurrió un error al guardar la orden.",
                    ex.Message);
            }
        }

        public async Task<bool> UpdateStatusAsync(
            string id,
            OrderStatus newStatus,
            CancellationToken cancellationToken)
        {
            try
            {
                var update = Builders<Order>.Update.Set(o => o.Status, newStatus);

                var result = await _orders.UpdateOneAsync(
                    o => o.Id == id,
                    update,
                    cancellationToken: cancellationToken);

                return result.ModifiedCount > 0;
            }
            catch (MongoException ex)
            {
                throw new InternalServerException(
                    "Ocurrió un error al actualizar el estado de la orden.",
                    ex.Message);
            }
        }
    }
}
