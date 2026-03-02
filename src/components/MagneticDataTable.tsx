import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProcessedMagStation } from '@/lib/magneticCalculations';

interface Props {
  data: ProcessedMagStation[];
}

const columns = [
  { key: 'sn', label: 'S/N' },
  { key: 'distance', label: 'Distance (m)' },
  { key: 'averageNT', label: 'Average nT' },
  { key: 'time', label: 'Time (s)' },
  { key: 'driftFactor', label: 'Drift Factor' },
  { key: 'driftCorrection', label: 'Drift' },
  { key: 'regionalField', label: 'Regional' },
  { key: 'reducedData', label: 'Reduced Data' },
  { key: 'reducedValue', label: 'Reduced Value' },
  { key: 'diurnalCorrection', label: 'Diurnal Corr.' },
  { key: 'totalAnomaly', label: 'Total Anomaly' },
];

const MagneticDataTable = ({ data }: Props) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Processed Magnetic Data</CardTitle>
        <CardDescription className="text-xs">
          Corrections applied: Drift, Regional removal, Diurnal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => (
                  <TableHead key={col.key} className="text-xs whitespace-nowrap">{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  {columns.map(col => {
                    const val = (row as any)[col.key];
                    return (
                      <TableCell key={col.key} className="text-xs font-mono whitespace-nowrap">
                        {typeof val === 'number' ? val.toFixed(col.key === 'driftFactor' ? 5 : 2) : String(val ?? '')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MagneticDataTable;
