import { useEffect, useState } from 'react'
import { getBasket } from './api'
import type { Order, View } from './types'
import Login from './views/Login'
import NavBar from './views/NavBar'
import Dashboard from './views/Dashboard'
import Products from './views/Products'
import Cart from './views/Cart'
import MyTickets from './views/MyTickets'
import TicketDetail from './views/TicketDetail'

// La "sesión" es deliberadamente simple: solo un nombre de usuario guardado
// en localStorage, sin contraseña ni token. Este proyecto no tiene un
// Auth.API implementado (ver README de Orders.API), así que "estar
// logueado" únicamente sirve para separar "mis tickets" del historial
// global — no es un mecanismo de seguridad real.
const SESSION_KEY = 'eshop-current-user'

function App() {
  const [userName, setUserName] = useState<string | null>(() =>
    localStorage.getItem(SESSION_KEY),
  )
  const [view, setView] = useState<View>('dashboard')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [justPurchased, setJustPurchased] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  async function refreshCartCount(name: string) {
    try {
      const cart = await getBasket(name)
      setCartCount(cart?.items.length ?? 0)
    } catch {
      // Si falla, dejamos el contador como estaba; no es crítico.
    }
  }

  useEffect(() => {
    if (userName) {
      refreshCartCount(userName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName])

  function handleLogin(name: string) {
    localStorage.setItem(SESSION_KEY, name)
    setUserName(name)
    setView('dashboard')
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY)
    setUserName(null)
  }

  function handleNavigate(target: View) {
    setJustPurchased(false)
    setView(target)
  }

  function handleViewOrder(order: Order) {
    setSelectedOrder(order)
    setJustPurchased(false)
    setView('ticket')
  }

  function handleOrderCreated(order: Order) {
    setSelectedOrder(order)
    setJustPurchased(true)
    setView('ticket')
  }

  if (!userName) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="page">
      <NavBar
        userName={userName}
        currentView={view}
        cartCount={cartCount}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <main className="layout-single">
        {view === 'dashboard' && <Dashboard onView={handleViewOrder} />}

        {view === 'products' && (
          <Products userName={userName} onAddedToCart={() => refreshCartCount(userName)} />
        )}

        {view === 'cart' && (
          <Cart
            userName={userName}
            onOrderCreated={handleOrderCreated}
            onCartChanged={() => refreshCartCount(userName)}
          />
        )}

        {view === 'my-tickets' && <MyTickets userName={userName} onView={handleViewOrder} />}

        {view === 'ticket' && selectedOrder && (
          <TicketDetail
            order={selectedOrder}
            justPurchased={justPurchased}
            onBack={() => handleNavigate(justPurchased ? 'products' : 'dashboard')}
          />
        )}
      </main>
    </div>
  )
}

export default App
