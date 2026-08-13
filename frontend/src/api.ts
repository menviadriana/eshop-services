import type { ShoppingCart, Order, ApiProblem, BasketItem } from './types'

// En Docker, el navegador corre en TU máquina, no dentro de la red de
// contenedores — por eso aquí SIEMPRE se usa localhost + el puerto publicado
// (6001, 6003), nunca el nombre del servicio (basket.api, orders.api). Eso
// solo aplica a la comunicación *entre* contenedores (ver Orders.API
// Program.cs / docker-compose.override.yml).
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

export async function addItemToBasket(
  userName: string,
  item: BasketItem,
): Promise<ShoppingCart> {
  const existing = await getBasket(userName)
  const items = existing ? [...existing.items, item] : [item]

  const response = await fetch(`${BASKET_API_URL}/basket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart: { userName, items } }),
  })

  if (!response.ok) {
    await parseErrorAndThrow(response)
  }

  return { userName, items, totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0) }
}

export async function clearBasket(userName: string): Promise<void> {
  await fetch(`${BASKET_API_URL}/basket/${encodeURIComponent(userName)}`, {
    method: 'DELETE',
  })
}

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

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const response = await fetch(
    `${ORDERS_API_URL}/api/orders/customer/${encodeURIComponent(customerId)}`,
  )

  if (!response.ok) {
    await parseErrorAndThrow(response)
  }

  return (await response.json()) as Order[]
}
