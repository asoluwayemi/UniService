-- Seed a developer/test account with SYSTEM_ADMIN role.
-- Credentials: developer@uniservice.local / Developer@123
-- (bcrypt hash of 'Developer@123')
INSERT INTO users (username, email, first_name, last_name, password_hash, enabled, created_at)
VALUES (
    'developer',
    'developer@uniservice.local',
    'System',
    'Developer',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVyNEDR15e',
    true,
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Assign SYSTEM_ADMIN role to the developer account
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'developer@uniservice.local'
  AND r.name = 'SYSTEM_ADMIN'
ON CONFLICT DO NOTHING;
