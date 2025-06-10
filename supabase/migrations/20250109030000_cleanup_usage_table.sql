-- Clean up usage table by removing token purchase records
-- These should only be in revenue_transactions table

-- First, ensure all token purchases are migrated to revenue_transactions
-- (This is a safety check in case the previous migration was incomplete)
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
  AND description LIKE '%Token purchase%'
  AND NOT EXISTS (
    -- Don't duplicate if already migrated
    SELECT 1 
    FROM revenue_transactions rt 
    WHERE rt.user_id = usage.user_id 
      AND rt.created_at = usage.created_at
      AND rt.tokens_amount = ABS(usage.tokens_used)
  );

-- Now remove all token purchase records from usage table
DELETE FROM usage
WHERE tokens_used < 0
  AND (description LIKE '%Token purchase%' OR description LIKE '%token purchase%');

-- Also remove any records that might have operation_type = 'token_purchase'
-- (though there shouldn't be any with the current constraint)
DELETE FROM usage
WHERE operation_type = 'token_purchase' OR operation_type = 'token_refund';

-- Add a constraint to ensure tokens_used is always positive
-- This prevents future negative values
ALTER TABLE usage 
ADD CONSTRAINT positive_tokens_used CHECK (tokens_used > 0);

-- Update the comment to reflect the table's single purpose
COMMENT ON TABLE usage IS 'Tracks token consumption for platform operations (image, video, audio generation, etc). Financial transactions are tracked in revenue_transactions table.';