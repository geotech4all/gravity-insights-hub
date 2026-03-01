import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ProcessedStation } from '@/lib/gravityCalculations';
import { computeTerrainCorrection, computeTidalCorrection, computeIsostaticAnomaly } from '@/lib/advancedCalculations';

const CorrectionsPanel = ({ data }: { data: ProcessedStation[] }) => {
  const [density, setDensity] = useState(2.67);
  const [maxDist, setMaxDist] = useState(5);
  const [isoModel, setIsoModel] = useState<'airy' | 'pratt'>('airy');
  const [crustalDensity, setCrustalDensity] = useState(2.67);
  const [mantleDensity, setMantleDensity] = useState(3.3);

  const terrain = useMemo(() => computeTerrainCorrection(data, density, maxDist), [data, density, maxDist]);
  const tidal = useMemo(() => computeTidalCorrection(data), [data]);
  const isostatic = useMemo(() => computeIsostaticAnomaly(data, isoModel, crustalDensity, mantleDensity), [data, isoModel, crustalDensity, mantleDensity]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Advanced Corrections</CardTitle>
        <CardDescription className="text-xs">Terrain, Tidal, and Isostatic corrections</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="terrain">
          <TabsList className="mb-3">
            <TabsTrigger value="terrain" className="text-xs">Terrain</TabsTrigger>
            <TabsTrigger value="tidal" className="text-xs">Tidal</TabsTrigger>
            <TabsTrigger value="isostatic" className="text-xs">Isostatic</TabsTrigger>
          </TabsList>

          <TabsContent value="terrain" className="space-y-3">
            <div className="flex gap-3 flex-wrap">
              <div className="space-y-1">
                <Label className="text-xs">Density (g/cm³)</Label>
                <Input type="number" value={density} onChange={e => setDensity(parseFloat(e.target.value) || 2.67)} className="h-8 w-28 text-xs" step="0.01" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max Neighbor Dist (km)</Label>
                <Input type="number" value={maxDist} onChange={e => setMaxDist(parseFloat(e.target.value) || 5)} className="h-8 w-28 text-xs" step="1" />
              </div>
            </div>
            <div className="overflow-x-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Station</TableHead>
                    <TableHead className="text-xs">TC (mGal)</TableHead>
                    <TableHead className="text-xs">Neighbors</TableHead>
                    <TableHead className="text-xs">Corrected BA (mGal)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terrain.map(t => (
                    <TableRow key={t.stationId}>
                      <TableCell className="text-xs font-medium">{t.stationId}</TableCell>
                      <TableCell className="text-xs">{t.terrainCorrection.toFixed(4)}</TableCell>
                      <TableCell className="text-xs">{t.neighborCount}</TableCell>
                      <TableCell className="text-xs">{t.correctedBouguer.toFixed(3)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="tidal" className="space-y-3">
            <div className="overflow-x-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Station</TableHead>
                    <TableHead className="text-xs">Date/Time</TableHead>
                    <TableHead className="text-xs">Tidal Corr (mGal)</TableHead>
                    <TableHead className="text-xs">Corrected g (mGal)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tidal.map(t => (
                    <TableRow key={t.stationId}>
                      <TableCell className="text-xs font-medium">{t.stationId}</TableCell>
                      <TableCell className="text-xs">{t.dateTime}</TableCell>
                      <TableCell className="text-xs">{t.tidalCorrection.toFixed(4)}</TableCell>
                      <TableCell className="text-xs">{t.correctedGravity.toFixed(3)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="isostatic" className="space-y-3">
            <div className="flex gap-3 flex-wrap">
              <div className="space-y-1">
                <Label className="text-xs">Model</Label>
                <Select value={isoModel} onValueChange={(v) => setIsoModel(v as 'airy' | 'pratt')}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airy">Airy</SelectItem>
                    <SelectItem value="pratt">Pratt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ρ crust (g/cm³)</Label>
                <Input type="number" value={crustalDensity} onChange={e => setCrustalDensity(parseFloat(e.target.value) || 2.67)} className="h-8 w-24 text-xs" step="0.01" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ρ mantle (g/cm³)</Label>
                <Input type="number" value={mantleDensity} onChange={e => setMantleDensity(parseFloat(e.target.value) || 3.3)} className="h-8 w-24 text-xs" step="0.01" />
              </div>
            </div>
            <div className="overflow-x-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Station</TableHead>
                    <TableHead className="text-xs">Root (km)</TableHead>
                    <TableHead className="text-xs">Iso Corr (mGal)</TableHead>
                    <TableHead className="text-xs">Iso Anomaly (mGal)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isostatic.map(r => (
                    <TableRow key={r.stationId}>
                      <TableCell className="text-xs font-medium">{r.stationId}</TableCell>
                      <TableCell className="text-xs">{r.rootDepth.toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{r.isostaticCorrection.toFixed(4)}</TableCell>
                      <TableCell className="text-xs">{r.isostaticAnomaly.toFixed(3)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CorrectionsPanel;
