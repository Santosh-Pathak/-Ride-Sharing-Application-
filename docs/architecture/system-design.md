# System Design

## Overview

RideShare is a microservices-based ride-sharing backend. Traffic enters through the API Gateway and is routed to the appropriate service.

## Components

- **Gateway**: Rate limiting, routing, CORS, Helmet.
- **User Service**: Auth (JWT), profiles, drivers (MongoDB).
- **Ride Service**: Ride lifecycle, matching, fare (MongoDB, Kafka).
- **Location Service**: Geospatial index, real-time updates (Socket.IO, Redis).
- **Payment Service**: Transactions, wallet (PostgreSQL, Kafka).
- **Notification Service**: Email, SMS, push (Kafka consumers).
- **Analytics Service**: Metrics and reporting.

## Data Stores

- **MongoDB**: Users, drivers, rides, locations.
- **PostgreSQL**: Payments, transactions, wallet.
- **Redis**: Cache, sessions, real-time driver state.
- **Kafka**: Event bus between services.

## See Also

- [Database schema](./database-schema.md)
- [Deployment](../../infrastructure/docker/)
