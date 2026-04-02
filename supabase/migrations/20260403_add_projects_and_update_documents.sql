-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NULL,
  status TEXT NULL DEFAULT 'draft'::text CHECK (
    status = ANY (ARRAY['draft'::text, 'ongoing'::text, 'completed'::text, 'cancelled'::text])
  ),
  budget NUMERIC NULL DEFAULT 0,
  total_income NUMERIC NULL DEFAULT 0,
  total_expense NUMERIC NULL DEFAULT 0,
  margin NUMERIC NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Update document_templates table to use JSONB for variables
ALTER TABLE IF EXISTS public.document_templates
ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb;

-- Update documents table to include project_id if not already present
ALTER TABLE IF EXISTS public.documents
ADD COLUMN IF NOT EXISTS project_id UUID NULL REFERENCES projects(id) ON DELETE CASCADE;

-- Create RLS policies for projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON public.projects(status);
CREATE INDEX IF NOT EXISTS documents_project_id_idx ON public.documents(project_id);
