# Orders.API — Microservicio de Órdenes de Compra

Examen Práctico de Integración de Microservicios — UTTT.

## Qué hace

Recibe la solicitud de compra de un cliente, valida su carrito consultando
directamente a **Basket.API** (nunca confía en precios que mande el cliente),
genera una orden con el total calculado, la persiste en **MongoDB Atlas**, y
vacía el carrito. También permite consultar órdenes y cambiar su estado
siguiendo un ciclo de vida controlado.

## Arquitectura y decisiones de diseño

- **Minimal API con Carter + MediatR (CQRS)**, exactamente el mismo patrón
  que ya usan `Catalog.API` y `Basket.API` en este proyecto. Cada operación
  vive en su propia carpeta bajo `Orders/` (`CreateOrder`, `GetOrderById`,
  `GetOrdersByCustomer`, `UpdateOrderStatus`), con su Command/Query, su
  Handler y su Endpoint separados.
- **Capas**: `Domain` (reglas de negocio puras, sin dependencias externas),
  `Data` (acceso a MongoDB), `Clients` (comunicación HTTP con Basket.API),
  `Orders/*` (casos de uso), `Contracts` (lo que se expone al exterior).
- **`BasketId` = `UserName`**: en este proyecto, `Basket.API` identifica el
  carrito directamente por el nombre de usuario — no existe un "basketId"
  separado. Por eso el contrato `{ customerId, basketId }` del examen se
  adapta usando el mismo valor para ambos campos en el caso típico de un
  usuario con un solo carrito activo.
- **El precio se congela al momento de la compra**: `Orders.API` no recibe
  precios del cliente. Consulta el carrito real en `Basket.API` y copia el
  precio de cada línea en ese instante hacia `OrderItem.UnitPrice`. Así, si
  el precio del producto cambia después en el catálogo, la orden ya generada
  no se ve afectada.
- **Vaciar el carrito es "best effort"**: si la orden ya se guardó en Mongo
  pero falla la llamada para vaciar el carrito, la orden **no se revierte**.
  La orden persistida es la fuente de verdad de la compra; un carrito que no
  se vació a tiempo es un problema menor y recuperable, perder una compra ya
  pagada no lo es.
- **Idempotencia**: el header `Idempotency-Key` (opcional) se guarda junto
  con la orden. Antes de crear una orden nueva, se busca si ya existe una
  orden de ese mismo cliente con esa misma clave; si existe, se devuelve esa
  orden (HTTP 200) en vez de crear una duplicada (HTTP 201 solo aplica a
  creaciones reales). Hay un índice parcial en Mongo sobre
  `(CustomerId, IdempotencyKey)` para que esto sea seguro incluso si dos
  peticiones idénticas llegan casi al mismo tiempo.
- **Ciclo de vida de la orden**: `Pending -> Confirmed` y `Pending ->
  Cancelled` son las únicas transiciones válidas (regla centralizada en
  `Order.CanTransitionTo`, para que nadie más en el código pueda saltársela).
  Cualquier otro intento de transición responde `409 Conflict`.
- **Manejo de errores sin exponer información sensible**: los errores de
  MongoDB se capturan en `OrderRepository` y se relanzan como
  `InternalServerException` con un mensaje genérico — el mensaje real del
  driver de Mongo se loguea internamente, nunca se manda al cliente.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/orders` | Crea una orden a partir del carrito. Header opcional `Idempotency-Key`. |
| GET | `/api/orders/{id}` | Consulta una orden por Id. |
| GET | `/api/orders/customer/{customerId}` | Lista las órdenes de un cliente. |
| PATCH | `/api/orders/{id}/status` | Cambia el estado (`{ "status": "Confirmed" }`). |
| GET | `/swagger` | Documentación interactiva (Swagger UI). |
| GET | `/health` | Health check. |

Ejemplos completos de cada prueba mínima del examen (P1 a P7) están en
`Orders.API.http`.

## Configuración (variables de entorno)

Este servicio nunca guarda secretos en el código. Se configuran así:

| Variable | Para qué |
|---|---|
| `MongoDb__ConnectionString` | Cadena de conexión completa a MongoDB Atlas. |
| `BasketApi__BaseUrl` | URL base de Basket.API (dentro de Docker: `http://basket.api:8080`). |

En desarrollo local con Docker, estas variables se resuelven automáticamente
desde el archivo `.env` en la raíz del proyecto (ver `.env.example`).

Para correr `Orders.API` suelto (sin Docker), usa `dotnet user-secrets`:

```bash
cd Services/Orders/Orders.API
dotnet user-secrets set "MongoDb:ConnectionString" "mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/OrdersDb"
dotnet user-secrets set "BasketApi:BaseUrl" "http://localhost:6001"
```

## Correrlo

Desde la raíz del proyecto (donde está `docker-compose.yml`):

```bash
docker compose up --build
```

`Orders.API` queda expuesto en `http://localhost:6003`.

## Pruebas mínimas (sección 10 del examen)

Abre `Orders.API.http` en VS Code (con la extensión REST Client) o en
Visual Studio, y ejecuta las peticiones en orden: primero agrega un producto
al carrito, luego crea la orden (P1), consúltala (P2), prueba el carrito
vacío (P3), repite la Idempotency-Key (P4), confirma la orden (P5), e
intenta una transición inválida (P6).
