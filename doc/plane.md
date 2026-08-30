# Auctra
## Where Value Finds Its Buyer

**Project Type:** Real-Time Auction Marketplace  
**Architecture:** Distributed Microservices Architecture  
**Primary Backend:** Node.js / TypeScript  
**Frontend:** Next.js  
**Database:** PostgreSQL  
**Cache & Real-Time State:** Redis  
**Event Streaming:** Apache Kafka  
**Containerization:** Docker  
**Orchestration:** Kubernetes  
**Cloud:** AWS  
**CI/CD:** GitHub Actions  
**Monitoring:** Prometheus + Grafana  
**Logging:** ELK / OpenSearch  
**API Gateway:** NGINX / AWS API Gateway  
**Infrastructure:** Terraform

---

# 1. Project Overview

Auctra is a real-time online auction marketplace where sellers can list unique products and multiple buyers can compete for the same product through bidding.

Unlike a traditional e-commerce platform:

```text
Traditional E-Commerce

Seller → Product → Fixed Price → Buyer
```

Auctra works like:

```text
Seller
   ↓
Create Auction
   ↓
One Unique Item
   ↓
Many Buyers
   ↓
Real-Time Bidding
   ↓
Highest Valid Bid
   ↓
Auction Ends
   ↓
Winner Selected
   ↓
Payment
   ↓
Order
   ↓
Seller Ships Product
```

The platform must handle thousands of users participating in auctions simultaneously while maintaining:

- Correct bid ordering
- No duplicate winners
- No invalid bids
- Real-time updates
- High availability
- Security
- Scalability
- Observability
- Fault tolerance

---

# 2. Main Objective

The primary objective is to build a production-style auction platform that demonstrates advanced software engineering concepts.

The system should support:

- User registration and authentication
- Seller and buyer accounts
- Product listing
- Auction creation
- Auction scheduling
- Real-time bidding
- Automatic bidding
- Reserve prices
- Buy Now
- Auction expiration
- Winner selection
- Payment
- Orders
- Notifications
- Reviews
- Seller reputation
- Admin dashboard
- Fraud detection
- Analytics

The infrastructure should additionally demonstrate:

- API rate limiting
- Redis caching
- Kafka event streaming
- Docker
- Kubernetes
- Horizontal scaling
- CI/CD
- AWS deployment
- Monitoring
- Centralized logging
- Distributed tracing
- Health checks
- Circuit breakers
- Database transactions
- Idempotency
- Retry mechanisms
- Dead-letter queues

---

# 3. Core Business Model

A seller owns one unique item.

Example:

```text
Product:
Apple MacBook Pro M4

Starting Price:
₹80,000

Minimum Bid Increment:
₹1,000

Auction:
10:00 AM → 8:00 PM
```

Multiple users bid:

```text
User A → ₹81,000
User B → ₹82,000
User C → ₹85,000
User A → ₹86,000
User D → ₹90,000
```

At auction completion:

```text
Highest Valid Bid
       ↓
User D
       ↓
₹90,000
       ↓
Winner
       ↓
Payment
       ↓
Order
```

---

# 4. User Roles

## Buyer

A buyer can:

- Browse products
- Search products
- Watch auctions
- Place bids
- Configure automatic bidding
- Add products to watchlist
- Buy immediately
- Make payments
- View orders
- Track shipments
- Review sellers

## Seller

A seller can:

- Create products
- Upload images
- Create auctions
- Set starting price
- Set reserve price
- Set minimum bid increment
- Set auction duration
- Set Buy Now price
- View bids
- Manage orders
- Ship products
- Receive payments
- View analytics

## Admin

Admin can:

- Manage users
- Manage sellers
- Manage products
- Suspend accounts
- Monitor auctions
- Investigate fraud
- Manage disputes
- View platform analytics
- Monitor system health

---

# 5. Auction Types

## 5.1 Standard Auction

Highest valid bidder wins.

```text
Starting Price
      ↓
Bidding
      ↓
Highest Bid
      ↓
Winner
```

## 5.2 Reserve Auction

Seller specifies a minimum acceptable price.

Example:

```text
Starting Price = ₹10,000
Reserve Price  = ₹20,000

Final Bid = ₹17,000

Result:
Auction ends without winner
```

## 5.3 Buy Now

Seller can specify an immediate purchase price.

