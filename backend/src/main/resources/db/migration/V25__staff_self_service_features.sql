-- Staff self-service additions: emergency contact info, qualification proof documents,
-- generic file storage, and per-user notification preference.

ALTER TABLE staff_profiles ADD COLUMN emergency_contact_name VARCHAR(150);
ALTER TABLE staff_profiles ADD COLUMN emergency_contact_relationship VARCHAR(100);
ALTER TABLE staff_profiles ADD COLUMN emergency_contact_phone VARCHAR(30);

ALTER TABLE academic_qualifications ADD COLUMN document_url VARCHAR(500);

ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE stored_documents (
    id BIGSERIAL PRIMARY KEY,
    storage_key VARCHAR(64) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(150),
    size_bytes BIGINT NOT NULL,
    uploaded_by_user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE UNIQUE INDEX uq_stored_documents_storage_key ON stored_documents (storage_key);
