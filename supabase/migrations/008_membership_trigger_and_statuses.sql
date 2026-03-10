-- Clean SaaS membership model for Capital Bridge
-- - Every auth user gets profile + membership via triggers
-- - Membership statuses: trial, pending_payment, active, expired
-- - Triggers are resilient: auth.users insert never fails because of downstream tables

-- 1) Relax memberships schema for safer inserts and richer states
ALTER TABLE public.memberships
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE text,
  DROP CONSTRAINT IF EXISTS memberships_status_check;

ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_status_check
  CHECK (status IN ('trial', 'pending_payment', 'active', 'expired'));

-- Allow membership rows to be created before we know the exact expiry.
ALTER TABLE public.memberships
  ALTER COLUMN expires_at DROP NOT NULL;

-- Optional: add explicit start/end dates if not present
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS start_date timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS end_date timestamptz;

-- 2) Harden existing profile + subscription triggers so they never break auth.users insert

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, username, email, created_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name'),
      NEW.email,
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'handle_new_user profile insert failed for auth user %: %', NEW.id, SQLERRM;
      -- Do not block user creation
  END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.subscriptions (user_id, email, plan, status)
    SELECT NEW.id, NEW.email, 'advisory', 'inactive'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.subscriptions WHERE user_id = NEW.id
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'handle_new_user_subscription insert failed for auth user %: %', NEW.id, SQLERRM;
      -- Do not block user creation
  END;
  RETURN NEW;
END;
$$;

-- 3) Single membership trigger on auth.users
--    Uses raw_user_meta_data.selected_plan when present, otherwise defaults to trial.

CREATE OR REPLACE FUNCTION public.handle_new_user_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_plan text;
  initial_status text;
BEGIN
  selected_plan := COALESCE(NEW.raw_user_meta_data->>'selected_plan', 'trial');

  IF selected_plan = 'trial' THEN
    initial_status := 'trial';
  ELSE
    initial_status := 'pending_payment';
  END IF;

  BEGIN
    INSERT INTO public.memberships (user_id, plan, status, start_date, end_date, expires_at)
    VALUES (NEW.id, selected_plan, initial_status, now(), NULL, NULL)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'handle_new_user_membership insert failed for auth user %: %', NEW.id, SQLERRM;
      -- Do not block user creation
  END;

  RETURN NEW;
END;
$$;

-- 4) Attach membership trigger to auth.users and remove old profile-based membership trigger

DROP TRIGGER IF EXISTS on_profile_created_membership ON public.profiles;

DROP TRIGGER IF EXISTS on_auth_user_created_membership ON auth.users;
CREATE TRIGGER on_auth_user_created_membership
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_membership();