```text
Current Bid = ₹50,000

Buy Now = ₹70,000

Buyer clicks Buy Now
        ↓
Auction immediately closes
        ↓
Product reserved
        ↓
Payment
```

## 5.4 Automatic Bidding

A buyer can specify:

```text
Maximum Budget = ₹100,000
```

The system automatically increases their bid when another user bids.

Example:

```text
User A maximum = ₹100,000

User B → ₹51,000
System → User A ₹52,000

User B → ₹55,000
System → User A ₹56,000

User B → ₹80,000
System → User A ₹81,000
```

---

# 6. High-Level Architecture

```text
                         INTERNET
                            │
                            ▼
                    ┌──────────────┐
                    │ CloudFront   │
                    │     CDN      │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ AWS WAF      │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Load Balancer│
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ API Gateway  │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     Auth Service     Auction Service   Product Service
          │                │                │
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Kafka    │
                    └──────┬──────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
 Notification         Payment             Order
 Service              Service             Service
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
                     PostgreSQL
```

---

# 7. Microservices Architecture

Do not start with 20 microservices.

Build the system using logical services and gradually separate them.

Recommended services:

```text
1. API Gateway
2. Auth Service
3. User Service
4. Product Service
5. Auction Service
6. Bid Service
7. Order Service
8. Payment Service
9. Notification Service
10. Search Service
11. Review Service
12. Admin Service
13. Analytics Service
```

---

# 8. API Gateway

The API Gateway is the single entry point for clients.

```text
Frontend
   ↓
API Gateway
   ↓
Services
```

Responsibilities:

- Authentication
- Authorization
- Routing
- Rate limiting
- Request validation
- CORS
- API versioning
- Request logging
- Correlation ID
- Security headers

Example:

```text
/api/v1/auth/*
/api/v1/users/*
/api/v1/products/*
/api/v1/auctions/*
/api/v1/bids/*
/api/v1/orders/*
/api/v1/payments/*
```

---

# 9. Rate Limiting

Rate limiting protects the system from:

- DDoS-like traffic
- Bots
- Brute force attacks
- API abuse
- Excessive bidding requests

Use:

```text
Redis
+
Token Bucket / Sliding Window
```

Example:

```text
Normal API:
100 requests/minute/user

Login:
5 requests/minute/IP

Bid API:
20 requests/minute/user

Admin:
Higher limits
```

Architecture:

```text
Request
   ↓
API Gateway
   ↓
Redis Rate Limiter
   ↓
Allowed?
 ┌─┴─┐
Yes No
 │   │
 ▼   ▼
API  429
```

---

# 10. Redis Architecture

Redis should not replace PostgreSQL.

Use Redis for:

### Caching

```text
Product
Auction
User profile
Popular auctions
```

### Real-Time Auction State

```text
auction:{auctionId}:currentBid
auction:{auctionId}:highestBidder
auction:{auctionId}:status
```

### Rate Limiting

```text
rate_limit:user:{userId}
```

### Distributed Locks

Useful for auction finalization.

```text
lock:auction:{auctionId}
```

### Session / Temporary Data

Redis can also store short-lived session and temporary state.

---

# 11. Kafka Architecture

Kafka is the event backbone of the platform.

Instead of directly connecting every service:

```text
Auction → Notification
Auction → Analytics
Auction → Search
Auction → Fraud
```

use:

```text
Auction Service
      ↓
     Kafka
      ↓
 ┌────┼─────┬──────┐
 ▼    ▼     ▼      ▼
Email Analytics Fraud Search
```

Important events:

```text
USER_REGISTERED
PRODUCT_CREATED
AUCTION_CREATED
AUCTION_STARTED
BID_PLACED
BID_OUTBID
AUCTION_EXTENDED
AUCTION_ENDED
AUCTION_WON
PAYMENT_CREATED
PAYMENT_SUCCESS
PAYMENT_FAILED
ORDER_CREATED
ORDER_SHIPPED
ORDER_DELIVERED
```

---

# 12. Kafka Topics

Recommended topics:

```text
user.events
product.events
auction.events
bid.events
payment.events
order.events
notification.events
fraud.events
analytics.events
```

Example:

```text
bid.events

{
  "eventId": "...",
  "eventType": "BID_PLACED",
  "auctionId": "...",
  "bidId": "...",
  "userId": "...",
  "amount": 85000,
  "timestamp": "..."
}
```

