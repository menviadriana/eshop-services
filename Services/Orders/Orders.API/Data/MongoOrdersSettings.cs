namespace Orders.API.Data
{
    // Se llena desde appsettings.json / variables de entorno.
    // Ver Program.cs -> builder.Configuration.GetSection("MongoDb")
    public class MongoOrdersSettings
    {
        public string ConnectionString { get; set; } = default!;
        public string CollectionName { get; set; } = "orders";
    }
}
