import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import GraviMagLogo from './GraviMagLogo';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, LayoutDashboard, User } from 'lucide-react';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
          <GraviMagLogo size={40} />
          <div>
            <h1 className="text-xl font-bold tracking-tight">GraviMag Cloud</h1>
            <p className="text-xs text-primary-foreground/70">by Geotech4All</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-medium text-primary-foreground">
            Phase 5
          </span>
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
