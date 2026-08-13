using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Orders.API.Domain
{
    // [BsonIgnoreExtraElements] evita que la app truene si el documento en Mongo
    // llega a tener campos que ya no existen en esta clase (por ejemplo, si el
    // modelo cambia en el futuro). Es una capa extra de tolerancia.
    [BsonIgnoreExtraElements]
    public class Order
    {
        [BsonId]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string CustomerId { get; set; } = default!;

        // Identificador del carrito de origen. En este proyecto, Basket.API
        // identifica el carrito por el nombre de usuario (no existe un
        // "basketId" separado), así que aquí guardamos ese mismo valor.
        public string BasketId { get; set; } = default!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Sin este atributo, Mongo guardaría el enum como número (0, 1, 2).
        // Lo guardamos como texto para que la colección sea legible a simple
        // vista en MongoDB Atlas (Database -> Browse Collections).
        [BsonRepresentation(BsonType.String)]
        public OrderStatus Status { get; set; } = OrderStatus.Pending;

        public List<OrderItem> Items { get; set; } = new();

        public decimal Subtotal { get; set; }

        public decimal Tax { get; set; }

        public decimal Total { get; set; }

        // Clave de idempotencia que mandó el cliente en el header
        // Idempotency-Key. Puede ser null si el cliente no la mandó.
        public string? IdempotencyKey { get; set; }

        // Reglas de transición de estado, centralizadas aquí para que
        // ningún otro lugar del código pueda "saltarse" la regla de negocio.
        public static bool CanTransitionTo(OrderStatus current, OrderStatus next)
        {
            return (current, next) switch
            {
                (OrderStatus.Pending, OrderStatus.Confirmed) => true,
                (OrderStatus.Pending, OrderStatus.Cancelled) => true,
                _ => false
            };
        }
    }
}
