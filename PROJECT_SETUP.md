# RideShare – Project Setup Summary

This document describes the industry-grade project setup created for the RideShare backend.

## What’s Included

### Root & tooling

- **Node**: `.nvmrc` and `.node-version` (Node 20)
- **Monorepo**: npm workspaces (`gateway`, `shared`, `services/*`)
- **Lint/format**: ESLint + Prettier; `npm run lint`, `npm run format`, `npm run format:check`
- **Git hooks**: Husky + lint-staged (pre-commit runs lint + format on staged files)
- **Editor**: `.editorconfig`, `.vscode/settings.json`, `.vscode/extensions.json`
- **License**: MIT

### Shared library (`shared/`)

- **Constants**: `EVENTS` (Kafka), `RIDE_STATUS`, `PAYMENT_STATUS`, `USER_ROLES`
- **Errors**: `AppError`, `errorHandler` middleware
- **Logger**: Winston
- **Redis**: `getRedis()`, `closeRedis()`
- **Kafka**: producer `send()`, consumer `consume()`

### API Gateway (`gateway/`)

- Express app with Helmet, rate limiting (default + stricter for `/auth`)
- Proxies: `/auth`, `/users` → user-service; `/rides` → ride-service; `/location`, `/payments`, `/notifications`, `/analytics` → respective services
- Health: `GET /health`

### Microservices (`services/`)

| Service            | Port | Status        | Notes                          |
|--------------------|------|---------------|---------------------------------|
| user-service       | 3001 | Implemented   | Register, login, JWT, profile   |
| ride-service       | 3002 | Skeleton     | Health + 501 placeholder        |
| location-service   | 3003 | Skeleton     | Health + 501 placeholder       |
| payment-service    | 3004 | Skeleton     | Health + 501 placeholder       |
| notification-service | 3005 | Skeleton   | Health + 501 placeholder       |
| analytics-service  | 3006 | Skeleton     | Health + 501 placeholder       |

Each service has:

- `src/app.js`, health route, shared error handler
- `tests/*.js` (Node test runner)
- `Dockerfile`

### Infrastructure

- **Docker Compose** (`infrastructure/docker/docker-compose.yml`): MongoDB, PostgreSQL, Redis, Zookeeper, Kafka (dev dependencies only; app services run locally or add to compose later)
- **Env**: `infrastructure/docker/.env.example` and root `.env.example`

### CI/CD & docs

- **GitHub Actions** (`.github/workflows/ci.yml`): lint, format check, tests on push/PR to `main` / `develop`
- **Docs**: `docs/api/swagger.yaml`, `docs/architecture/system-design.md`, `docs/architecture/database-schema.md`, `docs/deployment/deployment-guide.md`
- **Scripts**: `scripts/seed/seedData.js` (placeholder)
- **CONTRIBUTING.md**: setup, style, branching, PRs

## Quick start

```bash
# Install
npm install

# Start infra (MongoDB, Postgres, Redis, Kafka)
npm run docker:up

# Copy env
cp .env.example .env

# Run gateway (terminal 1)
npm run gateway

# Run user-service (terminal 2)
npm run user-service
```

- Gateway: http://localhost:3000/health  
- User service: http://localhost:3001/health  
- Register: `POST http://localhost:3000/auth/register` with `{ "email", "password", "name" }`  
- Login: `POST http://localhost:3000/auth/login` with `{ "email", "password" }`

## Commands

| Command           | Description                    |
|-------------------|--------------------------------|
| `npm run lint`    | ESLint                         |
| `npm run lint:fix`| ESLint with auto-fix           |
| `npm run format`  | Prettier write                 |
| `npm run format:check` | Prettier check           |
| `npm run test`    | Run tests in all workspaces    |
| `npm run test:ci` | Same, for CI                   |
| `npm run docker:up`   | Start infra containers     |
| `npm run docker:down` | Stop infra containers     |
| `npm run gateway` | Start gateway                  |
| `npm run user-service` | Start user service         |

## Next steps (from readme roadmap)

- **Sprint 1**: User service is in place; finish driver APIs, refresh token, Redis session if needed.
- **Sprint 2**: Implement ride-service and location-service (matching, geospatial, Socket.IO, Kafka).
- **Sprint 3**: Implement payment-service and notification-service.
- **Sprint 4**: Analytics, monitoring, security harden, full CI/CD and deployment.

See `readme.md` for the full 4-sprint plan and `CONTRIBUTING.md` for contribution guidelines.
