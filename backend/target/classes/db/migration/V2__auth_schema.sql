CREATE TABLE permissions(
 id BIGSERIAL PRIMARY KEY,
 name VARCHAR(150) UNIQUE NOT NULL
);

CREATE TABLE role_permissions(
 role_id BIGINT REFERENCES roles(id),
 permission_id BIGINT REFERENCES permissions(id),
 PRIMARY KEY(role_id, permission_id)
);

CREATE TABLE refresh_tokens(
 id BIGSERIAL PRIMARY KEY,
 user_id BIGINT REFERENCES users(id),
 token TEXT NOT NULL,
 expires_at TIMESTAMP NOT NULL
);

CREATE TABLE audit_logs(
 id BIGSERIAL PRIMARY KEY,
 username VARCHAR(100),
 action VARCHAR(255),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
