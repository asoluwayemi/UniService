-- Realign RBAC to the university's 7-role model. Roles are renamed in place (not
-- deleted/recreated) so existing user_roles FK links survive unchanged.
--   SUPER_ADMIN -> SYSTEM_ADMIN
--   HR_DIRECTOR -> HR_ADMIN
--   REGISTRAR   -> HOD_DEAN
--   LECTURER    -> ACADEMIC_STAFF
-- Plus 3 new roles: FINANCE_OFFICER, NON_ACADEMIC_STAFF, AUDITOR.
--
-- Permissions are re-mapped to each new role's real-world responsibility rather than
-- carried over blindly from the old role (e.g. REGISTRAR had ORG_WRITE; HOD_DEAN,
-- a departmental approver rather than an org-structure editor, does not).

UPDATE roles SET name = 'SYSTEM_ADMIN', description = 'Full system access: user accounts, role permissions, workflows, audit logs' WHERE name = 'SUPER_ADMIN';
UPDATE roles SET name = 'HR_ADMIN', description = 'Manages the staff lifecycle: recruitment, profile records, appraisals, exit clearance' WHERE name = 'HR_DIRECTOR';
UPDATE roles SET name = 'HOD_DEAN', description = 'Approves leave, reviews appraisals, assigns tasks, manages departmental rosters' WHERE name = 'REGISTRAR';
UPDATE roles SET name = 'ACADEMIC_STAFF', description = 'Self-service: payslips, leave requests, timetable, document requests' WHERE name = 'LECTURER';

INSERT INTO roles (name, description) VALUES
    ('FINANCE_OFFICER', 'Salary parameters, tax setup, allowance configuration, payroll generation'),
    ('NON_ACADEMIC_STAFF', 'Self-service: attendance clock-in, leave requests, helpdesk tickets, payslips'),
    ('AUDITOR', 'Read-only access to dashboards and reports for compliance and budget review')
ON CONFLICT DO NOTHING;

DELETE FROM role_permissions
WHERE role_id IN (SELECT id FROM roles WHERE name IN
    ('SYSTEM_ADMIN', 'HR_ADMIN', 'HOD_DEAN', 'ACADEMIC_STAFF', 'FINANCE_OFFICER', 'NON_ACADEMIC_STAFF', 'AUDITOR'));

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SYSTEM_ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'HR_ADMIN' AND p.name IN ('STAFF_READ', 'STAFF_WRITE', 'ORG_READ');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'FINANCE_OFFICER' AND p.name = 'STAFF_READ';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'HOD_DEAN' AND p.name IN ('STAFF_READ', 'ORG_READ');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'AUDITOR' AND p.name IN ('STAFF_READ', 'ORG_READ');

-- ACADEMIC_STAFF and NON_ACADEMIC_STAFF intentionally get no permissions: self-service
-- endpoints (e.g. GET /api/staff/me) only require authentication, not STAFF_READ, which
-- gates visibility into *other* people's records.
