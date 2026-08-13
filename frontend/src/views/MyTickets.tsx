import { useEffect, useState } from 'react'
import { getOrdersByCustomer, downloadOrderPdf, ApiError } from '../api'
import type { Order } from '../types'

function money(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

interface Props {
  userName: string
  onView: (order: Order) => void
}

function MyTickets({ userName, onView }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await getOrdersByCustomer(userName)
      setOrders(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar tu historial.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName])

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Mis compras</h2>
        <button className="ghost small" onClick={load} disabled={loading}>
          Actualizar
        </button>
      </div>
      <p className="section-subtitle-plain">
        Historial de compras de <strong>{userName}</strong>
      </p>

      {error && <p className="error-banner">{error}</p>}

      {orders.length === 0 ? (
        <p className="empty">Todavía no tienes compras registradas.</p>
      ) : (
        <ul className="ticket-timeline">
          {orders.map((order) => (
            <li key={order.id} className="ticket-timeline-item">
              <div className="ticket-timeline-dot" />
              <div className="ticket-timeline-body">
                <div className="ticket-timeline-head">
                  <span>{new Date(order.createdAt).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}</span>
                  <span className={`status status-${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>
                <p className="mono ticket-timeline-id">Folio {order.id.slice(0, 8).toUpperCase()}</p>
                <p className="ticket-timeline-total">{money(order.total)}</p>
                <div className="row-actions">
                  <button className="ghost small" onClick={() => onView(order)}>
                    Ver ticket
                  </button>
                  <button className="ghost small" onClick={() => downloadOrderPdf(order.id)}>
                    Descargar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default MyTickets
