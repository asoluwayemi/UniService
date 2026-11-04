-- Payroll: salary scale, monthly runs and payslips (see com.uniservice.payroll).
CREATE TABLE salary_scales (
    id BIGSERIAL PRIMARY KEY,
    grade_level INT NOT NULL UNIQUE,
    basic_monthly NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMP, updated_at TIMESTAMP, created_by VARCHAR(255), updated_by VARCHAR(255)
);

-- PLACEHOLDER figures so the feature works end to end. Finance must replace them with the real scale.
INSERT INTO salary_scales (grade_level, basic_monthly, created_at, updated_at) VALUES
    (1, 40000.00, now(), now()),
    (2, 56500.00, now(), now()),
    (3, 76000.00, now(), now()),
    (4, 98500.00, now(), now()),
    (5, 124000.00, now(), now()),
    (6, 152500.00, now(), now()),
    (7, 184000.00, now(), now()),
    (8, 218500.00, now(), now()),
    (9, 256000.00, now(), now()),
    (10, 296500.00, now(), now()),
    (11, 340000.00, now(), now()),
    (12, 386500.00, now(), now()),
    (13, 436000.00, now(), now()),
    (14, 488500.00, now(), now()),
    (15, 544000.00, now(), now()),
    (16, 602500.00, now(), now()),
    (17, 664000.00, now(), now());

CREATE TABLE payroll_runs (
    id BIGSERIAL PRIMARY KEY,
    period VARCHAR(7) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    staff_count INT NOT NULL DEFAULT 0,
    skipped_count INT NOT NULL DEFAULT 0,
    total_gross NUMERIC(16,2) NOT NULL DEFAULT 0,
    total_net NUMERIC(16,2) NOT NULL DEFAULT 0,
    generated_by VARCHAR(255),
    published_at TIMESTAMP,
    created_at TIMESTAMP, updated_at TIMESTAMP, created_by VARCHAR(255), updated_by VARCHAR(255)
);

CREATE TABLE payslips (
    id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES payroll_runs(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    staff_number VARCHAR(50),
    full_name VARCHAR(255) NOT NULL,
    grade_level INT NOT NULL,
    basic NUMERIC(14,2) NOT NULL,
    housing NUMERIC(14,2) NOT NULL,
    transport NUMERIC(14,2) NOT NULL,
    gross NUMERIC(14,2) NOT NULL,
    pension NUMERIC(14,2) NOT NULL,
    tax NUMERIC(14,2) NOT NULL,
    net NUMERIC(14,2) NOT NULL,
    bank_name VARCHAR(150),
    account_last4 VARCHAR(4),
    created_at TIMESTAMP, updated_at TIMESTAMP, created_by VARCHAR(255), updated_by VARCHAR(255),
    CONSTRAINT uq_payslip_run_user UNIQUE (run_id, user_id)
);
CREATE INDEX idx_payslips_user ON payslips (user_id);

INSERT INTO permissions (name) VALUES ('PAYROLL_MANAGE') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('SYSTEM_ADMIN', 'FINANCE_OFFICER') AND p.name = 'PAYROLL_MANAGE'
ON CONFLICT DO NOTHING;
