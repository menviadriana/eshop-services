using FluentValidation;

namespace Orders.API.Orders.CreateOrder
{
    public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
    {
        public CreateOrderCommandValidator()
        {
            RuleFor(x => x.CustomerId)
                .NotEmpty()
                .WithMessage("customerId es obligatorio.");

            RuleFor(x => x.BasketId)
                .NotEmpty()
                .WithMessage("basketId es obligatorio.");
        }
    }
}
