import { supabase } from '@/integrations/supabase/client';

export async function logActivity(action: string, metadata: Record<string, any> = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('user_activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action,
      metadata,
    } as any);
  } catch {
    // Silent fail — analytics should never block UX
  }
}
