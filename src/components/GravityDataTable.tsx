import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ProcessedStation } from '@/lib/gravityCalculations';

interface Props {
  data: ProcessedStation[];
}

const columns = [
  { key: 'sn', label: 'S/N' },
  { key: 'stationId', label: 'Station' },
  { key: 'latitude', label: 'Lat (°)' },
  { key: 'longitude', label: 'Long (°)' },
  { key: 'height', label: 'Height (m)' },
  { key: 'gravimeterReading', label: 'Grav. Read.' },
  { key: 'rawGrav', label: 'Raw Grav' },
  { key: 'driftCorrection', label: 'Drift Corr.' },
  { key: 'finalObsGravVal', label: 'Final Obs.' },
  { key: 'theoreticalGravity', label: 'gₙ (mGal)' },
  { key: 'freeAirCorrection', label: 'FAC' },
  { key: 'bouguerCorrection', label: 'BC' },
  { key: 'absoluteGravity', label: 'Abs. Grav.' },
  { key: 'freeAirAnomaly', label: 'FAA' },
  { key: 'bouguerAnomaly', label: 'BA' },
];

const GravityDataTable = ({ data }: Props) => {
  // Filter out close loop stations for display
  const displayData = data.filter(d => !d.remark?.toLowerCase().includes('close loop'));

  return (
    <ScrollArea className="w-full rounded-lg border">
      <div className="min-w-[1400px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary">
              {columns.map(col => (
                <TableHead key={col.key} className="whitespace-nowrap text-xs font-bold text-secondary-foreground">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((row, i) => (
              <TableRow key={i} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                <TableCell className="text-xs font-medium">{i + 1}</TableCell>
                <TableCell className="text-xs font-medium text-primary">{row.stationId}</TableCell>
                <TableCell className="text-xs">{row.latitude.toFixed(5)}</TableCell>
                <TableCell className="text-xs">{row.longitude.toFixed(5)}</TableCell>
                <TableCell className="text-xs">{row.height.toFixed(2)}</TableCell>
                <TableCell className="text-xs">{row.gravimeterReading.toFixed(2)}</TableCell>
                <TableCell className="text-xs">{row.rawGrav.toFixed(4)}</TableCell>
                <TableCell className="text-xs">{row.driftCorrection.toFixed(6)}</TableCell>
                <TableCell className="text-xs">{row.finalObsGravVal.toFixed(4)}</TableCell>
                <TableCell className="text-xs">{row.theoreticalGravity.toFixed(4)}</TableCell>
                <TableCell className="text-xs">{row.freeAirCorrection.toFixed(4)}</TableCell>
                <TableCell className="text-xs">{row.bouguerCorrection.toFixed(4)}</TableCell>
                <TableCell className="text-xs font-medium">{row.absoluteGravity.toFixed(3)}</TableCell>
                <TableCell className="text-xs font-bold text-primary">{row.freeAirAnomaly.toFixed(3)}</TableCell>
                <TableCell className="text-xs font-bold text-accent-foreground">{row.bouguerAnomaly.toFixed(3)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
};

export default GravityDataTable;
