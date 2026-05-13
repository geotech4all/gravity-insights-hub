import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquarePlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const Stars = ({ value, onChange, size = 16 }: { value: number; onChange?: (v: number) => void; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        type={onChange ? 'button' : undefined}
        onClick={onChange ? () => onChange(n) : undefined}
        className={onChange ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
        disabled={!onChange}
        aria-label={onChange ? `Rate ${n} star${n > 1 ? 's' : ''}` : undefined}
      >
        <Star
          width={size}
          height={size}
          className={n <= value ? 'fill-primary text-primary' : 'text-muted-foreground/40'}
        />
      </button>
    ))}
  </div>
);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 1) return 'Today';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

const ReviewSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('id,user_name,rating,comment,created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(9);
    if (!error && data) setReviews(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleOpen = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const trimmed = comment.trim();
    if (trimmed.length < 10) {
      toast({ title: 'Review too short', description: 'Please write at least 10 characters.', variant: 'destructive' });
      return;
    }
    if (trimmed.length > 1000) {
      toast({ title: 'Review too long', description: 'Please keep it under 1000 characters.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const userName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split('@')[0] ||
      'Anonymous';
    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      user_name: userName,
      rating,
      comment: trimmed,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Could not submit review', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Thank you!', description: 'Your review will appear once approved.' });
    setOpen(false);
    setComment('');
    setRating(5);
  };

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section id="reviews" className="container mx-auto px-4 py-24">
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary mb-4">Reviews</Badge>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          What geoscientists are saying
        </h2>
        {avg && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Stars value={Math.round(Number(avg))} size={20} />
            <span className="text-foreground font-semibold">{avg}</span>
            <span className="text-muted-foreground text-sm">· {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="text-center text-muted-foreground mb-8">
          Be the first to share your experience.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto mb-10">
          {reviews.map(r => (
            <Card key={r.id} className="border-border/60">
              <CardContent className="pt-6 pb-6 space-y-3">
                <Stars value={r.rating} />
                <p className="text-sm text-foreground/85 leading-relaxed">"{r.comment}"</p>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-sm font-semibold text-foreground">{r.user_name}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-center">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" onClick={handleOpen} className="gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              Write a Review
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share your experience</DialogTitle>
              <DialogDescription>
                Your review helps other geoscientists discover GraviMag Cloud. It will appear publicly after a quick review.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Rating</label>
                <Stars value={rating} onChange={setRating} size={28} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Your review</label>
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="What do you love? What could be better?"
                  rows={5}
                  maxLength={1000}
                />
                <div className="text-xs text-muted-foreground text-right">{comment.length}/1000</div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Review'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default ReviewSection;
