// Advanced Corrections: Terrain, Tidal, and Isostatic
// Also: Upward/Downward Continuation, Euler Deconvolution, Survey QC

import type { ProcessedStation } from './gravityCalculations';
import { computeCumulativeDistances } from './interpretationCalculations';

// ─── Terrain Correction (Simple Near-Zone Estimate) ─────────────────────────

/**
 * Simple terrain correction using elevation differences between adjacent stations.
 * TC_i = G * ρ * Σ (Δh² / (2 * r)) for nearby stations
 * Simplified: TC ≈ 0.04193 * ρ * Σ((h_i - h_j)² / (2 * d_ij)) for neighbors
 */
export function computeTerrainCorrection(
  stations: ProcessedStation[],
  density: number = 2.67,
  maxNeighborDistance: number = 5 // km
): TerrainCorrectionResult[] {
  const filtered = stations.filter(s => !s.remark?.toLowerCase().includes('close'));
  if (filtered.length < 2) return [];

  const distances = computeCumulativeDistances(filtered);
  const G = 6.674e-11; // m³/(kg·s²)
  const rhoKg = density * 1000; // kg/m³

  return filtered.map((station, i) => {
    let terrainCorr = 0;
    let neighborCount = 0;

    for (let j = 0; j < filtered.length; j++) {
      if (i === j) continue;
      const dij = Math.abs(distances[i] - distances[j]);
      if (dij <= 0 || dij > maxNeighborDistance) continue;

      const dh = station.height - filtered[j].height;
      // TC contribution = G * ρ * (dh² / (2 * r)) converted to mGal
      // Factor: G * ρ in mGal/m units ≈ 0.04193 * density for Bouguer slab
      // For terrain: TC = 0.04193 * ρ * dh² / (2 * r * 1000) where r in km->m
      terrainCorr += (0.04193 * density * dh * dh) / (2 * dij * 1000);
      neighborCount++;
    }

    return {
      stationId: station.stationId,
      terrainCorrection: terrainCorr,
      neighborCount,
      correctedBouguer: station.bouguerAnomaly + terrainCorr,
    };
  });
}

export interface TerrainCorrectionResult {
  stationId: string;
  terrainCorrection: number;
  neighborCount: number;
  correctedBouguer: number;
}

// ─── Tidal Correction ───────────────────────────────────────────────────────

/**
 * Simplified Longman (1959) tidal correction.
 * Computes the luni-solar gravitational effect based on date/time and location.
 * Returns correction in mGal.
 */
export function computeTidalCorrection(
  stations: ProcessedStation[]
): TidalCorrectionResult[] {
  const filtered = stations.filter(s => !s.remark?.toLowerCase().includes('close'));

  return filtered.map(station => {
    const tidalCorr = longmanTidalCorrection(
      station.latitude,
      station.longitude,
      station.height,
      station.date,
      station.time
    );

    return {
      stationId: station.stationId,
      tidalCorrection: tidalCorr,
      correctedGravity: station.absoluteGravity - tidalCorr,
      dateTime: `${station.date} ${station.time}`,
    };
  });
}

export interface TidalCorrectionResult {
  stationId: string;
  tidalCorrection: number;
  correctedGravity: number;
  dateTime: string;
}

/**
 * Simplified Longman tidal gravity formula.
 * Approximation using dominant lunar (M2) and solar (S2) components.
 */
