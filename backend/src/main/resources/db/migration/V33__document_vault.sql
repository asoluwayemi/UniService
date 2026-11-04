-- Document vault: private staff records stored via com.uniservice.storage (see com.uniservice.vault).
CREATE TABLE vault_documents (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id BIGINT NOT NULL REFERENCES users(id),
    stored_document_id BIGINT NOT NULL REFERENCES stored_documents(id),
    category VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    expires_on DATE,
    visible_to_owner BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP, updated_at TIMESTAMP, created_by VARCHAR(255), updated_by VARCHAR(255)
);
CREATE INDEX idx_vault_documents_owner ON vault_documents (owner_user_id);
CREATE INDEX idx_vault_documents_expires ON vault_documents (expires_on);

INSERT INTO permissions (name) VALUES ('VAULT_MANAGE') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('SYSTEM_ADMIN', 'HR_ADMIN', 'HR_DIRECTOR', 'HR_STAFF') AND p.name = 'VAULT_MANAGE'
ON CONFLICT DO NOTHING;
