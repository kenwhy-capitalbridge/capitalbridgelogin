-- Auth activity log for security auditing. Run in Supabase SQL Editor after 001.

CREATE TABLE IF NOT EXISTS public.auth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON public.auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON public.auth_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_event_type ON public.auth_events(event_type);

ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

-- Allow insert for authenticated users (own user_id or null for pre-auth events)
CREATE POLICY "Allow insert auth_events"
  ON public.auth_events FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Allow users to read own events only (for audit display if needed)
CREATE POLICY "Users can read own auth_events"
  ON public.auth_events FOR SELECT
  USING (auth.uid() = user_id);
