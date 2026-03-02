// Magnetic data parser — supports Excel and CSV formats
import type { RawMagStation } from './magneticCalculations';

export interface ParsedMagData {
  stations: RawMagStation[];
  driftFactor: number;
  regionalField: number;
  format: string;
  validationErrors: MagValidationError[];
}

export interface MagValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

function findCol(headers: string[], names: string[]): number {
  return headers.findIndex(h => names.some(n => h.toLowerCase().replace(/[^a-z0-9]/g, '') === n.toLowerCase().replace(/[^a-z0-9]/g, '')));
}

// ─── Excel Parser ────────────────────────────────────────────────────────────

export function parseMagneticExcel(buffer: ArrayBuffer): ParsedMagData {
  const XLSX = require('xlsx');
  const wb = XLSX.read(buffer, { type: 'array' });

  // Try to find the data sheet (skip empty first sheets)
  let dataSheet: any[] = [];
  let sheetName = '';
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name]) as any[];
    if (rows.length > 5) {
      dataSheet = rows;
      sheetName = name;
      break;
    }
  }

  if (dataSheet.length === 0) {
    return {
      stations: [],
      driftFactor: 0.00518,
      regionalField: 33434.6,
      format: 'xlsx',
      validationErrors: [{ row: 0, field: 'file', message: 'No data sheet found with sufficient rows', severity: 'error' }],
    };
  }

  const stations: RawMagStation[] = [];
  let driftFactor = 0.00518;
  let regionalField = 33434.6;

  // Try to detect columns from first row keys
  const headers = Object.keys(dataSheet[0]);

  const snIdx = findCol(headers, ['sn', 'SN', 'no', 'No', 'serialnumber']);
  const distIdx = findCol(headers, ['distanceM', 'distancem', 'distance', 'Distance', 'dist']);
  const avgIdx = findCol(headers, ['AveragenT', 'averagent', 'averageNT', 'Average', 'FieldnT', 'fieldnt', 'TotalField', 'totalfield', 'reading']);
  const timeIdx = findCol(headers, ['Times', 'time', 'Time', 'timesec', 'timeseconds']);
  const driftFactorIdx = findCol(headers, ['driftfactor', 'DriftFactor', 'driftFactor']);
  const driftIdx = findCol(headers, ['Drift', 'drift']);
  const regionalIdx = findCol(headers, ['Regional', 'regional', 'RegionalField']);
  const latIdx = findCol(headers, ['Latitude', 'latitude', 'lat']);
  const lonIdx = findCol(headers, ['Longitude', 'longitude', 'lon']);
  const elevIdx = findCol(headers, ['Elevation', 'elevation', 'height', 'Height']);

  for (let i = 0; i < dataSheet.length; i++) {
    const row = dataSheet[i];
    const vals = headers.map(h => row[h]);

    const sn = snIdx >= 0 ? Number(vals[snIdx]) || (i + 1) : (i + 1);
    const distance = distIdx >= 0 ? Number(vals[distIdx]) || 0 : i * 20;
    const averageNT = avgIdx >= 0 ? Number(vals[avgIdx]) || 0 : 0;
    const time = timeIdx >= 0 ? Number(vals[timeIdx]) || 0 : 0;

    if (averageNT === 0 && distance === 0) continue;

    // Extract drift factor from first valid row
    if (i === 0 && driftFactorIdx >= 0) {
      driftFactor = Number(vals[driftFactorIdx]) || driftFactor;
    }
    if (i === 0 && regionalIdx >= 0) {
      regionalField = Number(vals[regionalIdx]) || regionalField;
    }

    const station: RawMagStation = {
      sn,
      distance,
      averageNT,
      time,
      latitude: latIdx >= 0 ? Number(vals[latIdx]) || undefined : undefined,
      longitude: lonIdx >= 0 ? Number(vals[lonIdx]) || undefined : undefined,
      elevation: elevIdx >= 0 ? Number(vals[elevIdx]) || undefined : undefined,
    };

    stations.push(station);
  }

  const validationErrors = validateMagStations(stations);
  return { stations, driftFactor, regionalField, format: 'xlsx', validationErrors };
}

// ─── CSV Parser ──────────────────────────────────────────────────────────────

export function parseMagneticCSV(text: string): ParsedMagData {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    return {
      stations: [],
      driftFactor: 0.00518,
      regionalField: 33434.6,
      format: 'csv',
      validationErrors: [{ row: 0, field: 'file', message: 'File has fewer than 2 lines', severity: 'error' }],
    };
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const snIdx = findCol(headers, ['sn', 'SN', 'no']);
  const distIdx = findCol(headers, ['distance', 'distanceM', 'dist']);
  const avgIdx = findCol(headers, ['averagent', 'AveragenT', 'totalfield', 'reading', 'fieldnt']);
  const timeIdx = findCol(headers, ['time', 'Times', 'timesec']);
  const driftFactorIdx = findCol(headers, ['driftfactor']);
  const regionalIdx = findCol(headers, ['regional', 'regionalfield']);

  const stations: RawMagStation[] = [];
  let driftFactor = 0.00518;
  let regionalField = 33434.6;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const sn = snIdx >= 0 ? Number(cols[snIdx]) || i : i;
    const distance = distIdx >= 0 ? Number(cols[distIdx]) || 0 : (i - 1) * 20;
    const averageNT = avgIdx >= 0 ? Number(cols[avgIdx]) || 0 : 0;
    const time = timeIdx >= 0 ? Number(cols[timeIdx]) || 0 : 0;

    if (averageNT === 0) continue;

    if (i === 1 && driftFactorIdx >= 0) driftFactor = Number(cols[driftFactorIdx]) || driftFactor;
    if (i === 1 && regionalIdx >= 0) regionalField = Number(cols[regionalIdx]) || regionalField;

    stations.push({ sn, distance, averageNT, time });
  }

  const validationErrors = validateMagStations(stations);
  return { stations, driftFactor, regionalField, format: 'csv', validationErrors };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateMagStations(stations: RawMagStation[]): MagValidationError[] {
  const errors: MagValidationError[] = [];

  stations.forEach((s, i) => {
    const row = i + 1;
    if (s.averageNT <= 0) {
      errors.push({ row, field: 'averageNT', message: 'Field reading ≤ 0', severity: 'error' });
    }
    if (s.averageNT < 20000 || s.averageNT > 70000) {
      errors.push({ row, field: 'averageNT', message: `Unusual field value: ${s.averageNT.toFixed(1)} nT`, severity: 'warning' });
    }
    if (s.time < 0) {
      errors.push({ row, field: 'time', message: 'Negative time value', severity: 'error' });
    }
    if (s.distance < 0) {
      errors.push({ row, field: 'distance', message: 'Negative distance', severity: 'error' });
    }
  });

  // Check for time monotonicity issues
  for (let i = 1; i < stations.length; i++) {
    if (stations[i].time < stations[i - 1].time && stations[i].time > 0) {
      errors.push({ row: i + 1, field: 'time', message: 'Time is not monotonically increasing', severity: 'warning' });
    }
  }

  return errors;
}

// ─── Auto-detect magnetic data ───────────────────────────────────────────────

export function detectAndParseMagnetic(file: File, buffer: ArrayBuffer): ParsedMagData {
  const name = file.name.toLowerCase();
  
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseMagneticExcel(buffer);
  }
  
  const text = new TextDecoder().decode(buffer);
  return parseMagneticCSV(text);
}
