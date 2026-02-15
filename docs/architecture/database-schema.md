# Database Schema

## MongoDB (User Service)

- **users**: email, passwordHash, name, phone, role, avatar, isActive
- **drivers**: userId, licenseNumber, vehicleInfo, isVerified, isAvailable, rating, totalRides

## MongoDB (Ride Service)

- **rides**: riderId, driverId, pickup, dropoff, status, fare, startedAt, completedAt
- **ride_requests**: riderId, pickup, dropoff, status, createdAt

## PostgreSQL (Payment Service)

- **payments**: id, ride_id, user_id, amount, currency, status, stripe_id
- **transactions**: id, payment_id, type, amount, balance_after
- **wallets**: user_id, balance_currency, balance_amount

## Redis

- Active driver locations (geo)
- Session / token blacklist
- Rate limit counters (if used at gateway)
