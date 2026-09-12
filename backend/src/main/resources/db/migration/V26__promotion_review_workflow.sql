-- Reviewer-side promotion workflow: exam/interview scheduling fields and a PROMOTION_MANAGE
-- permission granted to the same HR-cadre roles that already manage appraisals.

ALTER TABLE promotion_applications ADD COLUMN exam_scheduled_date DATE;
ALTER TABLE promotion_applications ADD COLUMN interview_scheduled_date DATE;

INSERT INTO permissions (name) VALUES ('PROMOTION_MANAGE') ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('HR_ADMIN', 'COLLEGE_ADMIN', 'SYSTEM_ADMIN') AND p.name = 'PROMOTION_MANAGE'
ON CONFLICT DO NOTHING;
