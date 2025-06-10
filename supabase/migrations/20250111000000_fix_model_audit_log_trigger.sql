-- Fix the model audit log trigger to handle deletions properly
CREATE OR REPLACE FUNCTION log_model_change()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_changes JSONB;
  v_model_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_changes := to_jsonb(NEW);
    v_model_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determine specific action based on changes
    IF OLD.is_active != NEW.is_active THEN
      v_action := CASE WHEN NEW.is_active THEN 'activate' ELSE 'deactivate' END;
    ELSE
      v_action := 'update';
    END IF;
    -- Calculate changes
    v_changes := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'diff', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(OLD) -> key IS DISTINCT FROM value
      )
    );
    v_model_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_changes := to_jsonb(OLD);
    -- For delete operations, we need to store the model data but not reference the deleted ID
    v_model_id := NULL; -- Set to NULL since the model will be deleted
  END IF;

  INSERT INTO model_audit_log (model_id, admin_id, action, changes)
  VALUES (
    v_model_id,
    auth.uid(),
    v_action,
    v_changes
  );

  -- Return appropriate value based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a column to store the model_id value for deleted models in the changes JSON
COMMENT ON COLUMN model_audit_log.changes IS 'JSON containing the changes. For deleted models, includes the original model_id in the data.';