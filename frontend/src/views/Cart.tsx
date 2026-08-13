import { useEffect, useState } from 'react'
import {
  getBasket,
  updateItemQuantity,
  removeItemFromBasket,
  createOrder,
  ApiError,
} from '../api'
import type { ShoppingCart, Order } from '../types'

const TAX_RATE = 0.16 // Vista previa en el front. El total real y definitivo
// SIEMPRE lo calcula y persiste Orders.API al crear la orden — esto es solo
// para que el usuario vea un estimado antes de pagar.

function money(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

interface Props {
  userName: string
  onOrderCreated: (order: Order) => void
  onCartChanged: () => void
}

function Cart({ userName, onOrderCreated, onCartChanged }: Props) {
  const [cart, setCart] = useState<ShoppingCart | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const result = await getBasket(userName)
      setCart(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el carrito.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName])

  async function handleQuantityChange(productId: string, quantity: number) {
    if (quantity < 1) return
    setLoading(true)
    try {
      const updated = await updateItemQuantity(userName, productId, quantity)
      setCart(updated)
      onCartChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar la cantidad.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(productId: string) {
    setLoading(true)
    try {
      const updated = await removeItemFromBasket(userName, productId)
      setCart(updated)
      onCartChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo quitar el producto.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckout() {
    setError(null)
    setLoading(true)
    try {
      const idempotencyKey = crypto.randomUUID()
      const newOrder = await createOrder(userName, userName, idempotencyKey)
      setCart(null)
      onOrderCreated(newOrder)
      onCartChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo generar la orden.')
    } finally {
      setLoading(false)
    }
  }

  const subtotal = cart?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) ?? 0
  const taxPreview = subtotal * TAX_RATE
  const isEmpty = !cart || cart.items.length === 0

  return (
    <section className="cart-layout">
      <div className="panel cart-items-panel">
        <div className="panel-header">
          <h2>Artículos seleccionados</h2>
          <span className="tag">{userName}</span>
        </div>

        {error && <p className="error-banner">{error}</p>}

        {isEmpty ? (
          <p className="empty">
            No tienes nada en el carrito todavía. Ve a "Productos" para elegir algo.
          </p>
        ) : (
          <ul className="cart-list-v2">
            {cart!.items.map((item) => (
              <li key={item.productId} className="cart-row-v2">
                <div className="cart-row-v2-info">
                  <p className="cart-item-name">{item.productName}</p>
                  <p className="cart-item-price">{money(item.price)} c/u</p>
                </div>
                <input
                  type="number"
                  min={1}
                  className="qty-input"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.productId, Number(e.target.value))}
                  disabled={loading}
                />
                <span className="num cart-row-v2-line">{money(item.price * item.quantity)}</span>
                <button
                  className="ghost small"
                  onClick={() => handleRemove(item.productId)}
                  disabled={loading}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="panel cart-summary-panel">
        <h2>Resumen</h2>
        <div className="receipt-row">
          <span>Subtotal</span>
          <span className="num">{money(subtotal)}</span>
        </div>
        <div className="receipt-row">
          <span>IVA estimado (16%)</span>
          <span className="num">{money(taxPreview)}</span>
        </div>
        <div className="receipt-row receipt-total">
          <span>Total estimado</span>
          <span className="num">{money(subtotal + taxPreview)}</span>
        </div>
        <p className="cart-summary-note">
          El total definitivo lo calcula el servidor al confirmar la compra.
        </p>
        <button
          className="primary checkout-button"
          onClick={handleCheckout}
          disabled={loading || isEmpty}
        >
          Confirmar compra
        </button>
      </aside>
    </section>
  )
}

export default Cart
