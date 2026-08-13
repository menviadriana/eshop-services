namespace Orders.API.Exceptions
{
    public class InvalidOrderStatusTransitionException : Exception
    {
        public InvalidOrderStatusTransitionException(string currentStatus, string requestedStatus)
            : base($"No se puede cambiar la orden de '{currentStatus}' a '{requestedStatus}'.")
        {
        }
    }
}
