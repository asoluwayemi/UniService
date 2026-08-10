-- Headship-derived RBAC: access now flows from a person's position in the org
-- chart (who they are Head of), layered on top of the existing flat roles.
--
-- HOD_DEAN is renamed in place to DEPARTMENT_ROLE (same technique V7 used for
-- SUPER_ADMIN -> SYSTEM_ADMIN, preserving existing user_roles FK links) and its
-- grants move from blanket STAFF_READ/ORG_READ to the new subtree-scoped
-- permissions below. COLLEGE_ADMIN, FACULTY_ROLE, UNIT_ROLE, HR_STAFF are new.
-- HR_ADMIN is reused as-is for "Head of HR" rather than renamed.
--
-- Auto-assignment of these roles based on OrgUnit.head is handled in Java
-- (RoleSyncService), triggered from OrgChangeRequestService's approval flow —
-- this migration only creates the roles/permissions/grants they need.

UPDATE roles SET name = 'DEPARTMENT_ROLE',
    description = 'Derived from headship of a Department: sees own profile plus staff/org/appraisal data within that department''s subtree (including its Units)'
    WHERE name = 'HOD_DEAN';

INSERT INTO roles (name, description) VALUES
    ('COLLEGE_ADMIN', 'Derived from headship of a College: university-wide staff/org/appraisal visibility and management, same tier as Head of HR'),
    ('FACULTY_ROLE', 'Derived from headship of a Faculty: sees own profile plus staff/org/appraisal data within that faculty''s subtree'),
    ('UNIT_ROLE', 'Derived from headship of a Unit: own profile plus the existing appraisal-review capability for staff in the unit'),
    ('HR_STAFF', 'Derived from org placement under the HR unit (non-head): staff-record update rights and HR portal access')
ON CONFLICT DO NOTHING;

INSERT INTO permissions (name) VALUES
    ('STAFF_READ_SUBTREE'),
    ('ORG_READ_SUBTREE'),
    ('APPRAISAL_READ_SUBTREE'),
    ('HR_USER_MANAGE'),
    ('HR_PORTAL_ACCESS')
ON CONFLICT DO NOTHING;

-- DEPARTMENT_ROLE (formerly HOD_DEAN): replace blanket grants with subtree grants.
DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE name = 'DEPARTMENT_ROLE');
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'DEPARTMENT_ROLE' AND p.name IN ('STAFF_READ_SUBTREE', 'ORG_READ_SUBTREE', 'APPRAISAL_READ_SUBTREE');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'FACULTY_ROLE' AND p.name IN ('STAFF_READ_SUBTREE', 'ORG_READ_SUBTREE', 'APPRAISAL_READ_SUBTREE')
ON CONFLICT DO NOTHING;

-- UNIT_ROLE intentionally gets no blanket/subtree read permission: a Unit head's
-- appraisal-review capability is already granted per-object by AppraisalService
-- resolving OrgUnit.head, not by a standing permission.

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'COLLEGE_ADMIN' AND p.name IN
    ('STAFF_READ', 'STAFF_WRITE', 'ORG_READ', 'ORG_WRITE', 'APPRAISAL_READ', 'APPRAISAL_MANAGE', 'HR_PORTAL_ACCESS')
ON CONFLICT DO NOTHING;

-- HR_ADMIN already has STAFF_READ, STAFF_WRITE, ORG_READ (V7) and APPRAISAL_READ,
-- APPRAISAL_MANAGE (V11). Add what it's missing now that it doubles as "Head of HR".
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'HR_ADMIN' AND p.name IN ('ORG_WRITE', 'HR_USER_MANAGE', 'HR_PORTAL_ACCESS')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'HR_STAFF' AND p.name IN ('STAFF_READ', 'STAFF_WRITE', 'HR_PORTAL_ACCESS')
ON CONFLICT DO NOTHING;

-- SYSTEM_ADMIN's original grant (V7) was a point-in-time cross join over the
-- permissions that existed then; re-grant explicitly, same reason V11 had to.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SYSTEM_ADMIN' AND p.name IN
    ('STAFF_READ_SUBTREE', 'ORG_READ_SUBTREE', 'APPRAISAL_READ_SUBTREE', 'HR_USER_MANAGE', 'HR_PORTAL_ACCESS')
ON CONFLICT DO NOTHING;

-- Designates a single active org unit as "the HR unit" for role-derivation
-- purposes. Set via the existing change-request CREATE/UPDATE flow.
ALTER TABLE org_units ADD COLUMN is_hr_unit BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX uq_org_units_is_hr_unit_active ON org_units (is_hr_unit)
    WHERE is_hr_unit = TRUE AND status = 'ACTIVE';

ALTER TABLE org_unit_change_requests ADD COLUMN proposed_is_hr_unit BOOLEAN;
