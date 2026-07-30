ALTER TABLE verification_tokens ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'email_verification';
ALTER TABLE verification_tokens ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_verification_tokens_type ON verification_tokens(type);
