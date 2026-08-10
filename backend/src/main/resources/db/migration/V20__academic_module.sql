-- Academic Staff Module Schema: Courses, Publications, Supervision, Academic Leaves, Documents

CREATE TABLE academic_courses (
    id BIGSERIAL PRIMARY KEY,
    staff_profile_id BIGINT NOT NULL REFERENCES staff_profiles(id),
    course_code VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    level VARCHAR(50) NOT NULL,
    credit_units INTEGER NOT NULL DEFAULT 3,
    enrolled_students_count INTEGER NOT NULL DEFAULT 0,
    semester VARCHAR(100) NOT NULL,
    syllabus_url VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE TABLE academic_publications (
    id BIGSERIAL PRIMARY KEY,
    staff_profile_id BIGINT NOT NULL REFERENCES staff_profiles(id),
    title VARCHAR(300) NOT NULL,
    journal_publisher VARCHAR(200) NOT NULL,
    year_published INTEGER NOT NULL,
    doi_isbn VARCHAR(100),
    category VARCHAR(30) NOT NULL CHECK (category IN ('JOURNAL', 'CONFERENCE', 'BOOK', 'PATENT')),
    impact_factor NUMERIC(5,2) DEFAULT 0.0,
    document_url VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE TABLE academic_supervisions (
    id BIGSERIAL PRIMARY KEY,
    staff_profile_id BIGINT NOT NULL REFERENCES staff_profiles(id),
    student_name VARCHAR(150) NOT NULL,
    matric_number VARCHAR(50) NOT NULL,
    programme VARCHAR(30) NOT NULL CHECK (programme IN ('PHD', 'MSC', 'MPHIL', 'RESIDENCY')),
    research_topic VARCHAR(300) NOT NULL,
    stage VARCHAR(100) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Seed initial sample data for seeded academic staff profiles
INSERT INTO academic_courses (staff_profile_id, course_code, title, level, credit_units, enrolled_students_count, semester, created_at, updated_at)
SELECT id, 'PATH 401', 'General Pathology & Histopathology', '400 Level', 4, 142, 'First Semester 2025/2026', NOW(), NOW()
FROM staff_profiles WHERE staff_number = 'CM/PF.1834'
ON CONFLICT DO NOTHING;

INSERT INTO academic_courses (staff_profile_id, course_code, title, level, credit_units, enrolled_students_count, semester, created_at, updated_at)
SELECT id, 'HAEM 503', 'Clinical Haematology & Transfusion Medicine', '500 Level', 3, 110, 'First Semester 2025/2026', NOW(), NOW()
FROM staff_profiles WHERE staff_number = 'CM/PF.2418'
ON CONFLICT DO NOTHING;

INSERT INTO academic_courses (staff_profile_id, course_code, title, level, credit_units, enrolled_students_count, semester, created_at, updated_at)
SELECT id, 'MED 601', 'Advanced Clinical Gastroenterology', 'Postgraduate (M.Sc/Ph.D)', 3, 24, 'Second Semester 2025/2026', NOW(), NOW()
FROM staff_profiles WHERE staff_number = 'CM/PF.2801'
ON CONFLICT DO NOTHING;

INSERT INTO academic_publications (staff_profile_id, title, journal_publisher, year_published, doi_isbn, category, impact_factor, created_at, updated_at)
SELECT id, 'Histopathological Patterns of Lymphomas in South-Western Nigeria', 'African Journal of Laboratory Medicine', 2024, '10.4102/ajlm.v13i1.214', 'JOURNAL', 3.4, NOW(), NOW()
FROM staff_profiles WHERE staff_number = 'CM/PF.1834'
ON CONFLICT DO NOTHING;

INSERT INTO academic_publications (staff_profile_id, title, journal_publisher, year_published, doi_isbn, category, impact_factor, created_at, updated_at)
SELECT id, 'Diagnostic Efficacy of Molecular Biomarkers in Gastric Carcinoma', 'Nigerian Medical Journal', 2023, '10.4103/nmj.nmj_88_23', 'JOURNAL', 2.1, NOW(), NOW()
FROM staff_profiles WHERE staff_number = 'CM/PF.2418'
ON CONFLICT DO NOTHING;

INSERT INTO academic_supervisions (staff_profile_id, student_name, matric_number, programme, research_topic, stage, created_at, updated_at)
SELECT id, 'Dr. Opeyemi Adebayo', 'PG/2022/19482', 'PHD', 'Genomic Profiling of Triple-Negative Breast Cancer in Nigerian Females', 'Data Analysis & Dissertation Writing', NOW(), NOW()
FROM staff_profiles WHERE staff_number = 'CM/PF.1834'
ON CONFLICT DO NOTHING;

INSERT INTO academic_supervisions (staff_profile_id, student_name, matric_number, programme, research_topic, stage, created_at, updated_at)
SELECT id, 'Dr. Ibrahim Bello', 'FMC/PATH/2021/04', 'RESIDENCY', 'Immunohistochemical Evaluation of Prostate Adenocarcinoma', 'Final Defense Submitted', NOW(), NOW()
FROM staff_profiles WHERE staff_number = 'CM/PF.2418'
ON CONFLICT DO NOTHING;
