import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Zap, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const TIER_COLORS: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  standard: 'bg-primary/10 text-primary',
  enterprise: 'bg-amber-500/10 text-amber-600',
};

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  standard: 'Standard',
  enterprise: 'Enterprise',
};

export default function SubscriptionBanner() {
  const { tier, projectCount, projectLimit, canCreateProject, loading } = useSubscription();

  if (loading || tier === 'enterprise') return null;

  const pct = Math.min((projectCount / projectLimit) * 100, 100);
  const isNearLimit = projectCount >= projectLimit - 1;

  return (
    <Card className={`border ${isNearLimit ? 'border-destructive/40' : 'border-border'}`}>
      <CardContent className="pt-4 pb-3 flex items-center gap-4">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge className={TIER_COLORS[tier]}>{TIER_LABELS[tier]} Plan</Badge>
            <span className="text-xs text-muted-foreground">
              {projectCount} / {projectLimit} projects
            </span>
            {!canCreateProject && (
              <span className="flex items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="h-3 w-3" /> Limit reached
              </span>
            )}
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 shrink-0"
          onClick={() => toast.info('Subscription upgrade coming soon! Contact support@geotech4all.com')}
        >
          {tier === 'free' ? <Zap className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5" />}
          Upgrade
        </Button>
      </CardContent>
    </Card>
  );
}
