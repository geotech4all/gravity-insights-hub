// Magnetic Data Reduction Engine
// Implements standard magnetic survey corrections and advanced processing

export interface RawMagStation {
  sn: number;
  distance: number;        // meters
  averageNT: number;       // nanoTesla (raw field reading)
  time: number;            // seconds (epoch or elapsed)
  latitude?: number;
  longitude?: number;
  elevation?: number;
  remark?: string;
}

export interface ProcessedMagStation extends RawMagStation {
  driftFactor: number;
  driftCorrection: number;
  regionalField: number;
  reducedData: number;       // observed - regional
  reducedValue: number;      // reduced - drift = final anomaly
  diurnalCorrection: number;
  igrfField: number;
  totalAnomaly: number;      // total magnetic anomaly
}

// ─── IGRF Reference Field (Simplified 13th Gen) ─────────────────────────────

/**
 * Simplified IGRF-13 dipole approximation.
 * For accurate results, use full spherical harmonic expansion.
 * This gives a reasonable estimate based on latitude.
 * Total field ≈ 30000–60000 nT depending on latitude.
 */
export function computeIGRF(lat: number, _lon: number, _elevation: number = 0): number {
  const latRad = (lat * Math.PI) / 180;
  // Simplified dipole: F ≈ F_eq * sqrt(1 + 3*sin²φ)
  // F_eq ≈ 30000 nT at magnetic equator
  const F_eq = 30000;
  return F_eq * Math.sqrt(1 + 3 * Math.sin(latRad) ** 2);
}

/**
 * Compute magnetic inclination (dip angle) from latitude
 * tan(I) = 2 * tan(φ) for dipole field
 */
export function computeInclination(lat: number): number {
  const latRad = (lat * Math.PI) / 180;
  return Math.atan(2 * Math.tan(latRad)) * (180 / Math.PI);
}

/**
 * Compute magnetic declination approximation
 * This is a very rough estimate; real declination varies with location and time
 */
export function computeDeclination(_lat: number, _lon: number): number {
  // Simplified: return small value; real apps use WMM/IGRF coefficients
  return 0; // degrees
}

// ─── Diurnal Correction ─────────────────────────────────────────────────────

/**
 * Diurnal correction based on base station repeat readings.
 * If no base station data, estimates using sinusoidal approximation
 * of typical diurnal variation (~20-80 nT amplitude).
 */
export function computeDiurnalCorrection(
  timeSeconds: number,
  baseReadings?: { time: number; value: number }[],
  amplitude: number = 30 // nT typical
): number {
  if (baseReadings && baseReadings.length >= 2) {
    // Linear interpolation from base station readings
    const sorted = [...baseReadings].sort((a, b) => a.time - b.time);
    const baseValue = sorted[0].value;
    
    if (timeSeconds <= sorted[0].time) return 0;
    if (timeSeconds >= sorted[sorted.length - 1].time) {
      return sorted[sorted.length - 1].value - baseValue;
    }
    
    for (let i = 0; i < sorted.length - 1; i++) {
      if (timeSeconds >= sorted[i].time && timeSeconds <= sorted[i + 1].time) {
        const t = (timeSeconds - sorted[i].time) / (sorted[i + 1].time - sorted[i].time);
        const interpValue = sorted[i].value + t * (sorted[i + 1].value - sorted[i].value);
        return interpValue - baseValue;
      }
    }
    return 0;
  }
  
  // Sinusoidal approximation: peak at ~14:00 local time
  // Assume time in seconds from midnight
  const hoursFromMidnight = (timeSeconds % 86400) / 3600;
  return amplitude * Math.sin(Math.PI * (hoursFromMidnight - 6) / 12);
}

// ─── Drift Correction ───────────────────────────────────────────────────────

/**
 * Linear drift correction between start and end of survey.
 */
export function computeMagDrift(
  timeSeconds: number,
  driftFactor: number
): number {
  return driftFactor * timeSeconds;
}

