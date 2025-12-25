<p align="center">
  <h1 align="center">🔧 Nestra</h1>
  <p align="center">
    <strong>Universal Cutting Optimization System</strong>
  </p>
  <p align="center">
    Enterprise-grade 1D/2D cutting optimization platform with microservice-ready architecture
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-24+-green?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-5.2-lightgrey?logo=express" alt="Express">
  <img src="https://img.shields.io/badge/PostgreSQL-16+-blue?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Drizzle-0.45-2D3748?logo=drizzle" alt="Drizzle ORM">
  <img src="https://img.shields.io/badge/RabbitMQ-3.12-orange?logo=rabbitmq" alt="RabbitMQ">
  <img src="https://img.shields.io/badge/Tests-170%20passing-success" alt="Tests">
</p>

---

## 📖 Overview

**Nestra** is a comprehensive cutting optimization system designed for manufacturing environments. It provides intelligent algorithms for optimizing material cutting operations, reducing waste, and maximizing efficiency for both **1D** (bars, profiles, tubes) and **2D** (sheets, plates) materials.

### Key Highlights
- 🎯 **Multi-algorithm optimization**: FFD, BFD, Bottom-Left, Guillotine, MaxRects
- 📊 **Real-time tracking**: WebSocket-based live progress updates
- 🏭 **Production ready**: Microservice architecture with event-driven design
- 📈 **Analytics & Reports**: Waste analysis, efficiency reports, trend analysis
- 🔒 **Enterprise security**: JWT auth, RBAC, rate limiting

---

## 🏗️ Architecture

The system follows **SOLID principles** and implements a **microservice-ready architecture** with event-driven communication:

```
backend/src/
├── algorithms/              # Cutting Optimization Algorithms
│   ├── 1d/                 # FFD, BFD strategies (10 files)
│   ├── 2d/                 # Bottom-Left, Guillotine, MaxRects (15 files)
│   └── core/               # Shared algorithm utilities (5 files)
│
├── bootstrap/               # Application Bootstrap (NEW!)
│   ├── di-container.ts     # Dependency injection setup
│   ├── middleware.ts       # Express middleware configuration
│   ├── routes.ts           # Route registration
│   └── index.ts            # Application factory
│
├── core/                    # Infrastructure Layer (19 components)
│   ├── cache/              # Redis caching layer
│   ├── config/             # Environment configuration
│   ├── contracts/          # Service contracts & DTOs
│   ├── di/                 # Dependency injection container
│   ├── error-tracking/     # Sentry integration
│   ├── events/             # Event bus (RabbitMQ / In-Memory)
│   ├── gateway/            # API gateway patterns
│   ├── installers/         # Module installers
│   ├── interfaces/         # Core interfaces (ISP)
│   ├── jobs/               # BullMQ job queues
│   ├── logger/             # Pino structured logging
│   ├── messaging/          # Message bus abstraction
│   ├── monitoring/         # Prometheus metrics
│   ├── repositories/       # Base repository pattern
│   ├── resilience/         # Circuit breaker (Opossum)
│   ├── services/           # Service registry & clients
│   ├── tracing/            # OpenTelemetry + Jaeger
│   └── validation/         # Zod schema validation
│
├── modules/                 # Domain Modules (14 modules)
│   ├── auth/               # Authentication & Authorization
│   ├── customer/           # Customer management
│   ├── cutting-job/        # Cutting job orchestration
│   ├── dashboard/          # Analytics dashboard
│   ├── export/             # PDF/Excel export
│   ├── import/             # Excel/CSV import
│   ├── location/           # Warehouse locations
│   ├── machine/            # Machine management
│   ├── material/           # Material types & properties
│   ├── optimization/       # Optimization engine
│   ├── order/              # Order management
│   ├── production/         # Production tracking
│   ├── report/             # Reporting & analytics
│   └── stock/              # Stock inventory
│
├── middleware/              # Express Middleware (9 middlewares)
├── websocket/               # Socket.IO real-time
├── workers/                 # Piscina worker pool
└── db/                      # Drizzle schema & migrations
```

---

## 📦 Module Structure

Her modül tutarlı bir SOLID-uyumlu yapı takip eder:

