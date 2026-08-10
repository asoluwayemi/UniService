-- Seed sample staff records and organizational units from institutional dataset
-- Dev credentials for seeded users: Password is 'ChangeMe123!'

-- 1. Insert Organizational Units (Faculties, Departments, Units)
INSERT INTO org_units (name, code, type, status, created_at, updated_at)
VALUES 
    ('College of Medicine', 'CHS', 'COLLEGE', 'ACTIVE', NOW(), NOW()),
    ('Faculty of Basic Medical Sciences', 'FBMS', 'FACULTY', 'ACTIVE', NOW(), NOW()),
    ('Faculty of Clinical Sciences', 'FCS', 'FACULTY', 'ACTIVE', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Parent linkage for Faculties
UPDATE org_units SET parent_id = (SELECT id FROM org_units WHERE code = 'CHS') WHERE code IN ('FBMS', 'FCS');

INSERT INTO org_units (name, code, type, parent_id, status, created_at, updated_at)
VALUES
    ('Department of Pathology', 'PATH', 'DEPARTMENT', (SELECT id FROM org_units WHERE code = 'FBMS'), 'ACTIVE', NOW(), NOW()),
    ('Department of Haematology', 'HAEM', 'DEPARTMENT', (SELECT id FROM org_units WHERE code = 'FBMS'), 'ACTIVE', NOW(), NOW()),
    ('Department of Medicine', 'MED', 'DEPARTMENT', (SELECT id FROM org_units WHERE code = 'FCS'), 'ACTIVE', NOW(), NOW()),
    ('Department of Basic Medical Laboratory Sciences', 'BMLS', 'DEPARTMENT', (SELECT id FROM org_units WHERE code = 'FBMS'), 'ACTIVE', NOW(), NOW()),
    ('Human Resource & Development Unit', 'HRDU', 'UNIT', (SELECT id FROM org_units WHERE code = 'CHS'), 'ACTIVE', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 2. Insert User Accounts (Password: ChangeMe123!)
INSERT INTO users (username, password_hash, email, first_name, last_name, enabled, created_at, updated_at)
VALUES
    ('l.oladejo', '$2a$10$BtE/W9FG3HGH.dkqZ8xosuPdP/wwr0wlxqqL/9wXVkMqiETrMgBVa', 'engineersanjo@yahoo.co.uk', 'Lateef Omosanjo', 'Oladejo', true, NOW(), NOW()),
    ('a.oluwayemi', '$2a$10$BtE/W9FG3HGH.dkqZ8xosuPdP/wwr0wlxqqL/9wXVkMqiETrMgBVa', 'asoluwayemi@gmail.com', 'Abayomi Samuel', 'Oluwayemi', true, NOW(), NOW()),
    ('t.akingbola', '$2a$10$BtE/W9FG3HGH.dkqZ8xosuPdP/wwr0wlxqqL/9wXVkMqiETrMgBVa', 'titiakingbola@yahoo.com', 'Titilola Stella', 'Akingbola', true, NOW(), NOW()),
    ('j.ogunbiyi', '$2a$10$BtE/W9FG3HGH.dkqZ8xosuPdP/wwr0wlxqqL/9wXVkMqiETrMgBVa', 'f_ogunbiyi@yahoo.com', 'John Olufemi', 'Ogunbiyi', true, NOW(), NOW()),
    ('a.akere', '$2a$10$BtE/W9FG3HGH.dkqZ8xosuPdP/wwr0wlxqqL/9wXVkMqiETrMgBVa', 'adeakere@yahoo.co.uk', 'Adegboyega', 'Akere', true, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Assign Roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username IN ('l.oladejo', 'a.oluwayemi', 'a.akere') AND r.name = 'STAFF'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 't.akingbola' AND r.name IN ('STAFF', 'DEAN')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'j.ogunbiyi' AND r.name IN ('STAFF', 'HOD')
ON CONFLICT DO NOTHING;

-- 3. Set Headships on Org Units
UPDATE org_units SET head_id = (SELECT id FROM users WHERE username = 't.akingbola') WHERE code = 'FBMS';
UPDATE org_units SET head_id = (SELECT id FROM users WHERE username = 'j.ogunbiyi') WHERE code = 'PATH';

-- 4. Insert Staff Profiles
INSERT INTO staff_profiles (
    user_id, staff_number, gender, phone, category, designation, org_unit_id, employment_type, employment_status, date_of_hire, created_at, updated_at
)
VALUES
    (
        (SELECT id FROM users WHERE username = 'l.oladejo'),
        'CM/PF.2739', 'MALE', '07062775718', 'NON_ACADEMIC', 'Higher Data Processing Officer',
        (SELECT id FROM org_units WHERE code = 'HRDU'), 'FULL_TIME', 'ACTIVE', '2006-11-07', NOW(), NOW()
    ),
    (
        (SELECT id FROM users WHERE username = 'a.oluwayemi'),
        'CM/PF.3287', 'MALE', '07038476839', 'NON_ACADEMIC', 'Senior Technical Officer / Data Processing Officer',
        (SELECT id FROM org_units WHERE code = 'BMLS'), 'FULL_TIME', 'ACTIVE', '2015-01-02', NOW(), NOW()
    ),
    (
        (SELECT id FROM users WHERE username = 't.akingbola'),
        'CM/PF.2418', 'FEMALE', '08037287188', 'ACADEMIC', 'Professor of Pathology (Dean, FBMS)',
        (SELECT id FROM org_units WHERE code = 'HAEM'), 'FULL_TIME', 'ACTIVE', '2010-06-15', NOW(), NOW()
    ),
    (
        (SELECT id FROM users WHERE username = 'j.ogunbiyi'),
        'CM/PF.1834', 'MALE', '08023231728', 'ACADEMIC', 'Professor & Head of Department (Pathology)',
        (SELECT id FROM org_units WHERE code = 'PATH'), 'FULL_TIME', 'ACTIVE', '2002-04-01', NOW(), NOW()
    ),
    (
        (SELECT id FROM users WHERE username = 'a.akere'),
        'CM/PF.2801', 'MALE', '08033257211', 'ACADEMIC', 'Professor of Gastroenterology',
        (SELECT id FROM org_units WHERE code = 'MED'), 'FULL_TIME', 'ACTIVE', '2007-09-01', NOW(), NOW()
    )
ON CONFLICT (user_id) DO NOTHING;

-- 5. Insert Academic Qualifications
INSERT INTO academic_qualifications (staff_profile_id, degree, field_of_study, institution, year_obtained, created_at, updated_at)
VALUES
    ((SELECT id FROM staff_profiles WHERE staff_number = 'CM/PF.2739'), 'HND', 'Computer Science', 'Polytechnic', 2023, NOW(), NOW()),
    ((SELECT id FROM staff_profiles WHERE staff_number = 'CM/PF.3287'), 'B.Sc. (Hons)', 'Computer Science', 'Ladoke Akintola Univ. of Technol.', 2023, NOW(), NOW()),
    ((SELECT id FROM staff_profiles WHERE staff_number = 'CM/PF.2418'), 'FMC Path.', 'Pathology', 'National Postgraduate Medical College', 2012, NOW(), NOW()),
    ((SELECT id FROM staff_profiles WHERE staff_number = 'CM/PF.1834'), 'FWACP', 'Laboratory Medicine', 'West African College of Physicians', 2000, NOW(), NOW()),
    ((SELECT id FROM staff_profiles WHERE staff_number = 'CM/PF.2801'), 'FWACP', 'Gastroenterology', 'West African College of Physicians', 2005, NOW(), NOW())
ON CONFLICT DO NOTHING;
