import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import type { ProcessedMagStation } from '@/lib/magneticCalculations';
import {
  computeReductionToPole, computeMagDerivatives, computeMagPowerSpectrum,
  computeMagContinuation, computeMagEulerDeconvolution, computeInclination,
} from '@/lib/magneticCalculations';

interface Props {
  data: ProcessedMagStation[];
  latitude?: number;
}

const MagneticAdvanced = ({ data, latitude = 7.5 }: Props) => {
  const [contHeight, setContHeight] = useState(1);
  const [eulerSI, setEulerSI] = useState(1);
  const [eulerWindow, setEulerWindow] = useState(7);

  const inclination = useMemo(() => computeInclination(latitude), [latitude]);

  const rtpData = useMemo(() => computeReductionToPole(data, inclination), [data, inclination]);
  const derivatives = useMemo(() => computeMagDerivatives(data), [data]);
  const spectrum = useMemo(() => computeMagPowerSpectrum(data), [data]);
  const continuation = useMemo(() => computeMagContinuation(data, contHeight), [data, contHeight]);
  const euler = useMemo(() => computeMagEulerDeconvolution(data, eulerSI, eulerWindow), [data, eulerSI, eulerWindow]);

  const customTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-card p-2 shadow-md text-xs">
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* RTP */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Reduction to Pole (RTP)</CardTitle>
          <CardDescription className="text-xs">
            Inclination: {inclination.toFixed(1)}° — Moves anomalies over their sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rtpData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={rtpData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="distance" tick={{ fontSize: 10 }} label={{ value: 'Distance (m)', position: 'bottom', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'nT', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip content={customTooltip} />
                <Legend />
                <Line type="monotone" dataKey="original" name="Original" stroke="hsl(var(--muted-foreground))" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="rtpValue" name="RTP" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Not enough data for RTP calculation</p>
          )}
        </CardContent>
      </Card>

      {/* Derivatives */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Derivative Filters & Analytic Signal</CardTitle>
          <CardDescription className="text-xs">Edge detection and source boundary mapping</CardDescription>
        </CardHeader>
        <CardContent>
          {derivatives.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={derivatives}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="distance" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={customTooltip} />
                  <Legend />
                  <Line type="monotone" dataKey="horizontalGradient" name="Horizontal Gradient" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={derivatives}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="distance" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={customTooltip} />
                  <Legend />
                  <Area type="monotone" dataKey="analyticSignal" name="Analytic Signal" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Not enough data</p>
          )}
        </CardContent>
      </Card>

      {/* Power Spectrum */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Power Spectrum Analysis</CardTitle>
          <CardDescription className="text-xs">
            Depth estimates — Shallow: {spectrum.depthEstimates.shallow.toFixed(2)} km | Deep: {spectrum.depthEstimates.deep.toFixed(2)} km
          </CardDescription>
        </CardHeader>
        <CardContent>
          {spectrum.spectrum.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spectrum.spectrum}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="wavenumber" tick={{ fontSize: 10 }} label={{ value: 'Wavenumber (rad/km)', position: 'bottom', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'ln(Power)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip content={customTooltip} />
                <Line type="monotone" dataKey="logPower" name="Log Power" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Not enough data</p>
          )}
        </CardContent>
      </Card>

      {/* Continuation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Upward/Downward Continuation</CardTitle>
              <CardDescription className="text-xs">Enhance deep or shallow magnetic sources</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Height (km):</Label>
              <Input
                type="number"
                value={contHeight}
                onChange={e => setContHeight(parseFloat(e.target.value) || 1)}
                className="h-7 w-20 text-xs"
                step="0.5"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {continuation.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={continuation}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="distance" tick={{ fontSize: 10 }} label={{ value: 'Distance (m)', position: 'bottom', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'nT', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip content={customTooltip} />
                <Legend />
                <Line type="monotone" dataKey="original" name="Original" stroke="hsl(var(--muted-foreground))" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="continued" name={`Continued (${contHeight} km)`} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Not enough data</p>
          )}
        </CardContent>
      </Card>

      {/* Euler Deconvolution */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Euler Deconvolution</CardTitle>
              <CardDescription className="text-xs">Automatic source depth estimation ({euler.length} solutions)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">SI:</Label>
              <Select value={String(eulerSI)} onValueChange={v => setEulerSI(Number(v))}>
                <SelectTrigger className="h-7 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (Contact)</SelectItem>
                  <SelectItem value="1">1 (Dike)</SelectItem>
                  <SelectItem value="2">2 (Cylinder)</SelectItem>
                  <SelectItem value="3">3 (Sphere)</SelectItem>
                </SelectContent>
              </Select>
              <Label className="text-xs">Window:</Label>
              <Input
                type="number"
                value={eulerWindow}
                onChange={e => setEulerWindow(parseInt(e.target.value) || 7)}
                className="h-7 w-16 text-xs"
                min={5}
                max={15}
                step={2}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {euler.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="windowCenter" name="Position" tick={{ fontSize: 10 }} label={{ value: 'Position (km)', position: 'bottom', fontSize: 11 }} />
                <YAxis dataKey="z0" name="Depth" reversed tick={{ fontSize: 10 }} label={{ value: 'Depth (km)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip content={customTooltip} />
                <Scatter name="Source Depths" data={euler} fill="hsl(var(--primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No valid Euler solutions found. Try adjusting SI or window size.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MagneticAdvanced;
