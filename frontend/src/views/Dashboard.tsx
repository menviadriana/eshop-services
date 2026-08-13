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

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const confirmedCount = orders.filter((o) => o.status === 'Confirmed').length
  const pendingCount = orders.filter((o) => o.status === 'Pending').length

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Panorama general</h2>
        <button className="ghost" onClick={load} disabled={loading}>
          Actualizar
        </button>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-label">Órdenes totales</span>
          <span className="stat-value">{orders.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Ingresos acumulados</span>
          <span className="stat-value">{money(totalRevenue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Confirmadas</span>
          <span className="stat-value">{confirmedCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pendientes</span>
          <span className="stat-value">{pendingCount}</span>
        </div>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <h3 className="section-subtitle">Todas las órdenes</h3>

      {orders.length === 0 ? (
        <p className="empty">Todavía no hay órdenes en el sistema.</p>
      ) : (
        <div className="order-card-list">
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              <div className="order-card-top">
                <span className="mono order-card-id">{order.id.slice(0, 8)}</span>
                <span className={`status status-${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
              <p className="order-card-customer">Cliente: {order.customerId}</p>
              <p className="order-card-total">{money(order.total)}</p>
              <div className="order-card-actions">
                <button className="ghost small" onClick={() => onView(order)}>
                  Ver detalle
                </button>
                <button className="ghost small" onClick={() => downloadOrderPdf(order.id)}>
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default Dashboard