function longmanTidalCorrection(
  lat: number, lon: number, height: number,
  dateStr: string, timeStr: string
): number {
  const latRad = (lat * Math.PI) / 180;
  const timeParts = timeStr.split(':');
  const hours = parseInt(timeParts[0]) + parseInt(timeParts[1]) / 60 + (timeParts[2] ? parseInt(timeParts[2]) / 3600 : 0);

  // Parse date
  const dateParts = dateStr.split(/[-/]/);
  let year: number, month: number, day: number;
  if (dateParts[0].length === 4) {
    year = parseInt(dateParts[0]); month = parseInt(dateParts[1]); day = parseInt(dateParts[2]);
  } else {
    day = parseInt(dateParts[0]); month = parseInt(dateParts[1]); year = parseInt(dateParts[2]);
  }

  // Julian date approximation
  const jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) +
    Math.floor(275 * month / 9) + day + 1721013.5 + hours / 24;

  const T = (jd - 2451545.0) / 36525; // Julian centuries from J2000

  // Lunar hour angle approximation
  const lunarHourAngle = (280.46061837 + 360.98564736629 * (jd - 2451545.0) + lon) * Math.PI / 180;
  const solarHourAngle = (280.46646 + 36000.76983 * T + lon) * Math.PI / 180;

  // Lunar declination (simplified)
  const lunarDec = 23.4 * Math.sin(2 * Math.PI * T * 13.37) * Math.PI / 180;
  const solarDec = 23.44 * Math.sin((2 * Math.PI / 365.25) * ((jd - 2451545) + 284)) * Math.PI / 180;

  // Tidal potential derivatives (simplified Longman)
  const sin2lat = Math.sin(2 * latRad);
  const cos2lat = Math.cos(latRad) ** 2;

  // Lunar component (dominant, ~2.6x solar)
  const gMoon = 0.0000537 * 980665; // in mGal scale factor
  const lunarTide = gMoon * (
    (3 * Math.sin(latRad) ** 2 - 1) * (3 * Math.sin(lunarDec) ** 2 - 1) / 2 +
    3 * sin2lat * Math.sin(2 * lunarDec) * Math.cos(lunarHourAngle) / 2 +
    3 * cos2lat * Math.cos(lunarDec) ** 2 * Math.cos(2 * lunarHourAngle) / 2
  );

  // Solar component (~0.46x lunar)
  const gSun = 0.0000248 * 980665;
  const solarTide = gSun * (
    (3 * Math.sin(latRad) ** 2 - 1) * (3 * Math.sin(solarDec) ** 2 - 1) / 2 +
    3 * sin2lat * Math.sin(2 * solarDec) * Math.cos(solarHourAngle) / 2 +
    3 * cos2lat * Math.cos(solarDec) ** 2 * Math.cos(2 * solarHourAngle) / 2
  );

  // Total tidal correction in mGal (typical range: -0.3 to +0.3 mGal)
  return (lunarTide + solarTide) / 10000;
}

// ─── Isostatic Anomaly ──────────────────────────────────────────────────────

export interface IsostaticResult {
  stationId: string;
  isostaticCorrection: number;
  isostaticAnomaly: number;
  rootDepth: number;
  model: 'airy' | 'pratt';
}

/**
 * Airy isostatic model: assumes constant density, varying crustal thickness.
 * Root depth = h * (ρc / (ρm - ρc)) where h = elevation
 * Isostatic correction ≈ 2πGρc * root_thickness
 */
export function computeIsostaticAnomaly(
  stations: ProcessedStation[],
  model: 'airy' | 'pratt' = 'airy',
  crustalDensity: number = 2.67,
  mantleDensity: number = 3.3,
  normalCrustalThickness: number = 35, // km
  compensationDepth: number = 100 // km, for Pratt
): IsostaticResult[] {
  const filtered = stations.filter(s => !s.remark?.toLowerCase().includes('close'));

  return filtered.map(station => {
    let rootDepth: number;
    let isostaticCorr: number;

    if (model === 'airy') {
      // Airy: root = h * ρc / (ρm - ρc)
      rootDepth = (station.height / 1000) * crustalDensity / (mantleDensity - crustalDensity);
      // Isostatic correction ≈ 2πG * Δρ * root * 1e5 (to mGal)
      isostaticCorr = 2 * Math.PI * 6.674e-11 * (mantleDensity - crustalDensity) * 1000 * rootDepth * 1000 * 1e5;
    } else {
      // Pratt: density varies, compensation depth constant
      const effectiveDensity = crustalDensity * normalCrustalThickness / 
        (normalCrustalThickness + station.height / 1000);
      rootDepth = compensationDepth;
      isostaticCorr = 2 * Math.PI * 6.674e-11 * (crustalDensity - effectiveDensity) * 1000 * compensationDepth * 1000 * 1e5;
    }

    return {
      stationId: station.stationId,
      isostaticCorrection: isostaticCorr,
      isostaticAnomaly: station.bouguerAnomaly - isostaticCorr,
      rootDepth,
      model,
    };
  });
}

