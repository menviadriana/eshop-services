import { useEffect, useState } from 'react'
import { getProducts, createProduct, addItemToBasket, ApiError } from '../api'
import type { Product } from '../types'

function money(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

interface Props {
  userName: string
  onAddedToCart: () => void
}

function Products({ userName, onAddedToCart }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newCategory, setNewCategory] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await getProducts()
      setProducts(result.data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el catálogo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAdd(product: Product) {
    setMessage(null)
    setError(null)
    try {
      await addItemToBasket(userName, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
      })
      setMessage(`"${product.name}" se agregó al carrito de ${userName}.`)
      onAddedToCart()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo agregar el producto.')
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault()
    const price = Number(newPrice)
    if (!newName.trim() || !price || price <= 0) {
      setError('Nombre y precio (mayor a cero) son obligatorios.')
      return
    }
    setError(null)
    try {
      await createProduct({
        name: newName.trim(),
        price,
        category: newCategory.trim() ? [newCategory.trim()] : [],
      })
      setNewName('')
      setNewPrice('')
      setNewCategory('')
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el producto.')
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>🛍 Productos</h2>
        <button className="ghost" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Agregar producto'}
        </button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleCreateProduct}>
          <input
            placeholder="Nombre del producto"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            placeholder="Precio"
            type="number"
            step="0.01"
            min="0"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />
          <input
            placeholder="Categoría (opcional)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button className="primary small" type="submit">
            Guardar
          </button>
        </form>
      )}

      {error && <p className="error-banner">{error}</p>}
      {message && <p className="success-banner">{message}</p>}

      {loading ? (
        <p className="empty">Cargando catálogo...</p>
      ) : products.length === 0 ? (
        <p className="empty">
          El catálogo está vacío. Usa "+ Agregar producto" para crear el primero.
        </p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <div className="product-card" key={product.id}>
              <div className="product-card-body">
                <h3>{product.name}</h3>
                {product.category.length > 0 && (
                  <span className="tag">{product.category.join(', ')}</span>
                )}
                <p className="num">{money(product.price)}</p>
              </div>
              <button className="primary small" onClick={() => handleAdd(product)}>
                + Agregar
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default Products
