const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { logger } = require('@rideshare/shared');
const locationService = require('../services/location.service');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function attachSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || '*', credentials: true },
    path: '/location-ws',
  });

  const driverNamespace = io.of('/drivers');

  driverNamespace.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'driver' && decoded.role !== 'admin') {
        return next(new Error('Driver role required'));
      }
      socket.user = decoded;
      socket.driverId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  driverNamespace.on('connection', (socket) => {
    logger.info('Driver connected to location socket', { driverId: socket.driverId });

    socket.on('location', async (payload) => {
      try {
        const { lat, lng, heading, speed, isAvailable } = payload;
        await locationService.updateLocation(socket.driverId, {
          lat,
          lng,
          heading,
          speed,
          isAvailable,
        });
        driverNamespace.emit('location:updated', {
          driverId: socket.driverId,
          lat: Number(lat),
          lng: Number(lng),
          heading: payload.heading,
          speed: payload.speed,
          isAvailable: payload.isAvailable !== false,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('offline', async () => {
      try {
        await locationService.setDriverOffline(socket.driverId);
        driverNamespace.emit('driver:offline', { driverId: socket.driverId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      logger.info('Driver disconnected', { driverId: socket.driverId });
    });
  });

  const riderNamespace = io.of('/riders');
  riderNamespace.on('connection', (socket) => {
    socket.on('subscribe:nearby', (data) => {
      const { lat, lng, radiusKm } = data || {};
      socket.nearbyQuery = { lat, lng, radiusKm };
    });
  });

  return io;
}

module.exports = { attachSocketServer };
