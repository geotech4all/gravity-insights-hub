import * as XLSX from 'xlsx';
import type { RawStation, CalibrationTable } from './gravityCalculations';
import { DEFAULT_CALIBRATION } from './gravityCalculations';

function parseTime(val: any): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') {
    // Excel time as decimal fraction of day
    const totalMinutes = Math.round(val * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
  }
  return '0:00';
}

export interface ParsedExcelData {
  stations: RawStation[];
  calibration: CalibrationTable[];
  knownAbsValue: number;
  baseStationId: string;
}

export function parseGravityExcel(file: ArrayBuffer): ParsedExcelData {
  const wb = XLSX.read(file, { type: 'array' });

  // Parse calibration from Sheet 2 if exists
  let calibration = DEFAULT_CALIBRATION;
  let knownAbsValue = 978125.672;
  
  if (wb.SheetNames.length > 1) {
    const calSheet = XLSX.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[1]], { header: 1 });
    const calEntries: CalibrationTable[] = [];
    for (const row of calSheet) {
      if (row[0] && typeof row[0] === 'number' && row[1] && row[2]) {
        calEntries.push({ range: row[0], ffi: row[1], cr: row[2] });
      }
      // Look for known absolute value
      if (typeof row[0] === 'string' && row[0].toLowerCase().includes('known abs')) {
        knownAbsValue = parseFloat(row[1]) || knownAbsValue;
      }
    }
    if (calEntries.length > 0) calibration = calEntries;
  }

  // Parse main data from Sheet 1
  const sheet = XLSX.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]]);
  
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
      longitude: parseFloat(row['LONGITUDE'] || row['Longitude'] || row['LONG'] || row['LON'] || 0),
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

  return { stations, calibration, knownAbsValue, baseStationId };
}
