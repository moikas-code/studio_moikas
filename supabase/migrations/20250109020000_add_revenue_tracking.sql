-- Create revenue_transactions table for tracking MP purchases and refunds
CREATE TABLE IF NOT EXISTS revenue_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (operation IN ('token_purchase', 'token_refund', 'subscription_payment')),
  amount_cents INTEGER NOT NULL,
  tokens_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  description TEXT,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_revenue_transactions_user_id ON revenue_transactions(user_id);
CREATE INDEX idx_revenue_transactions_operation ON revenue_transactions(operation);
CREATE INDEX idx_revenue_transactions_created_at ON revenue_transactions(created_at);
CREATE INDEX idx_revenue_transactions_stripe_payment_intent ON revenue_transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- Enable RLS
ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own revenue transactions" ON revenue_transactions
  FOR SELECT
  USING (user_id = get_user_id_from_clerk());

-- Admins can view all transactions
CREATE POLICY "Admins can view all revenue transactions" ON revenue_transactions
  FOR SELECT
  USING (is_current_user_admin());

-- Only service role can insert (for webhook handling)
CREATE POLICY "Service role can insert revenue transactions" ON revenue_transactions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Migrate existing token purchase data from usage table
-- Token purchases are stored as negative tokens_used values
INSERT INTO revenue_transactions (
  user_id,
  operation,
  amount_cents,
  tokens_amount,
  description,
  created_at
)
SELECT 
  user_id,
  'token_purchase',
  ABS(tokens_used) * 10, -- Estimate: 1 MP = $0.001, so 1000 MP = $1 = 100 cents
  ABS(tokens_used),
  description,
  created_at
FROM usage
WHERE tokens_used < 0
  AND description LIKE '%Token purchase%';

-- Drop the existing view first to avoid type conflicts
DROP VIEW IF EXISTS admin_revenue_stats;

-- Now create the admin revenue view with real data
CREATE VIEW admin_revenue_stats AS
SELECT 
  COUNT(DISTINCT CASE WHEN operation = 'token_purchase' THEN user_id END)::integer as paying_customers,
  COALESCE(SUM(CASE WHEN operation = 'token_purchase' THEN amount_cents END) / 100.0, 0)::numeric as total_revenue,
  COALESCE(AVG(CASE WHEN operation = 'token_purchase' THEN amount_cents END) / 100.0, 0)::numeric as avg_transaction_value,
  COALESCE(COUNT(CASE WHEN operation = 'token_purchase' THEN 1 END), 0)::integer as total_purchases,
  COALESCE(SUM(CASE WHEN operation = 'token_refund' THEN amount_cents END) / 100.0, 0)::numeric as total_refunds,
  COALESCE(COUNT(CASE WHEN operation = 'token_refund' THEN 1 END), 0)::integer as refund_count
FROM revenue_transactions
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Add comments for documentation
COMMENT ON TABLE revenue_transactions IS 'Tracks all revenue-related transactions including MP purchases and refunds';
COMMENT ON COLUMN revenue_transactions.operation IS 'Type of transaction: token_purchase, token_refund, subscription_payment';
COMMENT ON COLUMN revenue_transactions.amount_cents IS 'Transaction amount in cents (USD)';
COMMENT ON COLUMN revenue_transactions.tokens_amount IS 'Number of MP tokens involved in the transaction';
COMMENT ON COLUMN revenue_transactions.stripe_payment_intent_id IS 'Stripe payment intent ID for tracking';
COMMENT ON COLUMN revenue_transactions.stripe_invoice_id IS 'Stripe invoice ID for subscription payments';