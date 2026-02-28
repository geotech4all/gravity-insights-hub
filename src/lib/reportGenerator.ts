import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
  PageBreak,
  TabStopPosition,
  TabStopType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { ProcessedStation } from './gravityCalculations';
import {
  computeRegionalResidual,
  computeDerivatives,
  computePowerSpectrum,
  computeCumulativeDistances,
  type RegionalResidualResult,
  type DerivativeResult,
} from './interpretationCalculations';

const BRAND_RED = 'E31E24';
const BRAND_DARK = '1A1A2E';
const FONT = 'Calibri';

// ─── Cell helpers ────────────────────────────────────────────────────────────

function headerCell(text: string, width = 700): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 15, color: 'FFFFFF', font: FONT })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { fill: BRAND_RED },
    width: { size: width, type: WidthType.DXA },
  });
}

function dataCell(text: string, width = 700): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 15, font: FONT })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    width: { size: width, type: WidthType.DXA },
  });
}

function subHeaderCell(text: string): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 15, color: 'FFFFFF', font: FONT })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { fill: BRAND_DARK },
  });
}

// ─── Text helpers ────────────────────────────────────────────────────────────

function heading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: BRAND_DARK, font: FONT })],
    heading: level,
    spacing: { before: 300, after: 150 },
  });
}

function body(text: string, opts?: { bold?: boolean; italic?: boolean }) {
  return new Paragraph({
    children: [new TextRun({ text, size: 18, font: FONT, bold: opts?.bold, italics: opts?.italic })],
    spacing: { after: 80 },
  });
}

function bullet(text: string) {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 18, font: FONT })],
    spacing: { after: 60 },
  });
}

function spacer() {
  return new Paragraph({ children: [new TextRun({ text: '', size: 16 })], spacing: { before: 200 } });
}

// ─── Statistics ──────────────────────────────────────────────────────────────

