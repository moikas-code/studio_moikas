-- Add status column to workflows table
ALTER TABLE public.workflows 
ADD COLUMN status text DEFAULT 'stable' CHECK (status IN ('stable', 'early_access', 'experimental', 'deprecated'));

-- Add status column to workflow_templates table
ALTER TABLE public.workflow_templates 
ADD COLUMN status text DEFAULT 'stable' CHECK (status IN ('stable', 'early_access', 'experimental', 'deprecated'));

-- Update existing workflows to have 'stable' status
UPDATE public.workflows SET status = 'stable' WHERE status IS NULL;

-- Update existing workflow templates to have 'stable' status  
UPDATE public.workflow_templates SET status = 'stable' WHERE status IS NULL;

-- Add comment to explain status values
COMMENT ON COLUMN public.workflows.status IS 'Workflow status: stable (production ready), early_access (may have bugs), experimental (beta/unstable), deprecated (will be removed)';
COMMENT ON COLUMN public.workflow_templates.status IS 'Template status: stable (production ready), early_access (may have bugs), experimental (beta/unstable), deprecated (will be removed)';