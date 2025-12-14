<p align="center">
  <h1 align="center">Nestra</h1>
  <p align="center">
    <strong>Universal Cutting Optimization System</strong>
  </p>
  <p align="center">
    Enterprise-grade 1D/2D cutting optimization platform with microservice architecture
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-18+-green?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-4.18-lightgrey?logo=express" alt="Express">
  <img src="https://img.shields.io/badge/PostgreSQL-14+-blue?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-5.7-2D3748?logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/RabbitMQ-3.12-orange?logo=rabbitmq" alt="RabbitMQ">
</p>

---

## Overview

**Nestra** is a comprehensive cutting optimization system designed for manufacturing environments. It provides intelligent algorithms for optimizing material cutting operations, reducing waste, and maximizing efficiency for both 1D (bars, profiles, tubes) and 2D (sheets, plates) materials.

---

## Architecture

The system follows **SOLID principles** and implements a **microservice-ready architecture** with event-driven communication:

```
backend/
├── src/
│   ├── algorithms/           # Optimization Algorithms
│   │   ├── 1d/              # First Fit Decreasing, Best Fit Decreasing
│   │   ├── 2d/              # Bottom-Left, Guillotine, Skyline
│   │   └── core/            # Shared algorithm utilities
│   │
│   ├── core/                 # Infrastructure Layer
│   │   ├── config/          # Configuration management
│   │   ├── contracts/       # Service contracts & DTOs
│   │   ├── di/              # Dependency injection container
│   │   ├── events/          # Event bus (publish/subscribe)
│   │   ├── interfaces/      # Core interfaces (ISP)
│   │   ├── logger/          # Structured JSON logging
│   │   ├── messaging/       # RabbitMQ / In-Memory message bus
│   │   ├── monitoring/      # Prometheus metrics
│   │   ├── repositories/    # Base repository pattern
│   │   ├── resilience/      # Circuit breaker (Opossum)
│   │   ├── services/        # Service registry & clients
│   │   └── validation/      # Zod schema validation
│   │
│   ├── modules/              # Domain Modules (SRP)
│   │   ├── auth/            # Authentication & authorization
│   │   ├── customer/        # Customer management
│   │   ├── cutting-job/     # Cutting job orchestration
│   │   ├── dashboard/       # Analytics dashboard
│   │   ├── export/          # PDF/Excel export
│   │   ├── import/          # Excel/CSV import
│   │   ├── location/        # Warehouse locations
│   │   ├── machine/         # Machine management
│   │   ├── material/        # Material types & properties
│   │   ├── optimization/    # Optimization engine
│   │   ├── order/           # Order management
│   │   ├── production/      # Production tracking
│   │   ├── report/          # Reporting module
│   │   └── stock/           # Stock inventory
│   │
│   ├── middleware/           # Express Middleware
│   │   ├── authMiddleware   # JWT authentication
│   │   ├── compression      # Response compression
│   │   ├── errorHandler     # Global error handling
│   │   ├── metrics          # Prometheus metrics
│   │   ├── rate-limit       # Rate limiting
│   │   ├── request-id       # Correlation ID
│   │   ├── request-logging  # Structured request logging
│   │   ├── security-headers # Security headers
│   │   └── timeout          # Request timeout
│   │
│   ├── websocket/            # Real-time Communication
│   │   └── Socket.IO        # Live optimization updates
│   │
│   ├── workers/              # Background Processing
│   │   └── Piscina          # Worker pool for optimization
│   │
│   └── controllers/          # Health endpoints
│
└── prisma/
    └── schema.prisma         # Database schema
```

---

## Key Features

### Cutting Optimization
- **1D Optimization**: First Fit Decreasing (FFD), Best Fit Decreasing (BFD) algorithms
- **2D Optimization**: Bottom-Left, Guillotine, Skyline placement strategies
- **Multi-objective optimization**: Minimize waste, maximize efficiency, reduce cost
- **Scenario comparison**: Run multiple optimization scenarios and compare results

### Material Support
- Sheet metals (SAC, Galvanized)
- Wood panels (with grain direction support)
- Aluminum profiles
- Plastic sheets
- Custom material types

