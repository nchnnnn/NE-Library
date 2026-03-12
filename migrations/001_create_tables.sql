-- Migration: Create colleges, programs, and sections tables
-- Run this in your MySQL database

-- Create colleges table
CREATE TABLE IF NOT EXISTS colleges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    college_name VARCHAR(255) NOT NULL,
    college_code VARCHAR(50) UNIQUE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    college_id INT NOT NULL,
    program_name VARCHAR(255) NOT NULL,
    program_code VARCHAR(50) UNIQUE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    program_id INT NOT NULL,
    section_name VARCHAR(100) NOT NULL,
    section_year INT NOT NULL, -- e.g., 1st year, 2nd year, etc.
    academic_year VARCHAR(20) NOT NULL, -- e.g., 2025-2026
    semester ENUM('1st', '2nd', 'summer') NOT NULL,
    status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_section (program_id, section_name, academic_year, semester)
);

-- Add program_id column to users table if not exists
-- ALTER TABLE users ADD COLUMN program_id INT NULL;
-- ALTER TABLE users ADD FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;

-- Sample data for colleges (New Era University structure)
INSERT INTO colleges (college_name, college_code, description) VALUES 
('College of Informatics and Computing Studies', 'CICS', 'College of Informatics and Computing Studies'),
('College of Engineering', 'COE', 'College of Engineering'),
('College of Business and Management', 'CBM', 'College of Business and Management'),
('College of Education', 'CED', 'College of Education'),
('College of Arts and Sciences', 'CAS', 'College of Arts and Sciences'),
('College of Nursing', 'CON', 'College of Nursing'),
('College of Architecture', 'COAR', 'College of Architecture'),
('College of Tourism and Hospitality Management', 'CTHM', 'College of Tourism and Hospitality Management');

-- Sample data for programs under CICS
INSERT INTO programs (college_id, program_name, program_code, description) VALUES 
(1, 'Bachelor of Science in Information Technology', 'BSIT', 'Information Technology'),
(1, 'Bachelor of Science in Computer Science', 'BSCS', 'Computer Science'),
(1, 'Bachelor of Science in Information Systems', 'BSIS', 'Information Systems'),
(1, 'Associate in Computer Technology', 'ACT', 'Computer Technology');

-- Sample data for other programs
INSERT INTO programs (college_id, program_name, program_code, description) VALUES 
(2, 'Bachelor of Science in Civil Engineering', 'BSCE', 'Civil Engineering'),
(2, 'Bachelor of Science in Electrical Engineering', 'BSEE', 'Electrical Engineering'),
(2, 'Bachelor of Science in Mechanical Engineering', 'BSME', 'Mechanical Engineering'),
(3, 'Bachelor of Science in Business Administration', 'BSBA', 'Business Administration'),
(3, 'Bachelor of Science in Accountancy', 'BSA', 'Accountancy'),
(4, 'Bachelor of Elementary Education', 'BEED', 'Elementary Education'),
(4, 'Bachelor of Secondary Education', 'BSED', 'Secondary Education'),
(5, 'Bachelor of Arts in Communication', 'ABCOM', 'Communication'),
(6, 'Bachelor of Science in Nursing', 'BSN', 'Nursing'),
(7, 'Bachelor of Science in Architecture', 'BSARCH', 'Architecture'),
(8, 'Bachelor of Science in Tourism Management', 'BSTM', 'Tourism Management'),
(8, 'Bachelor of Science in Hospitality Management', 'BSHM', 'Hospitality Management');

-- Sample data for sections
INSERT INTO sections (program_id, section_name, section_year, academic_year, semester) VALUES 
(1, 'A', 1, '2025-2026', '1st'),
(1, 'B', 1, '2025-2026', '1st'),
(1, 'A', 2, '2025-2026', '1st'),
(1, 'A', 3, '2025-2026', '1st'),
(1, 'A', 4, '2025-2026', '1st'),
(2, 'A', 1, '2025-2026', '1st'),
(2, 'B', 1, '2025-2026', '1st'),
(3, 'A', 1, '2025-2026', '1st');
