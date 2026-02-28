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
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import type { ProcessedStation } from './gravityCalculations';

const BRAND_RED = 'E31E24';
const BRAND_DARK = '1A1A2E';

function headerCell(text: string): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 16, color: 'FFFFFF', font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { fill: BRAND_RED },
    width: { size: 800, type: WidthType.DXA },
  });
}

function dataCell(text: string): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 16, font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    width: { size: 800, type: WidthType.DXA },
  });
}

export async function generateReport(
  data: ProcessedStation[],
  projectName: string,
  density: number,
  knownAbsValue: number
): Promise<void> {
  // Filter out close loop entries for reporting
  const reportData = data.filter(d => !d.remark?.toLowerCase().includes('close loop'));

  const headerRow = new TableRow({
    children: [
      headerCell('S/N'),
      headerCell('STN'),
      headerCell('Lat'),
      headerCell('Long'),
      headerCell('Height (m)'),
      headerCell('Grav. Reading'),
      headerCell('Raw Grav'),
      headerCell('Drift Corr.'),
      headerCell('Final Obs'),
      headerCell('gₙ (mGal)'),
      headerCell('FAC'),
      headerCell('BC'),
      headerCell('Abs Grav'),
      headerCell('FAA'),
      headerCell('BA'),
    ],
  });

  const dataRows = reportData.map((s, i) =>
    new TableRow({
      children: [
        dataCell(String(i + 1)),
        dataCell(s.stationId),
        dataCell(s.latitude.toFixed(5)),
        dataCell(s.longitude.toFixed(5)),
        dataCell(s.height.toFixed(2)),
        dataCell(s.gravimeterReading.toFixed(2)),
        dataCell(s.rawGrav.toFixed(4)),
        dataCell(s.driftCorrection.toFixed(6)),
        dataCell(s.finalObsGravVal.toFixed(4)),
        dataCell(s.theoreticalGravity.toFixed(4)),
        dataCell(s.freeAirCorrection.toFixed(4)),
        dataCell(s.bouguerCorrection.toFixed(4)),
        dataCell(s.absoluteGravity.toFixed(3)),
        dataCell(s.freeAirAnomaly.toFixed(3)),
        dataCell(s.bouguerAnomaly.toFixed(3)),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: { page: { size: { orientation: 'landscape' as any } } },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'GRAVITY DATA REDUCTION REPORT', bold: true, size: 32, color: BRAND_RED, font: 'Calibri' }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Project: ${projectName}`, size: 24, color: BRAND_DARK, font: 'Calibri' }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Date Generated: ${new Date().toLocaleDateString()}`, size: 20, font: 'Calibri' }),
              new TextRun({ text: `  |  Density: ${density} g/cm³`, size: 20, font: 'Calibri' }),
              new TextRun({ text: `  |  Base Station Abs. Value: ${knownAbsValue.toFixed(3)} mGal`, size: 20, font: 'Calibri' }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Processed Gravity Data', bold: true, size: 24, color: BRAND_DARK, font: 'Calibri' })],
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Table({
            rows: [headerRow, ...dataRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({
            children: [new TextRun({ text: '', size: 16 })],
            spacing: { before: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Formulas Applied:', bold: true, size: 20, color: BRAND_DARK, font: 'Calibri' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: '• Theoretical Gravity (gₙ): GRS80 International Gravity Formula', size: 18, font: 'Calibri' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: '• Free Air Correction (FAC) = 0.3086 × h (mGal)', size: 18, font: 'Calibri' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `• Bouguer Correction (BC) = 0.04193 × ρ × h (ρ = ${density} g/cm³)`, size: 18, font: 'Calibri' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: '• Free Air Anomaly (FAA) = Absolute Gravity - gₙ + FAC', size: 18, font: 'Calibri' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: '• Bouguer Anomaly (BA) = FAA - BC', size: 18, font: 'Calibri' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: '', size: 16 })],
            spacing: { before: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Generated by Geotech4All Gravity WebApp', italics: true, size: 16, color: BRAND_RED, font: 'Calibri' }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${projectName.replace(/\s+/g, '_')}_Gravity_Report.docx`);
}
