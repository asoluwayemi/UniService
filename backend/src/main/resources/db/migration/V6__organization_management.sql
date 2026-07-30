-- Organization Management: org units (faculties/departments/units) with an
-- approval-workflow change-request table, plus generic in-app notifications.

CREATE TABLE org_units (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(30) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('FACULTY', 'DEPARTMENT', 'UNIT')),
    parent_id BIGINT REFERENCES org_units(id),
    head_id BIGINT REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- The real concurrency backstop: app-level "is this code already active?" checks are just
-- UX niceties, this partial unique index is what actually prevents duplicate active codes
-- when two change requests approving the same code race each other.
CREATE UNIQUE INDEX uq_org_units_code_active ON org_units (LOWER(code)) WHERE status = 'ACTIVE';

CREATE TABLE org_unit_change_requests (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'ARCHIVE')),
    target_org_unit_id BIGINT REFERENCES org_units(id),
    proposed_name VARCHAR(150),
    proposed_code VARCHAR(30),
    proposed_type VARCHAR(20) CHECK (proposed_type IN ('FACULTY', 'DEPARTMENT', 'UNIT')),
    proposed_parent_id BIGINT REFERENCES org_units(id),
    proposed_head_id BIGINT REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    requested_by BIGINT NOT NULL REFERENCES users(id),
    reviewed_by BIGINT REFERENCES users(id),
    review_notes TEXT,
    reviewed_at TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    link VARCHAR(255),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);
