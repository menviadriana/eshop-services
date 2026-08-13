using BuildingBlocks.CQRS;
using BuildingBlocks.Exceptions;
using Orders.API.Clients;
using Orders.API.Data;
using Orders.API.Domain;

namespace Orders.API.Orders.CreateOrder
{
    public class CreateOrderCommandHandler(
        IOrderRepository orderRepository,
        IBasketApiClient basketApiClient,
        OrderSettings orderSettings,
        ILogger<CreateOrderCommandHandler> logger)
        : ICommandHandler<CreateOrderCommand, CreateOrderResult>
    {
        public async Task<CreateOrderResult> Handle(
            CreateOrderCommand command,
            CancellationToken cancellationToken)
        {
            // 1. Idempotencia: si el cliente ya mandó esta misma Idempotency-Key
            //    antes, regresamos la orden que ya existe en vez de crear otra.
            if (!string.IsNullOrWhiteSpace(command.IdempotencyKey))
            {
                var existingOrder = await orderRepository.GetByIdempotencyKeyAsync(
                    command.CustomerId,
                    command.IdempotencyKey,
                    cancellationToken);

                if (existingOrder is not null)
                {
                    logger.LogInformation(
                        "Idempotency-Key {Key} ya existía. Se devuelve la orden {OrderId} sin crear una nueva.",
                        command.IdempotencyKey,
                        existingOrder.Id);

                    return new CreateOrderResult(existingOrder, WasIdempotentReplay: true);
                }
            }

            // 2. Consultamos el carrito real en Basket.API. No confiamos en que
            //    el cliente nos mande los productos/precios directamente: eso
            //    abriría la puerta a que alguien "arme" una orden con precios
            //    inventados.
            var cart = await basketApiClient.GetBasketAsync(command.BasketId, cancellationToken);

            if (cart is null || cart.Items.Count == 0)
            {
                throw new BadRequestException(
                    "El carrito está vacío o no existe. No se puede generar la orden.");
            }

            // 3. Validamos que cada línea del carrito tenga datos consistentes.
            foreach (var item in cart.Items)
            {
                if (item.Quantity <= 0)
                {
                    throw new BadRequestException(
                        $"La cantidad del producto '{item.ProductName}' debe ser mayor a cero.");
                }

                if (item.Price < 0)
                {
                    throw new BadRequestException(
                        $"El precio del producto '{item.ProductName}' es inválido.");
                }
            }

            // 4. Armamos las líneas de la orden. El precio se copia del carrito
            //    en este instante ("la orden conserva el precio utilizado al
            //    momento de comprar" - punto 2 del examen).
            var orderItems = cart.Items.Select(item => new OrderItem
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                Quantity = item.Quantity,
                UnitPrice = item.Price,
                LineTotal = Math.Round(item.Price * item.Quantity, 2)
            }).ToList();

            var subtotal = Math.Round(orderItems.Sum(i => i.LineTotal), 2);
            var tax = Math.Round(subtotal * orderSettings.TaxRate, 2);
            var total = subtotal + tax;

            var order = new Order
            {
                CustomerId = command.CustomerId,
                BasketId = command.BasketId,
                Status = OrderStatus.Pending,
                Items = orderItems,
                Subtotal = subtotal,
                Tax = tax,
                Total = total,
                IdempotencyKey = command.IdempotencyKey
            };

            // 5. Persistimos. Si Mongo falla, OrderRepository ya convierte el
            //    error en InternalServerException sin exponer detalles internos.
            await orderRepository.CreateAsync(order, cancellationToken);

            // 6. Vaciamos el carrito. Es "best effort": si falla, no revertimos
            //    la orden (ya está guardada y es la fuente de verdad de la compra).
            await basketApiClient.ClearBasketAsync(command.BasketId, cancellationToken);

            return new CreateOrderResult(order, WasIdempotentReplay: false);
        }
    }
}