---

# 13. Dead Letter Queue

If a Kafka consumer repeatedly fails:

```text
Kafka
  ↓
Consumer
  ↓
Processing failed
  ↓
Retry
  ↓
Retry
  ↓
Retry
  ↓
DLQ
```

Example:

```text
notification.events
        ↓
Notification Service
        ↓
Failure
        ↓
notification.events.DLQ
```

Admin can inspect failed events later.

---

# 14. PostgreSQL Database

PostgreSQL is the source of truth.

Important entities:

```text
users
roles
products
product_images
auctions
bids
auto_bids
watchlists
orders
payments
shipments
reviews
notifications
audit_logs
```

---

# 15. Important Database Relationships

```text
User
 │
 ├── Products
 │
 ├── Bids
 │
 ├── Orders
 │
 ├── Reviews
 │
 └── Watchlists
       │
       ▼
     Product
       │
       ▼
     Auction
       │
       ▼
      Bids
```

---

# 16. Auction Table

Example conceptual schema:

```text
auctions

id
product_id
seller_id
starting_price
current_price
reserve_price
buy_now_price
minimum_increment
status
start_time
end_time
winner_id
created_at
updated_at
```

Status:

```text
DRAFT
SCHEDULED
LIVE
ENDED
CANCELLED
SOLD
UNSOLD
```

---

# 17. Bid Table

```text
bids

id
auction_id
user_id
amount
status
created_at
```

Possible statuses:

```text
VALID
OUTBID
REJECTED
CANCELLED
```

---

# 18. The Most Important Problem: Concurrent Bidding

Suppose:

```text
User A → ₹10,000
User B → ₹10,500
User C → ₹11,000
```

All requests arrive at almost exactly the same time.

The system must prevent:

```text
Current Bid = ₹10,000

A reads ₹10,000
B reads ₹10,000

A writes ₹11,000
B writes ₹11,000
```

This creates an incorrect state.

Instead, use:

```text
Transaction
+
Row Lock / Atomic Update
+
Redis Lock where appropriate
+
Idempotency
```

Conceptually:

```text
BEGIN TRANSACTION

SELECT auction
FOR UPDATE

Validate bid

Calculate new price

INSERT bid

UPDATE auction

COMMIT
```

This guarantees that competing bids are processed safely.

---

# 19. Bid Validation

Every bid should pass:

```text
1. User authenticated?
2. User allowed to bid?
3. Auction exists?
4. Auction is LIVE?
5. Auction hasn't expired?
6. User isn't the seller?
7. Amount >= current bid + increment?
8. User has bidding/payment eligibility?
9. Request isn't duplicate?
10. Bid successfully committed?
```

Only after successful database commit should the system publish:

```text
BID_PLACED
```

to Kafka.

---

# 20. Idempotency

Payment and bidding systems must handle duplicate requests.

Example:

```text
Client sends payment request

Network timeout

Client retries

Server receives request twice
```

Without idempotency:

```text
₹50,000
+
₹50,000
=
₹100,000 charged
```

Use:

```text
Idempotency-Key
```

Example:

```text
POST /payments

Idempotency-Key:
payment_7a89...
```

The server returns the original result for repeated requests.

---

# 21. Real-Time Communication

Use WebSockets / Socket.IO.

Flow:

```text
Buyer A places bid
       ↓
Bid Service
       ↓
PostgreSQL
       ↓
Kafka
       ↓
Auction Event
       ↓
WebSocket Gateway
       ↓
All connected buyers
```

Users immediately see:

```text
Current Bid: ₹86,000
Highest Bidder: Anonymous
Time Remaining: 00:03:21
```

No page refresh required.

---

# 22. Auction Ending

Do not depend only on frontend timers.

The backend must determine auction expiration.

Use:

```text
BullMQ
+
Redis
```

or Kubernetes scheduled workers.

Example:

```text
Auction ends at 8:00 PM

8:00 PM
   ↓
Worker wakes up
   ↓
Acquire distributed lock
   ↓
Verify auction status
   ↓
Find highest valid bid
   ↓
Check reserve price
   ↓
Select winner
   ↓
Update auction
   ↓
Create order
   ↓
Publish AUCTION_WON
```

---

# 23. Auction Race Condition

Imagine:

```text
8:00:00.001

Bid arrives

8:00:00.002

Auction-ending worker starts
```

