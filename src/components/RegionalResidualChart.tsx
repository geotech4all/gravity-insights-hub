import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart
} from 'recharts';
import ChartDownloadButton from '@/components/ChartDownloadButton';
import type { ProcessedStation } from '@/lib/gravityCalculations';
import { computeRegionalResidual } from '@/lib/interpretationCalculations';

interface Props {
  data: ProcessedStation[];
}

const RegionalResidualChart = ({ data }: Props) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [degree, setDegree] = useState(2);
  const [anomalyType, setAnomalyType] = useState<'freeAirAnomaly' | 'bouguerAnomaly'>('bouguerAnomaly');

  const results = useMemo(
    () => computeRegionalResidual(data, anomalyType, degree),
    [data, anomalyType, degree]
  );

  const chartData = results.map(r => ({
    station: r.stationId,
    distance: parseFloat(r.distance.toFixed(2)),
    observed: parseFloat(r.observed.toFixed(3)),
    regional: parseFloat(r.regional.toFixed(3)),
    residual: parseFloat(r.residual.toFixed(3)),
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Regional-Residual Separation</CardTitle>
        <CardDescription className="text-xs">
          Polynomial trend fitting (degree {degree}) to separate regional from residual anomalies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-6">
          <Tabs value={anomalyType} onValueChange={(v) => setAnomalyType(v as typeof anomalyType)}>
            <TabsList className="h-8">
              <TabsTrigger value="bouguerAnomaly" className="text-xs">Bouguer Anomaly</TabsTrigger>
              <TabsTrigger value="freeAirAnomaly" className="text-xs">Free Air Anomaly</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-3 min-w-[200px]">
            <Label className="text-xs whitespace-nowrap">Degree: {degree}</Label>
            <Slider
              value={[degree]}
              onValueChange={([v]) => setDegree(v)}
              min={1}
              max={6}
              step={1}
              className="w-32"
            />
          </div>
        </div>

        {/* Observed + Regional */}
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="distance" label={{ value: 'Distance (km)', position: 'insideBottom', offset: -2, style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
              <YAxis label={{ value: 'mGal', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="observed" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Observed" />
              <Line type="monotone" dataKey="regional" stroke="hsl(var(--accent-foreground))" strokeWidth={2} strokeDasharray="8 4" dot={false} name={`Regional (deg ${degree})`} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Residual */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="distance" label={{ value: 'Distance (km)', position: 'insideBottom', offset: -2, style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
              <YAxis label={{ value: 'Residual (mGal)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="residual" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={1.5} name="Residual" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegionalResidualChart;
