using Orders.API.Domain;

namespace Orders.API.Contracts
{
    public record OrderItemResponse(
        Guid ProductId,
        string ProductName,
        int Quantity,
        decimal UnitPrice,
        decimal LineTotal);

    public record OrderResponse(
        string Id,
        string CustomerId,
        DateTime CreatedAt,
        string Status,
        List<OrderItemResponse> Items,
        decimal Subtotal,
        decimal Tax,
        decimal Total)
    {
        // Mapeo explícito en vez de Mapster: son pocos campos y así queda
        // clarísimo qué se expone al cliente (por ejemplo, nunca exponemos
        // IdempotencyKey ni BasketId hacia afuera).
        public static OrderResponse FromOrder(Order order) => new(
            order.Id,
            order.CustomerId,
            order.CreatedAt,
            order.Status.ToString(),
            order.Items.Select(i => new OrderItemResponse(
                i.ProductId,
                i.ProductName,
                i.Quantity,
                i.UnitPrice,
                i.LineTotal)).ToList(),
            order.Subtotal,
            order.Tax,
            order.Total);
    }
}
