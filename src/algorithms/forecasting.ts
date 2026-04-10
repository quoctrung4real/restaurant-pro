// =============================================
// RESTAURANTPRO — AI FORECASTING ENGINE
// Thuật toán dự báo doanh thu thông minh
// =============================================

import type { Revenue, ForecastResult, ForecastReport } from '../types';

// =============================================
// UTILITY FUNCTIONS
// =============================================

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function mape(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) return Infinity;
  let total = 0;
  for (let i = 0; i < n; i++) {
    if (actual[i] !== 0) total += Math.abs((actual[i] - predicted[i]) / actual[i]);
  }
  return (total / n) * 100;
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getDayOfWeek(date: string): number {
  return new Date(date).getDay();
}

function getMonthIndex(date: string): number {
  return new Date(date).getMonth();
}

// =============================================
// ALGORITHM 1: WEIGHTED MOVING AVERAGE (WMA)
// Trọng số cao hơn cho dữ liệu mới nhất
// =============================================

export function weightedMovingAverage(
  data: number[],
  windowSize: number = 7
): number[] {
  const predictions: number[] = [];
  const weights: number[] = Array.from({ length: windowSize }, (_, i) => i + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  for (let i = windowSize; i < data.length; i++) {
    const windowData = data.slice(i - windowSize, i);
    const weighted = windowData.reduce((s, v, j) => s + v * weights[j], 0);
    predictions.push(weighted / weightSum);
  }
  return predictions;
}

export function wmaForecast(values: number[], horizon: number = 7): number[] {
  const windowSize = Math.min(14, values.length);
  const weights = Array.from({ length: windowSize }, (_, i) => (i + 1) ** 1.5);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const result: number[] = [];
  let history = [...values];

  for (let h = 0; h < horizon; h++) {
    const window = history.slice(-windowSize);
    const pred = window.reduce((s, v, j) => {
      const w = weights[j + (windowSize - window.length)];
      return s + v * w;
    }, 0) / weightSum;
    result.push(Math.max(0, pred));
    history.push(pred);
  }

  return result;
}

// =============================================
// ALGORITHM 2: HOLT-WINTERS TRIPLE EXPONENTIAL SMOOTHING
// Xử lý: trend + seasonality (tuần 7 ngày)
// =============================================

interface HoltWintersParams {
  alpha: number;  // Level smoothing
  beta: number;   // Trend smoothing
  gamma: number;  // Seasonality smoothing
  period: number; // Season length (7 for weekly)
}

export function holtWinters(
  data: number[],
  horizon: number,
  params?: Partial<HoltWintersParams>
): number[] {
  const { alpha = 0.3, beta = 0.1, gamma = 0.3, period = 7 } = params || {};

  if (data.length < period * 2) {
    return wmaForecast(data, horizon);
  }

  // Initialize
  let level = mean(data.slice(0, period));
  let trend = (mean(data.slice(period, period * 2)) - mean(data.slice(0, period))) / period;
  const seasonal: number[] = Array.from({ length: period }, (_, i) => {
    let sum = 0;
    let count = 0;
    for (let j = i; j < data.length; j += period) {
      sum += data[j] / (mean(data.slice(Math.max(0, j - period), j + period + 1)) || 1);
      count++;
    }
    return sum / count;
  });

  // Normalize seasonal factors
  const seasonalMean = mean(seasonal);
  for (let i = 0; i < seasonal.length; i++) {
    seasonal[i] /= seasonalMean;
  }

  const fitted: number[] = [];
  const seasonalHistory = [...seasonal];

  // Run through historical data to update state
  for (let t = 0; t < data.length; t++) {
    const s = seasonalHistory[t % period];
    const forecast = (level + trend) * s;
    fitted.push(forecast);

    const prevLevel = level;
    level = alpha * (data[t] / s) + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    seasonalHistory[t % period] = gamma * (data[t] / level) + (1 - gamma) * s;
  }

  // Generate future forecasts
  const forecasts: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    const s = seasonalHistory[(data.length + h - 1) % period];
    const forecast = (level + trend * h) * s;
    forecasts.push(Math.max(0, forecast));
  }

  return forecasts;
}

// =============================================
// ALGORITHM 3: LINEAR REGRESSION WITH SEASONALITY
// Xu hướng tuyến tính + điều chỉnh mùa vụ
// =============================================

