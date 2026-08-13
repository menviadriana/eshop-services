import type { View } from '../types'

interface Props {
  userName: string
  currentView: View
  cartCount: number
  onNavigate: (view: View) => void
  onLogout: () => void
}

const ITEMS: { view: View; label: string }[] = [
  { view: 'dashboard', label: 'Dashboard' },
  { view: 'products', label: 'Productos' },
  { view: 'cart', label: 'Carrito' },
  { view: 'my-tickets', label: 'Mis Tickets' },
]

function NavBar({ userName, currentView, cartCount, onNavigate, onLogout }: Props) {
  return (
    <header className="app-nav">
      <span className="wordmark">🛒 eShop</span>

      <nav className="app-nav-links">
        {ITEMS.map((item) => (
          <button
            key={item.view}
            className={`nav-link ${currentView === item.view ? 'nav-link-active' : ''}`}
            onClick={() => onNavigate(item.view)}
          >
            {item.label}
            {item.view === 'cart' && cartCount > 0 && (
              <span className="nav-badge">{cartCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="app-nav-user">
        <span>
          Hola, <strong>{userName}</strong>
        </span>
        <button className="ghost small" onClick={onLogout}>
          Salir
        </button>
      </div>
    </header>
  )
}

export default NavBar