### Enterprise Features
- **Role-based access control**: Admin, Planner, Operator, Manager
- **Multi-location support**: Warehouse and machine locations
- **Customer management**: Track orders by customer
- **Production tracking**: Plan vs actual comparison
- **Audit logging**: Complete operation history

### Integration
- **REST API**: Full CRUD operations for all modules
- **WebSocket**: Real-time optimization progress updates
- **File Import**: Excel (.xlsx) and CSV file import
- **File Export**: PDF and Excel report generation

---

## Technology Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js 18+ |
| **Language** | TypeScript 5.3 |
| **Framework** | Express 4.18 |
| **Database** | PostgreSQL 14+ |
| **ORM** | Prisma 5.7 |
| **Message Queue** | RabbitMQ 3.12 (optional) |
| **WebSocket** | Socket.IO 4.8 |
| **Authentication** | JWT (jsonwebtoken) |
| **Validation** | Zod 4.1 |
| **Logging** | Pino |
| **Metrics** | prom-client (Prometheus) |
| **Worker Pool** | Piscina |
| **Circuit Breaker** | Opossum |
| **Testing** | Jest 29 |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- Docker (optional, for RabbitMQ)

### Installation

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database connection string

# 4. Generate Prisma Client
npx prisma generate

# 5. Run database migrations
npx prisma migrate dev

# 6. Start development server
npm run dev
```

### Docker Services (Optional)

```bash
# Start RabbitMQ for async message processing
docker-compose up -d
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `USE_RABBITMQ` | Enable RabbitMQ | `false` |
| `RABBITMQ_URL` | RabbitMQ connection | `amqp://localhost` |

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

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
| POST | `/api/stock/movements` | Record stock movement |
| GET | `/api/stock/:id` | Get stock details |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id` | Get order details |
| PUT | `/api/orders/:id` | Update order |

### Optimization

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/optimization/scenarios` | Create scenario |
| POST | `/api/optimization/scenarios/:id/run` | Run optimization |
| GET | `/api/optimization/plans` | List cutting plans |
| POST | `/api/optimization/plans/:id/approve` | Approve plan |

### Import/Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/import/orders` | Import orders from file |
| POST | `/api/import/stock` | Import stock from file |
| GET | `/api/export/plan/:id/pdf` | Export plan as PDF |
| GET | `/api/export/plan/:id/excel` | Export plan as Excel |

### Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/live` | Liveness probe |
| GET | `/metrics` | Prometheus metrics |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production bundle |
| `npm start` | Run production server |
| `npm test` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma migrate dev` | Run database migrations |

---

## Project Structure

### SOLID Principles

| Principle | Implementation |
|-----------|----------------|
| **Single Responsibility** | Each module handles one domain (Material, Stock, Order, etc.) |
| **Open/Closed** | Strategy pattern allows adding new optimization algorithms |
| **Liskov Substitution** | Interfaces enable swapping implementations |
| **Interface Segregation** | Small, focused interfaces for each concern |
| **Dependency Inversion** | All dependencies injected via composition root |

### Module Structure

Each module follows a consistent structure:

```
module/
├── index.ts                    # Public exports
├── [module].repository.ts      # Data access layer
├── [module].service.ts         # Business logic
├── [module].controller.ts      # HTTP endpoints
├── [module].service-handler.ts # Inter-service communication
├── [module].event-handler.ts   # Event subscriptions
└── [module].types.ts           # TypeScript interfaces
```

---

## Microservice Communication

### Service Registry

Modules communicate through a **Service Registry** pattern:

```typescript
// Register service handler
serviceRegistry.register('optimization', optimizationServiceHandler);

// Create client for cross-module access
const optimizationClient = createOptimizationClient(serviceRegistry);
```

### Event-Driven Architecture

Async communication via **Event Bus** (RabbitMQ or In-Memory):

```typescript
// Publish event
eventBus.publish('order.created', { orderId: '...' });

// Subscribe to event
eventBus.subscribe('order.created', async (event) => {
  // Handle event
});
```

---

## Monitoring

### Health Checks

- `/health` - Overall health status
- `/health/ready` - Kubernetes readiness probe
- `/health/live` - Kubernetes liveness probe

### Prometheus Metrics

Available at `/metrics`:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency histogram
- `optimization_runs_total` - Optimization executions
- `optimization_duration_seconds` - Optimization time

---

## License

MIT License

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