// ─── Upward/Downward Continuation ───────────────────────────────────────────

export interface ContinuationResult {
  stationId: string;
  distance: number;
  original: number;
  continued: number;
  continuationHeight: number;
}

/**
 * Upward/Downward continuation using wavenumber domain filtering.
 * Upward (h > 0): attenuates high frequencies → enhances deep sources
 * Downward (h < 0): amplifies high frequencies → enhances shallow sources
 * Filter: exp(-|k| * h) for upward, exp(|k| * |h|) for downward (with damping)
 */
export function computeContinuation(
  stations: ProcessedStation[],
  continuationHeight: number, // positive = upward, negative = downward (km)
  anomalyType: 'freeAirAnomaly' | 'bouguerAnomaly' = 'bouguerAnomaly'
): ContinuationResult[] {
  const filtered = stations.filter(s => !s.remark?.toLowerCase().includes('close'));
  if (filtered.length < 4) return [];

  const distances = computeCumulativeDistances(filtered);
  const values = filtered.map(s => s[anomalyType]);
  const n = values.length;
  const L = distances[n - 1] - distances[0];
  if (L <= 0) return [];

  // Remove mean
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const centered = values.map(v => v - mean);

  // DFT forward
  const nFreq = Math.floor(n / 2);
  const reCoeff: number[] = [];
  const imCoeff: number[] = [];

  for (let k = 0; k <= nFreq; k++) {
    let re = 0, im = 0;
    for (let j = 0; j < n; j++) {
      const angle = (2 * Math.PI * k * j) / n;
      re += centered[j] * Math.cos(angle);
      im -= centered[j] * Math.sin(angle);
    }
    reCoeff.push(re);
    imCoeff.push(im);
  }

  // Apply continuation filter
  const h = Math.abs(continuationHeight);
  const isUpward = continuationHeight > 0;

  for (let k = 1; k <= nFreq; k++) {
    const wavenumber = (2 * Math.PI * k) / L;
    let filter: number;

    if (isUpward) {
      filter = Math.exp(-wavenumber * h);
    } else {
      // Downward: with Tikhonov damping to prevent blow-up
      const maxAmp = 10;
      filter = Math.min(Math.exp(wavenumber * h), maxAmp);
    }

    reCoeff[k] *= filter;
    imCoeff[k] *= filter;
  }

  // Inverse DFT
  const continued: number[] = [];
  for (let j = 0; j < n; j++) {
    let val = reCoeff[0] / n;
    for (let k = 1; k < nFreq; k++) {
      const angle = (2 * Math.PI * k * j) / n;
      val += (2 / n) * (reCoeff[k] * Math.cos(angle) - imCoeff[k] * Math.sin(angle));
    }
    if (nFreq > 0) {
      const angle = (2 * Math.PI * nFreq * j) / n;
      val += (1 / n) * (reCoeff[nFreq] * Math.cos(angle) - imCoeff[nFreq] * Math.sin(angle));
    }
    continued.push(val + mean);
  }

  return filtered.map((s, i) => ({
    stationId: s.stationId,
    distance: distances[i],
    original: values[i],
    continued: continued[i],
    continuationHeight,
  }));
}

// ─── Euler Deconvolution (2D Profile) ───────────────────────────────────────

