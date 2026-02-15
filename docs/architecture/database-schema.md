# Database Schema

## MongoDB (User Service)

- **users**: email, passwordHash, name, phone, role, avatar, isActive
- **drivers**: userId, licenseNumber, vehicleInfo, isVerified, isAvailable, rating, totalRides

## MongoDB (Location Service)

- **locations**: driverId, location (GeoJSON Point), heading, speed, isAvailable, updatedAt (2dsphere index)
- **locationhistories**: driverId, location, heading, speed, recordedAt (TTL 7 days)

## MongoDB (Ride Service)

- **rides**: riderId, driverId, pickup, dropoff, status, fare, startedAt, completedAt
- **ride_requests**: riderId, pickup, dropoff, status, createdAt

## PostgreSQL (Payment Service)

- **payments**: id, ride_id, user_id, amount, currency, status, stripe_id
- **transactions**: id, payment_id, type, amount, balance_after
- **wallets**: user_id, balance_currency, balance_amount

## Redis

- **driver:locations** – GEO set of driver positions (GEORADIUS for nearby)
- **driver:available** – SET of available driver IDs
- Session / token blacklist (user-service)
- Rate limit counters (gateway)
