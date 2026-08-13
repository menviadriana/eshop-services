# Frontend — eshop-services

React + TypeScript + Vite. Consume `Basket.API` y `Orders.API` directamente
desde el navegador (por eso ambos servicios tienen CORS abierto).

## Decisiones de diseño

- **Sin catálogo navegable todavía**: el proyecto base no traía un catálogo
  de productos en el frontend, y construirlo está fuera del alcance de este
  examen (enfocado en el microservicio de Órdenes). Para poder demostrar el
  flujo completo de compra, el botón "Agregar producto de ejemplo" agrega
  siempre el mismo producto de prueba al carrito. Es una simplificación
  deliberada, no un descuido — está documentada aquí y en el código
  (`DEMO_PRODUCT` en `App.tsx`).
- **Cliente identificado por texto libre**: no hay login todavía en el
  proyecto base, así que el "cliente" es simplemente el nombre que se
  escribe en el campo de arriba. Ese mismo valor se usa como `customerId` y
  como `basketId` al crear la orden (ver la nota sobre esto en el README de
  `Orders.API`).
- **Una Idempotency-Key nueva por cada clic en "Realizar compra"**
  (`crypto.randomUUID()`), para que reintentos accidentales no dupliquen la
  orden.
- **Localhost, no nombres de contenedor**: el navegador corre en la máquina
  del usuario, no dentro de la red de Docker. Por eso `api.ts` apunta a
  `localhost:6001` / `localhost:6003` (los puertos publicados), a diferencia
  de `Orders.API`, que internamente sí usa `basket.api:8080` para hablar con
  Basket.API dentro de la red de contenedores.

## Correrlo

Con `Catalog.API`, `Basket.API` y `Orders.API` ya corriendo (`docker compose
up`):

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`.

## Variables de entorno

Ver `.env.example`. Si publicas el backend en una URL pública, crea un
`.env` (o configura las variables en Netlify/Vercel) apuntando ahí en vez de
`localhost`.
