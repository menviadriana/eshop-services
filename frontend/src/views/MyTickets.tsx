import { useEffect, useState } from 'react'
import { getOrdersByCustomer, downloadOrderPdf, ApiError } from '../api'
import type { Order } from '../types'

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
        <h2>🎫 Mis Tickets de Compra</h2>
        <button className="ghost small" onClick={load} disabled={loading}>
          🔄 Actualizar
        </button>
      </div>

      {error && <p className="error-banner">{error}</p>}

      {orders.length === 0 ? (
        <p className="empty">
          <strong>{userName}</strong> todavía no tiene compras realizadas.
        </p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID de Orden</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="mono">{order.id.slice(0, 8).toUpperCase()}</td>
                <td>{new Date(order.createdAt).toLocaleDateString('es-MX')}</td>
                <td className="row-actions">
                  <button className="ghost small" onClick={() => onView(order)}>
                    👁 Ver
                  </button>
                  <button className="ghost small" onClick={() => downloadOrderPdf(order.id)}>
                    ⬇ Descargar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export default MyTickets
