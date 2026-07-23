-- Development seed
INSERT INTO users(username,password_hash,enabled)
VALUES(
'admin',
'$2a$10$PLACEHOLDER_BCRYPT_HASH',
true
)
ON CONFLICT DO NOTHING;