// ─── Regional Field Removal ─────────────────────────────────────────────────

/**
 * Remove regional field using polynomial fit or constant value.
 */
export function computeRegionalRemoval(
  averageNT: number,
  regionalField: number
): number {
  return averageNT - regionalField;
}

// ─── Main Processing Pipeline ───────────────────────────────────────────────

export interface MagProcessingParams {
  driftFactor: number;         // nT/s
  regionalField: number;       // nT (constant or from IGRF)
  useIGRF: boolean;
  latitude: number;            // for IGRF if no per-station coords
  longitude: number;
  elevation: number;
  diurnalAmplitude: number;    // nT
  baseReadings?: { time: number; value: number }[];
}

export const DEFAULT_MAG_PARAMS: MagProcessingParams = {
  driftFactor: 0.00518,
  regionalField: 33434.6,
  useIGRF: false,
  latitude: 7.5,
  longitude: 3.9,
  elevation: 0,
  diurnalAmplitude: 30,
};

export function processMagneticData(
  stations: RawMagStation[],
  params: MagProcessingParams = DEFAULT_MAG_PARAMS
): ProcessedMagStation[] {
  return stations.map(station => {
    const lat = station.latitude ?? params.latitude;
    const lon = station.longitude ?? params.longitude;
    const elev = station.elevation ?? params.elevation;

    // IGRF reference field
    const igrfField = params.useIGRF ? computeIGRF(lat, lon, elev) : params.regionalField;
    const regionalField = params.useIGRF ? igrfField : params.regionalField;

    // Drift correction
    const driftCorrection = computeMagDrift(station.time, params.driftFactor);

    // Diurnal correction
    const diurnalCorrection = computeDiurnalCorrection(
      station.time,
      params.baseReadings,
      params.diurnalAmplitude
    );

    // Reduced data (observed - regional)
    const reducedData = station.averageNT - regionalField;

    // Reduced value (reduced - drift) = final anomaly
    const reducedValue = reducedData - driftCorrection;

    // Total magnetic anomaly (with diurnal correction)
    const totalAnomaly = station.averageNT - regionalField - driftCorrection - diurnalCorrection;

    return {
      ...station,
      driftFactor: params.driftFactor,
      driftCorrection,
      regionalField,
      reducedData,
      reducedValue,
      diurnalCorrection,
      igrfField,
      totalAnomaly,
    };
  });
}

// ─── Advanced Magnetic Processing ───────────────────────────────────────────

export interface RTPResult {
  sn: number;
  distance: number;
  original: number;
  rtpValue: number;
}

/**
 * Reduction to Pole (RTP) — pseudo-RTP using wavenumber domain
 * Moves anomalies to their source positions by removing inclination/declination effects
 */
