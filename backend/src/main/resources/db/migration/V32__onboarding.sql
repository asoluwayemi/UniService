-- Onboarding: a case per new hire with a task checklist (see com.uniservice.onboarding).
CREATE TABLE onboarding_cases (
    id BIGSERIAL PRIMARY KEY,
    new_hire_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    position VARCHAR(200) NOT NULL,
    department VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    application_id BIGINT UNIQUE REFERENCES job_applications(id),
    user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP, updated_at TIMESTAMP, created_by VARCHAR(255), updated_by VARCHAR(255)
);

CREATE TABLE onboarding_tasks (
    id BIGSERIAL PRIMARY KEY,
    case_id BIGINT NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE,
    sort_order INT NOT NULL,
    title VARCHAR(250) NOT NULL,
    owner_team VARCHAR(30) NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    done_at TIMESTAMP,
    done_by VARCHAR(255),
    created_at TIMESTAMP, updated_at TIMESTAMP, created_by VARCHAR(255), updated_by VARCHAR(255)
);
CREATE INDEX idx_onboarding_tasks_case ON onboarding_tasks (case_id);

INSERT INTO permissions (name) VALUES ('ONBOARDING_MANAGE') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('SYSTEM_ADMIN', 'HR_ADMIN', 'HR_DIRECTOR', 'HR_STAFF') AND p.name = 'ONBOARDING_MANAGE'
ON CONFLICT DO NOTHING;
