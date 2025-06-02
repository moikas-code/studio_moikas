-- Add template_data column to workflow_templates
ALTER TABLE workflow_templates ADD COLUMN IF NOT EXISTS template_data jsonb DEFAULT '{}';

-- Insert default workflow templates with their node configurations
INSERT INTO workflow_templates (name, description, category, is_public, template_data) VALUES
(
  'Simple Chatbot', 
  'Basic AI assistant that responds to user queries', 
  'chat', 
  true,
  '{
    "nodes": [
      {
        "id": "input_1",
        "type": "input",
        "position": {"x": 100, "y": 200},
        "data": {"label": "User Input", "output_key": "user_message"}
      },
      {
        "id": "llm_1",
        "type": "llm",
        "position": {"x": 400, "y": 200},
        "data": {
          "label": "AI Assistant",
          "prompt": "{{user_message}}",
          "system_prompt": "You are a helpful AI assistant. Provide clear, concise, and accurate responses.",
          "model": "grok-3-mini-latest",
          "output_key": "assistant_response"
        }
      },
      {
        "id": "output_1",
        "type": "output",
        "position": {"x": 700, "y": 200},
        "data": {"label": "Response", "display_key": "assistant_response"}
      }
    ],
    "connections": [
      {"from": "input_1", "to": "llm_1"},
      {"from": "llm_1", "to": "output_1"}
    ]
  }'::jsonb
),
(
  'Image Generator', 
  'Generate images from text descriptions', 
  'creative', 
  true,
  '{
    "nodes": [
      {
        "id": "input_1",
        "type": "input",
        "position": {"x": 100, "y": 150},
        "data": {"label": "Image Description", "output_key": "description"}
      },
      {
        "id": "enhance_1",
        "type": "llm",
        "position": {"x": 350, "y": 150},
        "data": {
          "label": "Enhance Prompt",
          "prompt": "Enhance this image description for better AI generation. Keep it concise but detailed: {{description}}",
          "system_prompt": "You are an expert at writing prompts for AI image generation. Create vivid, detailed prompts that will produce high-quality images.",
          "model": "grok-3-mini-latest",
          "output_key": "enhanced_prompt"
        }
      },
      {
        "id": "image_1",
        "type": "image_generator",
        "position": {"x": 600, "y": 150},
        "data": {
          "label": "Generate Image",
          "prompt": "{{enhanced_prompt}}",
          "model": "fal-ai/flux/schnell",
          "output_key": "generated_image"
        }
      },
      {
        "id": "output_1",
        "type": "output",
        "position": {"x": 850, "y": 150},
        "data": {"label": "Generated Image", "display_key": "generated_image"}
      }
    ],
    "connections": [
      {"from": "input_1", "to": "enhance_1"},
      {"from": "enhance_1", "to": "image_1"},
      {"from": "image_1", "to": "output_1"}
    ]
  }'::jsonb
),
(
  'Content Creator', 
  'Create social media posts, blog articles, and marketing copy', 
  'content', 
  true,
  '{
    "nodes": [
      {
        "id": "input_topic",
        "type": "input",
        "position": {"x": 50, "y": 200},
        "data": {"label": "Content Topic", "output_key": "topic"}
      },
      {
        "id": "input_type",
        "type": "input",
        "position": {"x": 50, "y": 300},
        "data": {
          "label": "Content Type",
          "output_key": "content_type",
          "options": ["social_media", "blog_post", "email", "ad_copy"]
        }
      },
      {
        "id": "content_gen",
        "type": "llm",
        "position": {"x": 400, "y": 250},
        "data": {
          "label": "Generate Content",
          "prompt": "Create a {{content_type}} about: {{topic}}",
          "system_prompt": "You are a professional content creator. Generate engaging, high-quality content tailored to the specified format.",
          "model": "grok-3-mini-latest",
          "output_key": "generated_content"
        }
      },
      {
        "id": "output_1",
        "type": "output",
        "position": {"x": 700, "y": 250},
        "data": {"label": "Final Content", "display_key": "generated_content"}
      }
    ],
    "connections": [
      {"from": "input_topic", "to": "content_gen"},
      {"from": "input_type", "to": "content_gen"},
      {"from": "content_gen", "to": "output_1"}
    ]
  }'::jsonb
),
(
  'Code Assistant', 
  'Help with coding tasks and technical questions', 
  'development', 
  true,
  '{
    "nodes": [
      {
        "id": "input_1",
        "type": "input",
        "position": {"x": 100, "y": 200},
        "data": {"label": "Code Question", "output_key": "question"}
      },
      {
        "id": "code_assistant",
        "type": "llm",
        "position": {"x": 400, "y": 200},
        "data": {
          "label": "Code Assistant",
          "prompt": "{{question}}",
          "system_prompt": "You are an expert programmer. Help with coding questions, debug issues, explain concepts, and write clean, efficient code. Always include code examples when relevant.",
          "model": "grok-3-mini-latest",
          "output_key": "code_response"
        }
      },
      {
        "id": "output_1",
        "type": "output",
        "position": {"x": 700, "y": 200},
        "data": {"label": "Solution", "display_key": "code_response"}
      }
    ],
    "connections": [
      {"from": "input_1", "to": "code_assistant"},
      {"from": "code_assistant", "to": "output_1"}
    ]
  }'::jsonb
),
(
  'Story Writer', 
  'Generate creative stories and narratives', 
  'creative', 
  true,
  '{
    "nodes": [
      {
        "id": "input_genre",
        "type": "input",
        "position": {"x": 50, "y": 150},
        "data": {"label": "Story Genre", "output_key": "genre"}
      },
      {
        "id": "input_prompt",
        "type": "input",
        "position": {"x": 50, "y": 250},
        "data": {"label": "Story Prompt", "output_key": "prompt"}
      },
      {
        "id": "story_gen",
        "type": "llm",
        "position": {"x": 400, "y": 200},
        "data": {
          "label": "Story Generator",
          "prompt": "Write a {{genre}} story based on this prompt: {{prompt}}",
          "system_prompt": "You are a creative storyteller. Write engaging, imaginative stories with vivid descriptions, compelling characters, and interesting plots.",
          "model": "grok-3-mini-latest",
          "output_key": "story"
        }
      },
      {
        "id": "output_1",
        "type": "output",
        "position": {"x": 700, "y": 200},
        "data": {"label": "Generated Story", "display_key": "story"}
      }
    ],
    "connections": [
      {"from": "input_genre", "to": "story_gen"},
      {"from": "input_prompt", "to": "story_gen"},
      {"from": "story_gen", "to": "output_1"}
    ]
  }'::jsonb
),
(
  'Data Analyzer', 
  'Analyze and summarize text data', 
  'analysis', 
  true,
  '{
    "nodes": [
      {
        "id": "input_1",
        "type": "input",
        "position": {"x": 100, "y": 200},
        "data": {"label": "Text Data", "output_key": "text_data"}
      },
      {
        "id": "analyzer",
        "type": "text_analyzer",
        "position": {"x": 400, "y": 200},
        "data": {
          "label": "Analyze Text",
          "analysis_type": "comprehensive",
          "input_key": "text_data",
          "output_key": "analysis"
        }
      },
      {
        "id": "summarizer",
        "type": "llm",
        "position": {"x": 700, "y": 200},
        "data": {
          "label": "Generate Summary",
          "prompt": "Based on this analysis: {{analysis}}\n\nProvide a concise summary of the key findings.",
          "system_prompt": "You are a data analyst. Provide clear, actionable summaries of text analysis results.",
          "model": "grok-3-mini-latest",
          "output_key": "summary"
        }
      },
      {
        "id": "output_1",
        "type": "output",
        "position": {"x": 1000, "y": 200},
        "data": {"label": "Analysis Results", "display_keys": ["analysis", "summary"]}
      }
    ],
    "connections": [
      {"from": "input_1", "to": "analyzer"},
      {"from": "analyzer", "to": "summarizer"},
      {"from": "summarizer", "to": "output_1"}
    ]
  }'::jsonb
);

