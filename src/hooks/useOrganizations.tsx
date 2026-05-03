import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type OrgRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type OrgType = 'company' | 'institution';
export type OrgTier = 'free' | 'standard' | 'enterprise' | 'academic';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: OrgType;
  tier: OrgTier;
  country: string | null;
  email_domain: string | null;
  verified: boolean;
  logo_url: string | null;
  created_by: string;
  created_at: string;
}

export interface OrgMembership extends Organization {
  role: OrgRole;
}

export const useOrganizations = () => {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<OrgMembership[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) {
      setOrgs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('organization_members')
      .select('role, organizations(*)')
      .eq('user_id', user.id);

    if (!error && data) {
      const mapped = data
        .filter((r: any) => r.organizations)
        .map((r: any) => ({ ...r.organizations, role: r.role as OrgRole })) as OrgMembership[];
      setOrgs(mapped);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { orgs, loading, refresh: fetch };
};
