using Basket.API.Data;
using Basket.API.Models;
using BuildingBlocks.CQRS;
using FluentValidation;

namespace Basket.API.Basket.StoreBasket
{
    public record StoreBasketCommand(ShoppingCart Cart)
        : ICommand<StoreBasketResult>;

    public record StoreBasketResult(string UserName);

    public class StoreBasketCommandValidator
        : AbstractValidator<StoreBasketCommand>
    {
        // Las validaciones siempre se crean dentro del constructor.
        public StoreBasketCommandValidator()
        {
            RuleFor(x => x.Cart)
                .NotNull()
                .WithMessage("El carrito no puede ser null");

            When(x => x.Cart is not null, () =>
            {
                RuleFor(x => x.Cart.UserName)
                    .NotEmpty()
                    .WithMessage("El nombre de usuario es requerido");

                RuleFor(x => x.Cart.Items)
                    .NotNull()
                    .NotEmpty()
                    .WithMessage("El carrito debe contener al menos un producto");

                RuleForEach(x => x.Cart.Items)
                    .ChildRules(item =>
                    {
                        item.RuleFor(x => x.ProductId)
                            .NotEmpty()
                            .WithMessage("El identificador del producto es requerido");

                        item.RuleFor(x => x.ProductName)
                            .NotEmpty()
                            .WithMessage("El nombre del producto es requerido");

                        item.RuleFor(x => x.Quantity)
                            .GreaterThan(0)
                            .WithMessage("La cantidad debe ser mayor a cero");

                        item.RuleFor(x => x.Price)
                            .GreaterThanOrEqualTo(0)
                            .WithMessage("El precio no puede ser negativo");
                    });
            });
        }
    }

    public class StoreBasketCommandHandler(
        IBasketRepository repository)
        : ICommandHandler<StoreBasketCommand, StoreBasketResult>
    {
        public async Task<StoreBasketResult> Handle(
            StoreBasketCommand command,
            CancellationToken cancellationToken)
        {
            ShoppingCart cart = command.Cart;

            await repository.StoreBasket(
                cart,
                cancellationToken);

            return new StoreBasketResult(
                command.Cart.UserName);
        }
    }
}