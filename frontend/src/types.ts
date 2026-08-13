// Estos tipos reflejan exactamente lo que devuelven Catalog.API, Basket.API
// y Orders.API. Ver:
// - Catalog.API/Models/Products/GetProducts/GetProductsEndPoint.cs
// - Basket.API/Basket/GetBasket/GetBasketEndPoints.cs
// - Orders.API/Contracts/OrderResponse.cs

export interface Product {
  id: string
  name: string
  description: string
  category: string[]
  imageFiles: string
  price: number
}

export interface PaginatedProducts {
  pageNumber: number
  pageSize: number
  totalCount: number
  data: Product[]
}

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

// Las vistas de la aplicación una vez logueado. Se maneja como estado local
// en vez de una librería de rutas (react-router) para mantener el proyecto
// simple: no hay URLs profundas que compartir, todo vive dentro de una sola
// sesión de compra.
export type View = 'dashboard' | 'products' | 'cart' | 'my-tickets' | 'ticket'
