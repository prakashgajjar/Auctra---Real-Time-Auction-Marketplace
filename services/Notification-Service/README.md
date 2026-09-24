# Auctra Notification Service

The **Auctra Notification Service** is an enterprise-grade multi-channel notification and event delivery engine built for the Auctra Real-Time Auction Marketplace. It delivers instant alerts across **Email**, **In-App Notifications**, and **Real-Time WebSocket Streams**, supported by an event-driven architecture with **Dead-Letter Queue (DLQ)** resilience and exponential backoff retry mechanisms.

---

## 🌟 Architecture & Delivery Channels

```text
       [ Auction / Bid / Payment / Order Services ]
                           │
                 Redis Pub/Sub & Events
                           ▼
              ┌───────────────────────────┐
              │    Notification Service   │
              │  (Event Consumer & Logic) │
              └────────────┬──────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
 [ In-App Storage ]   [ Email Dispatch ]  [ Real-Time Pub/Sub ]
   (PostgreSQL DB)    (Resend / Gmail)    (Redis -> WebSockets)
```

1. **In-App Notifications (PostgreSQL)**:
   - Stored in the `notifications` table with status tracking (`isRead`, `readAt`, `data`).
   - Queryable with fast pagination, type filters, unread counts, and batch actions.

2. **Email Engine (Dual-Provider with Failover)**:
   - **Primary**: Resend API (`resend` SDK).
   - **Fallback**: Nodemailer SMTP (e.g. Gmail SMTP).
   - Rich responsive HTML templates matching Auctra's luxury dark/gold aesthetic.

3. **Real-Time WebSocket Stream (Redis Pub/Sub)**:
   - Publishes directly to `user:{userId}:notifications` and `notifications:realtime` for instantaneous delivery to connected clients and the WebSocket Service.

4. **Resilience & Dead-Letter Queue (DLQ)**:
   - Automatic idempotency deduplication (`isEventProcessed`).
   - 3x exponential backoff retry upon external failures.
   - Exhausted failures are moved to the DLQ (`notif:dlq:list`) for administrator inspection and manual/scheduled replay.

---

## 🔔 Supported Event Triggers

| Event Type | Trigger Origin | Target Recipients | Delivery Channels |
| :--- | :--- | :--- | :--- |
| `AUCTION_OUTBID` | New higher bid placed | Previous highest bidder | In-App, Email, WebSocket |
| `AUCTION_STARTED` | Auction status -> `LIVE` | Seller & Watchlisters | In-App, Email, WebSocket |
| `AUCTION_ENDING_SOON` | Auction closes in <= 15m | Watchlisters & Highest bidder | In-App, Email, WebSocket |
| `AUCTION_WON` | Auction status -> `ENDED` | Winning bidder & Seller | In-App, Email, WebSocket |
| `AUCTION_BID_PLACED` | Bid successfully recorded | Auction Seller | In-App, WebSocket |
| `PAYMENT_SUCCESSFUL` | Payment verified | Buyer & Seller | In-App, Email, WebSocket |
| `ORDER_SHIPPED` | Order dispatched | Buyer | In-App, Email, WebSocket |
| `SYSTEM` | Admin notice / System | Targeted users or All | In-App, Email, WebSocket |

---

## 📡 REST API Reference

All requests must include `Authorization: Bearer <JWT_ACCESS_TOKEN>` except public health checks.

### User Endpoints
- `GET /api/v1/notifications` — List notifications (query params: `page`, `limit`, `isRead`, `type`)
- `GET /api/v1/notifications/unread-count` — Count of unread notifications
- `PATCH /api/v1/notifications/:id/read` — Mark notification as read
- `PATCH /api/v1/notifications/read-all` — Mark all notifications as read
- `DELETE /api/v1/notifications/:id` — Delete notification
- `DELETE /api/v1/notifications/clear-read` — Delete all read notifications
- `GET /api/v1/notifications/preferences` — Get user delivery preferences
- `PUT /api/v1/notifications/preferences` — Update user delivery preferences

### Internal / Service Dispatch
- `POST /api/v1/notifications/send` — Direct dispatch endpoint

### Admin & DLQ Endpoints (`ADMIN` role required)
- `POST /api/v1/notifications/admin/broadcast` — Broadcast announcement to users
- `GET /api/v1/notifications/admin/stats` — Overall delivery metrics and DLQ status
- `GET /api/v1/notifications/admin/dlq` — List failed DLQ messages
- `GET /api/v1/notifications/admin/dlq/:id` — Inspect specific DLQ item
- `POST /api/v1/notifications/admin/dlq/:id/retry` — Replay/reprocess DLQ item
- `DELETE /api/v1/notifications/admin/dlq/:id` — Delete DLQ item
- `DELETE /api/v1/notifications/admin/dlq` — Purge entire DLQ

### Observability Probes
- `GET /health` — Full dependency check (PostgreSQL + Redis)
- `GET /readiness` — Kubernetes readiness probe
- `GET /liveness` — Kubernetes liveness probe
- `GET /` — Service metadata and runtime features

---

## 🛠️ Running Locally & Running Tests

```bash
# Install dependencies
bun install

# Generate Prisma Client
bun run prisma:generate

# Run integration tests (23 tests covering all features)
bun test

# Start in watch mode
bun run dev

# Start in production mode
bun start
```
