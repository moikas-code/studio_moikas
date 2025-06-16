-- Create DMCA requests table
CREATE TABLE IF NOT EXISTS public.dmca_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Complainant Information
  complainant_email TEXT NOT NULL,
  complainant_name TEXT NOT NULL,
  complainant_address TEXT,
  complainant_phone TEXT,
  
  -- Copyright Information
  copyrighted_work TEXT NOT NULL,
  original_work_url TEXT,
  
  -- Infringing Content
  infringing_content_url TEXT NOT NULL,
  infringing_content_description TEXT,
  reported_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Legal Statements
  good_faith_statement BOOLEAN NOT NULL DEFAULT FALSE,
  accuracy_statement BOOLEAN NOT NULL DEFAULT FALSE,
  signature TEXT NOT NULL,
  
  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'counter_notice_received', 'resolved')),
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- Counter Notice Information
  counter_notice_received_at TIMESTAMPTZ,
  counter_notice_text TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- Create indexes for efficient queries
CREATE INDEX idx_dmca_requests_status ON public.dmca_requests(status);
CREATE INDEX idx_dmca_requests_created_at ON public.dmca_requests(created_at);
CREATE INDEX idx_dmca_requests_reported_user ON public.dmca_requests(reported_user_id);

-- Create DMCA actions table for audit trail
CREATE TABLE IF NOT EXISTS public.dmca_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dmca_request_id UUID NOT NULL REFERENCES public.dmca_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to log DMCA actions
CREATE OR REPLACE FUNCTION log_dmca_action(
  request_id UUID,
  action_type TEXT,
  performed_by_user TEXT,
  action_details JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.dmca_actions (
    dmca_request_id,
    action,
    performed_by,
    details
  ) VALUES (
    request_id,
    action_type,
    performed_by_user,
    action_details
  );
  
  -- Update the updated_at timestamp on the request
  UPDATE public.dmca_requests
  SET updated_at = NOW()
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle DMCA takedown
CREATE OR REPLACE FUNCTION process_dmca_takedown(
  request_id UUID,
  admin_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Get the DMCA request
  SELECT * INTO request_record
  FROM public.dmca_requests
  WHERE id = request_id
  AND status = 'reviewing';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update request status
  UPDATE public.dmca_requests
  SET 
    status = 'accepted',
    reviewed_at = NOW()
  WHERE id = request_id;
  
  -- Log the action
  PERFORM log_dmca_action(
    request_id,
    'takedown_processed',
    admin_id,
    jsonb_build_object('infringing_url', request_record.infringing_content_url)
  );
  
  -- In a real implementation, you would:
  -- 1. Remove or disable access to the infringing content
  -- 2. Notify the user whose content was removed
  -- 3. Provide them with counter-notice information
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.dmca_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dmca_actions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a DMCA request
CREATE POLICY "Anyone can submit DMCA requests" ON public.dmca_requests
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view all DMCA requests
CREATE POLICY "Admins can view all DMCA requests" ON public.dmca_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.subscriptions s ON u.id = s.user_id
      WHERE u.id = auth.uid()
      AND s.plan = 'admin'
    )
  );

-- Complainants can view their own requests
CREATE POLICY "Complainants can view own requests" ON public.dmca_requests
  FOR SELECT
  USING (complainant_email = auth.jwt()->>'email');

-- Only admins can update DMCA requests
CREATE POLICY "Admins can update DMCA requests" ON public.dmca_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.subscriptions s ON u.id = s.user_id
      WHERE u.id = auth.uid()
      AND s.plan = 'admin'
    )
  );

-- Only admins can view DMCA actions
CREATE POLICY "Admins can view DMCA actions" ON public.dmca_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.subscriptions s ON u.id = s.user_id
      WHERE u.id = auth.uid()
      AND s.plan = 'admin'
    )
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_dmca_action TO authenticated;
GRANT EXECUTE ON FUNCTION process_dmca_takedown TO authenticated;

-- Add comments
COMMENT ON TABLE public.dmca_requests IS 'Tracks DMCA takedown requests and counter-notices';
COMMENT ON TABLE public.dmca_actions IS 'Audit trail for all actions taken on DMCA requests';