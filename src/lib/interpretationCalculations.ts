// Phase 3: Interpretation Calculations
// Regional-Residual Separation, Derivative Filters, Power Spectrum Analysis

import type { ProcessedStation } from './gravityCalculations';

// ─── Regional-Residual Separation ────────────────────────────────────────────

/**
 * Polynomial trend fitting for regional-residual separation.
 * Uses least-squares polynomial regression of specified degree.
 */
export function polynomialRegression(
  x: number[],
  y: number[],
  degree: number
): { coefficients: number[]; regional: number[]; residual: number[] } {
  const n = x.length;
  if (n === 0) return { coefficients: [], regional: [], residual: [] };

  // Build Vandermonde matrix
  const vandermonde: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j <= degree; j++) {
      row.push(Math.pow(x[i], j));
    }
    vandermonde.push(row);
  }

  // Normal equations: (V^T * V) * c = V^T * y
  const cols = degree + 1;
  const VtV: number[][] = Array.from({ length: cols }, () => Array(cols).fill(0));
  const Vty: number[] = Array(cols).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < cols; j++) {
      Vty[j] += vandermonde[i][j] * y[i];
      for (let k = 0; k < cols; k++) {
        VtV[j][k] += vandermonde[i][j] * vandermonde[i][k];
      }
    }
  }

  // Solve using Gaussian elimination
  const coefficients = solveLinearSystem(VtV, Vty);

  // Compute regional and residual
  const regional = x.map(xi => {
    let val = 0;
    for (let j = 0; j < coefficients.length; j++) {
      val += coefficients[j] * Math.pow(xi, j);
    }
    return val;
  });

  const residual = y.map((yi, i) => yi - regional[i]);

  return { coefficients, regional, residual };
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    if (Math.abs(aug[col][col]) < 1e-12) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Back substitution
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= aug[i][j] * x[j];
    }
    if (Math.abs(aug[i][i]) > 1e-12) {
      x[i] /= aug[i][i];
    }
  }
  return x;
}

export interface RegionalResidualResult {
  stationId: string;
  distance: number;
  observed: number;
  regional: number;
  residual: number;
}

export function computeRegionalResidual(
  stations: ProcessedStation[],
  anomalyType: 'freeAirAnomaly' | 'bouguerAnomaly',
  degree: number
): RegionalResidualResult[] {
  const filtered = stations.filter(s => !s.remark?.toLowerCase().includes('close'));
  if (filtered.length < 2) return [];

  // Use cumulative distance as x-axis
  const distances = computeCumulativeDistances(filtered);
  const values = filtered.map(s => s[anomalyType]);

  const { regional, residual } = polynomialRegression(distances, values, degree);

  return filtered.map((s, i) => ({
    stationId: s.stationId,
    distance: distances[i],
    observed: values[i],
    regional: regional[i],
    residual: residual[i],
  }));
}

// ─── Derivative Filters ─────────────────────────────────────────────────────

export interface DerivativeResult {
  stationId: string;
  distance: number;
  horizontalGradient: number;
  verticalGradient: number;
  analyticSignal: number;
}

/**
 * Compute horizontal derivative using central finite differences.
 * Vertical derivative approximated using Hilbert-like transform (second horizontal derivative proxy).
 */
export function computeDerivatives(
  stations: ProcessedStation[],
  anomalyType: 'freeAirAnomaly' | 'bouguerAnomaly'
): DerivativeResult[] {
  const filtered = stations.filter(s => !s.remark?.toLowerCase().includes('close'));
  if (filtered.length < 3) return [];

  const distances = computeCumulativeDistances(filtered);
  const values = filtered.map(s => s[anomalyType]);
  const n = values.length;

  const hGrad: number[] = Array(n).fill(0);
  const vGrad: number[] = Array(n).fill(0);

  // Horizontal gradient (central differences)
  for (let i = 1; i < n - 1; i++) {
    const dx = distances[i + 1] - distances[i - 1];
    if (dx > 0) {
      hGrad[i] = (values[i + 1] - values[i - 1]) / dx;
    }
  }
  // Forward/backward difference for endpoints
  if (n > 1) {
    const dx0 = distances[1] - distances[0];
    if (dx0 > 0) hGrad[0] = (values[1] - values[0]) / dx0;
    const dxn = distances[n - 1] - distances[n - 2];
    if (dxn > 0) hGrad[n - 1] = (values[n - 1] - values[n - 2]) / dxn;
  }

  // Vertical gradient (second horizontal derivative as proxy)
  for (let i = 1; i < n - 1; i++) {
    const dx = (distances[i + 1] - distances[i - 1]) / 2;
    if (dx > 0) {
      vGrad[i] = (values[i + 1] - 2 * values[i] + values[i - 1]) / (dx * dx);
    }
  }
  vGrad[0] = vGrad[1] || 0;
  vGrad[n - 1] = vGrad[n - 2] || 0;

  return filtered.map((s, i) => ({
    stationId: s.stationId,
    distance: distances[i],
    horizontalGradient: hGrad[i],
    verticalGradient: vGrad[i],
    analyticSignal: Math.sqrt(hGrad[i] ** 2 + vGrad[i] ** 2),
  }));
}

