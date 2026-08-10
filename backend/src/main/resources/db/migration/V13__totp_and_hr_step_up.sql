-- TOTP (authenticator-app) enrollment and HR Portal step-up state.
-- totp_secret is encrypted at rest at the application layer (AES-GCM, see
-- TotpService) before being persisted here, unlike most plaintext fields
-- elsewhere in this schema — a leaked TOTP secret defeats the second factor
-- entirely, so it gets different treatment.

ALTER TABLE users ADD COLUMN totp_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN totp_enrolled_at TIMESTAMP;
ALTER TABLE users ADD COLUMN hr_step_up_expires_at TIMESTAMP;
