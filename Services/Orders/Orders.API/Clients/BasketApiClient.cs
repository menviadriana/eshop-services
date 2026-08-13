using System.Net;
using System.Net.Http.Json;

namespace Orders.API.Clients
{
    // Se registra como Typed Client en Program.cs con builder.Services.AddHttpClient<IBasketApiClient, BasketApiClient>
    // así que HttpClient ya viene con la BaseAddress configurada (BasketApi:BaseUrl).
    public class BasketApiClient(HttpClient httpClient, ILogger<BasketApiClient> logger) : IBasketApiClient
    {
        public async Task<ShoppingCartDto?> GetBasketAsync(string userName, CancellationToken cancellationToken)
        {
            var response = await httpClient.GetAsync($"/basket/{userName}", cancellationToken);

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();

            var payload = await response.Content.ReadFromJsonAsync<GetBasketResponseDto>(
                cancellationToken: cancellationToken);

            return payload?.Cart;
        }

        public async Task<bool> ClearBasketAsync(string userName, CancellationToken cancellationToken)
        {
            try
            {
                var response = await httpClient.DeleteAsync($"/basket/{userName}", cancellationToken);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                // No propagamos el error: la orden ya se guardó en Mongo y eso
                // es lo importante. Solo dejamos evidencia en el log.
                logger.LogWarning(
                    ex,
                    "No se pudo vaciar el carrito de {UserName} después de crear la orden.",
                    userName);
                return false;
            }
        }
    }
}
