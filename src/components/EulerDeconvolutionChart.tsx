import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import type { ProcessedStation } from '@/lib/gravityCalculations';
import { computeEulerDeconvolution } from '@/lib/advancedCalculations';

const EulerDeconvolutionChart = ({ data }: { data: ProcessedStation[] }) => {
  const [si, setSI] = useState(1);
  const [windowSize, setWindowSize] = useState(7);
  const [anomalyType, setAnomalyType] = useState<'bouguerAnomaly' | 'freeAirAnomaly'>('bouguerAnomaly');

  const results = computeEulerDeconvolution(data, si, windowSize, anomalyType);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Euler Deconvolution (2D Profile)</CardTitle>
        <CardDescription className="text-xs">
          Automatic source depth estimation — SI={si} ({si === 0 ? 'Contact' : si === 1 ? 'Dike/Sill' : si === 2 ? 'Cylinder' : 'Sphere'})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">Structural Index</Label>
            <Select value={String(si)} onValueChange={(v) => setSI(Number(v))}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — Contact</SelectItem>
                <SelectItem value="1">1 — Dike/Sill</SelectItem>
                <SelectItem value="2">2 — Cylinder</SelectItem>
                <SelectItem value="3">3 — Sphere</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Anomaly</Label>
            <Select value={anomalyType} onValueChange={(v) => setAnomalyType(v as any)}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bouguerAnomaly">Bouguer</SelectItem>
                <SelectItem value="freeAirAnomaly">Free Air</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[180px] space-y-1">
            <Label className="text-xs">Window: {windowSize} stations</Label>
            <Slider
              value={[windowSize]}
              onValueChange={([v]) => setWindowSize(v)}
              min={5}
              max={15}
              step={2}
              className="w-full"
            />
          </div>
        </div>

        {results.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="x0"
                  name="Position"
                  label={{ value: 'Position (km)', position: 'insideBottom', offset: -5 }}
                  tick={{ fontSize: 10 }}
                  type="number"
                />
                <YAxis
                  dataKey="z0"
                  name="Depth"
                  label={{ value: 'Depth (km)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 10 }}
                  reversed
                  type="number"
                />
                <ZAxis dataKey="fitError" range={[20, 200]} name="Error %" />
                <Tooltip
                  contentStyle={{ fontSize: 11 }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)} ${name === 'Depth' ? 'km' : name === 'Position' ? 'km' : '%'}`,
                    name,
                  ]}
                />
                <Scatter data={results} fill="hsl(var(--primary))" />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center">
              {results.length} valid solutions found — depths range {Math.min(...results.map(r => r.z0)).toFixed(1)}–{Math.max(...results.map(r => r.z0)).toFixed(1)} km
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No valid Euler solutions found. Try adjusting the structural index or window size.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EulerDeconvolutionChart;
