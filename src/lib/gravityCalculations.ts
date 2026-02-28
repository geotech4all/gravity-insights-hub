// Gravity Data Reduction Engine
// Implements standard gravity survey corrections

export interface RawStation {
  date: string;
  stationId: string;
  description: string;
  latitude: number;
  longitude: number;
  gravimeterReading: number;
  time: string;
  remark: string;
  height: number;
}

export interface LoopSegment {
  stations: RawStation[];
  openIndex: number;
  closeIndex: number;
}

export interface CalibrationTable {
  range: number;
  ffi: number;
  cr: number;
}

export interface ProcessedStation extends RawStation {
  diff: number;
  ffi: number;
  cr: number;
  rawGrav: number;
  timeDecimal: number;
  timeMinutes: number;
  driftRate: number;
  timeDiffFromOpen: number;
  driftCorrection: number;
  obsMeterReading: number;
  finalObsGravVal: number;
  sineLat: number;
  theoreticalGravity: number; // gn
  freeAirCorrection: number;  // FAC
  bouguerCorrection: number;  // BC
  absoluteGravity: number;
  freeAirAnomaly: number;     // FAA
  bouguerAnomaly: number;     // BA
}

export const DEFAULT_CALIBRATION: CalibrationTable[] = [
  { range: 1600, ffi: 1.02191, cr: 1633.81 },
  { range: 1700, ffi: 1.02205, cr: 1736 },
];

export const DEFAULT_DENSITY = 2.67; // g/cm³ standard crustal density

export function getCalibration(reading: number, table: CalibrationTable[]): { ffi: number; cr: number } {
  // Find the appropriate range
  const sorted = [...table].sort((a, b) => b.range - a.range);
  for (const entry of sorted) {
    if (reading >= entry.range) {
      return { ffi: entry.ffi, cr: entry.cr };
    }
  }
  return { ffi: sorted[sorted.length - 1].ffi, cr: sorted[sorted.length - 1].cr };
}

export function timeToDecimalDays(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parts.length > 2 ? parseInt(parts[2], 10) : 0;
  return (hours * 3600 + minutes * 60 + seconds) / 86400;
}

export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

export function computeRawGrav(reading: number, calibration: CalibrationTable[]): { rawGrav: number; diff: number; ffi: number; cr: number } {
  const { ffi, cr } = getCalibration(reading, calibration);
  const range = calibration.find(c => c.ffi === ffi)?.range || 0;
  const diff = reading - range;
  const rawGrav = diff * ffi + cr;
  return { rawGrav, diff, ffi, cr };
}

/**
 * Theoretical gravity using the Geodetic Reference System 1980 (GRS80) formula
 * gn = 978032.67714 * (1 + 0.00193185138639 * sin²φ) / √(1 - 0.00669437999013 * sin²φ)
 */
export function theoreticalGravity(latitudeDeg: number): number {
  const latRad = (latitudeDeg * Math.PI) / 180;
  const sin2 = Math.sin(latRad) ** 2;
  return (978032.67714 * (1 + 0.00193185138639 * sin2)) / Math.sqrt(1 - 0.00669437999013 * sin2);
}

/** Free Air Correction: FAC = 0.3086 * h (mGal), h in meters */
export function freeAirCorrection(heightM: number): number {
  return 0.3086 * heightM;
}

/** Bouguer Correction: BC = 0.04193 * ρ * h (mGal) */
export function bouguerCorrection(heightM: number, density: number = DEFAULT_DENSITY): number {
  return 0.04193 * density * heightM;
}

/**
 * Identify loop segments from raw stations based on Open Loop / Close Loop remarks
 */
export function identifyLoops(stations: RawStation[]): LoopSegment[] {
  const loops: LoopSegment[] = [];
  let currentOpen = -1;

  for (let i = 0; i < stations.length; i++) {
    const remark = (stations[i].remark || '').toLowerCase();
    if (remark.includes('open loop') || remark.includes('open')) {
      if (remark.includes('open')) currentOpen = i;
    }
    if ((remark.includes('close loop') || remark.includes('close')) && currentOpen >= 0) {
      loops.push({ stations: stations.slice(currentOpen, i + 1), openIndex: currentOpen, closeIndex: i });
      currentOpen = -1;
    }
  }

  // If no loops found, treat entire dataset as one loop
  if (loops.length === 0 && stations.length > 0) {
    loops.push({ stations, openIndex: 0, closeIndex: stations.length - 1 });
  }

  return loops;
}

/**
 * Process all stations through the full gravity reduction pipeline
 */
export function processGravityData(
  stations: RawStation[],
  knownAbsValue: number,
  baseStationId: string,
  calibration: CalibrationTable[] = DEFAULT_CALIBRATION,
  density: number = DEFAULT_DENSITY
): ProcessedStation[] {
  const loops = identifyLoops(stations);
  const results: ProcessedStation[] = [];

  for (const loop of loops) {
    const { stations: loopStations } = loop;
    
    // Compute raw gravity for all stations in loop
    const rawData = loopStations.map(s => ({
      ...s,
      ...computeRawGrav(s.gravimeterReading, calibration),
      timeMinutes: timeToMinutes(s.time),
      timeDecimal: timeToDecimalDays(s.time),
    }));

    // Drift rate: (closeRawGrav - openRawGrav) / (closeTime - openTime)
    const openStation = rawData[0];
    const closeStation = rawData[rawData.length - 1];
    const timeDiffTotal = closeStation.timeMinutes - openStation.timeMinutes;
    const driftRate = timeDiffTotal !== 0
      ? (closeStation.rawGrav - openStation.rawGrav) / timeDiffTotal
      : 0;

    // Base station final observed gravity (from the open station)
    const baseRawGrav = openStation.rawGrav;

    for (let i = 0; i < rawData.length; i++) {
      const s = rawData[i];
      const timeDiffFromOpen = s.timeMinutes - openStation.timeMinutes;
      const driftCorrection = driftRate * timeDiffFromOpen;
      const obsMeterReading = s.rawGrav - driftCorrection;
      
      // For close loop station, force it to match open
      const isCloseLoop = i === rawData.length - 1 && loopStations[i].remark?.toLowerCase().includes('close');
      const finalObsGravVal = isCloseLoop ? baseRawGrav : obsMeterReading;

      const sineLat = Math.sin((s.latitude * Math.PI) / 180);
      const gn = theoreticalGravity(s.latitude);
      const fac = freeAirCorrection(s.height);
      const bc = bouguerCorrection(s.height, density);

      // Absolute gravity from relative difference
      const relativeDiff = knownAbsValue - baseRawGrav;
      const absGrav = finalObsGravVal + relativeDiff;

      const faa = absGrav - gn + fac;
      const ba = faa - bc;

      // Skip adding duplicate close loop entries if it's same station as open
      const processed: ProcessedStation = {
        ...loopStations[i],
        diff: s.diff,
        ffi: s.ffi,
        cr: s.cr,
        rawGrav: s.rawGrav,
        timeDecimal: s.timeDecimal,
        timeMinutes: s.timeMinutes,
        driftRate,
        timeDiffFromOpen,
        driftCorrection,
        obsMeterReading,
        finalObsGravVal,
        sineLat,
        theoreticalGravity: gn,
        freeAirCorrection: fac,
        bouguerCorrection: bc,
        absoluteGravity: absGrav,
        freeAirAnomaly: faa,
        bouguerAnomaly: ba,
      };

      results.push(processed);
    }
  }

  return results;
}
