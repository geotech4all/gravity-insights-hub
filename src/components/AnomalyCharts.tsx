import { useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChartDownloadButton from '@/components/ChartDownloadButton';
import type { ProcessedStation } from '@/lib/gravityCalculations';

interface Props {
  data: ProcessedStation[];
}

const PRIMARY_RED = 'hsl(358, 78%, 51%)';
const DARK_NAVY = 'hsl(234, 45%, 14%)';
const ACCENT_BLUE = 'hsl(210, 70%, 50%)';
const MUTED_GRAY = 'hsl(220, 9%, 46%)';

const AnomalyCharts = ({ data }: Props) => {
  const displayData = data
    .filter(d => !d.remark?.toLowerCase().includes('close loop'))
    .map((d, i) => ({
      sn: i + 1,
      station: d.stationId,
      FAA: parseFloat(d.freeAirAnomaly.toFixed(3)),
      BA: parseFloat(d.bouguerAnomaly.toFixed(3)),
      height: d.height,
      gn: parseFloat(d.theoreticalGravity.toFixed(2)),
      absGrav: parseFloat(d.absoluteGravity.toFixed(2)),
      FAC: parseFloat(d.freeAirCorrection.toFixed(3)),
      BC: parseFloat(d.bouguerCorrection.toFixed(3)),
      drift: parseFloat(d.driftCorrection.toFixed(6)),
      lat: d.latitude,
    }));

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg text-xs">
        <p className="font-bold text-card-foreground mb-1">Station #{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.value} mGal
          </p>
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="profile">Anomaly Profiles</TabsTrigger>
        <TabsTrigger value="comparison">FAA vs BA</TabsTrigger>
        <TabsTrigger value="corrections">Corrections</TabsTrigger>
        <TabsTrigger value="elevation">Elevation Profile</TabsTrigger>
      </TabsList>

      {/* Anomaly Profile - Line Chart */}
      <TabsContent value="profile">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Free Air & Bouguer Anomaly Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={displayData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="faaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PRIMARY_RED} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={PRIMARY_RED} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="baGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT_BLUE} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ACCENT_BLUE} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 87%)" />
                <XAxis dataKey="sn" label={{ value: 'Station Number', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
                <YAxis label={{ value: 'Anomaly (mGal)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
                <Tooltip content={customTooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="FAA" stroke={PRIMARY_RED} fill="url(#faaGrad)" strokeWidth={2.5} dot={{ r: 3, fill: PRIMARY_RED }} name="Free Air Anomaly" />
                <Area type="monotone" dataKey="BA" stroke={ACCENT_BLUE} fill="url(#baGrad)" strokeWidth={2.5} dot={{ r: 3, fill: ACCENT_BLUE }} name="Bouguer Anomaly" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* FAA vs BA Comparison */}
      <TabsContent value="comparison">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">FAA vs BA Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={displayData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 87%)" />
                <XAxis dataKey="sn" label={{ value: 'Station Number', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
                <YAxis label={{ value: 'mGal', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
                <Tooltip content={customTooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="FAA" fill={PRIMARY_RED} name="Free Air Anomaly" radius={[2, 2, 0, 0]} />
                <Bar dataKey="BA" fill={ACCENT_BLUE} name="Bouguer Anomaly" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Corrections Chart */}
      <TabsContent value="corrections">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Applied Corrections per Station</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={displayData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 87%)" />
                <XAxis dataKey="sn" label={{ value: 'Station Number', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
                <YAxis label={{ value: 'mGal', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
                <Tooltip content={customTooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="FAC" stroke={PRIMARY_RED} strokeWidth={2} dot={{ r: 3 }} name="Free Air Correction" />
                <Line type="monotone" dataKey="BC" stroke={DARK_NAVY} strokeWidth={2} dot={{ r: 3 }} name="Bouguer Correction" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Elevation Profile */}
      <TabsContent value="elevation">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Elevation Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={displayData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={DARK_NAVY} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={DARK_NAVY} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 87%)" />
                <XAxis dataKey="sn" label={{ value: 'Station Number', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
                <YAxis label={{ value: 'Height (m)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="height" stroke={DARK_NAVY} fill="url(#elevGrad)" strokeWidth={2} dot={{ r: 3, fill: DARK_NAVY }} name="Elevation (m)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default AnomalyCharts;
