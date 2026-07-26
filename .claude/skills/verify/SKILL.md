---
name: verify
summary: Drive Filmer local mock API flow and inspect mini-program build
---

# Filmer verification

1. Copy `.env.example` to `packages/server/.env`, run `npm run prisma:push --workspace=packages/server` and `npm run prisma:seed`.
2. Start `npm run dev:server`; verify `GET /health`.
3. Through HTTP, run `mock-login` → create order with `Idempotency-Key` → `/api/payment/jsapi` → `/api/payment/mock-notify` → fetch order; confirm `paid` and repeat notify to confirm idempotency.
4. Probe the order endpoint without Bearer token and expect 401.
5. Build the WeChat target with `npm run build:app`. Visual mini-program verification requires importing `packages/app` in WeChat DevTools; H5 is not an equivalent surface.
