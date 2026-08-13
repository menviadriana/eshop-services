namespace Orders.API.Clients
{
    // Estas clases reflejan la forma exacta en la que Basket.API responde
    // en GET /basket/{userName}. Ver Basket.API/Basket/GetBasket/GetBasketEndPoints.cs
    public record BasketItemDto(
        int Quantity,
        string? Color,
        decimal Price,
        Guid ProductId,
        string ProductName);

    public record ShoppingCartDto(
        string UserName,
        List<BasketItemDto> Items,
        decimal TotalPrice);

    public record GetBasketResponseDto(ShoppingCartDto Cart);
}
