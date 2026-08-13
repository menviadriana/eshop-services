import { useEffect, useState } from 'react'
import { getAllOrders, downloadOrderPdf, ApiError } from '../api'
import type { Order } from '../types'

function money(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

interface Props {
  onView: (order: Order) => void
}

function Dashboard({ onView }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await getAllOrders()
      setOrders(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el historial.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>📊 Historial Global de Tickets</h2>
        <button className="ghost" onClick={load} disabled={loading}>
          🔄 Actualizar Lista
        </button>
      </div>

      {error && <p className="error-banner">{error}</p>}

      {orders.length === 0 ? (
        <p className="empty">Todavía no hay órdenes en el sistema.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Orden</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="mono">{order.id.slice(0, 8)}...</td>
                <td>{order.customerId}</td>
                <td className="num">{money(order.total)}</td>
                <td>
                  <span className={`status status-${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
                <td className="row-actions">
                  <button className="ghost small" onClick={() => onView(order)}>
                    👁 Ver
                  </button>
                  <button className="ghost small" onClick={() => downloadOrderPdf(order.id)}>
                    📄 PDF
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

export default Dashboard
