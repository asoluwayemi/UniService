-- Read-only analytics dashboard (see com.uniservice.analytics). Sections inside it are further gated by each
-- module's own permission (payroll, recruitment, attendance, vault, onboarding).
INSERT INTO permissions (name) VALUES ('ANALYTICS_VIEW') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('SYSTEM_ADMIN', 'HR_ADMIN', 'HR_DIRECTOR', 'FINANCE_OFFICER') AND p.name = 'ANALYTICS_VIEW'
ON CONFLICT DO NOTHING;
