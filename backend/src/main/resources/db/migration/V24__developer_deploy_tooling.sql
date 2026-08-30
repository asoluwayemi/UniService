-- DEVELOPER role + DEPLOYMENT_TRIGGER permission, and a seeded developer account for local
-- push/deploy tooling (see com.uniservice.devops).

CREATE TABLE deployment_runs (
    id BIGSERIAL PRIMARY KEY,
    run_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    triggered_by BIGINT NOT NULL REFERENCES users(id),
    output TEXT,
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

INSERT INTO roles (name, description, created_at, updated_at)
VALUES ('DEVELOPER', 'Engineering access for push/deploy tooling', now(), now())
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name) VALUES ('DEPLOYMENT_TRIGGER') ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'DEVELOPER' AND p.name = 'DEPLOYMENT_TRIGGER'
ON CONFLICT DO NOTHING;

-- Also let SYSTEM_ADMIN trigger deploys, since they already hold every other manage permission.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SYSTEM_ADMIN' AND p.name = 'DEPLOYMENT_TRIGGER'
ON CONFLICT DO NOTHING;

-- Dev-only credential: username 'developer', password 'DevOps123!' (change before any shared/deployed use).
INSERT INTO users (username, email, first_name, last_name, password_hash, enabled, created_at, updated_at)
VALUES ('developer', 'developer@uniservice.local', 'Dev', 'Ops',
        '$2a$10$q/Ezvd8D2PsFwdWH.m.RQOmbj4c3Mwt7hFa0W0xP85vPxJ8K/zjRy', true, now(), now())
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'developer' AND r.name = 'DEVELOPER'
ON CONFLICT DO NOTHING;
