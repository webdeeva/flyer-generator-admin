-- Create base_prompts table
CREATE TABLE base_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generations table
CREATE TABLE generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  base_prompt_id UUID REFERENCES base_prompts(id),
  custom_prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  result_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_tracking table
CREATE TABLE usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  generation_count INTEGER DEFAULT 0,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 month',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert example base prompts
INSERT INTO base_prompts (title, description, prompt_template, category) VALUES
('Elegant High-End Poster', 'Professional poster with refined, celebratory feel', 'Design an elegant, high-end poster or flyer with a refined, celebratory feel. Feature a large, confident central close-up of the subject as the main focal point, styled in attire that reflects the theme or profession (e.g., formal, professional, cultural, or casual). Use a soft gradient background with harmonious tones that match the message (pastels, jewel tones, or brand colors), incorporating gentle fades, light flares, and bokeh for depth and atmosphere. Overlay ornamental or thematic accents such as floral patterns, abstract shapes, or subtle graphic elements that enhance the story without overpowering the subject. On one side (left or right), arrange four smaller, visually cohesive images of the subject in different poses or contexts, stacked vertically for balance. In the foreground, place a full-body image of the subject to create a strong, grounded visual anchor. Incorporate modern serif or serif-sans typography combinations for the main headline (e.g., name, event title, or campaign slogan) in uppercase with elegant spacing. Add secondary text for key details (e.g., event name, role, achievements, or date) in smaller, refined type. Include subtle symbolic or thematic icons relevant to the content (e.g., ribbons, emblems, badges) for a polished finish. Maintain a style that is professional, inspirational, and visually rich, blending gradients, fades, and ornamental detailing into a unified, high-end design.', 'professional'),
('Corporate Event Flyer', 'Modern corporate design with clean layout', 'Create a modern corporate event flyer with a clean, professional layout. Feature the subject in business attire with a confident expression. Use a subtle gradient background in corporate colors with geometric shapes and lines for visual interest. Include event details, company branding, and call-to-action elements. Typography should be clean and modern, mixing sans-serif headers with readable body text. Add subtle design elements like icons or patterns that reinforce the corporate theme without cluttering the design.', 'corporate'),
('Social Media Influencer', 'Trendy design for social media promotion', 'Design a vibrant, trendy poster for social media promotion. Feature the subject in fashionable attire with dynamic poses. Use bold, colorful gradients with modern abstract shapes and patterns. Include social media handles, hashtags, and engagement metrics. Typography should be bold and eye-catching with a mix of script and sans-serif fonts. Add trendy design elements like neon effects, geometric patterns, or digital glitch effects for a contemporary feel.', 'social');

-- Create indexes for better performance
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_created_at ON generations(created_at);
CREATE INDEX idx_base_prompts_category ON base_prompts(category);
CREATE INDEX idx_base_prompts_is_active ON base_prompts(is_active);