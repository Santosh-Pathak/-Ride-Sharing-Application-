/**
 * Fare: base + (distance * ratePerKm) + (duration * ratePerMin), then * surgeMultiplier.
 */
const BASE_FARE = Number(process.env.BASE_FARE) || 2.5;
const RATE_PER_KM = Number(process.env.RATE_PER_KM) || 1.2;
const RATE_PER_MIN = Number(process.env.RATE_PER_MIN) || 0.25;
const MIN_FARE = Number(process.env.MIN_FARE) || 5;

function getSurgeMultiplier(_zoneOrTime) {
  const surge = process.env.SURGE_MULTIPLIER ? Number(process.env.SURGE_MULTIPLIER) : 1;
  return Math.max(0.5, Math.min(3, surge));
}

function calculateFare(distanceKm, durationMin, surgeMultiplier = 1) {
  const base = BASE_FARE;
  const distancePart = distanceKm * RATE_PER_KM;
  const durationPart = durationMin * RATE_PER_MIN;
  const subtotal = base + distancePart + durationPart;
  const total = Math.max(MIN_FARE, subtotal * surgeMultiplier);
  return {
    baseFare: base,
    distanceKm,
    durationMin,
    ratePerKm: RATE_PER_KM,
    ratePerMin: RATE_PER_MIN,
    surgeMultiplier,
    total: Math.round(total * 100) / 100,
  };
}

function estimateFare(distanceKm, estimatedDurationMin, surgeMultiplier = 1) {
  return calculateFare(distanceKm, estimatedDurationMin, surgeMultiplier);
}

module.exports = {
  calculateFare,
  estimateFare,
  getSurgeMultiplier,
  BASE_FARE,
  RATE_PER_KM,
  RATE_PER_MIN,
};
