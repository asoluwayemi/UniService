-- University career progression identity fields and a traceable promotion application workflow.
ALTER TABLE staff_profiles ADD COLUMN grade_level INTEGER;
ALTER TABLE staff_profiles ADD COLUMN grade_step INTEGER;
ALTER TABLE staff_profiles ADD COLUMN cadre VARCHAR(150);
ALTER TABLE staff_profiles ADD COLUMN ippis_number VARCHAR(50);
ALTER TABLE staff_profiles ADD COLUMN nin VARCHAR(20);
ALTER TABLE staff_profiles ADD COLUMN tin VARCHAR(50);

CREATE UNIQUE INDEX uq_staff_profiles_ippis_number ON staff_profiles(ippis_number) WHERE ippis_number IS NOT NULL;
CREATE UNIQUE INDEX uq_staff_profiles_nin ON staff_profiles(nin) WHERE nin IS NOT NULL;

CREATE TABLE promotion_applications (
    id BIGSERIAL PRIMARY KEY,
    staff_profile_id BIGINT NOT NULL REFERENCES staff_profiles(id),
    current_grade_level INTEGER NOT NULL,
    requested_grade_level INTEGER NOT NULL,
    eligibility_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    staff_statement VARCHAR(2000),
    reviewer_comment VARCHAR(2000),
    reviewed_by BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT chk_promotion_grade_progression CHECK (requested_grade_level > current_grade_level)
);

CREATE INDEX idx_promotion_applications_staff_profile ON promotion_applications(staff_profile_id);
CREATE INDEX idx_promotion_applications_status ON promotion_applications(status);