```
module/
├── index.ts                    # Public barrel exports
├── [module].repository.ts      # Data access layer (Drizzle ORM)
├── [module].service.ts         # Business logic (SRP)
├── [module].controller.ts      # HTTP endpoints
├── [module].mapper.ts          # DTO transformations (NEW!)
├── [module].service-handler.ts # Inter-service communication
├── [module].event-handler.ts   # Event subscriptions
└── __tests__/                  # Unit tests
    └── *.spec.ts
```

### Recent Refactoring (SOLID Compliance)

Büyük servis dosyaları Single Responsibility Principle'a göre bölündü:

| Module | Before | After | New Files |
|--------|--------|-------|-----------|
| Order | 533 lines | ~250 | `order.mapper.ts`, `order-import.service.ts`, `order-template.service.ts` |
| CuttingJob | 592 lines | ~276 | `cutting-job.mapper.ts`, `cutting-job-generator.service.ts`, `cutting-job-operations.service.ts` |
| Production | 493 lines | ~330 | `production.mapper.ts`, `production-downtime.service.ts`, `production-quality.service.ts` |
| Report | 494 lines | ~180 | `report.mapper.ts`, `report-analytics.service.ts` |
| Stock | 463 lines | ~320 | `stock.mapper.ts`, `stock-alert.service.ts` |
| Optimization | 479 lines | ~100 | `scenario.controller.ts`, `plan.controller.ts` |

---

## ⚡ Key Features

### 🔢 Cutting Optimization

| Algorithm | Type | Description |
|-----------|------|-------------|
| **FFD** (First Fit Decreasing) | 1D | Bars, profiles, tubes optimization |
| **BFD** (Best Fit Decreasing) | 1D | Minimum waste placement |
| **Bottom-Left Fill** | 2D | Greedy sheet packing |
| **Guillotine** | 2D | Industrial-compliant cuts |
| **MaxRects** | 2D | Maximum rectangle utilization |

### 📊 Enterprise Features

- **Role-based access control**: Admin, Planner, Operator, Manager
- **Multi-location support**: Warehouse and machine locations
- **Customer management**: Track orders by customer
- **Production tracking**: Plan vs actual comparison
- **Audit logging**: Complete operation history
- **Real-time updates**: WebSocket live progress

### 📤 Integration

| Feature | Technology |
|---------|------------|
| REST API | Express 5.2 with OpenAPI docs |
| WebSocket | Socket.IO 4.8 live updates |
| File Import | Excel (.xlsx), CSV |
| File Export | PDF (pdfkit), Excel |
| Message Queue | RabbitMQ async processing |
| Job Queue | BullMQ + Redis |

---

## 🛠️ Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Runtime** | Node.js | 24+ |
| **Language** | TypeScript | 5.9 |
| **Framework** | Express | 5.2 |
| **Database** | PostgreSQL | 16+ |
| **ORM** | Drizzle ORM | 0.45 |
| **Cache** | Redis (ioredis) | 5.8 |
| **Message Queue** | RabbitMQ | 3.12 |
| **Job Queue** | BullMQ | 5.66 |
| **WebSocket** | Socket.IO | 4.8 |
| **Authentication** | JWT (jsonwebtoken) | 9.0 |
| **Validation** | Zod | 4.1 |
| **Logging** | Pino | 10.1 |
| **Metrics** | prom-client | 15.1 |
| **Tracing** | OpenTelemetry + Jaeger | - |
| **Error Tracking** | Sentry | 10.32 |
| **Worker Pool** | Piscina | 5.1 |
| **Circuit Breaker** | Opossum | 9.0 |
| **Testing** | Jest | 30.2 |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 24.x or higher
- **PostgreSQL** 16 or higher
- **Redis** (optional, for caching/jobs)
- **Docker** (optional, for RabbitMQ)

### Installation

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database connection

# 4. Push database schema
npm run db:push

# 5. Start development server
npm run dev
```

### Docker Services

```bash
# Start all services (PostgreSQL, Redis, RabbitMQ)
npm run docker:up

# Stop services
npm run docker:down
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection | - |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `USE_RABBITMQ` | Enable RabbitMQ | `false` |
| `RABBITMQ_URL` | RabbitMQ connection | `amqp://localhost` |
| `SENTRY_DSN` | Sentry error tracking | - |
| `JAEGER_ENDPOINT` | OpenTelemetry endpoint | - |

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh token |

