import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import type { ProcessedMagStation } from '@/lib/magneticCalculations';

interface Props {
  data: ProcessedMagStation[];
}

const MagneticCharts = ({ data }: Props) => {
  const chartData = useMemo(() => data.map(s => ({
    distance: s.distance,
    sn: s.sn,
    totalField: s.averageNT,
    anomaly: s.totalAnomaly,
    reducedValue: s.reducedValue,
    drift: s.driftCorrection,
    diurnal: s.diurnalCorrection,
    regional: s.regionalField,
  })), [data]);

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-card p-2 shadow-md text-xs">
        <p className="font-semibold text-foreground">Distance: {label} m</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="anomaly" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="anomaly">Anomaly Profile</TabsTrigger>
        <TabsTrigger value="field">Total Field</TabsTrigger>
        <TabsTrigger value="corrections">Corrections</TabsTrigger>
      </TabsList>

      <TabsContent value="anomaly">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Magnetic Anomaly Profile</CardTitle>
            <CardDescription className="text-xs">Total anomaly and reduced values along profile</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="magAnomalyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="distance" tick={{ fontSize: 10 }} label={{ value: 'Distance (m)', position: 'bottom', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'nT', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip content={customTooltip} />
                <Legend />
                <Area type="monotone" dataKey="anomaly" name="Total Anomaly" stroke="hsl(var(--primary))" fill="url(#magAnomalyGrad)" strokeWidth={2} />
                <Line type="monotone" dataKey="reducedValue" name="Reduced Value" stroke="hsl(var(--accent-foreground))" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="field">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Total Magnetic Field</CardTitle>
            <CardDescription className="text-xs">Raw field readings along profile</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="distance" tick={{ fontSize: 10 }} label={{ value: 'Distance (m)', position: 'bottom', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} label={{ value: 'nT', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip content={customTooltip} />
                <Legend />
                <Line type="monotone" dataKey="totalField" name="Total Field (nT)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="corrections">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Applied Corrections</CardTitle>
            <CardDescription className="text-xs">Drift and diurnal corrections along profile</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="distance" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'nT', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip content={customTooltip} />
                <Legend />
                <Bar dataKey="drift" name="Drift Correction" fill="hsl(var(--primary))" opacity={0.7} />
                <Bar dataKey="diurnal" name="Diurnal Correction" fill="hsl(var(--accent))" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default MagneticCharts;