The backend needs a clear rule for whether the bid is valid.

Define:

```text
Bid accepted if:

server_received_at < auction.end_time
```

The server-not the client-determines the timestamp.

This prevents users from manipulating browser clocks.

---

# 24. Anti-Sniping

Optional advanced feature:

If a bid arrives during the final 30 seconds:

```text
Auction remaining:
20 seconds

Valid bid arrives

Auction extends:
+30 seconds
```

Example:

```text
7:59:40
Bid → ₹90,000

Auction extended

8:00:10
New end time
```

This creates more competitive auctions.

---

# 25. Payment Flow

```text
Auction Ends
     ↓
Winner
     ↓
Create Order
     ↓
Payment Service
     ↓
Payment Gateway
     ↓
Payment Success?
   ┌──┴──┐
  Yes    No
   │      │
   ▼      ▼
Order   Retry
Confirmed
```

Payment should be asynchronous where possible.

Important events:

```text
PAYMENT_CREATED
PAYMENT_PROCESSING
PAYMENT_SUCCESS
PAYMENT_FAILED
PAYMENT_REFUNDED
```

---

# 26. Notification System

Notification service consumes Kafka events.

Example:

```text
BID_OUTBID
      ↓
Kafka
      ↓
Notification Service
      ↓
 ┌────┼────┐
 ▼    ▼    ▼
Email Push WebSocket
```

Notifications:

```text
"You have been outbid."

"Your auction has ended."

"Congratulations! You won."

"Payment is pending."

"Your order has shipped."
```

---

# 27. Search System

For the initial version:

```text
PostgreSQL
```

can handle search.

For production-scale search:

```text
OpenSearch / Elasticsearch
```

Index:

```text
product name
description
category
brand
condition
tags
price
auction status
```

Example:

```text
"gaming laptop"

       ↓

Search Service

       ↓

OpenSearch

       ↓

Relevant auctions
```

---

# 28. Image Storage

Do not store large images directly in PostgreSQL.

Use:

```text
User
 ↓
S3
 ↓
CloudFront
 ↓
Browser
```

Example:

```text
AWS S3
  │
  └── products/
       └── auction-id/
            ├── image1.webp
            ├── image2.webp
            └── image3.webp
```

Use pre-signed URLs for secure uploads.

---

# 29. AWS Architecture

Recommended production architecture:

```text
                    Route 53
                       │
                       ▼
                  CloudFront
                       │
                       ▼
                     WAF
                       │
                       ▼
               Application Load
                  Balancer
                       │
                       ▼
                  Kubernetes
                     EKS
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
   API Pods        Auction Pods     WebSocket Pods
       │               │               │
       └───────────────┼───────────────┘
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
         Redis       Kafka     PostgreSQL
       ElastiCache   MSK         RDS
                       │
                       ▼
                      S3
```

---

# 30. Kubernetes

Use Kubernetes to manage containers.

Main concepts to demonstrate:

```text
Pod
Deployment
Service
ConfigMap
Secret
Ingress
HorizontalPodAutoscaler
StatefulSet
Job
CronJob
Namespace
```

Example:

```text
auction-service
   │
   ├── Pod 1
   ├── Pod 2
   ├── Pod 3
   └── Pod 4
```

If traffic increases:

```text
4 pods
 ↓
8 pods
```

---

# 31. Horizontal Pod Autoscaling

Example:

```text
CPU > 70%
        ↓
Kubernetes
        ↓
Increase replicas
```

During a large auction:

```text
10:00 AM
100 users

11:00 AM
10,000 users

Auction Service:
3 pods → 15 pods
```

---

# 32. Docker

Every service gets its own Docker image.

Example:

```text
auth-service
auction-service
bid-service
payment-service
notification-service
```

Each service:

```text
Source Code
    ↓
Dockerfile
    ↓
Docker Image
    ↓
Container
    ↓
Kubernetes
```

Use multi-stage Docker builds to keep production images small.

---

# 33. CI/CD Pipeline

Use GitHub Actions.

Flow:

```text
Developer
   ↓
Git Push
   ↓
GitHub
   ↓
Run Tests
   ↓
Lint
   ↓
Security Scan
   ↓
Build Docker Image
   ↓
Push to AWS ECR
   ↓
Deploy to Kubernetes
   ↓
Health Check
   ↓
Production
```

