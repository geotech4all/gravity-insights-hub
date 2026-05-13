import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useActiveOrg } from './useActiveOrg';

export type SubscriptionTier = 'free' | 'standard' | 'enterprise' | 'academic';

interface SubscriptionInfo {
  tier: SubscriptionTier;
  projectCount: number;
  projectLimit: number;
  memberCount: number;
  memberLimit: number;
  canCreateProject: boolean;
  canAddMember: boolean;
  source: 'organization' | 'personal';
  loading: boolean;
  refresh: () => Promise<void>;
}

const PROJECT_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  standard: 50,
  academic: 50,
  enterprise: 999999,
};

const SEAT_LIMITS: Record<SubscriptionTier, number> = {
  free: 3,
  standard: 15,
  academic: 999999,
  enterprise: 999999,
};

export const useSubscription = (): SubscriptionInfo => {
  const { user } = useAuth();
  const { activeOrg, activeOrgId } = useActiveOrg();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [projectCount, setProjectCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    if (activeOrgId && activeOrg) {
      // Org-scoped tier and counts
      const t = (activeOrg.tier as SubscriptionTier) || 'free';
      setTier(t);
      const [projRes, memRes] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('org_id', activeOrgId),
        supabase.from('organization_members').select('id', { count: 'exact', head: true }).eq('org_id', activeOrgId),
      ]);
      setProjectCount(projRes.count || 0);
      setMemberCount(memRes.count || 0);
    } else {
      // Fallback: legacy personal profile tier
      const [profileRes, countRes] = await Promise.all([
        supabase.from('profiles').select('subscription_tier').eq('user_id', user.id).single(),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      const t = ((profileRes.data as any)?.subscription_tier as SubscriptionTier) || 'free';
      setTier(t);
      setProjectCount(countRes.count || 0);
      setMemberCount(1);
    }
    setLoading(false);
  }, [user, activeOrgId, activeOrg]);

  useEffect(() => { fetch(); }, [fetch]);

  const projectLimit = PROJECT_LIMITS[tier] ?? 5;
  const memberLimit = SEAT_LIMITS[tier] ?? 3;

  return {
    tier,
    projectCount,
    projectLimit,
    memberCount,
    memberLimit,
    canCreateProject: projectCount < projectLimit,
    canAddMember: memberCount < memberLimit,
    source: activeOrgId ? 'organization' : 'personal',
    loading,
    refresh: fetch,
  };
};
