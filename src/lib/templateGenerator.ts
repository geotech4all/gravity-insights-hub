// Downloadable template generator for Gravity and Magnetic data formats
import * as XLSX from 'xlsx';
import { downloadFile } from './dataManager';

// ─── Gravity Templates ──────────────────────────────────────────────────────

export function downloadGravityExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Data template
  const dataHeaders = ['DATE', 'STN', 'STN DESCRIPTION', 'LATITUDE', 'LONGITUDE', 'HEIGHT', 'Gravimeter READING', 'TIME', 'REMARK'];
  const sampleRows = [
    ['2024-01-15', 'BASE-01', 'Base Station (Market Square)', 7.4905, 3.9128, 215.3, 1672.45, '8:00', 'Open Loop'],
    ['2024-01-15', 'STN-001', 'Junction Road West', 7.4912, 3.9135, 220.1, 1673.12, '8:25', ''],
    ['2024-01-15', 'STN-002', 'University Gate', 7.4920, 3.9142, 218.7, 1671.89, '8:50', ''],
    ['2024-01-15', 'STN-003', 'Church Road', 7.4928, 3.9150, 225.0, 1674.56, '9:15', ''],
    ['2024-01-15', 'STN-004', 'Hospital Junction', 7.4935, 3.9158, 210.5, 1670.23, '9:40', ''],
    ['2024-01-15', 'BASE-01', 'Base Station (Market Square)', 7.4905, 3.9128, 215.3, 1672.48, '10:05', 'Close Loop'],
  ];
  const dataSheet = XLSX.utils.aoa_to_sheet([dataHeaders, ...sampleRows]);
  
  // Set column widths
  dataSheet['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 10 }, { wch: 10 },
    { wch: 8 }, { wch: 18 }, { wch: 8 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, dataSheet, 'Gravity Data');

  // Sheet 2: Calibration
  const calHeaders = ['Range', 'FFI', 'CR'];
  const calRows = [
    [1600, 1.02191, 1633.81],
    [1700, 1.02205, 1736.00],
    ['', '', ''],
    ['Known Abs Value', 978125.672, ''],
  ];
  const calSheet = XLSX.utils.aoa_to_sheet([calHeaders, ...calRows]);
  calSheet['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, calSheet, 'Calibration');

  // Sheet 3: Instructions
  const instructions = [
    ['GraviMag Cloud — Gravity Data Format Guide'],
    [''],
    ['REQUIRED COLUMNS:'],
    ['Column', 'Description', 'Example'],
    ['STN', 'Unique station identifier', 'STN-001'],
    ['LATITUDE', 'Station latitude in decimal degrees', '7.4905'],
    ['LONGITUDE', 'Station longitude in decimal degrees', '3.9128'],
    ['Gravimeter READING', 'Raw gravimeter counter reading', '1672.45'],
    ['TIME', 'Time of reading (HH:MM format)', '8:25'],
    ['HEIGHT', 'Station elevation in meters', '215.3'],
    [''],
    ['OPTIONAL COLUMNS:'],
    ['DATE', 'Survey date (YYYY-MM-DD)', '2024-01-15'],
    ['STN DESCRIPTION', 'Station location description', 'Market Square'],
    ['REMARK', '"Open Loop" for first base, "Close Loop" for return base', 'Open Loop'],
    [''],
    ['IMPORTANT NOTES:'],
    ['1. First and last stations should be at the base station (Open/Close Loop)'],
    ['2. Coordinates must be in decimal degrees (not DMS)'],
    ['3. Height/elevation in meters above sea level'],
    ['4. Time in 24-hour format (HH:MM)'],
    ['5. Calibration table goes in Sheet 2 with Range, FFI, CR columns'],
    ['6. Known absolute gravity value (mGal) in Sheet 2'],
    ['7. Supported formats: .xlsx, .xls, .csv, .xyz, .gxf'],
  ];
  const instrSheet = XLSX.utils.aoa_to_sheet(instructions);
  instrSheet['!cols'] = [{ wch: 25 }, { wch: 45 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, instrSheet, 'Instructions');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'GraviMag_Gravity_Template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadGravityCSVTemplate() {
  const csv = `DATE,STN,STN DESCRIPTION,LATITUDE,LONGITUDE,HEIGHT,Gravimeter READING,TIME,REMARK
2024-01-15,BASE-01,Base Station (Market Square),7.4905,3.9128,215.3,1672.45,8:00,Open Loop
2024-01-15,STN-001,Junction Road West,7.4912,3.9135,220.1,1673.12,8:25,
2024-01-15,STN-002,University Gate,7.4920,3.9142,218.7,1671.89,8:50,
2024-01-15,STN-003,Church Road,7.4928,3.9150,225.0,1674.56,9:15,
2024-01-15,STN-004,Hospital Junction,7.4935,3.9158,210.5,1670.23,9:40,
2024-01-15,BASE-01,Base Station (Market Square),7.4905,3.9128,215.3,1672.48,10:05,Close Loop`;
  downloadFile(csv, 'GraviMag_Gravity_Template.csv', 'text/csv');
}

// ─── Magnetic Templates ─────────────────────────────────────────────────────

export function downloadMagneticExcelTemplate() {
  const wb = XLSX.utils.book_new();

  const dataHeaders = ['sn', 'distance (M)', 'Average nT', 'Time (s)', 'drift factor', 'Drift', 'Regional', 'Reduced Data', 'Reduced value'];
  const sampleRows = [
    [1, 0, 33406.57, 31968, 0.00518, '', 33434.6, '', ''],
    [2, 20, 33373.78, 32064, 0.00518, '', 33434.6, '', ''],
    [3, 40, 33408.28, 32136, 0.00518, '', 33434.6, '', ''],
    [4, 80, 33346.42, 32202, 0.00518, '', 33434.6, '', ''],
    [5, 100, 33402.96, 32287, 0.00518, '', 33434.6, '', ''],
    [6, 120, 33388.48, 32376, 0.00518, '', 33434.6, '', ''],
  ];
  const dataSheet = XLSX.utils.aoa_to_sheet([dataHeaders, ...sampleRows]);
  dataSheet['!cols'] = [
    { wch: 5 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, dataSheet, 'Magnetic Data');

  // Instructions sheet
  const instructions = [
    ['GraviMag Cloud — Magnetic Data Format Guide'],
    [''],
    ['REQUIRED COLUMNS:'],
    ['Column', 'Description', 'Example'],
    ['sn', 'Serial/station number', '1'],
    ['distance (M)', 'Station distance from start in meters', '0'],
    ['Average nT', 'Average magnetic field reading in nanoTesla', '33406.57'],
    ['Time (s)', 'Time of reading in seconds (elapsed or epoch)', '31968'],
    [''],
    ['OPTIONAL COLUMNS (auto-calculated if blank):'],
    ['drift factor', 'Drift rate in nT/second', '0.00518'],
    ['Regional', 'Regional field value in nT', '33434.6'],
    ['Drift', 'Drift correction (auto-calculated)', ''],
    ['Reduced Data', 'Observed minus regional (auto-calculated)', ''],
    ['Reduced value', 'Final anomaly value (auto-calculated)', ''],
    ['Latitude', 'Station latitude (for IGRF)', '7.4905'],
    ['Longitude', 'Station longitude (for IGRF)', '3.9128'],
    ['Elevation', 'Station elevation in meters', '215.0'],
    [''],
    ['IMPORTANT NOTES:'],
    ['1. Distance should be in meters along the survey profile'],
    ['2. Field readings in nanoTesla (nT)'],
    ['3. Time can be seconds from midnight or elapsed seconds'],
    ['4. Drift factor and Regional are taken from the first data row'],
    ['5. If Latitude/Longitude provided, IGRF can be used as regional field'],
    ['6. Supported formats: .xlsx, .xls, .csv'],
  ];
  const instrSheet = XLSX.utils.aoa_to_sheet(instructions);
  instrSheet['!cols'] = [{ wch: 25 }, { wch: 50 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, instrSheet, 'Instructions');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'GraviMag_Magnetic_Template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadMagneticCSVTemplate() {
  const csv = `sn,distance (M),Average nT,Time (s),drift factor,Regional
1,0,33406.57,31968,0.00518,33434.6
2,20,33373.78,32064,0.00518,33434.6
3,40,33408.28,32136,0.00518,33434.6
4,80,33346.42,32202,0.00518,33434.6
5,100,33402.96,32287,0.00518,33434.6
6,120,33388.48,32376,0.00518,33434.6`;
  downloadFile(csv, 'GraviMag_Magnetic_Template.csv', 'text/csv');
}

// ─── Formatting Guide PDF (as HTML download) ────────────────────────────────

export function downloadFormattingGuide() {
  const html = `<!DOCTYPE html>
<html>
<head>
<title>GraviMag Cloud — Data Formatting Guide</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
  h1 { color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 10px; }
  h2 { color: #dc2626; margin-top: 30px; }
  h3 { color: #555; }
  table { border-collapse: collapse; width: 100%; margin: 15px 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background-color: #dc2626; color: white; }
  tr:nth-child(even) { background-color: #f9f9f9; }
  .note { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 15px 0; }
  .tip { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px; margin: 15px 0; }
  code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
</style>
</head>
<body>
<h1>🌍 GraviMag Cloud — Data Formatting Guide</h1>
<p><strong>Version 1.0</strong> | by Geotech4All</p>

<h2>1. Gravity Data Format</h2>
<h3>Supported File Types</h3>
<ul>
  <li><strong>Excel</strong> (.xlsx, .xls) — Recommended</li>
  <li><strong>CSV</strong> (.csv) — Comma-separated values</li>
  <li><strong>XYZ</strong> (.xyz) — Space-separated: Longitude Latitude Value [StationID] [Height]</li>
  <li><strong>GXF</strong> (.gxf) — Geosoft Grid Exchange Format</li>
</ul>

<h3>Required Columns (Excel/CSV)</h3>
<table>
  <tr><th>Column Name</th><th>Type</th><th>Description</th><th>Example</th></tr>
  <tr><td>STN</td><td>Text</td><td>Unique station identifier</td><td>STN-001</td></tr>
  <tr><td>LATITUDE</td><td>Number</td><td>Decimal degrees</td><td>7.4905</td></tr>
  <tr><td>LONGITUDE</td><td>Number</td><td>Decimal degrees</td><td>3.9128</td></tr>
  <tr><td>Gravimeter READING</td><td>Number</td><td>Raw counter reading</td><td>1672.45</td></tr>
  <tr><td>TIME</td><td>Text</td><td>24-hour format (HH:MM)</td><td>8:25</td></tr>
  <tr><td>HEIGHT</td><td>Number</td><td>Elevation in meters (ASL)</td><td>215.3</td></tr>
</table>

<h3>Optional Columns</h3>
<table>
  <tr><th>Column Name</th><th>Description</th></tr>
  <tr><td>DATE</td><td>Survey date (YYYY-MM-DD)</td></tr>
  <tr><td>STN DESCRIPTION</td><td>Location description</td></tr>
  <tr><td>REMARK</td><td>"Open Loop" / "Close Loop" for base returns</td></tr>
</table>

<div class="note">
  <strong>⚠️ Loop Structure:</strong> Your first station should have the remark "Open Loop" and 
  the last station (return to base) should have "Close Loop". This enables drift correction.
</div>

<h3>Calibration Table (Excel Sheet 2)</h3>
<table>
  <tr><th>Range</th><th>FFI</th><th>CR</th></tr>
  <tr><td>1600</td><td>1.02191</td><td>1633.81</td></tr>
  <tr><td>1700</td><td>1.02205</td><td>1736.00</td></tr>
</table>
<p>Include a row with "Known Abs Value" in column A and the value in column B.</p>

<h2>2. Magnetic Data Format</h2>
<h3>Supported File Types</h3>
<ul>
  <li><strong>Excel</strong> (.xlsx, .xls) — Recommended</li>
  <li><strong>CSV</strong> (.csv) — Comma-separated values</li>
</ul>

<h3>Required Columns</h3>
<table>
  <tr><th>Column Name</th><th>Type</th><th>Description</th><th>Example</th></tr>
  <tr><td>sn</td><td>Number</td><td>Serial/station number</td><td>1</td></tr>
  <tr><td>distance (M)</td><td>Number</td><td>Distance from start (meters)</td><td>0</td></tr>
  <tr><td>Average nT</td><td>Number</td><td>Magnetic field (nanoTesla)</td><td>33406.57</td></tr>
  <tr><td>Time (s)</td><td>Number</td><td>Time in seconds</td><td>31968</td></tr>
</table>

<h3>Optional Columns</h3>
<table>
  <tr><th>Column Name</th><th>Description</th></tr>
  <tr><td>drift factor</td><td>Drift rate (nT/s), e.g., 0.00518</td></tr>
  <tr><td>Regional</td><td>Regional field value (nT), e.g., 33434.6</td></tr>
  <tr><td>Latitude</td><td>For IGRF calculation</td></tr>
  <tr><td>Longitude</td><td>For IGRF calculation</td></tr>
  <tr><td>Elevation</td><td>Station elevation (m)</td></tr>
</table>

<div class="tip">
  <strong>💡 Tip:</strong> The Drift, Reduced Data, and Reduced Value columns are auto-calculated 
  by GraviMag Cloud. You only need to provide the raw readings.
</div>

<h2>3. Corrections Applied</h2>
<h3>Gravity Corrections</h3>
<ul>
  <li><strong>Drift Correction</strong> — Linear drift between loop open/close</li>
  <li><strong>Latitude Correction</strong> — GRS80 theoretical gravity</li>
  <li><strong>Free Air Correction</strong> — FAC = 0.3086 × h</li>
  <li><strong>Bouguer Correction</strong> — BC = 0.04193 × ρ × h</li>
  <li><strong>Terrain Correction</strong> — Near-zone topographic estimate</li>
  <li><strong>Tidal Correction</strong> — Longman luni-solar formula</li>
  <li><strong>Isostatic Correction</strong> — Airy or Pratt model</li>
</ul>

<h3>Magnetic Corrections</h3>
<ul>
  <li><strong>Drift Correction</strong> — Linear instrument drift</li>
  <li><strong>Diurnal Correction</strong> — Daily magnetic variation</li>
  <li><strong>Regional Field Removal</strong> — Constant or IGRF reference</li>
  <li><strong>Reduction to Pole (RTP)</strong> — Removes inclination effects</li>
</ul>

<h2>4. Tips for Best Results</h2>
<ol>
  <li>Use consistent units throughout your dataset</li>
  <li>Ensure coordinates are in decimal degrees (not DMS)</li>
  <li>Include complete loop closures for drift correction</li>
  <li>Record times accurately for diurnal/drift corrections</li>
  <li>Download the template files from GraviMag Cloud for the correct format</li>
</ol>

<hr>
<p style="text-align:center; color:#999;">© 2024 GraviMag Cloud by Geotech4All</p>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'GraviMag_Data_Formatting_Guide.html';
  a.click();
  URL.revokeObjectURL(url);
}
