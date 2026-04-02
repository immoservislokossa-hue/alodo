-- Create service_transactions table
CREATE TABLE IF NOT EXISTS public.service_transactions (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type = ANY (ARRAY['income'::text, 'expense'::text])),
  amount NUMERIC NOT NULL,
  project_id UUID NULL REFERENCES projects(id) ON DELETE SET NULL,
  category TEXT NULL,
  notes JSONB NULL DEFAULT '{}'::jsonb,
  date TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS service_transactions_user_id_idx ON public.service_transactions USING BTREE (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS service_transactions_project_id_idx ON public.service_transactions USING BTREE (project_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS service_transactions_type_idx ON public.service_transactions USING BTREE (type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS service_transactions_date_idx ON public.service_transactions USING BTREE (date) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.service_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "Users can view their own transactions"
  ON public.service_transactions FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = user_id));

CREATE POLICY IF NOT EXISTS "Users can insert their own transactions"
  ON public.service_transactions FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM profiles WHERE id = user_id));

CREATE POLICY IF NOT EXISTS "Users can update their own transactions"
  ON public.service_transactions FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = user_id));

CREATE POLICY IF NOT EXISTS "Users can delete their own transactions"
  ON public.service_transactions FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = user_id));
