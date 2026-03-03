import { supabase } from '@/integrations/supabase/client';
import type { RawStation, CalibrationTable } from './gravityCalculations';
import type { RawMagStation, MagProcessingParams } from './magneticCalculations';

export interface CloudProjectData {
  // Gravity
  stations?: RawStation[];
  calibration?: CalibrationTable[];
  knownAbsValue?: number;
  baseStationId?: string;
  density?: number;
  // Magnetic
  magStations?: RawMagStation[];
  magParams?: MagProcessingParams;
}

export async function saveCloudProject(
  projectId: string | null,
  name: string,
  dataMode: string,
  data: CloudProjectData,
  description = ''
) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const payload = {
    user_id: user.id,
    name,
    description,
    data_mode: dataMode,
    project_data: data as any,
    updated_at: new Date().toISOString(),
  };

  if (projectId) {
    const { error } = await supabase.from('projects').update(payload).eq('id', projectId);
    if (error) throw error;
    return projectId;
  } else {
    const { data: inserted, error } = await supabase.from('projects').insert(payload).select('id').single();
    if (error) throw error;
    return inserted.id;
  }
}

export async function loadCloudProject(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  if (error) throw error;
  return data;
}