export interface EulerResult {
  stationId: string;
  x0: number; // estimated source x position (km)
  z0: number; // estimated source depth (km)
  background: number;
  windowCenter: number;
  structuralIndex: number;
  fitError: number;
}

/**
 * 2D Profile Euler Deconvolution
 * Euler's equation: (x - x0) * dT/dx + (z - z0) * dT/dz = -N * (T - B)
 * N = structural index (0=contact, 1=dike/sill, 2=cylinder, 3=sphere)
 * Uses sliding window approach.
 */
export function computeEulerDeconvolution(
  stations: ProcessedStation[],
  structuralIndex: number = 1,
  windowSize: number = 7,
  anomalyType: 'freeAirAnomaly' | 'bouguerAnomaly' = 'bouguerAnomaly',
  maxDepth: number = 20, // km, reject solutions deeper than this
  maxError: number = 15  // %, reject high-error solutions
): EulerResult[] {
  const filtered = stations.filter(s => !s.remark?.toLowerCase().includes('close'));
  if (filtered.length < windowSize) return [];

  const distances = computeCumulativeDistances(filtered);
  const values = filtered.map(s => s[anomalyType]);
  const n = values.length;

  // Compute horizontal derivative
  const dTdx: number[] = Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const dx = distances[i + 1] - distances[i - 1];
    if (dx > 0) dTdx[i] = (values[i + 1] - values[i - 1]) / dx;
  }
  if (n > 1) {
    dTdx[0] = (values[1] - values[0]) / (distances[1] - distances[0] || 1);
    dTdx[n - 1] = (values[n - 1] - values[n - 2]) / (distances[n - 1] - distances[n - 2] || 1);
  }

  // Vertical derivative approximation (2nd horizontal derivative proxy)
  const dTdz: number[] = Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const dx = (distances[i + 1] - distances[i - 1]) / 2;
    if (dx > 0) dTdz[i] = (values[i + 1] - 2 * values[i] + values[i - 1]) / (dx * dx);
  }

  const results: EulerResult[] = [];
  const halfWin = Math.floor(windowSize / 2);

  for (let center = halfWin; center < n - halfWin; center++) {
    const winStart = center - halfWin;
    const winEnd = center + halfWin;

    // Set up overdetermined system: A * [x0, z0, B] = b
    // For each point i in window:
    // x_i * dTdx_i + z_i * dTdz_i + N * T_i = x0 * dTdx_i + z0 * dTdz_i + N * B
    const rows = winEnd - winStart + 1;
    const A: number[][] = [];
    const b: number[] = [];

    for (let i = winStart; i <= winEnd; i++) {
      A.push([dTdx[i], dTdz[i], structuralIndex]);
      b.push(
        distances[i] * dTdx[i] + 0 * dTdz[i] + structuralIndex * values[i]
      );
    }

    // Solve least squares: (A^T A) x = A^T b
    const solution = solveLeastSquares3(A, b);
    if (!solution) continue;

    const [x0, z0, B] = solution;

    // Compute fit error
    let ssRes = 0, ssTot = 0;
    const meanB = b.reduce((a, v) => a + v, 0) / b.length;
    for (let i = 0; i < rows; i++) {
      const predicted = A[i][0] * x0 + A[i][1] * z0 + A[i][2] * B;
      ssRes += (b[i] - predicted) ** 2;
      ssTot += (b[i] - meanB) ** 2;
    }
    const fitError = ssTot > 0 ? Math.sqrt(ssRes / ssTot) * 100 : 100;

    // Filter: reasonable depth and acceptable error
    if (z0 > 0 && z0 < maxDepth && fitError < maxError) {
      results.push({
        stationId: filtered[center].stationId,
        x0,
        z0,
        background: B,
        windowCenter: distances[center],
        structuralIndex,
        fitError,
      });
    }
  }

  return results;
}