Pipeline stages:

```text
1. Install
2. Lint
3. Unit Tests
4. Integration Tests
5. Build
6. Docker Build
7. Security Scan
8. Push Image
9. Deploy
10. Smoke Test
```

---

# 34. Deployment Strategy

Use rolling deployment initially.

```text
Old Pods
████████████

New Pods
████

Traffic gradually moves

Old Pods
████

New Pods
████████████
```

For advanced deployment:

```text
Blue-Green
Canary
```

Canary example:

```text
95% → old version
5%  → new version

If healthy:

50% → new
50% → old

Then:

100% → new
```

---

# 35. Monitoring

Use:

```text
Prometheus
+
Grafana
```

Monitor:

```text
CPU
Memory
Request rate
Error rate
Latency
Database connections
Redis memory
Kafka lag
Pod restarts
WebSocket connections
Auction throughput
Bid success rate
Payment failures
```

---

# 36. Important Grafana Dashboards

### API Dashboard

```text
Requests/sec
P95 latency
P99 latency
HTTP 4xx
HTTP 5xx
```

### Auction Dashboard

```text
Active auctions
Bids/sec
Successful bids
Rejected bids
Auction endings
```

### Kafka Dashboard

```text
Messages/sec
Consumer lag
Failed messages
DLQ messages
```

### Infrastructure Dashboard

```text
CPU
Memory
Pods
Network
Disk
```

---

# 37. Logging

Use structured JSON logs.

Example:

```json
{
  "level": "info",
  "service": "bid-service",
  "event": "BID_PLACED",
  "auctionId": "auc_123",
  "userId": "user_456",
  "amount": 85000,
  "traceId": "..."
}
```

Centralize logs using:

```text
OpenSearch
+
Fluent Bit
```

or:

```text
ELK Stack
```

---

# 38. Distributed Tracing

Use:

```text
OpenTelemetry
```

Example:

```text
Frontend
   ↓
API Gateway
   ↓
Bid Service
   ↓
PostgreSQL
   ↓
Kafka
   ↓
Notification Service
```

One request should have a common:

```text
traceId
```

This lets you investigate slow requests across multiple services.

---

# 39. Health Checks

Every service should provide:

```text
/health
/readiness
/liveness
```

Example:

```text
/health

{
  "status": "healthy",
  "database": "healthy",
  "redis": "healthy",
  "kafka": "healthy"
}
```

Kubernetes uses these endpoints to decide whether pods should receive traffic.

---

# 40. Circuit Breaker

Suppose Payment Service is unavailable.

Without a circuit breaker:

```text
API
 ↓
Payment
 ↓
Timeout
 ↓
Retry
 ↓
Timeout
 ↓
Retry
 ↓
System becomes slow
```

With circuit breaker:

```text
Payment failing
      ↓
Circuit OPEN
      ↓
Stop requests
      ↓
Return controlled response
```

After recovery:

```text
OPEN
 ↓
HALF OPEN
 ↓
Test request
 ↓
SUCCESS
 ↓
CLOSED
```

---

# 41. Retry Strategy

Use exponential backoff.

Example:

```text
Attempt 1 → immediately
Attempt 2 → 1 second
Attempt 3 → 2 seconds
Attempt 4 → 4 seconds
```

Never retry everything blindly.

Do not automatically retry operations that can cause duplicate payments unless idempotency is implemented.

---

# 42. Security Architecture

Implement:

```text
JWT / OAuth
Password hashing
Refresh tokens
RBAC
Rate limiting
Input validation
SQL injection protection
XSS protection
CSRF protection where applicable
CORS
Security headers
Secrets management
Audit logs
Encryption
```

Roles:

```text
BUYER
SELLER
ADMIN
MODERATOR
```

---

# 43. AWS Secrets

Never put:

```text
DATABASE_PASSWORD
JWT_SECRET
STRIPE_SECRET
AWS_SECRET
```

inside Git.

Use:

```text
AWS Secrets Manager
```

and Kubernetes secrets integration.

---

# 44. Infrastructure as Code

Use Terraform.

Terraform should provision:

```text
VPC
Subnets
EKS
RDS
ElastiCache
MSK
S3
CloudFront
Load Balancer
IAM
Security Groups
CloudWatch
```

Architecture:

```text
Terraform
    ↓
AWS Infrastructure
    ↓
Kubernetes
    ↓
Applications
```