export function linearRegressionForecast(
  data: number[],
  horizon: number,
  dates?: string[]
): number[] {
  const n = data.length;

  // Calculate linear regression coefficients
  const xValues = Array.from({ length: n }, (_, i) => i);
  const xMean = mean(xValues);
  const yMean = mean(data);

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (data[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Day-of-week seasonality from historical data
  const dowFactors = [0, 0, 0, 0, 0, 0, 0];
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];

  if (dates && dates.length === data.length) {
    const trendRemoved = data.map((v, i) => {
      const trend = slope * i + intercept;
      return trend > 0 ? v / trend : 1;
    });

    dates.forEach((d, i) => {
      const dow = getDayOfWeek(d);
      dowFactors[dow] += trendRemoved[i];
      dowCounts[dow]++;
    });

    for (let d = 0; d < 7; d++) {
      dowFactors[d] = dowCounts[d] > 0 ? dowFactors[d] / dowCounts[d] : 1;
    }

    // Normalize
    const factorMean = mean(dowFactors);
    for (let d = 0; d < 7; d++) {
      dowFactors[d] /= factorMean;
    }
  } else {
    // Default seasonality: Fri/Sat/Sun higher
    dowFactors.fill(1);
    dowFactors[0] = 0.78; // Mon
    dowFactors[1] = 0.82;
    dowFactors[2] = 0.88;
    dowFactors[3] = 0.92;
    dowFactors[4] = 1.05; // Fri
    dowFactors[5] = 1.28; // Sat
    dowFactors[6] = 1.22; // Sun
  }

  const lastDate = dates ? dates[dates.length - 1] : new Date().toISOString().split('T')[0];
  const forecasts: number[] = [];

  for (let h = 1; h <= horizon; h++) {
    const futureDate = addDays(lastDate, h);
    const dow = getDayOfWeek(futureDate);
    const trend = slope * (n + h - 1) + intercept;
    const seasonal = dowFactors[dow];
    forecasts.push(Math.max(0, trend * seasonal));
  }

  return forecasts;
}

// =============================================
// ALGORITHM 4: SEASONAL DECOMPOSITION (STL-like)
// Phân tách: trend + seasonality + residual
// =============================================

interface DecompositionResult {
  trend: number[];
  seasonal: number[];
  residual: number[];
}

export function seasonalDecomposition(
  data: number[],
  period: number = 7
): DecompositionResult {
  const n = data.length;

  // Step 1: Estimate trend with centered moving average
  const trend: number[] = new Array(n).fill(0);
  const halfWindow = Math.floor(period / 2);

  for (let i = halfWindow; i < n - halfWindow; i++) {
    trend[i] = mean(data.slice(i - halfWindow, i + halfWindow + 1));
  }

  // Fill edges
  for (let i = 0; i < halfWindow; i++) trend[i] = trend[halfWindow];
  for (let i = n - halfWindow; i < n; i++) trend[i] = trend[n - halfWindow - 1];

  // Step 2: Detrend
  const detrended = data.map((v, i) => trend[i] > 0 ? v / trend[i] : 1);

  // Step 3: Average seasonal factors
  const seasonalFactors: number[] = new Array(period).fill(0);
  const seasonalCounts: number[] = new Array(period).fill(0);

  for (let i = halfWindow; i < n - halfWindow; i++) {
    seasonalFactors[i % period] += detrended[i];
    seasonalCounts[i % period]++;
  }

  for (let s = 0; s < period; s++) {
    seasonalFactors[s] = seasonalCounts[s] > 0
      ? seasonalFactors[s] / seasonalCounts[s]
      : 1;
  }

  // Normalize
  const sfMean = mean(seasonalFactors);
  for (let s = 0; s < period; s++) seasonalFactors[s] /= sfMean;

  // Step 4: Build seasonal series and residuals
  const seasonal = data.map((_, i) => seasonalFactors[i % period]);
  const residual = data.map((v, i) => {
    const t = trend[i];
    const s = seasonal[i];
    return (t * s) > 0 ? v / (t * s) : 1;
  });

  return { trend, seasonal, residual };
}

export function stlForecast(
  data: number[],
  horizon: number,
  dates?: string[]
): number[] {
  if (data.length < 14) return wmaForecast(data, horizon);

  const { trend } = seasonalDecomposition(data, 7);

  // Forecast trend using linear regression on trend series
  const validTrend = trend.filter(v => v > 0);
  const n = validTrend.length;
  const xMean = (n - 1) / 2;
  const yMean = mean(validTrend);

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (validTrend[i] - yMean);
    den += (i - xMean) ** 2;
  }

  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;

  // Seasonal factors
  const lastDate = dates ? dates[dates.length - 1] : new Date().toISOString().split('T')[0];
  const dowFactors = computeDowFactors(data, dates);

  const forecasts: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    const trendValue = slope * (n + h - 1) + intercept;
    const futureDate = addDays(lastDate, h);
    const dow = getDayOfWeek(futureDate);
    const seasonal = dowFactors[dow];
    forecasts.push(Math.max(0, trendValue * seasonal));
  }

  return forecasts;
}