function solveLeastSquares3(A: number[][], b: number[]): number[] | null {
  const m = A.length;
  // A^T * A (3x3)
  const ATA = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const ATb = [0, 0, 0];

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < 3; j++) {
      ATb[j] += A[i][j] * b[i];
      for (let k = 0; k < 3; k++) {
        ATA[j][k] += A[i][j] * A[i][k];
      }
    }
  }

  // Solve 3x3 system using Cramer's rule
  const det =
    ATA[0][0] * (ATA[1][1] * ATA[2][2] - ATA[1][2] * ATA[2][1]) -
    ATA[0][1] * (ATA[1][0] * ATA[2][2] - ATA[1][2] * ATA[2][0]) +
    ATA[0][2] * (ATA[1][0] * ATA[2][1] - ATA[1][1] * ATA[2][0]);

  if (Math.abs(det) < 1e-20) return null;

  const invDet = 1 / det;
  const inv = [
    [
      (ATA[1][1] * ATA[2][2] - ATA[1][2] * ATA[2][1]) * invDet,
      (ATA[0][2] * ATA[2][1] - ATA[0][1] * ATA[2][2]) * invDet,
      (ATA[0][1] * ATA[1][2] - ATA[0][2] * ATA[1][1]) * invDet,
    ],
    [
      (ATA[1][2] * ATA[2][0] - ATA[1][0] * ATA[2][2]) * invDet,
      (ATA[0][0] * ATA[2][2] - ATA[0][2] * ATA[2][0]) * invDet,
      (ATA[0][2] * ATA[1][0] - ATA[0][0] * ATA[1][2]) * invDet,
    ],
    [
      (ATA[1][0] * ATA[2][1] - ATA[1][1] * ATA[2][0]) * invDet,
      (ATA[0][1] * ATA[2][0] - ATA[0][0] * ATA[2][1]) * invDet,
      (ATA[0][0] * ATA[1][1] - ATA[0][1] * ATA[1][0]) * invDet,
    ],
  ];

  return [
    inv[0][0] * ATb[0] + inv[0][1] * ATb[1] + inv[0][2] * ATb[2],
    inv[1][0] * ATb[0] + inv[1][1] * ATb[1] + inv[1][2] * ATb[2],
    inv[2][0] * ATb[0] + inv[2][1] * ATb[1] + inv[2][2] * ATb[2],
  ];
}

// ─── Survey QC Dashboard Calculations ───────────────────────────────────────

export interface SurveyQCResult {
  loopStats: LoopQCStats[];
  overallStats: OverallQCStats;
}

export interface LoopQCStats {
  loopIndex: number;
  openStation: string;
  closeStation: string;
  openTime: string;
  closeTime: string;
  driftRate: number; // mGal/hr
  closureError: number; // mGal
  duration: number; // minutes
  stationCount: number;
}

export interface OverallQCStats {
  totalStations: number;
  totalLoops: number;
  meanDriftRate: number;
  maxDriftRate: number;
  meanClosureError: number;
  maxClosureError: number;
  repeatabilityStd: number; // std of repeated base readings
  meanElevation: number;
  elevationRange: [number, number];
  coordinateExtent: {
    latMin: number; latMax: number;
    lonMin: number; lonMax: number;
  };
  surveyDuration: string;
  dataCompleteness: number; // percentage of non-null fields
}

