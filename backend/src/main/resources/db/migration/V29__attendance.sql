-- Daily staff attendance (clock in / clock out); see com.uniservice.attendance.
CREATE TABLE attendance_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    work_date DATE NOT NULL,
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    late BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uq_attendance_user_date UNIQUE (user_id, work_date)
);
CREATE INDEX idx_attendance_work_date ON attendance_records (work_date);

INSERT INTO permissions (name) VALUES ('ATTENDANCE_VIEW_ALL') ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('SYSTEM_ADMIN', 'HR_ADMIN', 'HR_STAFF', 'HR_DIRECTOR') AND p.name = 'ATTENDANCE_VIEW_ALL'
ON CONFLICT DO NOTHING;