---

# 45. Networking

Use AWS VPC.

```text
                    VPC
                     │
        ┌────────────┴────────────┐
        │                         │
   Public Subnet             Private Subnet
        │                         │
        ▼                         ▼
 Load Balancer                EKS Nodes
                                  │
                     ┌────────────┼────────────┐
                     ▼            ▼            ▼
                   Redis        RDS          Kafka
```

Databases should not be publicly accessible.

---

# 46. Caching Strategy

Use cache-aside.

```text
Request
  ↓
Redis?
 ┌┴────┐
Yes    No
 │      │
 ▼      ▼
Return PostgreSQL
        │
        ▼
      Redis
```

For frequently changing auction values, use careful cache invalidation.

The database remains authoritative.

---

# 47. Cache Invalidation

When product changes:

```text
Update PostgreSQL
       ↓
Invalidate Redis
       ↓
Publish event
```

Avoid serving stale auction state for critical bid validation.

---

# 48. Consistency Model

Not everything needs strong consistency.

### Strong consistency

Use PostgreSQL transactions for:

```text
Bid acceptance
Winner selection
Order creation
Payment state
Inventory ownership
```

### Eventual consistency

Kafka-driven systems can use eventual consistency for:

```text
Notifications
Analytics
Search index
Recommendations
Activity feeds
```

This distinction is an important part of the system design.

---

# 49. Failure Scenario: Redis Down

The application should not lose the source of truth.

```text
Redis unavailable
      ↓
Critical operation
      ↓
PostgreSQL
      ↓
Continue safely
```

Redis improves performance but should not be the only permanent source of auction data.

---

# 50. Failure Scenario: Kafka Down

Critical database operations should not simply disappear because Kafka is unavailable.

Use an:

```text
Transactional Outbox
```

Pattern:

```text
PostgreSQL Transaction
       │
       ├── Update Business Data
       │
       └── Insert Outbox Event
                │
                ▼
          Outbox Worker
                │
                ▼
              Kafka
```

This prevents:

```text
Database updated
BUT
Kafka event lost
```

---

# 51. Transactional Outbox

Example:

```text
BEGIN

INSERT bid

UPDATE auction

INSERT outbox_event

COMMIT
```

Then:

```text
Outbox Worker
     ↓
Kafka
     ↓
Consumers
```

This is one of the most valuable distributed-system concepts to demonstrate in this project.

---

# 52. Data Partitioning

As the platform grows, bid data can become huge.

Potential strategy:

```text
bids_2026_01
bids_2026_02
bids_2026_03
...
```

or partition by:

```text
auction_id
```

Do not introduce database sharding on day one.

First optimize:

```text
Indexes
Queries
Connection pooling
Partitioning
Read replicas
Caching
```

Then consider sharding if genuinely required.

---

# 53. Database Indexes

Important indexes:

```text
bids(auction_id, amount DESC)

bids(auction_id, created_at DESC)

auctions(status, end_time)

auctions(seller_id)

products(category_id)

products(created_at)

orders(user_id)

orders(status)
```

Indexes should be based on actual query patterns.

---

# 54. Read Replicas

For heavy read traffic:

```text
              PostgreSQL
                  │
          ┌───────┴───────┐
          ▼               ▼
       Primary         Replica
          │               │
       Writes            Reads
```

Critical writes go to primary.

Large read workloads can use replicas.

---

# 55. Frontend Architecture

Use Next.js.

Pages:

```text
/
 /login
 /register
 /auctions
 /auctions/[id]
 /products/[id]
 /sell
 /dashboard
 /dashboard/auctions
 /dashboard/bids
 /dashboard/orders
 /admin
```

Auction page:

```text
┌───────────────────────────────────────┐
│ Product Image                         │
│                                       │
│ MacBook Pro M4                        │
│                                       │
│ Current Bid: ₹85,000                  │
│                                       │
│ Time Left: 00:12:31                   │
│                                       │
│ [ ₹86,000 ] [ PLACE BID ]             │
│                                       │
│ Bid History                           │
│ User A     ₹85,000                    │
│ User B     ₹84,000                    │
│ User C     ₹82,000                    │
└───────────────────────────────────────┘
```

---

# 56. Project Repository

Recommended monorepo:

