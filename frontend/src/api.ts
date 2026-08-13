import type {
  ShoppingCart,
  Order,
  ApiProblem,
  BasketItem,
  PaginatedProducts,
} from './types'

// En Docker, el navegador corre en TU máquina, no dentro de la red de
// contenedores — por eso aquí SIEMPRE se usa localhost + el puerto publicado
// (6001, 6002, 6003), nunca el nombre del servicio (basket.api, orders.api).
// Eso solo aplica a la comunicación *entre* contenedores.
const CATALOG_API_URL = import.meta.env.VITE_CATALOG_API_URL ?? 'http://localhost:6002'
const BASKET_API_URL = import.meta.env.VITE_BASKET_API_URL ?? 'http://localhost:6001'
const ORDERS_API_URL = import.meta.env.VITE_ORDERS_API_URL ?? 'http://localhost:6003'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function parseErrorAndThrow(response: Response): Promise<never> {
  let message = `Error inesperado (HTTP ${response.status}).`
  try {
    const problem = (await response.json()) as ApiProblem
    if (problem.detail) {
      message = problem.detail
    }
  } catch {
    // La respuesta no traía JSON; nos quedamos con el mensaje genérico.
  }
  throw new ApiError(response.status, message)
}

// ---------------- Catalog.API ----------------

export async function getProducts(): Promise<PaginatedProducts> {
  const response = await fetch(`${CATALOG_API_URL}/products?pageNumber=1&pageSize=50`)
  if (!response.ok) {
    await parseErrorAndThrow(response)
  }
  const payload = await response.json()
  return payload.products as PaginatedProducts
}

export async function createProduct(input: {
  name: string
  price: number
  category: string[]
}): Promise<void> {
  const response = await fetch(`${CATALOG_API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      description: '',
      category: input.category,
      imageFiles: '',
      price: input.price,
    }),
  })
  if (!response.ok) {
    await parseErrorAndThrow(response)
  }
}

// ---------------- Basket.API ----------------

export async function getBasket(userName: string): Promise<ShoppingCart | null> {
  const response = await fetch(`${BASKET_API_URL}/basket/${encodeURIComponent(userName)}`)

  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    await parseErrorAndThrow(response)
  }

  const payload = await response.json()
  return payload.cart as ShoppingCart
}

// StoreBasket en Basket.API REEMPLAZA el carrito completo (no hace merge),
// así que toda edición del carrito (agregar, quitar, cambiar cantidad) pasa
// siempre por esta misma función: mandamos la lista completa que queremos
// que quede guardada.
async function saveBasket(userName: string, items: BasketItem[]): Promise<ShoppingCart> {
  const response = await fetch(`${BASKET_API_URL}/basket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart: { userName, items } }),
  })

  if (!response.ok) {
    await parseErrorAndThrow(response)
  }

  return {
    userName,
    items,
    totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  }
}

export async function addItemToBasket(
  userName: string,
  item: BasketItem,
): Promise<ShoppingCart> {
  const existing = await getBasket(userName)
  const items = existing ? [...existing.items] : []

  // Si el producto ya estaba en el carrito, sumamos cantidad en vez de
  // duplicar la línea.
  const index = items.findIndex((i) => i.productId === item.productId)
  if (index >= 0) {
    items[index] = { ...items[index], quantity: items[index].quantity + item.quantity }
  } else {
    items.push(item)
  }

  return saveBasket(userName, items)
}

export async function updateItemQuantity(
  userName: string,
  productId: string,
  quantity: number,
): Promise<ShoppingCart> {
  const existing = await getBasket(userName)
  const items = (existing?.items ?? []).map((i) =>
    i.productId === productId ? { ...i, quantity } : i,
  )
  return saveBasket(userName, items)
}

export async function removeItemFromBasket(
  userName: string,
  productId: string,
): Promise<ShoppingCart> {
  const existing = await getBasket(userName)
  const items = (existing?.items ?? []).filter((i) => i.productId !== productId)
  return saveBasket(userName, items)
}

export async function clearBasket(userName: string): Promise<void> {
  await fetch(`${BASKET_API_URL}/basket/${encodeURIComponent(userName)}`, {
    method: 'DELETE',
  })
}

// ---------------- Orders.API ----------------

export async function createOrder(
  customerId: string,
  basketId: string,
  idempotencyKey: string,
): Promise<Order> {
  const response = await fetch(`${ORDERS_API_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ customerId, basketId }),
  })

  if (!response.ok) {
    await parseErrorAndThrow(response)
  }

  return (await response.json()) as Order
}

export async function getOrderById(id: string): Promise<Order> {
  const response = await fetch(`${ORDERS_API_URL}/api/orders/${encodeURIComponent(id)}`)
  if (!response.ok) {
    await parseErrorAndThrow(response)
  }
  return (await response.json()) as Order
}

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const response = await fetch(
    `${ORDERS_API_URL}/api/orders/customer/${encodeURIComponent(customerId)}`,
  )

  if (!response.ok) {
    await parseErrorAndThrow(response)
  }

  return (await response.json()) as Order[]
}

// Historial global: TODAS las órdenes, de cualquier cliente. Cualquier
// usuario logueado puede verlo (este proyecto no maneja roles/permisos).
export async function getAllOrders(): Promise<Order[]> {
  const response = await fetch(`${ORDERS_API_URL}/api/orders`)
  if (!response.ok) {
    await parseErrorAndThrow(response)
  }
  return (await response.json()) as Order[]
}

// Descarga el PDF del ticket y dispara la descarga en el navegador. No
// devolvemos la URL directamente porque el endpoint no es público sin más
// contexto: preferimos traer el blob nosotros y controlar el nombre del
// archivo descargado.
export async function downloadOrderPdf(id: string): Promise<void> {
  const response = await fetch(`${ORDERS_API_URL}/api/orders/${encodeURIComponent(id)}/pdf`)
  if (!response.ok) {
    await parseErrorAndThrow(response)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Ticket_${id}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
