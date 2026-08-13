using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Orders.API.Exceptions
{
    // Este handler se registra ANTES que el CustomExceptionHandler de BuildingBlocks
    // (ver Program.cs). ASP.NET Core prueba los IExceptionHandler en el orden en que
    // se registraron; si este no reconoce la excepción, devuelve false y deja que
    // el siguiente handler (el genérico de BuildingBlocks) se encargue.
    public class OrderStatusTransitionExceptionHandler(
        ILogger<OrderStatusTransitionExceptionHandler> logger) : IExceptionHandler
    {
        public async ValueTask<bool> TryHandleAsync(
            HttpContext context,
            Exception exception,
            CancellationToken cancellationToken)
        {
            if (exception is not InvalidOrderStatusTransitionException)
            {
                return false;
            }

            logger.LogWarning(
                "Transición de estado inválida: {Message}",
                exception.Message);

            context.Response.StatusCode = StatusCodes.Status409Conflict;

            var problemDetails = new ProblemDetails
            {
                Title = "InvalidOrderStatusTransitionException",
                Detail = exception.Message,
                Status = StatusCodes.Status409Conflict,
                Instance = context.Request.Path
            };

            await context.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

            return true;
        }
    }
}
