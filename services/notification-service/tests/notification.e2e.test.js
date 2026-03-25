const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../../src/config/db.config');
const app = require('../../src/app');
const Notification = require('../../src/models/Notification.model');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const TEST_USER_ID = `e2e-notif-user-${Date.now()}`;
const OTHER_USER_ID = `e2e-other-user-${Date.now()}`;

function tokenFor(userId, role = 'rider') {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
}

const userToken = tokenFor(TEST_USER_ID, 'rider');
const otherUserToken = tokenFor(OTHER_USER_ID, 'rider');

describe('Notification Service E2E Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await Notification.deleteMany({
      userId: { $in: [TEST_USER_ID, OTHER_USER_ID] },
    });
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('notification-service');
    });
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated request to /notifications', async () => {
      const res = await request(app).get('/notifications');
      expect(res.status).toBe(401);
    });

    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .get('/notifications')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /notifications', () => {
    beforeAll(async () => {
      await Notification.create([
        {
          userId: TEST_USER_ID,
          source: 'ride',
          title: 'Ride requested',
          body: 'Your ride has been requested',
        },
        {
          userId: TEST_USER_ID,
          source: 'payment',
          title: 'Payment completed',
          body: 'Your payment was processed',
        },
        {
          userId: TEST_USER_ID,
          source: 'system',
          title: 'Welcome',
          body: 'Welcome to the platform',
        },
      ]);
    });

    it('should return notifications for authenticated user', async () => {
      const res = await request(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(3);
    });

    it('should return only user notifications', async () => {
      const res = await request(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      res.body.data.items.forEach((item) => {
        expect(item.userId).toBe(TEST_USER_ID);
      });
    });

    it('should respect pagination parameters', async () => {
      const res = await request(app)
        .get('/notifications?page=1&limit=2')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeLessThanOrEqual(2);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(2);
    });

    it('should return empty array for user with no notifications', async () => {
      const res = await request(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('should return notifications sorted by createdAt descending', async () => {
      const res = await request(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      for (let i = 1; i < items.length; i++) {
        const prev = new Date(items[i - 1].createdAt);
        const curr = new Date(items[i].createdAt);
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
      }
    });
  });

  describe('GET /notifications/:id', () => {
    let notificationId;

    beforeAll(async () => {
      const notification = await Notification.create({
        userId: TEST_USER_ID,
        source: 'ride',
        title: 'Test notification',
        body: 'This is a test',
      });
      notificationId = notification._id.toString();
    });

    it('should return a specific notification', async () => {
      const res = await request(app)
        .get(`/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(notificationId);
      expect(res.body.data.title).toBe('Test notification');
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/notifications/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when accessing other user notification', async () => {
      const res = await request(app)
        .get(`/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get(`/notifications/${notificationId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    let unreadNotification;

    beforeEach(async () => {
      unreadNotification = await Notification.create({
        userId: TEST_USER_ID,
        source: 'payment',
        title: 'Unread notification',
        body: 'Mark this as read',
      });
    });

    it('should mark notification as read', async () => {
      const res = await request(app)
        .patch(`/notifications/${unreadNotification._id}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.readAt).toBeDefined();
    });

    it('should return updated notification with readAt timestamp', async () => {
      const res = await request(app)
        .patch(`/notifications/${unreadNotification._id}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(new Date(res.body.data.readAt)).toBeInstanceOf(Date);
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when marking other user notification as read', async () => {
      const res = await request(app)
        .patch(`/notifications/${unreadNotification._id}/read`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).patch(`/notifications/${unreadNotification._id}/read`);

      expect(res.status).toBe(401);
    });
  });

  describe('Notification Data Structure', () => {
    let notification;

    beforeAll(async () => {
      notification = await Notification.create({
        userId: TEST_USER_ID,
        source: 'ride',
        eventKey: 'ride.requested',
        title: 'Data structure test',
        body: 'Testing notification fields',
        metadata: { rideId: 'test-ride-123', driverId: 'test-driver-456' },
      });
    });

    it('should include all notification fields', async () => {
      const res = await request(app)
        .get(`/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.userId).toBe(TEST_USER_ID);
      expect(res.body.data.source).toBe('ride');
      expect(res.body.data.eventKey).toBe('ride.requested');
      expect(res.body.data.title).toBe('Data structure test');
      expect(res.body.data.body).toBe('Testing notification fields');
      expect(res.body.data.metadata).toBeDefined();
      expect(res.body.data.metadata.rideId).toBe('test-ride-123');
    });

    it('should include timestamp fields', async () => {
      const res = await request(app)
        .get(`/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.createdAt).toBeDefined();
      expect(res.body.data.updatedAt).toBeDefined();
    });
  });

  describe('Notification Sources', () => {
    it('should handle ride source notifications', async () => {
      const notification = await Notification.create({
        userId: TEST_USER_ID,
        source: 'ride',
        title: 'Ride notification',
        body: 'Ride event occurred',
      });

      const res = await request(app)
        .get(`/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.source).toBe('ride');
    });

    it('should handle payment source notifications', async () => {
      const notification = await Notification.create({
        userId: TEST_USER_ID,
        source: 'payment',
        title: 'Payment notification',
        body: 'Payment event occurred',
      });

      const res = await request(app)
        .get(`/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.source).toBe('payment');
    });

    it('should handle system source notifications', async () => {
      const notification = await Notification.create({
        userId: TEST_USER_ID,
        source: 'system',
        title: 'System notification',
        body: 'System event occurred',
      });

      const res = await request(app)
        .get(`/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.source).toBe('system');
    });
  });

  describe('Pagination Edge Cases', () => {
    it('should handle invalid page parameter', async () => {
      const res = await request(app)
        .get('/notifications?page=invalid')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.page).toBe(1);
    });

    it('should handle negative page parameter', async () => {
      const res = await request(app)
        .get('/notifications?page=-1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.page).toBe(1);
    });

    it('should handle limit over 100', async () => {
      const res = await request(app)
        .get('/notifications?limit=500')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.limit).toBeLessThanOrEqual(100);
    });

    it('should handle zero limit', async () => {
      const res = await request(app)
        .get('/notifications?limit=0')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.limit).toBeGreaterThanOrEqual(1);
    });
  });
});