function computeDowFactors(data: number[], dates?: string[]): number[] {
  const factors = new Array(7).fill(0);
  const counts = new Array(7).fill(0);
  const avg = mean(data);

  if (dates && dates.length === data.length) {
    dates.forEach((d, i) => {
      const dow = getDayOfWeek(d);
      factors[dow] += data[i] / (avg || 1);
      counts[dow]++;
    });
    for (let d = 0; d < 7; d++) {
      factors[d] = counts[d] > 0 ? factors[d] / counts[d] : 1;
    }
  } else {
    return [0.78, 0.82, 0.88, 0.92, 1.05, 1.28, 1.22];
  }

  // Normalize
  const m = mean(factors);
  return factors.map(f => f / m);
}

// =============================================
// ALGORITHM 5: ENSEMBLE MODEL
// Kết hợp các model với trọng số dựa trên MAPE
// =============================================

export function ensembleForecast(
  data: number[],
  horizon: number,
  dates?: string[]
): { predictions: number[]; weights: Record<string, number> } {
  if (data.length < 7) {
    const simple = wmaForecast(data, horizon);
    return { predictions: simple, weights: { wma: 1.0 } };
  }

  const validationSize = Math.min(14, Math.floor(data.length * 0.2));
  const trainData = data.slice(0, -validationSize);
  const actualValid = data.slice(-validationSize);
  const validDates = dates ? dates.slice(-validationSize) : undefined;

  // Get predictions from each model on validation set
  const models: Record<string, number[]> = {
    wma: wmaForecast(trainData, validationSize),
    holtWinters: holtWinters(trainData, validationSize),
    linearRegression: linearRegressionForecast(trainData, validationSize, dates?.slice(0, -validationSize)),
    stl: stlForecast(trainData, validationSize, dates?.slice(0, -validationSize)),
  };

  // Compute MAPE for each model
  const errors: Record<string, number> = {};
  for (const [name, preds] of Object.entries(models)) {
    errors[name] = mape(actualValid, preds);
  }

  // Convert errors to weights (lower error = higher weight)
  // Using inverse MAPE with softmax-like normalization
  const maxError = Math.max(...Object.values(errors));
  const rawWeights: Record<string, number> = {};

  for (const [name, err] of Object.entries(errors)) {
    // Avoid division by zero
    rawWeights[name] = maxError > 0 ? (maxError - err + 1) ** 2 : 1;
  }

  const weightSum = Object.values(rawWeights).reduce((a, b) => a + b, 0);
  const weights: Record<string, number> = {};
  for (const [name, w] of Object.entries(rawWeights)) {
    weights[name] = w / weightSum;
  }

  // Generate final forecasts from all models
  const finalPredictions = {
    wma: wmaForecast(data, horizon),
    holtWinters: holtWinters(data, horizon),
    linearRegression: linearRegressionForecast(data, horizon, dates),
    stl: stlForecast(data, horizon, dates),
  };

  // Weighted average ensemble
  const ensemble: number[] = Array.from({ length: horizon }, (_, h) => {
    let total = 0;
    for (const [name, preds] of Object.entries(finalPredictions)) {
      total += (preds[h] || 0) * weights[name];
    }
    return Math.max(0, total);
  });

  return { predictions: ensemble, weights };
}

// =============================================
// MAIN FORECAST ENGINE
// Tạo báo cáo dự báo đầy đủ
// =============================================

