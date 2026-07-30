-- Performance & Appraisals: annual appraisal cycles opened by HR, with a
-- 4-stage workflow (Staff -> Head of Unit -> Staff counter-comment -> Head of
-- Department) per the University of Ibadan Annual Staff Appraisal Form.

CREATE TABLE appraisal_cycles (
    id BIGSERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE UNIQUE INDEX uq_appraisal_cycles_year ON appraisal_cycles (year);

CREATE TABLE appraisal_forms (
    id BIGSERIAL PRIMARY KEY,
    cycle_id BIGINT NOT NULL REFERENCES appraisal_cycles(id),
    staff_profile_id BIGINT NOT NULL REFERENCES staff_profiles(id),
    status VARCHAR(35) NOT NULL DEFAULT 'STAFF_DRAFT' CHECK (status IN (
        'STAFF_DRAFT', 'AWAITING_UNIT_HEAD', 'AWAITING_STAFF_COUNTER_COMMENT',
        'AWAITING_DEPARTMENT_HEAD', 'COMPLETED'
    )),

    -- Staff stage
    schedule_of_duties VARCHAR(500),

    -- Head of Unit stage: 13 job performance characteristics, each rated 1 (Poor) - 5 (Outstanding)
    rating_quality_of_work INTEGER,
    rating_knowledge_of_work INTEGER,
    rating_performance_under_stress INTEGER,
    rating_initiative INTEGER,
    rating_adaptability INTEGER,
    rating_resourcefulness INTEGER,
    rating_team_spirit INTEGER,
    rating_job_presence INTEGER,
    rating_administrative_ability INTEGER,
    rating_attitude_to_work INTEGER,
    rating_knowledge_of_ict INTEGER,
    rating_punctuality INTEGER,
    rating_appearance INTEGER,
    loyalty_to_institution VARCHAR(1000),
    overall_grading VARCHAR(20) CHECK (overall_grading IN (
        'OUTSTANDING', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'SATISFACTORY', 'FAIR', 'POOR'
    )),
    courses_attended VARCHAR(1000),
    training_needs VARCHAR(1000),
    promotability VARCHAR(20) CHECK (promotability IN ('WELL_FITTED', 'FITTED', 'NOT_FITTED')),
    promotability_comments VARCHAR(1000),
    long_term_potentials VARCHAR(1000),
    general_remarks VARCHAR(2000),
    served_under_reporting_officer_years INTEGER,
    number_of_queries INTEGER,
    pending_disciplinary_action VARCHAR(500),
    concluded_disciplinary_action VARCHAR(500),
    unit_head_id BIGINT REFERENCES users(id),
    unit_head_post VARCHAR(150),
    unit_head_signed_at TIMESTAMP,

    -- Staff counter-comment stage
    staff_comments VARCHAR(1000),
    staff_commented_at TIMESTAMP,

    -- Head of Department stage
    department_head_comments VARCHAR(1000),
    department_head_id BIGINT REFERENCES users(id),
    department_head_signed_at TIMESTAMP,

    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE UNIQUE INDEX uq_appraisal_forms_cycle_staff ON appraisal_forms (cycle_id, staff_profile_id);

CREATE TABLE appraisal_sick_leaves (
    id BIGSERIAL PRIMARY KEY,
    appraisal_form_id BIGINT NOT NULL REFERENCES appraisal_forms(id),
    from_date DATE,
    to_date DATE,
    number_of_days INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

INSERT INTO permissions (name) VALUES
    ('APPRAISAL_READ'),
    ('APPRAISAL_MANAGE')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SYSTEM_ADMIN' AND p.name IN ('APPRAISAL_READ', 'APPRAISAL_MANAGE')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'HR_ADMIN' AND p.name IN ('APPRAISAL_READ', 'APPRAISAL_MANAGE')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'AUDITOR' AND p.name = 'APPRAISAL_READ'
ON CONFLICT DO NOTHING;
