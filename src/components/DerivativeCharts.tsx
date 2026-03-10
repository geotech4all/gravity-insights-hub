import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import ChartDownloadButton from '@/components/ChartDownloadButton';
import type { ProcessedStation } from '@/lib/gravityCalculations';
import { computeDerivatives } from '@/lib/interpretationCalculations';

interface Props {
  data: ProcessedStation[];
}

const DerivativeCharts = ({ data }: Props) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [anomalyType, setAnomalyType] = useState<'freeAirAnomaly' | 'bouguerAnomaly'>('bouguerAnomaly');

  const results = useMemo(
    () => computeDerivatives(data, anomalyType),
    [data, anomalyType]
  );

  const chartData = results.map(r => ({
    station: r.stationId,
    distance: parseFloat(r.distance.toFixed(2)),
    horizontal: parseFloat(r.horizontalGradient.toFixed(4)),
    vertical: parseFloat(r.verticalGradient.toFixed(4)),
    analytic: parseFloat(r.analyticSignal.toFixed(4)),
  }));

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Derivative Filters & Edge Detection</CardTitle>
          <CardDescription className="text-xs">
            Horizontal/vertical gradients and analytic signal for structural mapping
          </CardDescription>
        </div>
        <ChartDownloadButton containerRef={chartRef} filename="derivatives" />
      </CardHeader>
      <CardContent className="space-y-4" ref={chartRef}>
        <Tabs value={anomalyType} onValueChange={(v) => setAnomalyType(v as typeof anomalyType)}>
          <TabsList className="h-8">
            <TabsTrigger value="bouguerAnomaly" className="text-xs">Bouguer Anomaly</TabsTrigger>
            <TabsTrigger value="freeAirAnomaly" className="text-xs">Free Air Anomaly</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Horizontal Gradient */}
        <div className="h-[220px]">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Horizontal Gradient (mGal/km)</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="distance" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="horizontal" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} name="dg/dx" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Vertical Gradient */}
        <div className="h-[220px]">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Vertical Gradient (mGal/km²)</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="distance" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="vertical" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 2 }} name="d²g/dz²" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Analytic Signal */}
        <div className="h-[220px]">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Analytic Signal Amplitude</p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="distance" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="analytic" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} name="|AS|" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DerivativeCharts;
