# Deployment Guide

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- (Optional) Kubernetes for production

## Local Development

1. **Start infrastructure**

   ```bash
   npm run docker:up
   ```

   This starts MongoDB, PostgreSQL, Redis, Zookeeper, and Kafka.

2. **Environment**

   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

3. **Install and run**

   ```bash
   npm install
   npm run gateway          # Terminal 1 - port 3000
   npm run user-service     # Terminal 2 - port 3001
   # Add other services as you implement them
   ```

4. **Health checks**
   - Gateway: http://localhost:3000/health
   - User: http://localhost:3001/health

## Docker (all services)

From project root, build and run with a full stack compose (see `infrastructure/docker/docker-compose.prod.yml` when added). For now, run infrastructure with `docker:up` and run Node services locally.

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` and secrets management
- [ ] Enable TLS at gateway/load balancer
- [ ] Configure Prometheus/Grafana (see `infrastructure/monitoring/`)
- [ ] Use managed Kafka, Redis, and databases where possible
