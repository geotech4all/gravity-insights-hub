import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizations, type OrgRole, type OrgMembership } from '@/hooks/useOrganizations';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Users, Mail, Settings, Trash2, Copy, Plus, Crown, Shield, Pencil, Eye, GraduationCap, Building2, Upload, ScrollText } from 'lucide-react';
import { logOrgAudit } from '@/lib/orgAudit';

const ROLE_META: Record<OrgRole, { label: string; icon: any; className: string }> = {
  owner:  { label: 'Owner',  icon: Crown,  className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  admin:  { label: 'Admin',  icon: Shield, className: 'bg-primary/10 text-primary border-primary/30' },
  editor: { label: 'Editor', icon: Pencil, className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  viewer: { label: 'Viewer', icon: Eye,    className: 'bg-muted text-muted-foreground border-border' },
};

const TIER_LABEL: Record<string, string> = {
  free: 'Free', standard: 'Standard', enterprise: 'Enterprise', academic: 'Academic (Free Unlimited)',
};

interface Member {
  id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface Invite {
  id: string;
  email: string;
  role: OrgRole;
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

interface AuditEntry {
  id: string;
  actor_email: string | null;
  action: string;
  target_email: string | null;
  metadata: any;
  created_at: string;
}

const OrganizationDashboard = () => {
  const { orgId: paramOrgId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orgs, loading: orgsLoading, refresh: refreshOrgs } = useOrganizations();

  // Pick the active org: from URL, else the first one the user belongs to
  const activeOrg: OrgMembership | undefined =
    (paramOrgId && orgs.find(o => o.id === paramOrgId)) || orgs[0];

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Settings form
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [orgCountry, setOrgCountry] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Invite form
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('viewer');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Remove confirmation
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const isAdmin = activeOrg && ['owner', 'admin'].includes(activeOrg.role);
  const isOwner = activeOrg?.role === 'owner';

  const loadData = useCallback(async () => {
    if (!activeOrg) return;
    setLoadingData(true);

    // Members + their profile data (two queries — RLS allows reading profiles for self only,
    // but we fetch profiles for all org members via a separate query that we control client-side)
    const [membersRes, invitesRes, auditRes] = await Promise.all([
      supabase.from('organization_members')
        .select('id, user_id, role, created_at')
        .eq('org_id', activeOrg.id)
        .order('created_at', { ascending: true }),
      supabase.from('organization_invites')
        .select('id, email, role, token, expires_at, created_at, accepted_at')
        .eq('org_id', activeOrg.id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false }),
      supabase.from('org_audit_logs' as any)
        .select('id, actor_email, action, target_email, metadata, created_at')
        .eq('org_id', activeOrg.id)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    if (membersRes.data) {
      const userIds = membersRes.data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setMembers(membersRes.data.map(m => ({
        ...m,
        role: m.role as OrgRole,
        display_name: profileMap.get(m.user_id)?.display_name ?? null,
        avatar_url: profileMap.get(m.user_id)?.avatar_url ?? null,
        email: null,
      })));
    }
    if (invitesRes.data) setInvites(invitesRes.data as Invite[]);
    if (auditRes.data) setAuditLogs(auditRes.data as unknown as AuditEntry[]);

    setLoadingData(false);
  }, [activeOrg]);

  useEffect(() => {
    if (activeOrg) {
      setOrgName(activeOrg.name);
      setOrgSlug(activeOrg.slug);
      setOrgCountry(activeOrg.country || '');
      loadData();
    }
  }, [activeOrg, loadData]);

  if (orgsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-8 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!activeOrg) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-8">
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <Users className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-foreground font-medium">You don't belong to any organization yet.</p>
              <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSaveSettings = async () => {
    if (!isAdmin) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from('organizations')
      .update({
        name: orgName.trim(),
        slug: orgSlug.trim(),
        country: orgCountry.trim() || null,
      })
      .eq('id', activeOrg.id);
    setSavingSettings(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Organization updated');
      refreshOrgs();
    }
  };

  const handleSendInvite = async () => {
    if (!isAdmin) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email');
      return;
    }
    setSendingInvite(true);
    const { error } = await supabase.from('organization_invites').insert({
      org_id: activeOrg.id,
      email,
      role: inviteRole,
      invited_by: user.id,
    });
    setSendingInvite(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Invite created for ${email}`);
      setInviteEmail('');
      setInviteRole('viewer');
      setInviteOpen(false);
      loadData();
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied');
  };

  const handleRevokeInvite = async (id: string) => {
    const { error } = await supabase.from('organization_invites').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Invite revoked'); loadData(); }
  };

  const handleChangeRole = async (memberId: string, newRole: OrgRole) => {
    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId);
    if (error) toast.error(error.message);
    else { toast.success('Role updated'); loadData(); }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberToRemove.id);
    if (error) toast.error(error.message);
    else { toast.success('Member removed'); loadData(); }
    setMemberToRemove(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl space-y-6">
        {/* Header card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              {activeOrg.type === 'institution'
                ? <GraduationCap className="h-7 w-7 text-primary" />
                : <Building2 className="h-7 w-7 text-primary" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{activeOrg.name}</h1>
                {activeOrg.verified && (
                  <Badge className="bg-primary/10 text-primary border-primary/30 border">Verified</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="capitalize">{activeOrg.type}</span>
                <span>·</span>
                <span>{TIER_LABEL[activeOrg.tier] || activeOrg.tier}</span>
                <span>·</span>
                <span>{members.length} member{members.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Org switcher (if more than one) */}
        {orgs.length > 1 && (
          <Card className="border-border/60">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <span className="text-xs text-muted-foreground shrink-0">Switch organization:</span>
              <Select value={activeOrg.id} onValueChange={(v) => navigate(`/organization/${v}`)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {orgs.map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name} <span className="text-muted-foreground text-xs ml-1">({o.role})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Members</TabsTrigger>
            <TabsTrigger value="invites" className="gap-1.5"><Mail className="h-3.5 w-3.5" /> Invites</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-3.5 w-3.5" /> Settings</TabsTrigger>
          </TabsList>

          {/* MEMBERS */}
          <TabsContent value="members">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Team members</CardTitle>
                  <CardDescription>
                    {(() => {
                      const limit = activeOrg.tier === 'free' ? 3 : activeOrg.tier === 'standard' ? 15 : null;
                      return limit
                        ? `${members.length} of ${limit} seats used on the ${TIER_LABEL[activeOrg.tier] || activeOrg.tier} plan`
                        : `Unlimited seats on the ${TIER_LABEL[activeOrg.tier] || activeOrg.tier} plan`;
                    })()}
                  </CardDescription>
                </div>
                {isAdmin && (() => {
                  const limit = activeOrg.tier === 'free' ? 3 : activeOrg.tier === 'standard' ? 15 : Infinity;
                  const full = members.length >= limit;
                  return (
                    <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-1.5" disabled={full} title={full ? 'Seat limit reached — upgrade to invite more' : undefined}>
                      <Plus className="h-3.5 w-3.5" /> Invite
                    </Button>
                  );
                })()}
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingData && <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>}
                {!loadingData && members.map(m => {
                  const meta = ROLE_META[m.role];
                  const Icon = meta.icon;
                  const isMe = m.user_id === user.id;
                  const canEdit = isAdmin && !isMe && m.role !== 'owner';
                  const initials = (m.display_name || '?').slice(0, 2).toUpperCase();

                  return (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={m.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {m.display_name || 'Unnamed user'}
                          {isMe && <span className="text-xs text-muted-foreground ml-2">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(m.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {canEdit ? (
                        <Select value={m.role} onValueChange={(v) => handleChangeRole(m.id, v as OrgRole)}>
                          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(['admin', 'editor', 'viewer'] as OrgRole[]).map(r => (
                              <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                            ))}
                            {isOwner && <SelectItem value="owner">Owner</SelectItem>}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={`gap-1 ${meta.className}`}>
                          <Icon className="h-3 w-3" /> {meta.label}
                        </Badge>
                      )}
                      {canEdit && (
                        <Button size="icon" variant="ghost" onClick={() => setMemberToRemove(m)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                {!loadingData && members.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">No members yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* INVITES */}
          <TabsContent value="invites">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Pending invites</CardTitle>
                  <CardDescription>Invites that haven't been accepted yet</CardDescription>
                </div>
                {isAdmin && (
                  <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> New invite
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {!isAdmin && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Only admins and owners can manage invites.
                  </p>
                )}
                {isAdmin && invites.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">No pending invites.</p>
                )}
                {isAdmin && invites.map(inv => {
                  const expired = new Date(inv.expires_at) < new Date();
                  const meta = ROLE_META[inv.role];
                  return (
                    <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {expired
                            ? <span className="text-destructive">Expired</span>
                            : <>Expires {new Date(inv.expires_at).toLocaleDateString()}</>}
                        </p>
                      </div>
                      <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                      <Button size="icon" variant="ghost" onClick={() => handleCopyInviteLink(inv.token)} className="h-8 w-8">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleRevokeInvite(inv.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Organization settings</CardTitle>
                <CardDescription>
                  {isAdmin ? 'Update your organization details.' : 'Only admins can edit these settings.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Name</Label>
                  <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} disabled={!isAdmin} maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-slug">Slug</Label>
                  <Input id="org-slug" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} disabled={!isAdmin} maxLength={60} />
                  <p className="text-xs text-muted-foreground">Used in URLs and identifiers. Lowercase letters, numbers and dashes only.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-country">Country</Label>
                  <Input id="org-country" value={orgCountry} onChange={(e) => setOrgCountry(e.target.value)} disabled={!isAdmin} placeholder="e.g. Nigeria" maxLength={80} />
                </div>
                {activeOrg.type === 'institution' && activeOrg.email_domain && (
                  <div className="space-y-2">
                    <Label>Email domain</Label>
                    <Input value={activeOrg.email_domain} disabled />
                    <p className="text-xs text-muted-foreground">Auto-detected from academic email. Cannot be changed.</p>
                  </div>
                )}
                <div className="pt-2 flex items-center gap-2">
                  <Button onClick={handleSaveSettings} disabled={!isAdmin || savingSettings || !orgName.trim() || !orgSlug.trim()}>
                    {savingSettings ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-email">Email</Label>
              <Input id="inv-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@example.com" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-role">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as OrgRole)}>
                <SelectTrigger id="inv-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer — read-only access</SelectItem>
                  <SelectItem value="editor">Editor — create & edit projects</SelectItem>
                  <SelectItem value="admin">Admin — manage members & settings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              We'll create an invite link valid for 7 days. You can copy and share it from the Invites tab.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleSendInvite} disabled={sendingInvite}>
              {sendingInvite ? 'Creating…' : 'Create invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove member confirm */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(o) => !o && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {memberToRemove?.display_name || 'this member'}?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll lose access to this organization's projects immediately. They can be re-invited later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrganizationDashboard;
