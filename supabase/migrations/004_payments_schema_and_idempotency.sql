-- Align payments table with spec: plan, amount (sen), payment_status.
-- Support idempotent webhook: one record per billplz_bill_id.

-- Add columns if missing (for existing tables that had plan_name, amount_cents)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS plan text,
  ADD COLUMN IF NOT EXISTS amount integer,
  ADD COLUMN IF NOT EXISTS payment_status text;

-- Backfill from legacy columns when present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'plan_name') THEN
    UPDATE public.payments SET plan = plan_name WHERE plan IS NULL AND plan_name IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'amount_cents') THEN
    UPDATE public.payments SET amount = amount_cents WHERE amount IS NULL AND amount_cents IS NOT NULL;
  END IF;
END $$;

UPDATE public.payments SET payment_status = 'completed' WHERE payment_status IS NULL;

-- Unique constraint for idempotency: one payment record per Billplz bill (omit if you have existing duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS payments_billplz_bill_id_key
  ON public.payments (billplz_bill_id);
