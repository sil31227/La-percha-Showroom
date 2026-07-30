-- Ejecutar en SQL Editor de Supabase
CREATE TABLE verification_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  name TEXT,
  type TEXT DEFAULT 'email_verification',
  verified BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_tokens ON verification_tokens FOR ALL USING (true) WITH CHECK (true);
