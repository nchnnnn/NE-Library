-- =====================================================
-- NORMALIZED DATABASE SCHEMA FOR NEW ERA UNIVERSITY LIBRARY
-- =====================================================

-- Create roles table (normalized from role_id)
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_description VARCHAR(255),
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (id, role_name, role_description, permissions) VALUES 
(1, 'student', 'Student - can borrow books and enter library', '{"library_entry": true, "borrow_books": true, "manage_users": false}'),
(2, 'librarian', 'Librarian - can manage library operations', '{"library_entry": true, "borrow_books": true, "manage_users": true, "block_users": true, "manage_books": true}'),
(3, 'management', 'Management - administrative access', '{"library_entry": true, "borrow_books": true, "manage_users": true, "block_users": true, "manage_books": true, "view_reports": true}'),
(4, 'admin', 'System Administrator - full access', '{"library_entry": true, "borrow_books": true, "manage_users": true, "block_users": true, "manage_books": true, "view_reports": true, "system_settings": true}');

-- Create academic_years table
CREATE TABLE IF NOT EXISTS academic_years (
    id INT PRIMARY KEY AUTO_INCREMENT,
    year_start YEAR NOT NULL,
    year_end YEAR NOT NULL,
    semester ENUM('1st', '2nd', 'summer') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_academic_year (year_start, year_end, semester)
);

-- Sample academic year
INSERT INTO academic_years (year_start, year_end, semester, is_active) VALUES 
(2025, 2026, '1st', TRUE);

-- Update users table with proper foreign keys
ALTER TABLE users 
    ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    ADD FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL;

-- Create library_logs table for tracking library entry
CREATE TABLE IF NOT EXISTS library_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP NULL,
    purpose ENUM('study', 'borrow', 'return', 'research', 'other') DEFAULT 'study',
    qr_code_used VARCHAR(255) NOT NULL,
    status ENUM('entered', 'exited', 'blocked') DEFAULT 'entered',
    blocked_reason VARCHAR(255),
    logged_by INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (logged_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_entry_time (entry_time),
    INDEX idx_exit_time (exit_time)
);

-- Create book_categories table
CREATE TABLE IF NOT EXISTS book_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_code VARCHAR(20) UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    isbn VARCHAR(20) UNIQUE,
    book_title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    publisher VARCHAR(255),
    year_published YEAR,
    category_id INT,
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    location VARCHAR(100),
    status ENUM('available', 'borrowed', 'lost', 'damaged', 'archived') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES book_categories(id) ON DELETE SET NULL,
    INDEX idx_isbn (isbn),
    INDEX idx_title (book_title),
    INDEX idx_category (category_id)
);

-- Create book_borrowings table
CREATE TABLE IF NOT EXISTS book_borrowings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    return_date TIMESTAMP NULL,
    status ENUM('borrowed', 'returned', 'overdue', 'lost') DEFAULT 'borrowed',
    late_fee DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    borrowed_by INT,
    returned_by INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (borrowed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (returned_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id),
    INDEX idx_borrow_date (borrow_date),
    INDEX idx_due_date (due_date)
);

-- Create book_reservations table
CREATE TABLE IF NOT EXISTS book_reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    reserved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMP NOT NULL,
    status ENUM('pending', 'fulfilled', 'cancelled', 'expired') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id)
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES 
('library_open_time', '07:00', 'Library opening time', TRUE),
('library_close_time', '20:00', 'Library closing time', TRUE),
('max_borrow_books', '5', 'Maximum books a student can borrow', TRUE),
('borrow_days', '7', 'Number of days to return books', TRUE),
('late_fee_per_day', '5.00', 'Late fee per day', TRUE);
