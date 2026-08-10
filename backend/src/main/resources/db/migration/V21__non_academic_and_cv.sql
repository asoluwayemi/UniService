-- Non-Academic Staff Module Schema: Administrative Duties, Training & Certifications, Projects

CREATE TABLE non_academic_trainings (
    id BIGSERIAL PRIMARY KEY,
    staff_profile_id BIGINT NOT NULL REFERENCES staff_profiles(id),
    title VARCHAR(300) NOT NULL,
    organizer VARCHAR(200) NOT NULL,
    year_attended INTEGER NOT NULL,
    certificate_number VARCHAR(100),
    certificate_url VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE TABLE non_academic_projects (
    id BIGSERIAL PRIMARY KEY,
    staff_profile_id BIGINT NOT NULL REFERENCES staff_profiles(id),
    project_title VARCHAR(300) NOT NULL,
    role VARCHAR(150) NOT NULL,
    start_date DATE,
    end_date DATE,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Seed sample data for Non-Academic Staff (e.g. A.S. Oluwayemi, L.O. Oladejo)
INSERT INTO non_academic_trainings (staff_profile_id, title, organizer, year_attended, certificate_number, created_at, updated_at)
SELECT id, 'Advanced University Administrative Governance & Registry Operations', 'Association of Nigerian University Administrators (ANUA)', 2024, 'ANUA/2024/0921', NOW(), NOW()
FROM staff_profiles WHERE staff_number = 'ADM/PF.4019'
ON CONFLICT DO NOTHING;

INSERT INTO non_academic_trainings (staff_profile_id, title, organizer, year_attended, certificate_number, created_at, updated_at)
SELECT id, 'Digital Records Management & HR Analytics in Tertiary Institutions', 'Industrial Training Fund (ITF)', 2025, 'ITF/HR/2025/112', NOW(), NOW()
FROM staff_profiles WHERE staff_number = 'ADM/PF.5120'
ON CONFLICT DO NOTHING;

INSERT INTO non_academic_projects (staff_profile_id, project_title, role, status, description, created_at, updated_at)
SELECT id, 'Implementation of Automated Leave & Appraisal Processing System', 'Project Lead / Co-ordinator', 'COMPLETED', 'Digitized paper-based leave processing for 500+ faculty staff.', NOW(), NOW()
FROM staff_profiles WHERE staff_number = 'ADM/PF.4019'
ON CONFLICT DO NOTHING;
