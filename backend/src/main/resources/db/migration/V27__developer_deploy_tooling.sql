-- DEVELOPER role + DEPLOYMENT_TRIGGER permission for local push/deploy tooling (see com.uniservice.devops).
-- Granted to the 'developer' account seeded in V22.

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

-- The 'developer' account itself is seeded by V22 (developer@uniservice.local / Developer@123).
-- Just add the DEVELOPER role to it here so it also gets DEPLOYMENT_TRIGGER.
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'developer' AND r.name = 'DEVELOPER'
ON CONFLICT DO NOTHING;
