const metricsService = require('../services/metrics.service');
const { AppError } = require('@rideshare/shared');

function defaultFromKey(toKey) {
  const d = new Date(`${toKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 29);
  return d.toISOString().slice(0, 10);
}

async function dashboard(req, res, next) {
  try {
    const to = metricsService.parseDateKey(req.query.to) || metricsService.utcDateKey();
    const from = metricsService.parseDateKey(req.query.from) || defaultFromKey(to);
    if (from > to) throw new AppError('Invalid range: from must be <= to', 400, 'VALIDATION_ERROR');

    const summary = await metricsService.aggregateRange(from, to);
    const totals = { ...summary };
    delete totals._id;

    res.json({
      success: true,
      data: {
        period: { from, to },
        summary: {
          ...totals,
          rideRevenue: (totals.rideRevenueCents / 100).toFixed(2),
          refundAmount: (totals.refundAmountCents / 100).toFixed(2),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function daily(req, res, next) {
  try {
    const to = metricsService.parseDateKey(req.query.to) || metricsService.utcDateKey();
    const from = metricsService.parseDateKey(req.query.from) || defaultFromKey(to);
    if (from > to) throw new AppError('Invalid range: from must be <= to', 400, 'VALIDATION_ERROR');

    const rows = await metricsService.listDaily(from, to);
    res.json({ success: true, data: { period: { from, to }, days: rows } });
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboard, daily };
