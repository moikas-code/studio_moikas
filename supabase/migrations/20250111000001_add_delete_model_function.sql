-- Create a function to delete a model and handle audit logging properly
CREATE OR REPLACE FUNCTION delete_model_with_audit(p_model_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_model RECORD;
  v_result JSONB;
BEGIN
  -- Get the model data before deletion
  SELECT * INTO v_model FROM models WHERE id = p_model_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Model not found'
    );
  END IF;
  
  -- Temporarily disable the trigger to avoid the foreign key issue
  ALTER TABLE models DISABLE TRIGGER model_audit_trigger;
  
  -- Manually create the audit log entry
  INSERT INTO model_audit_log (model_id, admin_id, action, changes)
  VALUES (
    NULL, -- Set to NULL since we're deleting the model
    auth.uid(),
    'delete',
    jsonb_build_object(
      'deleted_model', to_jsonb(v_model),
      'deleted_at', now(),
      'model_id', p_model_id,
      'model_name', v_model.name
    )
  );
  
  -- Delete the model
  DELETE FROM models WHERE id = p_model_id;
  
  -- Re-enable the trigger
  ALTER TABLE models ENABLE TRIGGER model_audit_trigger;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_model', v_model.name
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Make sure to re-enable the trigger even if there's an error
    ALTER TABLE models ENABLE TRIGGER model_audit_trigger;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admin check is in the API)
GRANT EXECUTE ON FUNCTION delete_model_with_audit(UUID) TO authenticated;