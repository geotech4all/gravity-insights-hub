import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import ChartDownloadButton from '@/components/ChartDownloadButton';
import type { ProcessedStation } from '@/lib/gravityCalculations';
import { computePowerSpectrum } from '@/lib/interpretationCalculations';

interface Props {
  data: ProcessedStation[];
}

const PowerSpectrumChart = ({ data }: Props) => {
  const [anomalyType, setAnomalyType] = useState<'freeAirAnomaly' | 'bouguerAnomaly'>('bouguerAnomaly');

  const { spectrum, depthEstimates } = useMemo(
    () => computePowerSpectrum(data, anomalyType),
    [data, anomalyType]
  );

  const chartData = spectrum
    .filter(s => isFinite(s.logPower) && s.logPower > -Infinity)
    .map(s => ({
      wavenumber: parseFloat(s.wavenumber.toFixed(4)),
      logPower: parseFloat(s.logPower.toFixed(3)),
      frequency: parseFloat(s.frequency.toFixed(4)),
    }));

  const midWavenumber = chartData.length > 0
    ? chartData[Math.floor(chartData.length / 2)]?.wavenumber || 0
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Power Spectrum Analysis</CardTitle>
        <CardDescription className="text-xs">
          Radially-averaged power spectrum for depth-to-source estimation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Tabs value={anomalyType} onValueChange={(v) => setAnomalyType(v as typeof anomalyType)}>
            <TabsList className="h-8">
              <TabsTrigger value="bouguerAnomaly" className="text-xs">Bouguer Anomaly</TabsTrigger>
              <TabsTrigger value="freeAirAnomaly" className="text-xs">Free Air Anomaly</TabsTrigger>
            </TabsList>
          </Tabs>

          {depthEstimates.deep > 0 && (
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                Deep Source: ~{depthEstimates.deep.toFixed(1)} km
              </Badge>
              <Badge variant="outline" className="text-xs">
                Shallow Source: ~{depthEstimates.shallow.toFixed(1)} km
              </Badge>
            </div>
          )}
        </div>

        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="wavenumber"
                type="number"
                name="Wavenumber"
                label={{ value: 'Wavenumber (rad/km)', position: 'insideBottom', offset: -10, style: { fontSize: 11 } }}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                dataKey="logPower"
                type="number"
                name="ln(Power)"
                label={{ value: 'ln(Power)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                formatter={(value: number, name: string) => [value.toFixed(3), name]}
              />
              {midWavenumber > 0 && (
                <ReferenceLine
                  x={midWavenumber}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  label={{ value: 'Deep ← → Shallow', position: 'top', style: { fontSize: 9, fill: 'hsl(var(--muted-foreground))' } }}
                />
              )}
              <Scatter data={chartData} fill="hsl(var(--primary))" r={4} name="Power Spectrum" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
          <p><strong>Method:</strong> DFT with Hanning window applied to detrended anomaly profile.</p>
          <p><strong>Depth Estimation:</strong> Slope of ln(Power) vs. wavenumber; depth = -slope / 4π.</p>
          <p>Deep sources dominate low wavenumbers (left); shallow sources dominate high wavenumbers (right).</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PowerSpectrumChart;
