using iText.Kernel.Colors;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Draw;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using Orders.API.Domain;

namespace Orders.API.Orders.GetOrderPdf
{
    // Genera el ticket en PDF usando iText7, una librería 100% administrada
    // (sin dependencias nativas de sistema operativo). Se eligió a propósito
    // en vez de librerías basadas en Skia/HarfBuzz porque esas necesitan
    // librerías gráficas del sistema operativo (fontconfig, freetype, X11...)
    // que suelen faltar en imágenes base de Docker como
    // mcr.microsoft.com/dotnet/aspnet y provocan crashes (segmentation fault)
    // difíciles de diagnosticar. iText7 evita ese problema por completo.
    public static class OrderPdfDocument
    {
        public static byte[] Generate(Order order)
        {
            using var stream = new MemoryStream();

            using (var writer = new PdfWriter(stream))
            using (var pdf = new PdfDocument(writer))
            using (var document = new Document(pdf))
            {
                document.Add(new Paragraph("eShop").SetFontSize(22).SetBold());
                document.Add(new Paragraph("Ticket de Compra / Comprobante de Pago").SetFontSize(12));
                document.Add(new LineSeparator(new SolidLine()).SetMarginBottom(10));

                document.Add(new Paragraph($"Orden #: {order.Id}"));
                document.Add(new Paragraph($"Fecha: {order.CreatedAt:dd/MM/yyyy HH:mm} UTC"));
                document.Add(new Paragraph($"Cliente: {order.CustomerId}"));
                document.Add(new Paragraph($"Estado: {order.Status}").SetMarginBottom(15));

                var table = new Table(UnitValue.CreatePercentArray(new float[] { 4, 1, 2, 2 }))
                    .UseAllAvailableWidth();

                table.AddHeaderCell(HeaderCell("Producto"));
                table.AddHeaderCell(HeaderCell("Cant."));
                table.AddHeaderCell(HeaderCell("Precio unit."));
                table.AddHeaderCell(HeaderCell("Total"));

                foreach (var item in order.Items)
                {
                    table.AddCell(new Cell().Add(new Paragraph(item.ProductName)).SetBorder(iText.Layout.Borders.Border.NO_BORDER));
                    table.AddCell(new Cell().Add(new Paragraph(item.Quantity.ToString())).SetBorder(iText.Layout.Borders.Border.NO_BORDER));
                    table.AddCell(new Cell().Add(new Paragraph(item.UnitPrice.ToString("C2"))).SetTextAlignment(TextAlignment.RIGHT).SetBorder(iText.Layout.Borders.Border.NO_BORDER));
                    table.AddCell(new Cell().Add(new Paragraph(item.LineTotal.ToString("C2"))).SetTextAlignment(TextAlignment.RIGHT).SetBorder(iText.Layout.Borders.Border.NO_BORDER));
                }

                document.Add(table);

                document.Add(new Paragraph($"Subtotal: {order.Subtotal:C2}")
                    .SetTextAlignment(TextAlignment.RIGHT).SetMarginTop(10));
                document.Add(new Paragraph($"IVA (16%): {order.Tax:C2}")
                    .SetTextAlignment(TextAlignment.RIGHT));
                document.Add(new Paragraph($"TOTAL: {order.Total:C2}")
                    .SetBold().SetFontSize(13).SetTextAlignment(TextAlignment.RIGHT));

                document.Add(new LineSeparator(new SolidLine()).SetMarginTop(20));
                document.Add(new Paragraph("¡Gracias por tu compra!").SetFontSize(10).SetMarginTop(5));
                document.Add(new Paragraph("Conserva este documento como comprobante.").SetFontSize(9));
            }

            return stream.ToArray();
        }

        private static Cell HeaderCell(string text) =>
            new Cell()
                .Add(new Paragraph(text).SetBold())
                .SetBackgroundColor(new DeviceRgb(240, 240, 240))
                .SetBorder(iText.Layout.Borders.Border.NO_BORDER);
    }
}