export function computeReductionToPole(
  stations: ProcessedMagStation[],
  inclination: number, // degrees
  declination: number = 0 // degrees
): RTPResult[] {
  const n = stations.length;
  if (n < 4) return [];

  const incRad = (inclination * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;
  const values = stations.map(s => s.totalAnomaly);
  
  // For 2D profile, RTP filter in wavenumber domain:
  // RTP = F / (sin(I) + i*cos(I)*cos(D-α))²
  // Simplified for profile: phase shift based on inclination
  
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const centered = values.map(v => v - mean);
  
  const nFreq = Math.floor(n / 2);
  const reCoeff: number[] = [];
  const imCoeff: number[] = [];
  
  // DFT forward
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
  
  // Apply RTP filter
  const sinI = Math.sin(incRad);
  const cosI = Math.cos(incRad);
  const cosD = Math.cos(decRad);
  
  for (let k = 1; k <= nFreq; k++) {
    // Phase rotation factor
    const alpha = (k > 0) ? Math.atan2(imCoeff[k], reCoeff[k]) : 0;
    const denom = sinI * sinI + cosI * cosI * cosD * cosD;
    const rtpFactor = denom > 0.01 ? 1 / denom : 1; // cap to avoid division by tiny numbers
    
    const mag = Math.sqrt(reCoeff[k] ** 2 + imCoeff[k] ** 2) * Math.min(rtpFactor, 10);
    // Shift phase to simulate pole position
    const newPhase = alpha + (Math.PI / 2 - incRad);
    reCoeff[k] = mag * Math.cos(newPhase);
    imCoeff[k] = mag * Math.sin(newPhase);
  }
  
  // Inverse DFT
  const rtpValues: number[] = [];
  for (let j = 0; j < n; j++) {
    let val = reCoeff[0] / n;
    for (let k = 1; k < nFreq; k++) {
      const angle = (2 * Math.PI * k * j) / n;
      val += (2 / n) * (reCoeff[k] * Math.cos(angle) - imCoeff[k] * Math.sin(angle));
    }
    rtpValues.push(val + mean);
  }
  
  return stations.map((s, i) => ({
    sn: s.sn,
    distance: s.distance,
    original: s.totalAnomaly,
    rtpValue: rtpValues[i],
  }));
}

/**
 * Magnetic derivatives — horizontal gradient, vertical gradient, analytic signal
 */
export interface MagDerivativeResult {
  sn: number;
  distance: number;
  horizontalGradient: number;
  verticalGradient: number;
  analyticSignal: number;
}

export function computeMagDerivatives(
  stations: ProcessedMagStation[]
): MagDerivativeResult[] {
  const n = stations.length;
  if (n < 3) return [];
  
  const results: MagDerivativeResult[] = [];
  
  for (let i = 0; i < n; i++) {
    let hGrad = 0, vGrad = 0;
    
    if (i > 0 && i < n - 1) {
      const dx = (stations[i + 1].distance - stations[i - 1].distance) / 1000; // to km
      if (dx > 0) {
        hGrad = (stations[i + 1].totalAnomaly - stations[i - 1].totalAnomaly) / (2 * dx);
        vGrad = (stations[i + 1].totalAnomaly - 2 * stations[i].totalAnomaly + stations[i - 1].totalAnomaly) / (dx * dx);
      }
    } else if (i === 0 && n > 1) {
      const dx = (stations[1].distance - stations[0].distance) / 1000;
      if (dx > 0) hGrad = (stations[1].totalAnomaly - stations[0].totalAnomaly) / dx;
    } else if (i === n - 1 && n > 1) {
      const dx = (stations[n - 1].distance - stations[n - 2].distance) / 1000;
      if (dx > 0) hGrad = (stations[n - 1].totalAnomaly - stations[n - 2].totalAnomaly) / dx;
    }
    
    const analyticSignal = Math.sqrt(hGrad ** 2 + vGrad ** 2);
    
    results.push({
      sn: stations[i].sn,
      distance: stations[i].distance,
      horizontalGradient: hGrad,
      verticalGradient: vGrad,
      analyticSignal,
    });
  }
  
  return results;
}

/**
 * Magnetic power spectrum for depth estimation
 */
export interface MagPowerSpectrumResult {
  wavenumber: number;
  logPower: number;
  wavelength: number;
}

export function computeMagPowerSpectrum(
  stations: ProcessedMagStation[]
): { spectrum: MagPowerSpectrumResult[]; depthEstimates: { shallow: number; deep: number } } {
  const n = stations.length;
  if (n < 8) return { spectrum: [], depthEstimates: { shallow: 0, deep: 0 } };

  const values = stations.map(s => s.totalAnomaly);
  const totalDist = (stations[n - 1].distance - stations[0].distance) / 1000; // km
  if (totalDist <= 0) return { spectrum: [], depthEstimates: { shallow: 0, deep: 0 } };

  const mean = values.reduce((a, b) => a + b, 0) / n;
  const centered = values.map(v => v - mean);

  const nFreq = Math.floor(n / 2);
  const spectrum: MagPowerSpectrumResult[] = [];

  for (let k = 1; k <= nFreq; k++) {
    let re = 0, im = 0;
    for (let j = 0; j < n; j++) {
      const angle = (2 * Math.PI * k * j) / n;
      re += centered[j] * Math.cos(angle);
      im -= centered[j] * Math.sin(angle);
    }
    const power = (re * re + im * im) / (n * n);
    const wavenumber = (2 * Math.PI * k) / totalDist;
    spectrum.push({
      wavenumber,
      logPower: power > 0 ? Math.log(power) : -20,
      wavelength: totalDist / k,
    });
  }

  // Estimate depths from slope of log(power) vs wavenumber
  const deepSlope = spectrum.length >= 4 
    ? -(spectrum[1].logPower - spectrum[3].logPower) / (spectrum[3].wavenumber - spectrum[1].wavenumber) / 2
    : 0;
  const shallowIdx = Math.min(Math.floor(spectrum.length * 0.6), spectrum.length - 2);
  const shallowSlope = spectrum.length > shallowIdx + 1
    ? -(spectrum[shallowIdx].logPower - spectrum[shallowIdx + 1].logPower) / 
       (spectrum[shallowIdx + 1].wavenumber - spectrum[shallowIdx].wavenumber) / 2
    : 0;

  return {
    spectrum,
    depthEstimates: {
      shallow: Math.max(0, shallowSlope),
      deep: Math.max(0, deepSlope),
    },
  };
}

/**
 * Upward/Downward continuation for magnetic data
 */
export interface MagContinuationResult {
  sn: number;
  distance: number;
  original: number;
  continued: number;
  continuationHeight: number;
}

export function computeMagContinuation(
  stations: ProcessedMagStation[],
  continuationHeight: number // positive = upward, negative = downward (km)
): MagContinuationResult[] {
  const n = stations.length;
  if (n < 4) return [];

  const values = stations.map(s => s.totalAnomaly);
  const totalDist = (stations[n - 1].distance - stations[0].distance) / 1000;
  if (totalDist <= 0) return [];

  const mean = values.reduce((a, b) => a + b, 0) / n;
  const centered = values.map(v => v - mean);

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

  const h = Math.abs(continuationHeight);
  const isUpward = continuationHeight > 0;

  for (let k = 1; k <= nFreq; k++) {
    const wavenumber = (2 * Math.PI * k) / totalDist;
    let filter: number;
    if (isUpward) {
      filter = Math.exp(-wavenumber * h);
    } else {
      filter = Math.min(Math.exp(wavenumber * h), 10);
    }
    reCoeff[k] *= filter;
    imCoeff[k] *= filter;
  }

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

  return stations.map((s, i) => ({
    sn: s.sn,
    distance: s.distance,
    original: values[i],
    continued: continued[i],
    continuationHeight,
  }));
}

/**
 * Euler Deconvolution for magnetic profiles
 */
export interface MagEulerResult {
  sn: number;
  x0: number;
  z0: number;
  background: number;
  windowCenter: number;
  structuralIndex: number;
  fitError: number;
}

export function computeMagEulerDeconvolution(
  stations: ProcessedMagStation[],
  structuralIndex: number = 1,
  windowSize: number = 7,
  maxDepth: number = 20,
  maxError: number = 15
): MagEulerResult[] {
  const n = stations.length;
  if (n < windowSize) return [];

  const distances = stations.map(s => s.distance / 1000); // km
  const values = stations.map(s => s.totalAnomaly);

  // Horizontal derivative
  const dTdx: number[] = Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const dx = distances[i + 1] - distances[i - 1];
    if (dx > 0) dTdx[i] = (values[i + 1] - values[i - 1]) / dx;
  }
  if (n > 1) {
    dTdx[0] = (values[1] - values[0]) / (distances[1] - distances[0] || 1);
    dTdx[n - 1] = (values[n - 1] - values[n - 2]) / (distances[n - 1] - distances[n - 2] || 1);
  }

  // Vertical derivative (2nd horizontal derivative proxy)
  const dTdz: number[] = Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const dx = (distances[i + 1] - distances[i - 1]) / 2;
    if (dx > 0) dTdz[i] = (values[i + 1] - 2 * values[i] + values[i - 1]) / (dx * dx);
  }

  const results: MagEulerResult[] = [];
  const halfWin = Math.floor(windowSize / 2);

  for (let center = halfWin; center < n - halfWin; center++) {
    const winStart = center - halfWin;
    const winEnd = center + halfWin;

    const A: number[][] = [];
    const b: number[] = [];

    for (let i = winStart; i <= winEnd; i++) {
      A.push([dTdx[i], dTdz[i], structuralIndex]);
      b.push(distances[i] * dTdx[i] + structuralIndex * values[i]);
    }

    const solution = solveLeastSquares3x3(A, b);
    if (!solution) continue;

    const [x0, z0, B] = solution;

    let ssRes = 0, ssTot = 0;
    const meanB = b.reduce((a, v) => a + v, 0) / b.length;
    for (let i = 0; i < A.length; i++) {
      const predicted = A[i][0] * x0 + A[i][1] * z0 + A[i][2] * B;
      ssRes += (b[i] - predicted) ** 2;
      ssTot += (b[i] - meanB) ** 2;
    }
    const fitError = ssTot > 0 ? Math.sqrt(ssRes / ssTot) * 100 : 100;

    if (z0 > 0 && z0 < maxDepth && fitError < maxError) {
      results.push({
        sn: stations[center].sn,
        x0, z0, background: B,
        windowCenter: distances[center],
        structuralIndex,
        fitError,
      });
    }
  }

  return results;
}

