-- Fix schema drift between V1-V4 and the JPA entities, and seed real RBAC data
-- (permissions table was previously created but never populated).

-- BaseEntity (extended by every entity) declares created_at/updated_at/created_by/updated_by,
-- but V1/V2 never added them to roles, permissions, or refresh_tokens (and users is missing three of the four).
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP;
ALTER TABLE users ADD COLUMN created_by VARCHAR(255);
ALTER TABLE users ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE roles ADD COLUMN description VARCHAR(255);
ALTER TABLE roles ADD COLUMN created_at TIMESTAMP;
ALTER TABLE roles ADD COLUMN updated_at TIMESTAMP;
ALTER TABLE roles ADD COLUMN created_by VARCHAR(255);
ALTER TABLE roles ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE permissions ADD COLUMN description VARCHAR(255);
ALTER TABLE permissions ADD COLUMN created_at TIMESTAMP;
ALTER TABLE permissions ADD COLUMN updated_at TIMESTAMP;
ALTER TABLE permissions ADD COLUMN created_by VARCHAR(255);
ALTER TABLE permissions ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE refresh_tokens ADD COLUMN created_at TIMESTAMP;
ALTER TABLE refresh_tokens ADD COLUMN updated_at TIMESTAMP;
ALTER TABLE refresh_tokens ADD COLUMN created_by VARCHAR(255);
ALTER TABLE refresh_tokens ADD COLUMN updated_by VARCHAR(255);

ALTER TABLE users ADD COLUMN email VARCHAR(120);
ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
ALTER TABLE refresh_tokens ADD COLUMN revoked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE refresh_tokens ADD CONSTRAINT uq_refresh_tokens_token UNIQUE (token);

-- Backfill the seeded admin row (V3) so the new NOT NULL columns can be enforced.
-- Dev-only credential: username 'admin', password 'ChangeMe123!' (change before any shared/deployed use).
UPDATE users
SET email = 'admin@uniservice.local',
    first_name = 'System',
    last_name = 'Admin',
    password_hash = '$2a$10$BtE/W9FG3HGH.dkqZ8xosuPdP/wwr0wlxqqL/9wXVkMqiETrMgBVa'
WHERE username = 'admin';

ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO permissions (name) VALUES
    ('STAFF_READ'),
    ('STAFF_WRITE'),
    ('ORG_READ'),
    ('ORG_WRITE'),
    ('USER_MANAGE')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'HR_DIRECTOR' AND p.name IN ('STAFF_READ', 'STAFF_WRITE', 'ORG_READ')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'REGISTRAR' AND p.name IN ('STAFF_READ', 'ORG_READ', 'ORG_WRITE')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'LECTURER' AND p.name = 'STAFF_READ'
ON CONFLICT DO NOTHING;