export function generateForecastReport(
  revenues: Revenue[],
  horizon: number = 30
): ForecastReport {
  if (revenues.length < 14) {
    return {
      dailyForecasts: [],
      monthlyTotal: 0,
      growthRate: 0,
      confidence: 0,
      recommendations: ['Cần thêm dữ liệu lịch sử để dự báo chính xác'],
      riskLevel: 'high',
      peakDays: [],
      lowDays: [],
    };
  }

  // Sort by date
  const sorted = [...revenues].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map(r => r.amount);
  const dates = sorted.map(r => r.date);

  // Get ensemble forecast
  const { predictions, weights } = ensembleForecast(values, horizon, dates);

  const lastDate = dates[dates.length - 1];

  // Compute confidence interval (±1.5 stddev of recent residuals)
  const recentData = values.slice(-30);
  const recentStd = std(recentData);
  const stdFactor = 0.15; // 15% uncertainty for MAPE-calibrated CI

  const dailyForecasts: ForecastResult[] = predictions.map((pred, i) => {
    const date = addDays(lastDate, i + 1);
    const uncertainty = pred * stdFactor * (1 + i / horizon * 0.5);
    return {
      date,
      predicted: Math.round(pred),
      lower: Math.round(Math.max(0, pred - uncertainty)),
      upper: Math.round(pred + uncertainty),
      model: 'Ensemble',
    };
  });

  // Monthly total
  const monthlyTotal = Math.round(predictions.slice(0, 30).reduce((a, b) => a + b, 0));

  // Growth rate: compare last 30 days vs forecast next 30 days
  const last30Avg = mean(values.slice(-30));
  const next30Avg = mean(predictions.slice(0, 30));
  const growthRate = last30Avg > 0 ? ((next30Avg - last30Avg) / last30Avg) * 100 : 0;

  // Confidence: inverse of CV (coefficient of variation)
  const cv = recentStd / (mean(recentData) || 1);
  const confidence = Math.min(95, Math.max(50, Math.round((1 - cv) * 100)));

  // Get model weights for dominant model
  const dominantModel = Object.entries(weights).reduce((a, b) => a[1] > b[1] ? a : b)[0];

  // Peak/low day analysis
  const dayAvg: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  sorted.slice(-90).forEach(r => {
    dayAvg[getDayOfWeek(r.date)].push(r.amount);
  });

  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayAverages = Object.entries(dayAvg).map(([d, vals]) => ({
    day: dayNames[parseInt(d)],
    avg: vals.length > 0 ? mean(vals) : 0,
  }));

  const sortedDays = [...dayAverages].sort((a, b) => b.avg - a.avg);
  const peakDays = sortedDays.slice(0, 2).map(d => d.day);
  const lowDays = sortedDays.slice(-2).map(d => d.day);

  // Recommendations
  const recommendations: string[] = [];

  if (growthRate > 5) {
    recommendations.push(`📈 Doanh thu dự báo tăng ${growthRate.toFixed(1)}% — Cân nhắc tăng nhân lực và dự trữ nguyên liệu`);
  } else if (growthRate < -5) {
    recommendations.push(`📉 Doanh thu có xu hướng giảm ${Math.abs(growthRate).toFixed(1)}% — Xem xét chương trình khuyến mãi`);
  }

  recommendations.push(`🗓️ Ngày cao điểm: ${peakDays.join(', ')} — Cần chuẩn bị nhân lực và nguyên liệu đầy đủ`);
  recommendations.push(`📊 Model dự báo tốt nhất: ${modelNames[dominantModel]} (trọng số ${(weights[dominantModel] * 100).toFixed(0)}%)`);

  if (confidence < 70) {
    recommendations.push('⚠️ Độ tin cậy thấp — Cần thêm dữ liệu lịch sử để cải thiện dự báo');
  }

  const riskLevel: ForecastReport['riskLevel'] =
    confidence >= 80 ? 'low' :
    confidence >= 65 ? 'medium' : 'high';

  return {
    dailyForecasts,
    monthlyTotal,
    growthRate,
    confidence,
    recommendations,
    riskLevel,
    peakDays,
    lowDays,
  };
}

const modelNames: Record<string, string> = {
  wma: 'Weighted Moving Average',
  holtWinters: 'Holt-Winters Exponential Smoothing',
  linearRegression: 'Linear Regression',
  stl: 'Seasonal Decomposition (STL)',
};

// =============================================
// SMART PRICING ENGINE
// =============================================

