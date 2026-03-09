-- Create subscription record automatically when a new user signs up.
-- Table may already exist; create only if missing so migration is idempotent.

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  plan text NOT NULL DEFAULT 'advisory',
  status text NOT NULL DEFAULT 'inactive',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS: users can read own subscription
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger: insert into subscriptions when a new auth user is created (no duplicates)
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, email, plan, status)
  SELECT NEW.id, NEW.email, 'advisory', 'inactive'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subscriptions WHERE user_id = NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();
