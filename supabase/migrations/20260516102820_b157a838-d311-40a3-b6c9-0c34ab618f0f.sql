
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS context text NOT NULL DEFAULT 'gravimagcloud';
CREATE INDEX IF NOT EXISTS idx_reviews_context_approved ON public.reviews (context, approved, created_at DESC);

DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
CREATE POLICY "Anyone can submit a review"
  ON public.reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND approved = false
    AND rating BETWEEN 1 AND 5
    AND char_length(comment) BETWEEN 10 AND 1000
    AND char_length(user_name) BETWEEN 1 AND 80
  );
