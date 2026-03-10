-- Pending payment and trial usage for signup → payment → access flow.
-- Plan selection is stored on profile until payment completes.

-- Pending plan and payment status (for users who signed up but haven't paid)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pending_plan text,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'none' CHECK (payment_status IN ('none', 'pending', 'paid'));

-- Trial: allow up to 3 uses per user (replace single boolean)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_use_count integer NOT NULL DEFAULT 0;

-- Backfill: existing free_trial_used = true -> trial_use_count = 1
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'free_trial_used') THEN
    UPDATE public.profiles SET trial_use_count = 1 WHERE free_trial_used = true AND trial_use_count < 1;
  END IF;
END $$;

-- Optional: trial abuse signals (same IP/device many trials)
CREATE TABLE IF NOT EXISTS public.trial_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text,
  fingerprint_hash text,
  email_domain text,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trial_attempts_ip_hash_idx ON public.trial_attempts (ip_hash);
CREATE INDEX IF NOT EXISTS trial_attempts_attempted_at_idx ON public.trial_attempts (attempted_at);

COMMENT ON TABLE public.trial_attempts IS 'Signals for trial abuse detection; prune old rows periodically.';