function computeStats(values: number[]) {
  const n = values.length;
  if (n === 0) return { min: 0, max: 0, mean: 0, std: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  return { min, max, mean, std };
}

function statsRow(label: string, stats: { min: number; max: number; mean: number; std: number }) {
  return new TableRow({
    children: [
      dataCell(label),
      dataCell(stats.min.toFixed(3)),
      dataCell(stats.max.toFixed(3)),
      dataCell(stats.mean.toFixed(3)),
      dataCell(stats.std.toFixed(3)),
    ],
  });
}

// ─── Main export ─────────────────────────────────────────────────────────────

export interface ReportOptions {
  includeInterpretation?: boolean;
  polynomialDegree?: number;
  anomalyType?: 'freeAirAnomaly' | 'bouguerAnomaly';
}

export async function generateReport(
  data: ProcessedStation[],
  projectName: string,
  density: number,
  knownAbsValue: number,
  options: ReportOptions = {}
): Promise<void> {
  const {
    includeInterpretation = true,
    polynomialDegree = 2,
    anomalyType = 'bouguerAnomaly',
  } = options;

  const reportData = data.filter(d => !d.remark?.toLowerCase().includes('close loop'));
  const now = new Date();

  // ─── Section 1: Title page ─────────────────────────────────────────────────
  const titleSection = [
    new Paragraph({ spacing: { before: 2000 }, children: [] }),
    new Paragraph({
      children: [new TextRun({ text: 'GRAVITY DATA REDUCTION', bold: true, size: 48, color: BRAND_RED, font: FONT })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '& INTERPRETATION REPORT', bold: true, size: 40, color: BRAND_DARK, font: FONT })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: projectName, size: 28, color: BRAND_DARK, font: FONT })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Date: ${now.toLocaleDateString()}`, size: 22, font: FONT })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: `Stations: ${reportData.length}  |  Density: ${density} g/cm³  |  Base Abs: ${knownAbsValue.toFixed(3)} mGal`, size: 20, font: FONT })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Generated by Geotech4All Gravity WebApp', italics: true, size: 18, color: BRAND_RED, font: FONT })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // ─── Section 2: Survey metadata ────────────────────────────────────────────
  const dates = reportData.map(s => s.date).filter(Boolean);
  const uniqueDates = [...new Set(dates)];
  const latRange = computeStats(reportData.map(s => s.latitude));
  const lonRange = computeStats(reportData.map(s => s.longitude));
  const elevRange = computeStats(reportData.map(s => s.height));

  const metadataSection = [
    heading('1. Survey Metadata'),
    body(`Project Name: ${projectName}`, { bold: true }),
    body(`Report Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`),
    body(`Survey Dates: ${uniqueDates.length > 0 ? uniqueDates.join(', ') : 'N/A'}`),
    body(`Number of Stations: ${reportData.length}`),
    body(`Base Station Absolute Value: ${knownAbsValue.toFixed(3)} mGal`),
    body(`Assumed Crustal Density: ${density} g/cm³`),
    spacer(),
    body('Survey Area Extent:', { bold: true }),
    bullet(`Latitude: ${latRange.min.toFixed(5)}° to ${latRange.max.toFixed(5)}°`),
    bullet(`Longitude: ${lonRange.min.toFixed(5)}° to ${lonRange.max.toFixed(5)}°`),
    bullet(`Elevation: ${elevRange.min.toFixed(1)} m to ${elevRange.max.toFixed(1)} m`),
    spacer(),
  ];

  // ─── Section 3: Statistical summary ────────────────────────────────────────
  const faaStats = computeStats(reportData.map(s => s.freeAirAnomaly));
  const baStats = computeStats(reportData.map(s => s.bouguerAnomaly));
  const absStats = computeStats(reportData.map(s => s.absoluteGravity));
  const driftStats = computeStats(reportData.map(s => s.driftCorrection));

  const statsTable = new Table({
    rows: [
      new TableRow({
        children: [subHeaderCell('Parameter'), subHeaderCell('Min'), subHeaderCell('Max'), subHeaderCell('Mean'), subHeaderCell('Std Dev')],
      }),
      statsRow('Free Air Anomaly (mGal)', faaStats),
      statsRow('Bouguer Anomaly (mGal)', baStats),
      statsRow('Absolute Gravity (mGal)', absStats),
      statsRow('Drift Correction (mGal)', driftStats),
      statsRow('Elevation (m)', elevRange),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const statsSection = [
    heading('2. Statistical Summary'),
    statsTable,
    spacer(),
  ];

  // ─── Section 4: Main data table ────────────────────────────────────────────
  const mainTableHeader = new TableRow({
    children: [
      headerCell('S/N'), headerCell('STN'), headerCell('Lat'), headerCell('Long'),
      headerCell('H (m)'), headerCell('Reading'), headerCell('Raw G'),
      headerCell('Drift'), headerCell('Final Obs'), headerCell('gₙ'),
      headerCell('FAC'), headerCell('BC'), headerCell('Abs G'),
      headerCell('FAA'), headerCell('BA'),
    ],
  });

  const mainDataRows = reportData.map((s, i) =>
    new TableRow({
      children: [
        dataCell(String(i + 1)), dataCell(s.stationId),
        dataCell(s.latitude.toFixed(5)), dataCell(s.longitude.toFixed(5)),
        dataCell(s.height.toFixed(2)), dataCell(s.gravimeterReading.toFixed(2)),
        dataCell(s.rawGrav.toFixed(4)), dataCell(s.driftCorrection.toFixed(6)),
        dataCell(s.finalObsGravVal.toFixed(4)), dataCell(s.theoreticalGravity.toFixed(4)),
        dataCell(s.freeAirCorrection.toFixed(4)), dataCell(s.bouguerCorrection.toFixed(4)),
        dataCell(s.absoluteGravity.toFixed(3)), dataCell(s.freeAirAnomaly.toFixed(3)),
        dataCell(s.bouguerAnomaly.toFixed(3)),
      ],
    })
  );

  const dataTableSection = [
    heading('3. Processed Gravity Data'),
    body('All corrections applied: Drift (linear), Latitude (GRS80), Free Air, Bouguer.'),
    new Table({
      rows: [mainTableHeader, ...mainDataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // ─── Section 5: Interpretation results ─────────────────────────────────────
  let interpretationSection: Paragraph[] | (Paragraph | Table)[] = [];

  if (includeInterpretation && reportData.length >= 3) {
    const anomalyLabel = anomalyType === 'bouguerAnomaly' ? 'Bouguer Anomaly' : 'Free Air Anomaly';

    // Regional-Residual
    const rrResults = computeRegionalResidual(data, anomalyType, polynomialDegree);
    const residualStats = computeStats(rrResults.map(r => r.residual));

    const rrTableHeader = new TableRow({
      children: [headerCell('Station'), headerCell('Dist (km)'), headerCell('Observed'), headerCell('Regional'), headerCell('Residual')],
    });
    const rrRows = rrResults.map(r => new TableRow({
      children: [
        dataCell(r.stationId), dataCell(r.distance.toFixed(2)),
        dataCell(r.observed.toFixed(3)), dataCell(r.regional.toFixed(3)), dataCell(r.residual.toFixed(3)),
      ],
    }));

    // Derivatives
    const derivResults = computeDerivatives(data, anomalyType);
    const derTableHeader = new TableRow({
      children: [headerCell('Station'), headerCell('Dist (km)'), headerCell('dg/dx'), headerCell('d²g/dz²'), headerCell('|AS|')],
    });
    const derRows = derivResults.map(r => new TableRow({
      children: [
        dataCell(r.stationId), dataCell(r.distance.toFixed(2)),
        dataCell(r.horizontalGradient.toFixed(4)), dataCell(r.verticalGradient.toFixed(4)),
        dataCell(r.analyticSignal.toFixed(4)),
      ],
    }));

    // Power Spectrum
    const { depthEstimates } = computePowerSpectrum(data, anomalyType);

    interpretationSection = [
      heading('4. Interpretation Results'),
      
      heading('4.1 Regional-Residual Separation', HeadingLevel.HEADING_3),
      body(`Anomaly: ${anomalyLabel}  |  Polynomial Degree: ${polynomialDegree}`),
      body(`Residual Range: ${residualStats.min.toFixed(3)} to ${residualStats.max.toFixed(3)} mGal (σ = ${residualStats.std.toFixed(3)})`),
      spacer(),
      new Table({
        rows: [rrTableHeader, ...rrRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ children: [new PageBreak()] }),

      heading('4.2 Derivative Analysis', HeadingLevel.HEADING_3),
      body('Horizontal gradient (dg/dx) highlights lateral density contrasts and edges of geological bodies.'),
      body('Vertical gradient (d²g/dz²) enhances near-surface features.'),
      body('Analytic signal amplitude |AS| is useful for locating source boundaries independent of magnetization direction.'),
      spacer(),
      new Table({
        rows: [derTableHeader, ...derRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      spacer(),

      heading('4.3 Power Spectrum Depth Estimates', HeadingLevel.HEADING_3),
      body(`Anomaly: ${anomalyLabel}`),
      body(`Estimated Deep Source Depth: ~${depthEstimates.deep.toFixed(2)} km`, { bold: true }),
      body(`Estimated Shallow Source Depth: ~${depthEstimates.shallow.toFixed(2)} km`, { bold: true }),
      spacer(),
      body('Depth estimation derived from the slope of ln(Power) vs. wavenumber using the relation: depth = -slope / 4π.'),
      body('The spectrum was divided at the midpoint into low-wavenumber (deep) and high-wavenumber (shallow) segments.'),
      new Paragraph({ children: [new PageBreak()] }),
    ];
  }

  // ─── Section 6: Methodology ────────────────────────────────────────────────
  const methodSection = [
    heading(includeInterpretation ? '5. Methodology & Formulas' : '4. Methodology & Formulas'),
    heading('Gravity Reduction', HeadingLevel.HEADING_3),
    bullet('Theoretical Gravity (gₙ): GRS80 — gₙ = 978032.67714(1 + 0.00193185sin²φ) / √(1 - 0.00669438sin²φ)'),
    bullet('Free Air Correction (FAC) = 0.3086 × h (mGal)'),
    bullet(`Bouguer Correction (BC) = 0.04193 × ρ × h (ρ = ${density} g/cm³)`),
    bullet('Free Air Anomaly (FAA) = Absolute Gravity - gₙ + FAC'),
    bullet('Bouguer Anomaly (BA) = FAA - BC'),
    bullet('Drift Correction: Linear interpolation between open/close loop readings'),
    spacer(),
  ];

  if (includeInterpretation) {
    methodSection.push(
      heading('Interpretation Methods', HeadingLevel.HEADING_3),
      bullet(`Regional-Residual: Least-squares polynomial regression (degree ${polynomialDegree})`),
      bullet('Horizontal Gradient: Central finite differences dg/dx'),
      bullet('Vertical Gradient: Second horizontal derivative as proxy d²g/dz²'),
      bullet('Analytic Signal: |AS| = √((dg/dx)² + (dg/dz)²)'),
      bullet('Power Spectrum: DFT with Hanning window; depth from ln(Power) slope'),
      spacer(),
    );
  }

  // ─── Footer ────────────────────────────────────────────────────────────────
  const footer = [
    spacer(),
    new Paragraph({
      children: [new TextRun({ text: '─'.repeat(60), size: 16, color: BRAND_RED, font: FONT })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Generated by Geotech4All Gravity WebApp — www.geotech4all.com', italics: true, size: 16, color: BRAND_RED, font: FONT })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: `© ${now.getFullYear()} Geotech4All. All rights reserved.`, size: 14, color: BRAND_DARK, font: FONT })],
      alignment: AlignmentType.CENTER,
    }),
  ];

  // ─── Assemble document ─────────────────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        properties: { page: { size: { orientation: 'landscape' as any } } },
        children: [
          ...titleSection,
          ...metadataSection,
          ...statsSection,
          ...dataTableSection,
          ...interpretationSection,
          ...methodSection,
          ...footer,
        ] as any[],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${projectName.replace(/\s+/g, '_')}_Gravity_Report.docx`);
}
