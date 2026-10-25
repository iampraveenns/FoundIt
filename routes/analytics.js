import express from 'express';
import {
  generateFourteenDayForecast,
  getCorridorRiskAnalysis,
  DAY_OF_WEEK_FACTORS,
} from '../services/analytics-forecast/forecast.js';

const router = express.Router();

/**
 * GET /api/analytics/forecast
 * 14-day rolling predictive intake & recovery forecast
 */
router.get('/forecast', (req, res) => {
  const forecast = generateFourteenDayForecast();
  res.json({
    success: true,
    model: 'Triple Exponential Smoothing with Seasonal Surge Indication',
    horizonDays: 14,
    forecast,
  });
});

/**
 * GET /api/analytics/corridors
 * Real-time corridor risk analysis & officer deployment suggestions
 */
router.get('/corridors', (req, res) => {
  const corridors = getCorridorRiskAnalysis();
  res.json({
    success: true,
    corridors,
  });
});

/**
 * GET /api/analytics/day-factors
 * Day of week operational surge factors
 */
router.get('/day-factors', (req, res) => {
  res.json({
    success: true,
    factors: DAY_OF_WEEK_FACTORS,
  });
});

export default router;
