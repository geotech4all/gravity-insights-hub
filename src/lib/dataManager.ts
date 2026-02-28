// Multi-format gravity data parser
// Supports: Excel (.xlsx/.xls), CSV, XYZ, GXF

import type { RawStation, CalibrationTable } from './gravityCalculations';
import { DEFAULT_CALIBRATION } from './gravityCalculations';

export interface ParsedData {
  stations: RawStation[];
  calibration: CalibrationTable[];
  knownAbsValue: number;
  baseStationId: string;
  format: string;
  validationErrors: ValidationError[];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateStations(stations: RawStation[]): ValidationError[] {
  const errors: ValidationError[] = [];

  stations.forEach((s, i) => {
    const row = i + 1;

    if (!s.stationId || s.stationId.trim() === '') {
      errors.push({ row, field: 'stationId', message: 'Missing station ID', severity: 'error' });
    }
    if (s.latitude === 0 && s.longitude === 0) {
      errors.push({ row, field: 'coordinates', message: 'Coordinates are (0,0) — possibly missing', severity: 'warning' });
    }
    if (s.latitude < -90 || s.latitude > 90) {
      errors.push({ row, field: 'latitude', message: `Invalid latitude: ${s.latitude}`, severity: 'error' });
    }
    if (s.longitude < -180 || s.longitude > 180) {
      errors.push({ row, field: 'longitude', message: `Invalid longitude: ${s.longitude}`, severity: 'error' });
    }
    if (s.gravimeterReading <= 0) {
      errors.push({ row, field: 'gravimeterReading', message: 'Gravimeter reading ≤ 0', severity: 'warning' });
    }
    if (s.height < -500 || s.height > 9000) {
      errors.push({ row, field: 'height', message: `Unusual elevation: ${s.height} m`, severity: 'warning' });
    }
    if (!s.time || s.time === '0:00') {
      errors.push({ row, field: 'time', message: 'Missing time value', severity: 'warning' });
    }
  });

  // Check for duplicate station IDs (excluding open/close loop markers)
  const nonLoopStations = stations.filter(s => {
    const r = (s.remark || '').toLowerCase();
    return !r.includes('open') && !r.includes('close');
  });
  const idCounts = new Map<string, number>();
  nonLoopStations.forEach(s => idCounts.set(s.stationId, (idCounts.get(s.stationId) || 0) + 1));
  idCounts.forEach((count, id) => {
    if (count > 1) {
      errors.push({ row: 0, field: 'stationId', message: `Duplicate station ID: \"${id}\" appears ${count} times`, severity: 'warning' });
    }
  });

  // Check for loop structure
  const hasOpen = stations.some(s => (s.remark || '').toLowerCase().includes('open'));
  const hasClose = stations.some(s => (s.remark || '').toLowerCase().includes('close'));
  if (!hasOpen) {
    errors.push({ row: 0, field: 'remark', message: 'No \"Open Loop\" remark found — drift correction may be inaccurate', severity: 'warning' });
  }
  if (!hasClose) {
    errors.push({ row: 0, field: 'remark', message: 'No \"Close Loop\" remark found — drift correction may be inaccurate', severity: 'warning' });
  }

  return errors;
}

// ─── Time parser ─────────────────────────────────────────────────────────────

function parseTime(val: any): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') {
    const totalMinutes = Math.round(val * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
  }
  return '0:00';
}

// ─── Excel Parser ────────────────────────────────────────────────────────────

export function parseGravityExcel(file: ArrayBuffer): ParsedData {
  const XLSX = require('xlsx');
  const wb = XLSX.read(file, { type: 'array' });

  let calibration = DEFAULT_CALIBRATION;
  let knownAbsValue = 978125.672;

  if (wb.SheetNames.length > 1) {
    const calSheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[1]], { header: 1 }) as any[];
    const calEntries: CalibrationTable[] = [];
    for (const row of calSheet) {
      if (row[0] && typeof row[0] === 'number' && row[1] && row[2]) {
        calEntries.push({ range: row[0], ffi: row[1], cr: row[2] });
      }
      if (typeof row[0] === 'string' && row[0].toLowerCase().includes('known abs')) {
        knownAbsValue = parseFloat(row[1]) || knownAbsValue;
      }
    }
    if (calEntries.length > 0) calibration = calEntries;
  }

  const sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
  const stations: RawStation[] = [];
  let baseStationId = '';

  for (const row of sheet) {
    const stn = row['STN'] || row['Station'] || row['STATION'] || '';
    if (!stn) continue;

    const station: RawStation = {
      date: row['DATE'] || row['Date'] || '',
      stationId: String(stn),
      description: row['STN DESCRIPTION'] || row['Description'] || '',
      latitude: parseFloat(row['LATITUDE'] || row['Latitude'] || row['LAT'] || 0),
      longitude: parseFloat(row['LONGITUDE'] || row['Longitude'] || row['LON'] || row['LON'] || 0),
      gravimeterReading: parseFloat(row['Gravimeter READING'] || row['Reading'] || row['READING'] || 0),
      time: parseTime(row['TIME'] || row['Time'] || '0:00'),
      remark: row['REMARK'] || row['Remark'] || '',
      height: parseFloat(row['Height'] || row['HEIGHT'] || row['Elevation'] || 0),
    };

    if (!baseStationId && station.remark?.toLowerCase().includes('open')) {
      baseStationId = station.stationId;
    }
    stations.push(station);
  }

  const validationErrors = validateStations(stations);
  return { stations, calibration, knownAbsValue, baseStationId, format: 'xlsx', validationErrors };
}

