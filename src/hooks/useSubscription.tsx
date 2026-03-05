import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SubscriptionTier = 'free' | 'standard' | 'enterprise';

interface SubscriptionInfo {
  tier: SubscriptionTier;
  projectCount: number;
  projectLimit: number;
  canCreateProject: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  standard: 50,
  enterprise: 999999,
};

export const useSubscription = (): SubscriptionInfo => {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [projectCount, setProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!user) return;
    setLoading(true);
    const [profileRes, countRes] = await Promise.all([
      supabase.from('profiles').select('subscription_tier').eq('user_id', user.id).single(),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);
    const t = (profileRes.data as any)?.subscription_tier as SubscriptionTier || 'free';
    setTier(t);
    setProjectCount(countRes.count || 0);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  const limit = TIER_LIMITS[tier];

  return {
    tier,
    projectCount,
    projectLimit: limit,
    canCreateProject: projectCount < limit,
    loading,
    refresh: fetch,
  };
};
