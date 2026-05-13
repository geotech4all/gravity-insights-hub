## User Reviews Feature

Add a public review system so users can rate and comment on the platform. Reviews are displayed on the landing page and can be submitted by authenticated users.

### Database

```text
reviews
├── id            uuid PK
├── user_id       uuid → profiles.user_id
├── user_name     text  (denormalized for display)
├── rating        int   (1–5)
├── comment       text
├── approved      bool  (default false)
├── created_at    timestamptz
```

RLS policies:
- Anyone can SELECT approved reviews
- Authenticated users can INSERT their own review
- Admins can UPDATE/DELETE (for moderation)

### UI

1. **ReviewSection** — displays approved reviews in a grid on the landing page (bottom, above footer). Shows star rating, user name, comment, and relative date.
2. **ReviewForm** — modal or inline form on the landing page for authenticated users to submit a review (rating + comment).
3. **StarRating** — reusable star display + input component.

### Integration

- Add `<ReviewSection />` to `Landing.tsx` above the footer.
- Use existing design tokens (red/white, `primary`, `card`, etc.).
- Fetch approved reviews from the database on mount.
- If user is authenticated, show a “Write a Review” CTA that opens the form modal.
- On submit, insert into `reviews` with `approved = false` (pending admin approval).

### Admin

- AdminDashboard already exists; no new admin UI needed for MVP. Reviews can be moderated directly in the database or later added to the admin panel.

### Technical Details

- React 18, Tailwind, shadcn/ui components where appropriate (`Dialog`, `Textarea`, `Button`).
- Supabase client for queries/inserts.
- No new dependencies.
- Responsive: 1 column mobile, 2–3 columns desktop.
