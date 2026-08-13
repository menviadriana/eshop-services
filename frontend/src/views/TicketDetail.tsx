import { downloadOrderPdf } from '../api'
import type { Order } from '../types'

function money(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

interface Props {
  order: Order
  justPurchased: boolean
  onBack: () => void
}

function TicketDetail({ order, justPurchased, onBack }: Props) {
  return (
    <section className="panel receipt-slot">
      <div className="receipt">
        {justPurchased && (
          <div className="receipt-success">
            <span className="receipt-success-emoji">🎉</span>
            <h2>¡Compra Exitosa!</h2>
            <p>
              Tu orden <strong>#{order.id.slice(0, 8)}...</strong> ha sido procesada
              correctamente.
            </p>
          </div>
        )}

        {!justPurchased && <h2>Ticket de Compra</h2>}

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

        <div className="receipt-actions">
          <button className="primary" onClick={() => downloadOrderPdf(order.id)}>
            ⬇ Descargar PDF
          </button>
          <button className="link" onClick={onBack}>
            Volver
          </button>
        </div>
      </div>
    </section>
  )
}

export default TicketDetail