```text
auctra/
│
├── apps/
│   ├── web/
│   ├── admin/
│   │
│   └── services/
│       ├── api-gateway/
│       ├── auth-service/
│       ├── user-service/
│       ├── product-service/
│       ├── auction-service/
│       ├── bid-service/
│       ├── order-service/
│       ├── payment-service/
│       ├── notification-service/
│       ├── search-service/
│       └── analytics-service/
│
├── packages/
│   ├── config/
│   ├── database/
│   ├── logger/
│   ├── events/
│   ├── validation/
│   └── types/
│
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   ├── terraform/
│   └── monitoring/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   └── decisions/
│
└── .github/
    └── workflows/
```

---

# 57. Technology Stack

## Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
TanStack Query
Zustand
Socket.IO Client
```

## Backend

```text
Node.js
TypeScript
NestJS or Express
REST APIs
WebSockets
```

NestJS is recommended if the goal is to demonstrate a structured enterprise backend.

## Database

```text
PostgreSQL
Prisma or Drizzle
```

## Distributed Systems

```text
Redis
Kafka
BullMQ
WebSockets
Transactional Outbox
```

## Infrastructure

```text
Docker
Kubernetes
Helm
Terraform
NGINX
```

## AWS

```text
EKS
RDS
ElastiCache
MSK
S3
CloudFront
Route 53
WAF
ECR
Secrets Manager
CloudWatch
IAM
VPC
```

## Observability

```text
Prometheus
Grafana
OpenTelemetry
OpenSearch / ELK
Fluent Bit
```

## CI/CD

```text
GitHub Actions
Docker
ECR
Helm
Kubernetes
Terraform
```

---

# 58. Development Roadmap

Do not build everything simultaneously.

Build in phases.

## Phase 1 - Foundation

```text
1. Repository setup
2. Next.js setup
3. Backend setup
4. PostgreSQL
5. Docker Compose
6. Authentication
7. User roles
```

## Phase 2 - Marketplace

```text
8. Product management
9. Image upload
10. Seller dashboard
11. Product browsing
12. Search/filter
```

## Phase 3 - Auction Engine

```text
13. Auction creation
14. Auction scheduling
15. Bid placement
16. Bid validation
17. Bid history
18. Auction expiration
19. Winner selection
```

## Phase 4 - Real-Time System

```text
20. WebSockets
21. Redis
22. Real-time bid updates
23. Distributed locks
24. Auto bidding
25. Anti-sniping
```

## Phase 5 - Event Architecture

```text
26. Kafka
27. Event schemas
28. Consumers
29. Transactional Outbox
30. Retry mechanism
31. Dead Letter Queue
```

## Phase 6 - Commerce

```text
32. Orders
33. Payments
34. Payment webhooks
35. Shipping
36. Notifications
37. Reviews
```

## Phase 7 - Production Engineering

```text
38. Rate limiting
39. Circuit breakers
40. Idempotency
41. Security hardening
42. Audit logging
43. Health checks
```

## Phase 8 - DevOps

```text
44. Docker production images
45. Kubernetes
46. Helm
47. AWS EKS
48. RDS
49. ElastiCache
50. MSK
51. S3
```

## Phase 9 - Observability

```text
52. Prometheus
53. Grafana
54. Centralized logs
55. OpenTelemetry
56. Distributed tracing
57. Alerts
```

## Phase 10 - CI/CD

```text
58. GitHub Actions
59. Automated testing
60. Docker build
61. ECR
62. Kubernetes deployment
63. Rolling deployment
64. Canary deployment
```

---

# 59. Testing Strategy

## Unit Tests

Test:

```text
Bid validation
Auction rules
Price calculation
Auto-bidding
Authentication
```

## Integration Tests

Test:

```text
API + PostgreSQL
API + Redis
Kafka consumers
Payment flow
```

## End-to-End Tests

Example:

```text
Register
 ↓
Login
 ↓
Seller creates product
 ↓
Seller creates auction
 ↓
Buyer joins
 ↓
Buyer bids
 ↓
Another buyer bids
 ↓
Auction ends
 ↓
Winner selected
 ↓
Payment
 ↓