export function calculateRecommendedPrice(
  ingredientCost: number,
  labourCostPercent: number = 25,
  overheadPercent: number = 15,
  targetFoodCostPercent: number = 28,
  vatPercent: number = 8
): {
  totalCost: number;
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  profitMargin: number;
  labourCost: number;
  overheadCost: number;
} {
  // Base cost
  const totalCost = ingredientCost;

  // Recommended price: food cost model
  const recommendedPrice = ingredientCost / (targetFoodCostPercent / 100);

  // Add VAT
  const priceWithVat = recommendedPrice * (1 + vatPercent / 100);

  // Labour and overhead based on recommended price
  const labourCost = priceWithVat * (labourCostPercent / 100);
  const overheadCost = priceWithVat * (overheadPercent / 100);

  // Min price: cover all costs with 10% margin
  const allCosts = ingredientCost + labourCost + overheadCost;
  const minPrice = allCosts * 1.1;

  // Max price: market cap (3x ingredient cost heuristic)
  const maxPrice = ingredientCost * 4.5;

  // Profit margin
  const profitMargin = ((priceWithVat - allCosts) / priceWithVat) * 100;

  return {
    totalCost: Math.round(totalCost),
    recommendedPrice: Math.round(priceWithVat / 1000) * 1000,
    minPrice: Math.round(minPrice / 1000) * 1000,
    maxPrice: Math.round(maxPrice / 1000) * 1000,
    profitMargin: Math.round(profitMargin * 10) / 10,
    labourCost: Math.round(labourCost),
    overheadCost: Math.round(overheadCost),
  };
}

// =============================================
// BREAK-EVEN ANALYSIS
// =============================================

export function calculateBreakEven(
  fixedCostMonthly: number,
  avgOrderValue: number,
  avgOrderCost: number
): {
  breakEvenRevenue: number;
  breakEvenOrders: number;
  contributionMarginRatio: number;
  safetyMarginRevenue: number;
  currentRevToCoverFixed: number;
} {
  const contributionPerOrder = avgOrderValue - avgOrderCost;
  const contributionMarginRatio = avgOrderValue > 0 ? contributionPerOrder / avgOrderValue : 0;

  const breakEvenRevenue = contributionMarginRatio > 0
    ? fixedCostMonthly / contributionMarginRatio
    : 0;

  const breakEvenOrders = contributionPerOrder > 0
    ? Math.ceil(fixedCostMonthly / contributionPerOrder)
    : 0;

  return {
    breakEvenRevenue: Math.round(breakEvenRevenue),
    breakEvenOrders,
    contributionMarginRatio: Math.round(contributionMarginRatio * 100),
    safetyMarginRevenue: Math.round(breakEvenRevenue * 0.8),
    currentRevToCoverFixed: Math.round(breakEvenRevenue * 1.2),
  };
}

// =============================================
// MENU ENGINEERING — BCG MATRIX
// =============================================

export function classifyMenuItems(
  items: Array<{
    id: string;
    name: string;
    category: string;
    totalSold: number;
    totalRevenue: number;
    cost: number;
    price: number;
  }>
): import('../types').MenuEngineeringItem[] {
  if (items.length === 0) return [];

  const avgSold = mean(items.map(i => i.totalSold));
  const avgContribMargin = mean(items.map(i => i.price - i.cost));

  return items.map(item => {
    const contributionMargin = item.price - item.cost;
    const popularityScore = avgSold > 0 ? (item.totalSold / avgSold) * 100 : 0;
    const profitabilityScore = avgContribMargin > 0 ? (contributionMargin / avgContribMargin) * 100 : 0;

    // BCG Classification
    const isHighPopularity = popularityScore >= 100;
    const isHighProfitability = profitabilityScore >= 100;

    let classification: import('../types').MenuEngineeringItem['classification'];
    let recommendation: string;

    if (isHighPopularity && isHighProfitability) {
      classification = 'star';
      recommendation = '⭐ Sản phẩm ngôi sao — Duy trì chất lượng, đẩy mạnh marketing';
    } else if (isHighPopularity && !isHighProfitability) {
      classification = 'plow_horse';
      recommendation = '🐴 Bán nhiều nhưng lợi nhuận thấp — Tối ưu cost hoặc tăng giá nhẹ';
    } else if (!isHighPopularity && isHighProfitability) {
      classification = 'puzzle';
      recommendation = '❓ Lợi nhuận tốt nhưng ít người gọi — Cần marketing mạnh hơn';
    } else {
      classification = 'dog';
      recommendation = '🐕 Bán ít, lợi nhuận thấp — Cân nhắc loại bỏ khỏi menu';
    }

    return {
      menuItemId: item.id,
      name: item.name,
      category: item.category,
      totalSold: item.totalSold,
      totalRevenue: item.totalRevenue,
      avgCost: item.cost,
      contributionMargin,
      popularityScore: Math.round(popularityScore),
      profitabilityScore: Math.round(profitabilityScore),
      classification,
      recommendation,
    };
  });
}
