-- Migrate all staff accounts to use email as username

UPDATE users
SET username = email
WHERE email IS NOT NULL AND email != '' AND username != 'admin';
