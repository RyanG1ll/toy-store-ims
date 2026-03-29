/**
 * Reorder Point = (Average Daily Demand × Lead Time) + Safety Stock
 * Based on Harris (1913) and Silver, Pyke & Peterson (1998)
 */
function calculateReorderPoint(avgDailyDemand, leadTimeDays, safetyStockDays = 3) {
  const safetyStock = avgDailyDemand * safetyStockDays;
  return Math.ceil((avgDailyDemand * leadTimeDays) + safetyStock);
}

/**
 * Economic Order Quantity (EOQ) - Harris (1913)
 * Minimises total ordering and holding costs
 * EOQ = sqrt((2 × Demand × Order Cost) / Holding Cost)
 */
function calculateEOQ(annualDemand, orderCost, holdingCostPerUnit) {
  if (holdingCostPerUnit <= 0) return 0;
  return Math.ceil(Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit));
}

/**
 * Simple Moving Average - for demand forecasting
 * Averages the last N periods of sales data
 */
function simpleMovingAverage(salesData, periods = 3) {
  if (salesData.length < periods) return 0;
  const recent = salesData.slice(-periods);
  return recent.reduce((sum, val) => sum + val, 0) / periods;
}

/**
 * Exponential Smoothing - gives more weight to recent data
 * Forecast = α × Actual + (1 - α) × Previous Forecast
 */
function exponentialSmoothing(salesData, alpha = 0.3) {
  if (salesData.length === 0) return 0;
  let forecast = salesData[0];
  for (let i = 1; i < salesData.length; i++) {
    forecast = alpha * salesData[i] + (1 - alpha) * forecast;
  }
  return Math.round(forecast * 100) / 100;
}

module.exports = {
  calculateReorderPoint,
  calculateEOQ,
  simpleMovingAverage,
  exponentialSmoothing,
};