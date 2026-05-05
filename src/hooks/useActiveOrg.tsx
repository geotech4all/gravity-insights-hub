import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import { useOrganizations, type OrgMembership } from './useOrganizations';

const STORAGE_KEY = 'gravimag.activeOrgId';

interface ActiveOrgCtx {
  orgs: OrgMembership[];
  activeOrg: OrgMembership | null;
  activeOrgId: string | null;
  setActiveOrgId: (id: string) => void;
  loading: boolean;
  refresh: () => void;
}

const Ctx = createContext<ActiveOrgCtx | null>(null);

export const ActiveOrgProvider = ({ children }: { children: ReactNode }) => {
  const { orgs, loading, refresh } = useOrganizations();
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );

  // Auto-pick a default when orgs load / change
  useEffect(() => {
    if (loading) return;
    if (orgs.length === 0) {
      setActiveOrgIdState(null);
      return;
    }
    const stillValid = activeOrgId && orgs.some(o => o.id === activeOrgId);
    if (!stillValid) {
      // Prefer a personal workspace, else first
      const personal = orgs.find(o => o.type === 'company' && o.role === 'owner');
      const next = (personal || orgs[0]).id;
      setActiveOrgIdState(next);
      localStorage.setItem(STORAGE_KEY, next);
    }
  }, [orgs, loading, activeOrgId]);

  const setActiveOrgId = useCallback((id: string) => {
    setActiveOrgIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const activeOrg = useMemo(
    () => orgs.find(o => o.id === activeOrgId) || null,
    [orgs, activeOrgId]
  );

  return (
    <Ctx.Provider value={{ orgs, activeOrg, activeOrgId, setActiveOrgId, loading, refresh }}>
      {children}
    </Ctx.Provider>
  );
};

export const useActiveOrg = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useActiveOrg must be used within ActiveOrgProvider');
  return ctx;
};
