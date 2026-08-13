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
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">🛒 eShop</div>
        <p className="login-hint">Ingresa tu nombre de usuario para continuar</p>
        <input
          className="login-input"
          placeholder="Ej: erick, xime, prof..."
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          autoFocus
        />
        <button className="primary login-button" type="submit" disabled={!userName.trim()}>
          Iniciar Sesión
        </button>
      </form>
    </div>
  )
}

export default Login
