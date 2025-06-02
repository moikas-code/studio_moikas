-- Drop existing RLS policies that incorrectly compare auth.uid() with user_id
DROP POLICY IF EXISTS "Users can view their own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can create workflows" ON workflows;
DROP POLICY IF EXISTS "Users can update their own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can delete their own workflows" ON workflows;

DROP POLICY IF EXISTS "Users can view their own sessions" ON workflow_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON workflow_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON workflow_sessions;

DROP POLICY IF EXISTS "Users can view messages from their sessions" ON workflow_messages;
DROP POLICY IF EXISTS "Users can create messages in their sessions" ON workflow_messages;

DROP POLICY IF EXISTS "Users can view nodes from their workflows" ON workflow_nodes;
DROP POLICY IF EXISTS "Users can manage nodes in their workflows" ON workflow_nodes;

DROP POLICY IF EXISTS "Users can view executions from their sessions" ON workflow_executions;
DROP POLICY IF EXISTS "Users can create executions in their sessions" ON workflow_executions;

-- Create corrected RLS policies for workflows
CREATE POLICY "Users can view their own workflows"
  ON workflows FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workflows"
  ON workflows FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own workflows"
  ON workflows FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own workflows"
  ON workflows FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.uid()
    )
  );

-- Create corrected RLS policies for workflow_sessions
CREATE POLICY "Users can view their own sessions"
  ON workflow_sessions FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions"
  ON workflow_sessions FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own sessions"
  ON workflow_sessions FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.uid()
    )
  );

-- Create corrected RLS policies for workflow_messages
CREATE POLICY "Users can view messages from their sessions"
  ON workflow_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_sessions
      WHERE workflow_sessions.id = workflow_messages.session_id
      AND workflow_sessions.user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create messages in their sessions"
  ON workflow_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_sessions
      WHERE workflow_sessions.id = workflow_messages.session_id
      AND workflow_sessions.user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.uid()
      )
    )
  );

-- Create corrected RLS policies for workflow_nodes
CREATE POLICY "Users can view nodes from their workflows"
  ON workflow_nodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_nodes.workflow_id
      AND workflows.user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage nodes in their workflows"
  ON workflow_nodes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workflows
      WHERE workflows.id = workflow_nodes.workflow_id
      AND workflows.user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.uid()
      )
    )
  );

-- Create corrected RLS policies for workflow_executions
CREATE POLICY "Users can view executions from their sessions"
  ON workflow_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_sessions
      WHERE workflow_sessions.id = workflow_executions.session_id
      AND workflow_sessions.user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create executions in their sessions"
  ON workflow_executions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_sessions
      WHERE workflow_sessions.id = workflow_executions.session_id
      AND workflow_sessions.user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.uid()
      )
    )
  );

-- Also fix the workflow_templates policies
DROP POLICY IF EXISTS "Users can view their own templates" ON workflow_templates;
DROP POLICY IF EXISTS "Users can create templates" ON workflow_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON workflow_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON workflow_templates;

CREATE POLICY "Users can view their own templates"
  ON workflow_templates FOR SELECT
  USING (
    created_by IN (
      SELECT id FROM users WHERE clerk_id = auth.uid()
    )
  );

CREATE POLICY "Users can create templates"
  ON workflow_templates FOR INSERT
  WITH CHECK (
    created_by IN (
      SELECT id FROM users WHERE clerk_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own templates"
  ON workflow_templates FOR UPDATE
  USING (
    created_by IN (
      SELECT id FROM users WHERE clerk_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own templates"
  ON workflow_templates FOR DELETE
  USING (
    created_by IN (
      SELECT id FROM users WHERE clerk_id = auth.uid()
    )
  );