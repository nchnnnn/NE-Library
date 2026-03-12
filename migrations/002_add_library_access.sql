-- Migration: Add library access fields to users table

-- Add library_access column (allowed/blocked)
ALTER TABLE users ADD COLUMN library_access ENUM('allowed', 'blocked') DEFAULT 'allowed';

-- Add block_reason column
ALTER TABLE users ADD COLUMN block_reason TEXT;

-- Add blocked_at column
ALTER TABLE users ADD COLUMN blocked_at TIMESTAMP NULL;

-- Add blocked_by column (references user id)
ALTER TABLE users ADD COLUMN blocked_by INT;

-- Add foreign key for blocked_by
ALTER TABLE users ADD FOREIGN KEY (blocked_by) REFERENCES users(id) ON DELETE SET NULL;