// ─── CSV Parser ──────────────────────────────────────────────────────────────

export function parseGravityCSV(text: string): ParsedData {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    return { stations: [], calibration: DEFAULT_CALIBRATION, knownAbsValue: 978125.672, baseStationId: '', format: 'csv', validationErrors: [{ row: 0, field: 'file', message: 'File has fewer than 2 lines', severity: 'error' }] };
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const stations: RawStation[] = [];
  let baseStationId = '';

  const findCol = (names: string[]) => headers.findIndex(h => names.some(n => h.toLowerCase() === n.toLowerCase()));

  const stnIdx = findCol(['STN', 'Station', 'STATION', 'station_id']);
  const latIdx = findCol(['LATITUDE', 'Latitude', 'LAT', 'lat']);
  const lonIdx = findCol(['LONGITUDE', 'Longitude', 'LONG', 'LON', 'lon']);
  const readIdx = findCol(['Gravimeter READING', 'Reading', 'READING', 'reading', 'grav_reading']);
  const timeIdx = findCol(['TIME', 'Time', 'time']);
  const heightIdx = findCol(['Height', 'HEIGHT', 'Elevation', 'elevation', 'height']);
  const dateIdx = findCol(['DATE', 'Date', 'date']);
  const descIdx = findCol(['STN DESCRIPTION', 'Description', 'description']);
  const remarkIdx = findCol(['REMARK', 'Remark', 'remark']);

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const stn = stnIdx >= 0 ? cols[stnIdx] : '';
    if (!stn) continue;

    const remark = remarkIdx >= 0 ? cols[remarkIdx] || '' : '';
    const station: RawStation = {
      date: dateIdx >= 0 ? cols[dateIdx] || '' : '',
      stationId: stn,
      description: descIdx >= 0 ? cols[descIdx] || '' : '',
      latitude: latIdx >= 0 ? parseFloat(cols[latIdx]) || 0 : 0,
      longitude: lonIdx >= 0 ? parseFloat(cols[lonIdx]) || 0 : 0,
      gravimeterReading: readIdx >= 0 ? parseFloat(cols[readIdx]) || 0 : 0,
      time: timeIdx >= 0 ? cols[timeIdx] || '0:00' : '0:00',
      remark,
      height: heightIdx >= 0 ? parseFloat(cols[heightIdx]) || 0 : 0,
    };

    if (!baseStationId && remark.toLowerCase().includes('open')) {
      baseStationId = station.stationId;
    }
    stations.push(station);
  }

  const validationErrors = validateStations(stations);
  return { stations, calibration: DEFAULT_CALIBRATION, knownAbsValue: 978125.672, baseStationId, format: 'csv', validationErrors };
}

// ─── XYZ Parser ──────────────────────────────────────────────────────────────
// Format: X(lon) Y(lat) Z(gravity value) [station_id] [height]

export function parseGravityXYZ(text: string): ParsedData {
  const lines = text.trim().split('\n').filter(l => !l.startsWith('#') && l.trim() !== '');
  const stations: RawStation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length < 3) continue;

    const station: RawStation = {
      date: '',
      stationId: parts.length > 3 ? parts[3] : `STN_${i + 1}`,
      description: '',
      latitude: parseFloat(parts[1]) || 0,
      longitude: parseFloat(parts[0]) || 0,
      gravimeterReading: parseFloat(parts[2]) || 0,
      time: '0:00',
      remark: i === 0 ? 'Open Loop' : (i === lines.length - 1 ? 'Close Loop' : ''),
      height: parts.length > 4 ? parseFloat(parts[4]) || 0 : 0,
    };
    stations.push(station);
  }

  const validationErrors = validateStations(stations);
  return { stations, calibration: DEFAULT_CALIBRATION, knownAbsValue: 978125.672, baseStationId: stations[0]?.stationId || '', format: 'xyz', validationErrors };
}

// ─── GXF Parser (simplified) ─────────────────────────────────────────────────
// Geosoft Grid Exchange Format — reads header + data

