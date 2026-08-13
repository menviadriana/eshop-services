// Estos tipos reflejan exactamente lo que devuelven Basket.API y Orders.API.
// Ver Basket.API/Basket/GetBasket/GetBasketEndPoints.cs y
// Orders.API/Contracts/OrderResponse.cs

export interface BasketItem {
  productId: string
  productName: string
  quantity: number
  price: number
  color?: string
}

export interface ShoppingCart {
  userName: string
  items: BasketItem[]
  totalPrice: number
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Cancelled'

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Order {
  id: string
  customerId: string
  createdAt: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
}

// Formato estándar de error que devuelve el CustomExceptionHandler del backend
// (ProblemDetails: title, detail, status, instance).
export interface ApiProblem {
  title?: string
  detail?: string
  status?: number
}
