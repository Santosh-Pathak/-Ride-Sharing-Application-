const { createProxyMiddleware } = require('http-proxy-middleware');
const { services } = require('../config/services.config');
const { logger, INTERNAL_SERVICE_HEADER, INTERNAL_SERVICE_NAME_HEADER } = require('@rideshare/shared');

function createServiceProxy(serviceName) {
  const target = services[serviceName];
  if (!target) {
    logger.warn(`Unknown service: ${serviceName}`);
    return (req, res) => res.status(502).json({ error: 'Bad Gateway' });
  }
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => path,
    onProxyReq: (proxyReq) => {
      proxyReq.removeHeader(INTERNAL_SERVICE_HEADER);
      proxyReq.removeHeader(INTERNAL_SERVICE_NAME_HEADER);
    },
    onError: (err, req, res) => {
      logger.error('Proxy error', { service: serviceName, error: err.message });
      res.status(502).json({ success: false, error: 'Service unavailable' });
    },
  });
}

module.exports = { createServiceProxy };