export function parseGravityGXF(text: string): ParsedData {
  const lines = text.trim().split('\n');
  let nCols = 0, nRows = 0;
  let xOrigin = 0, yOrigin = 0;
  let xSize = 1, ySize = 1;
  let dataStart = 0;

  // Parse header
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#POINTS')) { dataStart = i + 1; nCols = parseInt(lines[i + 1]) || 0; i++; }
    else if (line.startsWith('#ROWS')) { dataStart = i + 1; nRows = parseInt(lines[i + 1]) || 0; i++; }
    else if (line.startsWith('#PTSEPARATION')) { dataStart = i + 1; xSize = parseFloat(lines[i + 1]) || 1; i++; }
    else if (line.startsWith('#RWSEPARATION')) { dataStart = i + 1; ySize = parseFloat(lines[i + 1]) || 1; i++; }
    else if (line.startsWith('#XORIGIN')) { dataStart = i + 1; xOrigin = parseFloat(lines[i + 1]) || 0; i++; }
    else if (line.startsWith('#YORIGIN')) { dataStart = i + 1; yOrigin = parseFloat(lines[i + 1]) || 0; i++; }
    else if (!line.startsWith('#') && !isNaN(parseFloat(line))) {
      dataStart = i;
      break;
    }
  }

  const stations: RawStation[] = [];
  let stnCount = 0;
  const dataLines = lines.slice(dataStart);

  for (let row = 0; row < dataLines.length && stnCount < 10000; row++) {
    const values = dataLines[row].trim().split(/\s+/).map(Number);
    for (let col = 0; col < values.length; col++) {
      if (isNaN(values[col]) || values[col] === 1e30 || values[col] === -1e30) continue;
      stnCount++;
      stations.push({
        date: '',
        stationId: `GXF_${stnCount}`,
        description: `Row ${row + 1}, Col ${col + 1}`,
        latitude: yOrigin + row * ySize,
        longitude: xOrigin + col * xSize,
        gravimeterReading: values[col],
        time: '0:00',
        remark: stnCount === 1 ? 'Open Loop' : '',
        height: 0,
      });
    }
  }

  if (stations.length > 0) {
    stations[stations.length - 1].remark = 'Close Loop';
  }

  const validationErrors = validateStations(stations);
  return { stations, calibration: DEFAULT_CALIBRATION, knownAbsValue: 978125.672, baseStationId: stations[0]?.stationId || '', format: 'gxf', validationErrors };
}

// ─── Auto-detect format ──────────────────────────────────────────────────────

export function detectAndParse(file: File, buffer: ArrayBuffer): ParsedData {
  const name = file.name.toLowerCase();

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseGravityExcel(buffer);
  }

  const text = new TextDecoder().decode(buffer);

  if (name.endsWith('.gxf')) {
    return parseGravityGXF(text);
  }
  if (name.endsWith('.xyz')) {
    return parseGravityXYZ(text);
  }
  if (name.endsWith('.csv')) {
    return parseGravityCSV(text);
  }

  // Try to auto-detect from content
  if (text.includes('#POINTS') || text.includes('#ROWS')) {
    return parseGravityGXF(text);
  }
  if (text.includes(',')) {
    return parseGravityCSV(text);
  }
  return parseGravityXYZ(text);
}

// ─── Data Export ─────────────────────────────────────────────────────────────

export function exportToCSV(stations: any[], columns: { key: string; label: string }[]): string {
  const header = columns.map(c => c.label).join(',');
  const rows = stations.map(s =>
    columns.map(c => {
      const val = s[c.key];
      return typeof val === 'number' ? val.toFixed(6) : String(val || '');
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

export function exportToXYZ(stations: { longitude: number; latitude: number; [key: string]: any }[], valueKey: string): string {
  return stations.map(s =>
    `${s.longitude.toFixed(6)} ${s.latitude.toFixed(6)} ${(typeof s[valueKey] === 'number' ? s[valueKey].toFixed(6) : '0')} ${s.stationId || ''}`
  ).join('\n');
}

// ─── Project Save/Load ──────────────────────────────────────────────────────

export interface SavedProject {
  version: 1;
  projectName: string;
  knownAbsValue: number;
  baseStationId: string;
  density: number;
  calibration: CalibrationTable[];
  stations: RawStation[];
  savedAt: string;
}

export function saveProject(project: SavedProject): void {
  const json = JSON.stringify(project);
  localStorage.setItem(`gravity_project_${project.projectName}`, json);

  // Also keep a list of project names
  const list: string[] = JSON.parse(localStorage.getItem('gravity_project_list') || '[]');
  if (!list.includes(project.projectName)) {
    list.push(project.projectName);
    localStorage.setItem('gravity_project_list', JSON.stringify(list));
  }
}

export function loadProject(projectName: string): SavedProject | null {
  const json = localStorage.getItem(`gravity_project_${projectName}`);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function listSavedProjects(): string[] {
  return JSON.parse(localStorage.getItem('gravity_project_list') || '[]');
}

export function deleteProject(projectName: string): void {
  localStorage.removeItem(`gravity_project_${projectName}`);
  const list: string[] = JSON.parse(localStorage.getItem('gravity_project_list') || '[]');
  localStorage.setItem('gravity_project_list', JSON.stringify(list.filter(n => n !== projectName)));
}

export function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
