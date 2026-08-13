import { useState } from 'react'

interface Props {
  onLogin: (userName: string) => void
}

function Login({ onLogin }: Props) {
  const [userName, setUserName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = userName.trim()
    if (trimmed) {
      onLogin(trimmed)
    }
  }

  return (
    <div className="auth-screen">
      <aside className="auth-side">
        <p className="auth-side-kicker">Microservicio de Órdenes · UTTT</p>
        <h1 className="auth-side-title">Panel de Compras</h1>
        <p className="auth-side-copy">
          Consulta el catálogo, arma tu carrito y genera tu orden. Cada compra queda registrada
          con folio propio, y puedes descargar tu comprobante en PDF cuando quieras.
        </p>
        <ul className="auth-side-list">
          <li>Catálogo en tiempo real</li>
          <li>Seguimiento de tus órdenes</li>
          <li>Comprobante descargable</li>
        </ul>
      </aside>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Acceder</h2>
          <p className="auth-form-hint">Escribe tu nombre para entrar al panel.</p>

          <label className="auth-field">
            <span>Nombre de usuario</span>
            <input
              placeholder="tu-nombre"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              autoFocus
            />
          </label>

          <button className="primary auth-submit" type="submit" disabled={!userName.trim()}>
            Entrar al panel
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
