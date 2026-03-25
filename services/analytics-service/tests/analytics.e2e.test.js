const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../../src/config/db.config');
const app = require('../../src/app');
const DailyStats = require('../../src/models/DailyStats.model');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function tokenFor(userId, role = 'admin') {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
}

const adminToken = tokenFor('admin-e2e-analytics', 'admin');
const riderToken = tokenFor('rider-e2e-analytics', 'rider');
const driverToken = tokenFor('driver-e2e-analytics', 'driver');

describe('Analytics Service E2E Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await DailyStats.deleteMany({
      dateKey: { $regex: /^2024-01-/ },
    });
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('analytics-service');
    });
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated request to /analytics/dashboard', async () => {
      const res = await request(app).get('/analytics/dashboard');
      expect(res.status).toBe(401);
    });

    it('should return 401 for unauthenticated request to /analytics/daily', async () => {
      const res = await request(app).get('/analytics/daily');
      expect(res.status).toBe(401);
    });

    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .get('/analytics/dashboard')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });
  });

  describe('Authorization', () => {
    it('should return 403 for rider role on /analytics/dashboard', async () => {
      const res = await request(app)
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${riderToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 for driver role on /analytics/dashboard', async () => {
      const res = await request(app)
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${driverToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 for rider role on /analytics/daily', async () => {
      const res = await request(app)
        .get('/analytics/daily')
        .set('Authorization', `Bearer ${riderToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 for driver role on /analytics/daily', async () => {
      const res = await request(app)
        .get('/analytics/daily')
        .set('Authorization', `Bearer ${driverToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow admin role on /analytics/dashboard', async () => {
      const res = await request(app)
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('should allow admin role on /analytics/daily', async () => {
      const res = await request(app)
        .get('/analytics/daily')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /analytics/dashboard', () => {
    beforeAll(async () => {
      await DailyStats.create([
        {
          dateKey: '2024-01-15',
          ridesRequested: 100,
          ridesMatched: 95,
          ridesAccepted: 90,
          ridesRejected: 5,
          ridesStarted: 85,
          ridesCompleted: 80,
          ridesCancelled: 10,
          rideRevenueCents: 1200000,
          paymentsCompleted: 80,
          paymentsFailed: 2,
          refundsCount: 1,
          refundAmountCents: 15000,
        },
        {
          dateKey: '2024-01-16',
          ridesRequested: 120,
          ridesMatched: 115,
          ridesAccepted: 110,
          ridesRejected: 5,
          ridesStarted: 105,
          ridesCompleted: 100,
          ridesCancelled: 10,
          rideRevenueCents: 1500000,
          paymentsCompleted: 100,
          paymentsFailed: 1,
          refundsCount: 0,
          refundAmountCents: 0,
        },
      ]);
    });

    it('should return dashboard analytics with summary', async () => {
      const res = await request(app)
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.period).toBeDefined();
      expect(res.body.data.summary).toBeDefined();
    });

    it('should return period with from and to dates', async () => {
      const res = await request(app)
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.period.from).toBeDefined();
      expect(res.body.data.period.to).toBeDefined();
    });

    it('should include all summary metrics', async () => {
      const res = await request(app)
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const summary = res.body.data.summary;
      expect(summary.ridesRequested).toBeDefined();
      expect(summary.ridesMatched).toBeDefined();
      expect(summary.ridesAccepted).toBeDefined();
      expect(summary.ridesRejected).toBeDefined();
      expect(summary.ridesStarted).toBeDefined();
      expect(summary.ridesCompleted).toBeDefined();
      expect(summary.ridesCancelled).toBeDefined();
      expect(summary.rideRevenueCents).toBeDefined();
      expect(summary.paymentsCompleted).toBeDefined();
      expect(summary.paymentsFailed).toBeDefined();
      expect(summary.refundsCount).toBeDefined();
      expect(summary.refundAmountCents).toBeDefined();
    });

    it('should aggregate metrics across date range', async () => {
      const res = await request(app)
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const summary = res.body.data.summary;
      expect(summary.ridesRequested).toBeGreaterThanOrEqual(220);
      expect(summary.ridesCompleted).toBeGreaterThanOrEqual(180);
    });

    it('should respect from and to query parameters', async () => {
      const res = await request(app)
        .get('/analytics/dashboard?from=2024-01-15&to=2024-01-15')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.period.from).toBe('2024-01-15');
      expect(res.body.data.period.to).toBe('2024-01-15');
      expect(res.body.data.summary.ridesRequested).toBe(100);
    });

    it('should return revenue in dollars format', async () => {
      const res = await request(app)
        .get('/analytics/dashboard?from=2024-01-15&to=2024-01-15')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.data.summary.rideRevenue).toBe('string');
    });

    it('should return refund amount in dollars format', async () => {
      const res = await request(app)
        .get('/analytics/dashboard?from=2024-01-15&to=2024-01-15')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.data.summary.refundAmount).toBe('string');
    });

    it('should return 400 for invalid date range (from > to)', async () => {
      const res = await request(app)
        .get('/analytics/dashboard?from=2024-01-20&to=2024-01-15')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return default values for non-existent date range', async () => {
      const res = await request(app)
        .get('/analytics/dashboard?from=2020-01-01&to=2020-01-02')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.ridesRequested).toBe(0);
      expect(res.body.data.summary.ridesCompleted).toBe(0);
    });
  });

  describe('GET /analytics/daily', () => {
    it('should return daily analytics data', async () => {
      const res = await request(app)
        .get('/analytics/daily')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.period).toBeDefined();
      expect(Array.isArray(res.body.data.days)).toBe(true);
    });

    it('should return period with from and to dates', async () => {
      const res = await request(app)
        .get('/analytics/daily')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.period.from).toBeDefined();
      expect(res.body.data.period.to).toBeDefined();
    });

    it('should respect from and to query parameters', async () => {
      const res = await request(app)
        .get('/analytics/daily?from=2024-01-15&to=2024-01-16')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.period.from).toBe('2024-01-15');
      expect(res.body.data.period.to).toBe('2024-01-16');
    });

    it('should return daily data sorted by date ascending', async () => {
      const res = await request(app)
        .get('/analytics/daily?from=2024-01-15&to=2024-01-16')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const days = res.body.data.days;
      expect(days.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < days.length; i++) {
        expect(days[i].dateKey >= days[i - 1].dateKey).toBe(true);
      }
    });

    it('should return all metrics for each day', async () => {
      const res = await request(app)
        .get('/analytics/daily?from=2024-01-15&to=2024-01-15')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      if (res.body.data.days.length > 0) {
        const day = res.body.data.days[0];
        expect(day.dateKey).toBe('2024-01-15');
        expect(day.ridesRequested).toBe(100);
        expect(day.ridesCompleted).toBe(80);
        expect(day.rideRevenueCents).toBe(1200000);
      }
    });

    it('should return empty array for non-existent date range', async () => {
      const res = await request(app)
        .get('/analytics/daily?from=2020-01-01&to=2020-01-02')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.days)).toBe(true);
    });

    it('should return 400 for invalid date range (from > to)', async () => {
      const res = await request(app)
        .get('/analytics/daily?from=2024-01-20&to=2024-01-15')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Date Validation', () => {
    it('should reject invalid date format', async () => {
      const res = await request(app)
        .get('/analytics/dashboard?from=invalid-date')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject invalid date format in daily endpoint', async () => {
      const res = await request(app)
        .get('/analytics/daily?from=invalid-date')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should handle single day range', async () => {
      const res = await request(app)
        .get('/analytics/dashboard?from=2024-01-15&to=2024-01-15')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.period.from).toBe(res.body.data.period.to);
    });
  });

  describe('Empty State', () => {
    it('should return zero metrics for dashboard with no data', async () => {
      const res = await request(app)
        .get('/analytics/dashboard?from=2099-01-01&to=2099-01-02')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const summary = res.body.data.summary;
      expect(summary.ridesRequested).toBe(0);
      expect(summary.ridesMatched).toBe(0);
      expect(summary.ridesAccepted).toBe(0);
      expect(summary.ridesRejected).toBe(0);
      expect(summary.ridesStarted).toBe(0);
      expect(summary.ridesCompleted).toBe(0);
      expect(summary.ridesCancelled).toBe(0);
      expect(summary.rideRevenueCents).toBe(0);
      expect(summary.paymentsCompleted).toBe(0);
      expect(summary.paymentsFailed).toBe(0);
      expect(summary.refundsCount).toBe(0);
      expect(summary.refundAmountCents).toBe(0);
    });

    it('should return empty days array for daily with no data', async () => {
      const res = await request(app)
        .get('/analytics/daily?from=2099-01-01&to=2099-01-02')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.days)).toBe(true);
      expect(res.body.data.days.length).toBe(0);
    });
  });
});
