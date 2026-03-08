-- Memberships: one row per user, updated on renewal.
-- Payments: one row per successful payment for records.

-- 1. Memberships table (matches existing schema: plan, expires_at)
CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  amount_cents integer NOT NULL,
  billplz_bill_id text NOT NULL,
  billplz_transaction_id text,
  paid_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. RLS for memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own membership" ON public.memberships;
CREATE POLICY "Users can view own membership"
  ON public.memberships FOR SELECT
  USING (auth.uid() = user_id);

-- Service role / webhook will insert/update; no insert/update policy for users.

-- 4. RLS for payments (users can only read own)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Trigger: create free trial membership when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.memberships (user_id, plan, status, expires_at)
  VALUES (
    NEW.id,
    'free',
    'active',
    now() + interval '24 hours'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_membership ON public.profiles;
CREATE TRIGGER on_profile_created_membership
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_membership();

-- 6. Backfill: ensure existing profiles get a free trial membership if missing (run once)
-- Skip if your memberships table already uses 'free' and has data; run only if needed.
INSERT INTO public.memberships (user_id, plan, status, expires_at)
SELECT p.id, 'free', 'active', now() + interval '24 hours'
FROM public.profiles p
LEFT JOIN public.memberships m ON m.user_id = p.id
WHERE m.id IS NULL
ON CONFLICT (user_id) DO NOTHING;
