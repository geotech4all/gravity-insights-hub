import { supabase } from '@/integrations/supabase/client';

export async function logOrgAudit(
  orgId: string,
  action: string,
  opts: { targetEmail?: string; metadata?: Record<string, any> } = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('org_audit_logs').insert({
      org_id: orgId,
      actor_user_id: user.id,
      actor_email: user.email,
      action,
      target_email: opts.targetEmail ?? null,
      metadata: opts.metadata ?? {},
    } as any);
  } catch {
    // never block UX on audit failure
  }
}
