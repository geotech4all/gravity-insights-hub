import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveOrg } from '@/hooks/useActiveOrg';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, LayoutDashboard, Shield, User, Building2, GraduationCap, Check, ChevronDown } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { orgs, activeOrg, setActiveOrgId } = useActiveOrg();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle()
        .then(({ data }) => setIsAdmin(!!data));
    }
  }, [user]);

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || '?';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div>
            <h1 className="text-xl font-bold tracking-tight">GraviMag Cloud</h1>
            <p className="text-xs text-primary-foreground/70">by Geotech4All</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user && orgs.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary-foreground hover:bg-primary-foreground/20 max-w-[200px]">
                  {activeOrg?.type === 'institution'
                    ? <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                    : <Building2 className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate text-xs font-medium">{activeOrg?.name || 'Select org'}</span>
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Switch organization</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {orgs.map(o => (
                  <DropdownMenuItem
                    key={o.id}
                    onClick={() => setActiveOrgId(o.id)}
                    className="gap-2 cursor-pointer"
                  >
                    {o.type === 'institution'
                      ? <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                      : <Building2 className="h-3.5 w-3.5 text-muted-foreground" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{o.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{o.role} · {o.tier}</p>
                    </div>
                    {o.id === activeOrg?.id && <Check className="h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/organization')} className="gap-2 cursor-pointer text-xs">
                  <Building2 className="h-3.5 w-3.5" /> Manage organization
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {user && <NotificationBell />}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:bg-primary-foreground/20">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || user.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/')} className="gap-2 cursor-pointer">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2 cursor-pointer">
                  <User className="h-3.5 w-3.5" /> Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/organization')} className="gap-2 cursor-pointer">
                  <Building2 className="h-3.5 w-3.5" /> Organization
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2 cursor-pointer">
                    <Shield className="h-3.5 w-3.5" /> Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-destructive">
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
