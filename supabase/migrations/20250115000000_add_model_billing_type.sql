-- Add billing type enum for models
CREATE TYPE billing_type AS ENUM ('flat_rate', 'time_based');

-- Add billing_type column to models table
ALTER TABLE models 
ADD COLUMN billing_type billing_type DEFAULT 'flat_rate' NOT NULL;

-- Add time-based billing configuration columns
ALTER TABLE models
ADD COLUMN min_time_charge_seconds NUMERIC(10, 2) DEFAULT 1,
ADD COLUMN max_time_charge_seconds NUMERIC(10, 2);

-- Add comment for clarity
COMMENT ON COLUMN models.billing_type IS 'Determines if model charges flat rate per generation or based on processing time';
COMMENT ON COLUMN models.min_time_charge_seconds IS 'Minimum seconds to charge for time-based billing';
COMMENT ON COLUMN models.max_time_charge_seconds IS 'Maximum seconds to charge for time-based billing (cap)';

-- Update the model audit log trigger to capture billing type changes
-- The existing trigger will automatically capture these new fields