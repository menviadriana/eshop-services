import { useEffect, useState } from 'react'
import {
  addItemToBasket,
  clearBasket,
  createOrder,
  getBasket,
  getOrdersByCustomer,
  ApiError,
} from './api'
import type { ShoppingCart, Order } from './types'

// Como este proyecto todavía no tiene un catálogo navegable en el frontend,
// el botón "Agregar producto de ejemplo" manda siempre este producto de
// prueba. Es una decisión deliberada para poder demostrar el flujo completo
// de compra sin necesitar construir un catálogo completo (fuera del alcance
// del examen de Órdenes). Documentado también en el README.
const DEMO_PRODUCT = {
  productId: '00000000-0000-0000-0000-000000000001',
  productName: 'Producto de prueba',
  price: 150.5,
  color: 'N/A',
}

function money(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

function App() {
  const [customerId, setCustomerId] = useState('adriana')
  const [cart, setCart] = useState<ShoppingCart | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [history, setHistory] = useState<Order[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadBasket(name: string) {
    try {
      const result = await getBasket(name)
      setCart(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el carrito.')
    }
  }

  useEffect(() => {
    loadBasket(customerId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAddDemoProduct() {
    setError(null)
    setLoading(true)
    try {
      const updated = await addItemToBasket(customerId, { ...DEMO_PRODUCT, quantity: 1 })
      setCart(updated)
      setOrder(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo agregar el producto.')
    } finally {
      setLoading(false)
    }
  }

  async function handleClearBasket() {
    setLoading(true)
    await clearBasket(customerId)
    setCart(null)
    setLoading(false)
  }

  async function handlePurchase() {
    setError(null)
    setLoading(true)
    try {
      // Una Idempotency-Key nueva por cada intento de compra: si el usuario
      // hace doble clic o reenvía por un error de red, el backend detecta la
      // repetición y no genera una orden duplicada.
      const idempotencyKey = crypto.randomUUID()
      const newOrder = await createOrder(customerId, customerId, idempotencyKey)
      setOrder(newOrder)
      setCart(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo generar la orden.')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleHistory() {
    if (!showHistory) {
      try {
        const orders = await getOrdersByCustomer(customerId)
        setHistory(orders)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar el historial.')
      }
    }
    setShowHistory(!showHistory)
  }

  return (
    <div className="page">
      <header className="topbar">
        <span className="wordmark">eshop-services</span>
        <span className="tagline">microservicio de órdenes · UTTT</span>
      </header>

      <main className="layout">
        <section className="panel">
          <label className="field">
            <span>Cliente</span>
            <input
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value)
                setOrder(null)
              }}
              onBlur={() => loadBasket(customerId)}
            />
          </label>

          <div className="panel-header">
            <h2>Carrito</h2>
            <button className="ghost" onClick={handleAddDemoProduct} disabled={loading}>
              + Agregar producto de ejemplo
            </button>
          </div>

          {!cart || cart.items.length === 0 ? (
            <p className="empty">
              El carrito de <strong>{customerId}</strong> está vacío. Agrega un producto para
              continuar.
            </p>
          ) : (
            <>
              <ul className="cart-list">
                {cart.items.map((item) => (
                  <li key={item.productId} className="cart-row">
                    <span>
                      {item.productName} <em>× {item.quantity}</em>
                    </span>
                    <span className="num">{money(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="cart-total">
                <span>Total del carrito</span>
                <span className="num">{money(cart.totalPrice)}</span>
              </div>
            </>
          )}

          {error && <p className="error-banner">{error}</p>}

          <div className="actions">
            <button
              className="primary"
              onClick={handlePurchase}
              disabled={loading || !cart || cart.items.length === 0}
            >
              Realizar compra
            </button>
            <button className="ghost" onClick={handleClearBasket} disabled={loading || !cart}>
              Vaciar carrito
            </button>
          </div>

          <button className="link" onClick={handleToggleHistory}>
            {showHistory ? 'Ocultar historial de compras' : 'Ver historial de compras'}
          </button>

          {showHistory && (
            <ul className="history-list">
              {history.length === 0 && <li className="empty">Todavía no hay órdenes.</li>}
              {history.map((o) => (
                <li key={o.id} className="history-row">
                  <span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span>
                  <span className="num">{money(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel receipt-slot">
          {order ? <Receipt order={order} /> : <ReceiptPlaceholder />}
        </section>
      </main>
    </div>
  )
}

function Receipt({ order }: { order: Order }) {
  return (
    <div className="receipt">
      <h2>Compra confirmada</h2>
      <p className="receipt-id">#{order.id}</p>
      <p className="receipt-date">{new Date(order.createdAt).toLocaleString('es-MX')}</p>

      <div className="receipt-divider" />

      <ul className="receipt-items">
        {order.items.map((item) => (
          <li key={item.productId}>
            <span>
              {item.quantity} × {item.productName}
            </span>
            <span className="num">{money(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <div className="receipt-divider" />

      <div className="receipt-row">
        <span>Subtotal</span>
        <span className="num">{money(order.subtotal)}</span>
      </div>
      <div className="receipt-row">
        <span>IVA</span>
        <span className="num">{money(order.tax)}</span>
      </div>
      <div className="receipt-row receipt-total">
        <span>Total</span>
        <span className="num">{money(order.total)}</span>
      </div>

      <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span>
    </div>
  )
}

function ReceiptPlaceholder() {
  return (
    <div className="receipt-placeholder">
      <p>Aquí aparecerá el comprobante en cuanto realices una compra.</p>
    </div>
  )
}

export default App