-- Update the copy_workflow_template function to use template_data
CREATE OR REPLACE FUNCTION copy_workflow_template(
  p_template_id uuid,
  p_user_id uuid,
  p_new_name text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_new_workflow_id uuid;
  v_template_name text;
  v_template_data jsonb;
  v_node jsonb;
  v_nodes jsonb[];
BEGIN
  -- Get template info
  SELECT name, template_data 
  INTO v_template_name, v_template_data 
  FROM workflow_templates 
  WHERE id = p_template_id;
  
  -- Create new workflow
  INSERT INTO workflows (user_id, template_id, name, description, graph_data)
  VALUES (
    p_user_id,
    p_template_id,
    COALESCE(p_new_name, v_template_name || ' Copy'),
    'Created from template: ' || v_template_name,
    jsonb_build_object(
      'nodes', v_template_data->'nodes',
      'connections', v_template_data->'connections'
    )
  )
  RETURNING id INTO v_new_workflow_id;
  
  -- Insert nodes from template_data
  FOR v_node IN SELECT * FROM jsonb_array_elements(v_template_data->'nodes')
  LOOP
    INSERT INTO workflow_nodes (workflow_id, node_id, type, position, data, connections)
    VALUES (
      v_new_workflow_id,
      v_node->>'id',
      v_node->>'type',
      v_node->'position',
      v_node->'data',
      '[]'::jsonb
    );
  END LOOP;
  
  RETURN v_new_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;