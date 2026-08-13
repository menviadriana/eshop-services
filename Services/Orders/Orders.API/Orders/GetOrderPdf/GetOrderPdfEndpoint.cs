using Carter;
using MediatR;
using Orders.API.Orders.GetOrderById;

namespace Orders.API.Orders.GetOrderPdf
{
    public class GetOrderPdfEndpoint : ICarterModule
    {
        public void AddRoutes(IEndpointRouteBuilder app)
        {
            app.MapGet("/api/orders/{id}/pdf", async (string id, ISender sender) =>
            {
                // Reutilizamos el mismo query que ya usa GET /api/orders/{id}:
                // si la orden no existe, lanza NotFoundException igual (-> 404),
                // no hay lógica duplicada de búsqueda.
                var order = await sender.Send(new GetOrderByIdQuery(id));

                var pdfBytes = OrderPdfDocument.Generate(order);

                return Results.File(
                    pdfBytes,
                    contentType: "application/pdf",
                    fileDownloadName: $"Ticket_{order.Id}.pdf");
            })
            .WithName("DescargarOrdenPdf")
            .Produces(StatusCodes.Status200OK, contentType: "application/pdf")
            .ProducesProblem(StatusCodes.Status404NotFound)
            .WithSummary("Descargar el ticket de una orden en PDF")
            .WithDescription("Genera un PDF del comprobante de compra al vuelo (no se guarda en disco).");
        }
    }
}
