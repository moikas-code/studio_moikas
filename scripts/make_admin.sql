-- Script to make a user an admin
-- Replace 'your-email@example.com' with your actual email address

UPDATE users 
SET role = 'admin' 
WHERE email = 'moikapy@devmoi.com';

-- Verify the update
SELECT id, email, role, created_at 
FROM users 
WHERE email = 'moikapy@devmoi.com';