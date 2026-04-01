-- Create institution_credits table
CREATE TABLE IF NOT EXISTS institution_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  description text,
  status text NOT NULL DEFAULT 'initiated', -- initiated, sent, received, repaid, failed
  moneroo_payout_id text,
  created_at timestamp DEFAULT now(),
  sent_at timestamp,
  repaid_at timestamp,
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Create table for repayment transactions
CREATE TABLE IF NOT EXISTS credit_repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id uuid NOT NULL REFERENCES institution_credits(id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  description text,
  status text NOT NULL DEFAULT 'initiated', -- initiated, pending, success, failed
  moneroo_payment_id text,
  created_at timestamp DEFAULT now(),
  completed_at timestamp,
  CONSTRAINT valid_repayment_amount CHECK (amount > 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_institution_credits_institution_id ON institution_credits(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_credits_user_id ON institution_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_institution_credits_status ON institution_credits(status);
CREATE INDEX IF NOT EXISTS idx_credit_repayments_credit_id ON credit_repayments(credit_id);
CREATE INDEX IF NOT EXISTS idx_credit_repayments_status ON credit_repayments(status);

-- Add RLS policies
ALTER TABLE institution_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_repayments ENABLE ROW LEVEL SECURITY;

-- Institution can view their credits
CREATE POLICY "institution_view_own_credits" ON institution_credits
  FOR SELECT USING (auth.uid() = institution_id);

-- Users can view credits given to them
CREATE POLICY "user_view_received_credits" ON institution_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert/update credits
CREATE POLICY "system_manage_credits" ON institution_credits
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Users can view their repayments
CREATE POLICY "user_view_own_repayments" ON credit_repayments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM institution_credits WHERE id = credit_id
    )
  );

-- Users can create repayments for credits given to them
CREATE POLICY "user_create_repayments" ON credit_repayments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM institution_credits WHERE id = credit_id
    )
  );
