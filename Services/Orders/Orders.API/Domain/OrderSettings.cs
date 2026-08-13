namespace Orders.API.Domain
{
    // Se llena desde appsettings.json -> sección "OrderSettings".
    public class OrderSettings
    {
        // 0.16 = 16% de IVA. Configurable para no dejarlo "quemado" en el código.
        public decimal TaxRate { get; set; } = 0.16m;
    }
}
