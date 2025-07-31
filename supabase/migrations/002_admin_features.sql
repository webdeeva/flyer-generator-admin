-- Add admin features to the database

-- Add admin flag to profiles (assuming you have a profiles table linked to auth.users)
-- If not, we'll create one
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create or replace function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enhance base_prompts table
ALTER TABLE base_prompts ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE base_prompts ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;
ALTER TABLE base_prompts ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE base_prompts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE base_prompts ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE base_prompts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add prompt_categories table
CREATE TABLE IF NOT EXISTS prompt_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add category reference to base_prompts
ALTER TABLE base_prompts ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES prompt_categories(id);

-- Insert default categories
INSERT INTO prompt_categories (name, slug, description, display_order) VALUES
  ('Realistic', 'realistic', 'Photorealistic and natural looking flyers', 1),
  ('Fantasy', 'fantasy', 'Fantasy and imaginative themed flyers', 2),
  ('Bold', 'bold', 'Bold, vibrant, and eye-catching designs', 3),
  ('Minimalist', 'minimalist', 'Clean and simple designs', 4),
  ('Corporate', 'corporate', 'Professional business-oriented flyers', 5)
ON CONFLICT (slug) DO NOTHING;

-- Add admin_logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_base_prompts_category ON base_prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_base_prompts_is_active ON base_prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

-- Update existing prompts to link to categories based on their current category field
UPDATE base_prompts bp
SET category_id = pc.id
FROM prompt_categories pc
WHERE LOWER(bp.category) = pc.slug
AND bp.category_id IS NULL;

-- Row Level Security (RLS) policies

-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Prompt categories policies (everyone can read, only admins can modify)
CREATE POLICY "Anyone can view categories" ON prompt_categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert categories" ON prompt_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can update categories" ON prompt_categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can delete categories" ON prompt_categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Admin logs policies (only admins can view)
CREATE POLICY "Only admins can view logs" ON admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Only admins can insert logs" ON admin_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Update base_prompts policies to allow admin modifications
DROP POLICY IF EXISTS "Only admins can insert prompts" ON base_prompts;
CREATE POLICY "Only admins can insert prompts" ON base_prompts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "Only admins can update prompts" ON base_prompts;
CREATE POLICY "Only admins can update prompts" ON base_prompts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "Only admins can delete prompts" ON base_prompts;
CREATE POLICY "Only admins can delete prompts" ON base_prompts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, changes)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_changes)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;