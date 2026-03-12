-- =====================================================
-- SEPARATE STAFF USERS AND BLOCKING INFORMATION
-- =====================================================

-- Create staff_users table for librarians, management, and admins
-- Only these roles can login to the system
CREATE TABLE IF NOT EXISTS staff_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    qr_code VARCHAR(255) UNIQUE,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_employee_id (employee_id),
    INDEX idx_email (email)
);

-- Insert staff users (from existing users with role_id 2, 3, 4)
INSERT INTO staff_users (role_id, employee_id, first_name, last_name, email, password, qr_code, status)
SELECT 
    role_id,
    employee_id,
    first_name,
    last_name,
    email,
    password,
    qr_code,
    status
FROM users 
WHERE role_id IN (2, 3, 4);

-- Create user_blocks table for blocking information
-- Separated from users table for better organization
CREATE TABLE IF NOT EXISTS user_blocks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    block_reason TEXT,
    blocked_at TIMESTAMP NULL,
    blocked_by INT,
    unblocked_at TIMESTAMP NULL,
    unblocked_by INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_by) REFERENCES staff_users(id) ON DELETE SET NULL,
    FOREIGN KEY (unblocked_by) REFERENCES staff_users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_blocked_at (blocked_at),
    INDEX idx_is_active (is_active)
);

-- Migrate existing block data to user_blocks table
INSERT INTO user_blocks (user_id, block_reason, blocked_at, blocked_by, is_active)
SELECT 
    id,
    block_reason,
    blocked_at,
    blocked_by,
    CASE WHEN library_access = 'blocked' THEN TRUE ELSE FALSE END
FROM users 
WHERE library_access = 'blocked';

-- Update users table - remove block-related columns
ALTER TABLE users DROP COLUMN IF EXISTS library_access;
ALTER TABLE users DROP COLUMN IF EXISTS block_reason;
ALTER TABLE users DROP COLUMN IF EXISTS blocked_at;
ALTER TABLE users DROP COLUMN IF EXISTS blocked_by;

-- Update users table - add section_id if not exists
-- (This should already exist from previous migrations, but ensuring it's here)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS section_id INT;
-- ALTER TABLE users ADD FOREIGN KEY IF NOT EXISTS (section_id) REFERENCES sections(id) ON DELETE SET NULL;

-- Add more sample students with section_ids
-- Get some section IDs first (assuming sections exist from migration 001)
-- Adding students with random section assignments

-- Sample students for BSIT (program_id = 1)
INSERT INTO users (role_id, student_number, first_name, last_name, email, qr_code, status, section_id) VALUES 
(1, '2024-0001', 'Juan', 'Dela Cruz', 'juan.delacruz@student.edu', UUID(), 'active', 1),
(1, '2024-0002', 'Maria', 'Luna', 'maria.luna@student.edu', UUID(), 'active', 1),
(1, '2024-0003', 'Pedro', 'Santos', 'pedro.santos@student.edu', UUID(), 'active', 2),
(1, '2024-0004', 'Ana', 'Reyes', 'ana.reyes@student.edu', UUID(), 'active', 2),
(1, '2024-0005', 'Jose', 'Garcia', 'jose.garcia@student.edu', UUID(), 'active', 3),

-- BSCS students
(1, '2024-0010', 'Lisa', 'Mendoza', 'lisa.mendoza@student.edu', UUID(), 'active', 7),
(1, '2024-0011', 'Mark', 'Torres', 'mark.torres@student.edu', UUID(), 'active', 7),
(1, '2024-0012', 'Sarah', 'Cruz', 'sarah.cruz@student.edu', UUID(), 'active', 8),

-- BSIS students
(1, '2024-0020', 'James', 'Ramos', 'james.ramos@student.edu', UUID(), 'active', 9),

-- More BSIT students (different years)
(1, '2023-0010', 'Emily', 'Aquino', 'emily.aquino@student.edu', UUID(), 'active', 4),
(1, '2023-0011', 'Daniel', 'Bautista', 'daniel.bautista@student.edu', UUID(), 'active', 4),
(1, '2023-0012', 'Grace', 'Flores', 'grace.flores@student.edu', UUID(), 'active', 5),
(1, '2022-0001', 'Michael', 'Rivera', 'michael.rivera@student.edu', UUID(), 'active', 6),
(1, '2022-0002', 'Nicole', 'Gomez', 'nicole.gomez@student.edu', UUID(), 'active', 6);

-- Generate QR codes for all users without one
UPDATE users SET qr_code = UUID() WHERE qr_code IS NULL OR qr_code = '';

-- Generate QR codes for staff without one
UPDATE staff_users SET qr_code = UUID() WHERE qr_code IS NULL OR qr_code = '';

-- Update the old users table to only keep students (role_id = 1)
DELETE FROM users WHERE role_id IN (2, 3, 4);

-- Note: The application will now need to authenticate against:
-- - staff_users table for admin/librarian/management login
-- - users table for student operations (if students need login)
