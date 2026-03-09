-- Track whether user has already used the 7-day free trial (from /select-plan).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_trial_used boolean NOT NULL DEFAULT false;
