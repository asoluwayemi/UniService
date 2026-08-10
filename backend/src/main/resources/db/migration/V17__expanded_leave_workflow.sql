-- Expanded leave lifecycle with grade-based balances, handover officer, resumption certificates, and allowance handoff.
ALTER TABLE leave_requests ADD COLUMN handover_officer_id BIGINT REFERENCES users(id);
ALTER TABLE leave_requests ADD COLUMN handover_notes VARCHAR(1000);
ALTER TABLE leave_requests ADD COLUMN handover_status VARCHAR(30) DEFAULT 'NOT_REQUIRED';

ALTER TABLE leave_requests ADD COLUMN resumption_date DATE;
ALTER TABLE leave_requests ADD COLUMN resumption_notes VARCHAR(1000);
ALTER TABLE leave_requests ADD COLUMN resumption_status VARCHAR(30) DEFAULT 'NOT_RESUMED';
ALTER TABLE leave_requests ADD COLUMN resumption_confirmed_at TIMESTAMP;
ALTER TABLE leave_requests ADD COLUMN resumption_confirmed_by BIGINT REFERENCES users(id);

ALTER TABLE leave_requests ADD COLUMN allowance_eligible BOOLEAN DEFAULT FALSE;
ALTER TABLE leave_requests ADD COLUMN allowance_handoff_status VARCHAR(30) DEFAULT 'NOT_ELIGIBLE';
ALTER TABLE leave_requests ADD COLUMN allowance_amount NUMERIC(15,2);

CREATE INDEX idx_leave_requests_handover_officer ON leave_requests(handover_officer_id);
