-- Recruitment: job postings and the applications pipeline (see com.uniservice.recruitment).
CREATE TABLE job_postings (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    department VARCHAR(200) NOT NULL,
    category VARCHAR(20) NOT NULL,
    description VARCHAR(4000) NOT NULL,
    status VARCHAR(20) NOT NULL,
    closing_date DATE,
    created_at TIMESTAMP, updated_at TIMESTAMP, created_by VARCHAR(255), updated_by VARCHAR(255)
);

CREATE TABLE job_applications (
    id BIGSERIAL PRIMARY KEY,
    posting_id BIGINT NOT NULL REFERENCES job_postings(id),
    applicant_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(40),
    cover_note VARCHAR(2000),
    stage VARCHAR(20) NOT NULL,
    stage_note VARCHAR(1000),
    applied_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP, updated_at TIMESTAMP, created_by VARCHAR(255), updated_by VARCHAR(255),
    CONSTRAINT uq_application_posting_email UNIQUE (posting_id, email)
);
CREATE INDEX idx_job_applications_posting ON job_applications (posting_id);

INSERT INTO permissions (name) VALUES ('RECRUITMENT_MANAGE') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('SYSTEM_ADMIN', 'HR_ADMIN', 'HR_DIRECTOR', 'HR_STAFF') AND p.name = 'RECRUITMENT_MANAGE'
ON CONFLICT DO NOTHING;