function solveLeastSquares3x3(A: number[][], b: number[]): number[] | null {
  const m = A.length;
  const ATA = [[0,0,0],[0,0,0],[0,0,0]];
  const ATb = [0,0,0];

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < 3; j++) {
      ATb[j] += A[i][j] * b[i];
      for (let k = 0; k < 3; k++) {
        ATA[j][k] += A[i][j] * A[i][k];
      }
    }
  }

  const det =
    ATA[0][0] * (ATA[1][1] * ATA[2][2] - ATA[1][2] * ATA[2][1]) -
    ATA[0][1] * (ATA[1][0] * ATA[2][2] - ATA[1][2] * ATA[2][0]) +
    ATA[0][2] * (ATA[1][0] * ATA[2][1] - ATA[1][1] * ATA[2][0]);

  if (Math.abs(det) < 1e-20) return null;

  const invDet = 1 / det;
  const inv = [
    [(ATA[1][1]*ATA[2][2]-ATA[1][2]*ATA[2][1])*invDet, (ATA[0][2]*ATA[2][1]-ATA[0][1]*ATA[2][2])*invDet, (ATA[0][1]*ATA[1][2]-ATA[0][2]*ATA[1][1])*invDet],
    [(ATA[1][2]*ATA[2][0]-ATA[1][0]*ATA[2][2])*invDet, (ATA[0][0]*ATA[2][2]-ATA[0][2]*ATA[2][0])*invDet, (ATA[0][2]*ATA[1][0]-ATA[0][0]*ATA[1][2])*invDet],
    [(ATA[1][0]*ATA[2][1]-ATA[1][1]*ATA[2][0])*invDet, (ATA[0][1]*ATA[2][0]-ATA[0][0]*ATA[2][1])*invDet, (ATA[0][0]*ATA[1][1]-ATA[0][1]*ATA[1][0])*invDet],
  ];

  return [
    inv[0][0]*ATb[0]+inv[0][1]*ATb[1]+inv[0][2]*ATb[2],
    inv[1][0]*ATb[0]+inv[1][1]*ATb[1]+inv[1][2]*ATb[2],
    inv[2][0]*ATb[0]+inv[2][1]*ATb[1]+inv[2][2]*ATb[2],
  ];
}
