const crypto = require('crypto');
const { getRedis } = require('@rideshare/shared');

const REFRESH_PREFIX = 'refresh:';
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60; // 7 days

function generateTokenId() {
  return crypto.randomBytes(24).toString('hex');
}

async function storeRefreshToken(userId) {
  const tokenId = generateTokenId();
  const redis = getRedis();
  const key = REFRESH_PREFIX + tokenId;
  await redis.setex(key, REFRESH_TTL_SEC, JSON.stringify({ userId, createdAt: Date.now() }));
  return tokenId;
}

async function validateAndConsumeRefreshToken(tokenId) {
  const redis = getRedis();
  const key = REFRESH_PREFIX + tokenId;
  const raw = await redis.get(key);
  if (!raw) return null;
  await redis.del(key);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function revokeRefreshToken(tokenId) {
  const redis = getRedis();
  await redis.del(REFRESH_PREFIX + tokenId);
}

module.exports = {
  storeRefreshToken,
  validateAndConsumeRefreshToken,
  revokeRefreshToken,
  REFRESH_TTL_SEC,
};
