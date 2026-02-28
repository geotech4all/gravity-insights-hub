import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProcessedStation } from '@/lib/gravityCalculations';
import { exportToCSV, exportToXYZ, downloadFile } from '@/lib/dataManager';

interface Props {
  data: ProcessedStation[];
  projectName: string;
}

const csvColumns = [
  { key: 'stationId', label: 'Station' },
  { key: 'latitude', label: 'Latitude' },
  { key: 'longitude', label: 'Longitude' },
  { key: 'height', label: 'Height (m)' },
  { key: 'gravimeterReading', label: 'Reading' },
  { key: 'rawGrav', label: 'Raw Gravity' },
  { key: 'driftCorrection', label: 'Drift Correction' },
  { key: 'finalObsGravVal', label: 'Final Obs' },
  { key: 'theoreticalGravity', label: 'gn' },
  { key: 'freeAirCorrection', label: 'FAC' },
  { key: 'bouguerCorrection', label: 'BC' },
  { key: 'absoluteGravity', label: 'Abs Gravity' },
  { key: 'freeAirAnomaly', label: 'FAA' },
  { key: 'bouguerAnomaly', label: 'BA' },
];

const DataExportDialog = ({ data, projectName }: Props) => {
  const [format, setFormat] = useState('csv');
  const [xyzValue, setXyzValue] = useState('bouguerAnomaly');

  const filtered = data.filter(d => !d.remark?.toLowerCase().includes('close'));

  const handleExport = () => {
    const safeName = projectName.replace(/\s+/g, '_');

    if (format === 'csv') {
      const content = exportToCSV(filtered, csvColumns);
      downloadFile(content, `${safeName}_gravity_data.csv`, 'text/csv');
    } else if (format === 'xyz') {
      const content = exportToXYZ(filtered, xyzValue);
      downloadFile(content, `${safeName}_${xyzValue}.xyz`);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={data.length === 0}>
          <Download className="h-3 w-3" /> Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">Export Processed Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (all columns)</SelectItem>
                <SelectItem value="xyz">XYZ (Lon Lat Value)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {format === 'xyz' && (
            <div>
              <Label className="text-xs">Value Column</Label>
              <Select value={xyzValue} onValueChange={setXyzValue}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bouguerAnomaly">Bouguer Anomaly</SelectItem>
                  <SelectItem value="freeAirAnomaly">Free Air Anomaly</SelectItem>
                  <SelectItem value="absoluteGravity">Absolute Gravity</SelectItem>
                  <SelectItem value="height">Elevation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleExport} size="sm" className="w-full">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Download {format.toUpperCase()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataExportDialog;
