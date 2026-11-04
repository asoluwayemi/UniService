-- Append-only audit trail of security- and HR-relevant actions (see com.uniservice.audit).
-- audit_logs was created (unused) in V2 with (id, username, action, created_at); evolve it rather than recreate it.
ALTER TABLE audit_logs RENAME COLUMN username TO actor;
UPDATE audit_logs SET actor = 'system' WHERE actor IS NULL;
UPDATE audit_logs SET action = 'UNKNOWN' WHERE action IS NULL;
UPDATE audit_logs SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE audit_logs ALTER COLUMN actor TYPE VARCHAR(255);
ALTER TABLE audit_logs ALTER COLUMN actor SET NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN action SET NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE audit_logs ADD COLUMN entity_type VARCHAR(80);
ALTER TABLE audit_logs ADD COLUMN entity_id VARCHAR(80);
ALTER TABLE audit_logs ADD COLUMN detail VARCHAR(1000);
ALTER TABLE audit_logs ADD COLUMN updated_at TIMESTAMP;
ALTER TABLE audit_logs ADD COLUMN created_by VARCHAR(255);
ALTER TABLE audit_logs ADD COLUMN updated_by VARCHAR(255);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);

INSERT INTO permissions (name) VALUES ('AUDIT_VIEW') ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SYSTEM_ADMIN' AND p.name = 'AUDIT_VIEW'
ON CONFLICT DO NOTHING;
