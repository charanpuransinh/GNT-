BEGIN;
ALTER TABLE user_master ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255);
CREATE TABLE IF NOT EXISTS auth_otp_challenge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES user_master(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL, otp_hash VARCHAR(255) NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_auth_otp_expires ON auth_otp_challenge(expires_at);
CREATE TABLE IF NOT EXISTS auth_user_revocation (
  user_id UUID PRIMARY KEY REFERENCES user_master(id) ON DELETE CASCADE,
  revoked_after TIMESTAMPTZ NOT NULL
);
COMMIT;