// ─── Power Spectrum Analysis ─────────────────────────────────────────────────

export interface PowerSpectrumResult {
  frequency: number;
  wavenumber: number;
  power: number;
  logPower: number;
  depth: number; // Estimated depth from slope
}

/**
 * Radially-averaged power spectrum for depth-to-source estimation.
 * Uses DFT since data may not be regularly spaced.
 */
export function computePowerSpectrum(
  stations: ProcessedStation[],
  anomalyType: 'freeAirAnomaly' | 'bouguerAnomaly'
): { spectrum: PowerSpectrumResult[]; depthEstimates: { shallow: number; deep: number } } {
  const filtered = stations.filter(s => !s.remark?.toLowerCase().includes('close'));
  if (filtered.length < 4) return { spectrum: [], depthEstimates: { shallow: 0, deep: 0 } };

  const distances = computeCumulativeDistances(filtered);
  const values = filtered.map(s => s[anomalyType]);
  const n = values.length;

  // Remove mean
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const detrended = values.map(v => v - mean);

  // Apply Hanning window
  const windowed = detrended.map((v, i) => v * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))));

  // Total profile length
  const L = distances[n - 1] - distances[0];
  if (L <= 0) return { spectrum: [], depthEstimates: { shallow: 0, deep: 0 } };

  // DFT
  const nFreq = Math.floor(n / 2);
  const spectrum: PowerSpectrumResult[] = [];

  for (let k = 1; k <= nFreq; k++) {
    let re = 0, im = 0;
    for (let j = 0; j < n; j++) {
      const angle = (2 * Math.PI * k * j) / n;
      re += windowed[j] * Math.cos(angle);
      im -= windowed[j] * Math.sin(angle);
    }
    const power = (re * re + im * im) / n;
    const frequency = k / L;
    const wavenumber = 2 * Math.PI * frequency;

    spectrum.push({
      frequency,
      wavenumber,
      power,
      logPower: power > 0 ? Math.log(power) : -Infinity,
      depth: 0,
    });
  }

  // Depth estimation from slope of log(power) vs wavenumber
  // Split spectrum into deep (low freq) and shallow (high freq) segments
  const midIdx = Math.floor(spectrum.length / 2);
  const deepSegment = spectrum.slice(0, Math.max(midIdx, 2));
  const shallowSegment = spectrum.slice(midIdx);

  const deepDepth = estimateDepthFromSlope(deepSegment);
  const shallowDepth = estimateDepthFromSlope(shallowSegment);

  // Assign depth estimates to individual points
  spectrum.forEach((s, i) => {
    s.depth = i < midIdx ? deepDepth : shallowDepth;
  });

  return {
    spectrum,
    depthEstimates: { shallow: Math.abs(shallowDepth), deep: Math.abs(deepDepth) },
  };
}

function estimateDepthFromSlope(segment: PowerSpectrumResult[]): number {
  if (segment.length < 2) return 0;
  const validPoints = segment.filter(s => s.logPower > -Infinity && isFinite(s.logPower));
  if (validPoints.length < 2) return 0;

  const x = validPoints.map(s => s.wavenumber);
  const y = validPoints.map(s => s.logPower);
  const n = x.length;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // depth = -slope / (4π) for gravity
  return -slope / (4 * Math.PI);
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Compute cumulative distance along profile using Haversine formula (km).
 */
export function computeCumulativeDistances(stations: { latitude: number; longitude: number }[]): number[] {
  const distances: number[] = [0];
  for (let i = 1; i < stations.length; i++) {
    const d = haversineDistance(
      stations[i - 1].latitude, stations[i - 1].longitude,
      stations[i].latitude, stations[i].longitude
    );
    distances.push(distances[i - 1] + d);
  }
  return distances;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
