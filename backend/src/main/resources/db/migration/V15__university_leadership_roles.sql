-- University leadership roles are assigned from the live organisation chart.
-- Renaming in place preserves existing user-role assignments and audit history.
UPDATE roles SET name = 'DEAN', description = 'Head of a Faculty: manages its departments, units, staff records and appraisal visibility'
WHERE name = 'FACULTY_ROLE';

UPDATE roles SET name = 'HOD', description = 'Head of a Department: manages its units, staff records and appraisal visibility'
WHERE name = 'DEPARTMENT_ROLE';

UPDATE roles SET name = 'HOU', description = 'Head of a Unit: appraises staff assigned to that unit'
WHERE name = 'UNIT_ROLE';

INSERT INTO roles (name, description) VALUES
    ('STAFF', 'University staff self-service access: profile, leave, appraisal and personal records')
ON CONFLICT DO NOTHING;
