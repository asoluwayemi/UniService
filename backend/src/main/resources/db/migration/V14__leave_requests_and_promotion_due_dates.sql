-- Employee self-service leave workflow and an explicit HR-managed promotion review date.
ALTER TABLE staff_profiles ADD COLUMN promotion_due_date DATE;

CREATE TABLE leave_requests (
    id BIGSERIAL PRIMARY KEY,
    staff_profile_id BIGINT NOT NULL REFERENCES staff_profiles(id),
    leave_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    number_of_days INTEGER NOT NULL,
    reason VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewer_id BIGINT REFERENCES users(id),
    reviewer_comment VARCHAR(1000),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT chk_leave_request_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_leave_request_days CHECK (number_of_days > 0),
    CONSTRAINT chk_leave_request_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
);

CREATE INDEX idx_leave_requests_staff_profile ON leave_requests(staff_profile_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