export function computeSurveyQC(stations: ProcessedStation[]): SurveyQCResult {
  const loops = identifyLoopsFromProcessed(stations);
  const loopStats: LoopQCStats[] = [];

  for (let li = 0; li < loops.length; li++) {
    const loop = loops[li];
    const openSt = loop[0];
    const closeSt = loop[loop.length - 1];

    const duration = closeSt.timeMinutes - openSt.timeMinutes;
    const driftRate = duration > 0
      ? ((closeSt.rawGrav - openSt.rawGrav) / duration) * 60 // mGal/hr
      : 0;

    const closureError = Math.abs(closeSt.rawGrav - openSt.rawGrav);

    loopStats.push({
      loopIndex: li + 1,
      openStation: openSt.stationId,
      closeStation: closeSt.stationId,
      openTime: openSt.time,
      closeTime: closeSt.time,
      driftRate,
      closureError,
      duration,
      stationCount: loop.length,
    });
  }

  // Repeatability: find stations read multiple times
  const stationReadings: Record<string, number[]> = {};
  for (const s of stations) {
    if (!stationReadings[s.stationId]) stationReadings[s.stationId] = [];
    stationReadings[s.stationId].push(s.rawGrav);
  }
  const repeatedStds: number[] = [];
  for (const readings of Object.values(stationReadings)) {
    if (readings.length > 1) {
      const mean = readings.reduce((a, b) => a + b, 0) / readings.length;
      const std = Math.sqrt(readings.reduce((a, v) => a + (v - mean) ** 2, 0) / readings.length);
      repeatedStds.push(std);
    }
  }
  const repeatabilityStd = repeatedStds.length > 0
    ? repeatedStds.reduce((a, b) => a + b, 0) / repeatedStds.length
    : 0;

  const elevations = stations.map(s => s.height);
  const lats = stations.map(s => s.latitude);
  const lons = stations.map(s => s.longitude);

  // Data completeness
  let filledFields = 0, totalFields = 0;
  for (const s of stations) {
    totalFields += 8;
    if (s.stationId) filledFields++;
    if (s.latitude) filledFields++;
    if (s.longitude) filledFields++;
    if (s.height !== undefined) filledFields++;
    if (s.gravimeterReading) filledFields++;
    if (s.time) filledFields++;
    if (s.date) filledFields++;
    if (s.description) filledFields++;
  }

  const driftRates = loopStats.map(l => l.driftRate);
  const closureErrors = loopStats.map(l => l.closureError);

  return {
    loopStats,
    overallStats: {
      totalStations: stations.length,
      totalLoops: loops.length,
      meanDriftRate: driftRates.length > 0 ? driftRates.reduce((a, b) => a + b, 0) / driftRates.length : 0,
      maxDriftRate: driftRates.length > 0 ? Math.max(...driftRates.map(Math.abs)) : 0,
      meanClosureError: closureErrors.length > 0 ? closureErrors.reduce((a, b) => a + b, 0) / closureErrors.length : 0,
      maxClosureError: closureErrors.length > 0 ? Math.max(...closureErrors.map(Math.abs)) : 0,
      repeatabilityStd,
      meanElevation: elevations.reduce((a, b) => a + b, 0) / elevations.length,
      elevationRange: [Math.min(...elevations), Math.max(...elevations)],
      coordinateExtent: {
        latMin: Math.min(...lats), latMax: Math.max(...lats),
        lonMin: Math.min(...lons), lonMax: Math.max(...lons),
      },
      surveyDuration: `${stations[0]?.date || ''} – ${stations[stations.length - 1]?.date || ''}`,
      dataCompleteness: totalFields > 0 ? (filledFields / totalFields) * 100 : 0,
    },
  };
}

function identifyLoopsFromProcessed(stations: ProcessedStation[]): ProcessedStation[][] {
  const loops: ProcessedStation[][] = [];
  let currentLoop: ProcessedStation[] = [];

  for (const s of stations) {
    const remark = (s.remark || '').toLowerCase();
    if (remark.includes('open')) {
      if (currentLoop.length > 0) loops.push(currentLoop);
      currentLoop = [s];
    } else {
      currentLoop.push(s);
      if (remark.includes('close')) {
        loops.push(currentLoop);
        currentLoop = [];
      }
    }
  }
  if (currentLoop.length > 0) loops.push(currentLoop);
  if (loops.length === 0 && stations.length > 0) loops.push(stations);
  return loops;
}
