namespace Orders.API.Clients
{
    public interface IBasketApiClient
    {
        // Devuelve null si el carrito no existe (Basket.API respondió 404).
        Task<ShoppingCartDto?> GetBasketAsync(string userName, CancellationToken cancellationToken);

        // "Best effort": si falla, no debe tumbar la creación de la orden
        // (la orden ya se guardó). Ver CreateOrderCommandHandler.
        Task<bool> ClearBasketAsync(string userName, CancellationToken cancellationToken);
    }
}