### Materials

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/materials` | List material types |
| POST | `/api/materials` | Create material type |
| PUT | `/api/materials/:id` | Update material |
| DELETE | `/api/materials/:id` | Delete material |

### Stock

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock` | List stock items |
| POST | `/api/stock` | Create stock item |
| GET | `/api/stock/:id` | Get stock details |
| POST | `/api/stock/movements` | Record movement |
| GET | `/api/stock/alerts` | Get low stock alerts |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id` | Get order details |
| PUT | `/api/orders/:id` | Update order |
| POST | `/api/orders/import` | Import from Excel |

### Cutting Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cutting-jobs` | List cutting jobs |
| POST | `/api/cutting-jobs` | Create cutting job |
| POST | `/api/cutting-jobs/auto-generate` | Auto-generate from orders |
| POST | `/api/cutting-jobs/merge` | Merge jobs |
| POST | `/api/cutting-jobs/split` | Split job |

### Optimization

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/optimization/scenarios` | List scenarios |
| POST | `/api/optimization/scenarios` | Create scenario |
| POST | `/api/optimization/scenarios/:id/run` | Run optimization |
| GET | `/api/optimization/plans` | List cutting plans |
| POST | `/api/optimization/plans/:id/approve` | Approve plan |
| POST | `/api/optimization/plans/compare` | Compare plans |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/waste` | Waste report |
| GET | `/api/reports/efficiency` | Efficiency report |
| GET | `/api/reports/trend` | Trend analysis |
| GET | `/api/reports/comparative` | Comparative analysis |

### Export/Import

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/import/orders` | Import orders |
| POST | `/api/import/stock` | Import stock |
| GET | `/api/export/plan/:id/pdf` | Export as PDF |
| GET | `/api/export/plan/:id/excel` | Export as Excel |

### Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/live` | Liveness probe |
| GET | `/metrics` | Prometheus metrics |
| GET | `/api-docs` | OpenAPI documentation |

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm test` | Run unit tests (170 tests) |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio GUI |
| `npm run db:generate` | Generate migrations |
| `npm run db:migrate` | Run migrations |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- order.service.spec.ts
```

**Test Coverage:**
- ✅ 170 tests passing
- Repository layer tests
- Service layer tests
- Controller integration tests

---

## 🔧 SOLID Principles Implementation

| Principle | Implementation |
|-----------|----------------|
| **S**ingle Responsibility | Each module handles one domain. Services are split into focused sub-services (mapper, specialized services) |
| **O**pen/Closed | Strategy pattern for algorithms. New optimization strategies can be added without modifying existing code |
| **L**iskov Substitution | Interfaces enable swapping implementations (e.g., RabbitMQ ↔ InMemory message bus) |
| **I**nterface Segregation | Small, focused interfaces: `IOrderRepository`, `IOrderService`, `IOrderImportService` |
| **D**ependency Inversion | All dependencies injected via composition root (`bootstrap/di-container.ts`) |

---

## 📊 Monitoring & Observability

### Health Checks
- `/health` - Overall application health
- `/health/ready` - Kubernetes readiness probe
- `/health/live` - Kubernetes liveness probe

### Prometheus Metrics (`/metrics`)
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency histogram
- `optimization_runs_total` - Optimization executions
- `optimization_duration_seconds` - Optimization time
- `db_query_duration_seconds` - Database query time

### Distributed Tracing
- **OpenTelemetry** instrumentation
- **Jaeger** trace visualization
- Request correlation IDs

### Error Tracking
- **Sentry** integration for production errors

---

## 🐳 Docker Deployment

```yaml
# docker-compose.yml services
services:
  postgres:     # PostgreSQL 16
  redis:        # Redis for caching
  rabbitmq:     # Message queue
  prometheus:   # Metrics collection
  jaeger:       # Distributed tracing
```

```bash
# Build and run
docker build -t nestra-backend .
docker run -p 3000:3000 nestra-backend
```

---

## 📄 License

MIT License

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📞 Support

For issues and feature requests, please use the GitHub issue tracker.