Order
```

## Load Testing

Use:

```text
k6
```

Simulate:

```text
1,000 concurrent users
10,000 concurrent users
100,000 bids
```

Measure:

```text
P95 latency
P99 latency
Requests/sec
Bids/sec
Error rate
```

---

# 60. System Design Interview Scenarios

This project should allow you to explain:

### Scenario 1

**How do you handle 10,000 users bidding simultaneously?**

Answer involves:

```text
Load Balancer
Kubernetes
Horizontal Scaling
Redis
PostgreSQL Transactions
WebSockets
Kafka
```

### Scenario 2

**How do you prevent two users from winning the same auction?**

```text
Transaction
+
Row Lock
+
Distributed Lock
+
Idempotency
```

### Scenario 3

**What happens if Kafka goes down?**

```text
Transactional Outbox
+
Retry
+
DLQ
```

### Scenario 4

**What happens if Redis goes down?**

```text
PostgreSQL remains source of truth
Redis is rebuilt
```

### Scenario 5

**How do you scale WebSockets?**

```text
Multiple WebSocket pods
        ↓
Redis Pub/Sub
        ↓
All connected instances
```

### Scenario 6

**How do you prevent duplicate payment?**

```text
Idempotency Key
+
Payment State Machine
+
Database Transaction
```

---

# 61. State Machines

Use explicit states instead of random boolean fields.

Auction:

```text
DRAFT
  ↓
SCHEDULED
  ↓
LIVE
  ↓
ENDING
  ↓
ENDED
  ↓
SOLD / UNSOLD
```

Payment:

```text
CREATED
  ↓
PROCESSING
  ↓
SUCCESS
```

or:

```text
PROCESSING
  ↓
FAILED
  ↓
RETRY
```

Order:

```text
PENDING_PAYMENT
  ↓
PAID
  ↓
PROCESSING
  ↓
SHIPPED
  ↓
DELIVERED
```

---

# 62. Important Engineering Principles

Auctra should follow:

```text
SOLID
DRY
KISS
YAGNI
12-Factor principles
Clean Architecture
Domain-driven design where useful
Event-driven architecture
API versioning
Observability-first design
Security-by-default
```

Do not introduce technology simply because it looks impressive.

For example:

```text
Kafka → asynchronous events

Redis → caching / locks / real-time infrastructure

PostgreSQL → transactional source of truth

Kubernetes → orchestration

Prometheus → metrics

Grafana → visualization

OpenTelemetry → tracing

S3 → object storage
```

Every technology should have a clear responsibility.

---

# 63. Final Architecture

The final production architecture should look approximately like:

```text
                         USERS
                           │
                           ▼
                    ┌─────────────┐
                    │ CloudFront  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │     WAF     │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ LoadBalancer│
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ API Gateway │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
          Auth Pods    Auction Pods   Bid Pods
              │            │            │
              └────────────┼────────────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
          Redis         PostgreSQL      Kafka
             │                           │
             │             ┌─────────────┼──────────────┐
             │             │             │              │
             ▼             ▼             ▼              ▼
       WebSockets      Payments     Notifications    Analytics
                           │
                           ▼
                        Orders
                           │
                           ▼
                      Shipments

             ─────────────────────────────

                 Kubernetes / AWS EKS

             ─────────────────────────────

             Prometheus → Grafana
             OpenTelemetry → Tracing
             Fluent Bit → OpenSearch

             ─────────────────────────────

                    GitHub Actions
                         ↓
                       Docker
                         ↓
                        ECR
                         ↓
                     Kubernetes
```

---

# 64. What This Project Demonstrates

After completing Auctra, you should be able to demonstrate knowledge of:

```text
✓ Full-stack development
✓ REST APIs
✓ WebSockets
✓ PostgreSQL
✓ Database transactions
✓ Redis
✓ Kafka
✓ Event-driven architecture
✓ Microservices
✓ Distributed locks
✓ Concurrency
✓ Idempotency
✓ Rate limiting
✓ Circuit breakers
✓ Retry mechanisms
✓ Dead-letter queues
✓ Docker
✓ Kubernetes
✓ AWS
✓ Terraform
✓ CI/CD
✓ Horizontal scaling
✓ Load balancing
✓ Prometheus
✓ Grafana
✓ Centralized logging
✓ Distributed tracing
✓ Security
✓ System design
✓ Load testing
```

The **most important part** is not using every technology just to put it on your resume. Each component should solve a real problem in Auctra. That makes the project much stronger in interviews because you can explain **why** Kafka, Redis, Kubernetes, PostgreSQL, rate limiting, etc. exist and what would happen if each one failed.