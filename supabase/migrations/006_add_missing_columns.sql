-- Add missing columns to base_prompts table

-- Add additional_elements column for storing extra elements users can add to prompts
ALTER TABLE base_prompts 
ADD COLUMN IF NOT EXISTS additional_elements TEXT[] DEFAULT '{}';

-- Update the metadata column to ensure it has a default value
ALTER TABLE base_prompts 
ALTER COLUMN metadata SET DEFAULT '{}';

-- Add any other missing columns that might be needed
COMMENT ON COLUMN base_prompts.additional_elements IS 'Array of additional elements that can be added to this prompt';

-- If you have any existing prompts, you might want to set some default additional_elements
-- For example:
UPDATE base_prompts 
SET additional_elements = ARRAY['holding flowers', 'with a smile', 'professional attire', 'casual outfit', 'formal dress']
WHERE category_id = (SELECT id FROM prompt_categories WHERE slug = 'realistic')
AND additional_elements = '{}';

UPDATE base_prompts 
SET additional_elements = ARRAY['magical aura', 'mystical background', 'fantasy creatures', 'glowing eyes', 'ethereal lighting']
WHERE category_id = (SELECT id FROM prompt_categories WHERE slug = 'fantasy')
AND additional_elements = '{}';

UPDATE base_prompts 
SET additional_elements = ARRAY['vibrant colors', 'dynamic pose', 'energetic expression', 'bold makeup', 'striking outfit']
WHERE category_id = (SELECT id FROM prompt_categories WHERE slug = 'bold')
AND additional_elements = '{}';