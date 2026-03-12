-- =============================================
-- NEW DATABASE SCHEMA FOR NE-LIBRARY
-- =============================================

-- 1. COLLEGES (Top level: CICS, CBA, etc.)
-- First, check and create/modify colleges table
CREATE TABLE IF NOT EXISTS colleges_new (
    college_id INT PRIMARY KEY AUTO_INCREMENT,
    college_code VARCHAR(10) NOT NULL UNIQUE,  -- CICS, CBA, COE, etc.
    college_name VARCHAR(100) NOT NULL,         -- College of Informatics...
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. COURSES/DEGREES (Under each college: BSIT, BSCS, etc.)
CREATE TABLE IF NOT EXISTS courses (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    college_id INT NOT NULL,
    course_code VARCHAR(10) NOT NULL,           -- BSIT, BSCS, BSIS
    course_name VARCHAR(100) NOT NULL,          -- Bachelor of Science...
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (college_id) REFERENCES colleges_new(college_id),
    UNIQUE KEY unique_course_per_college (college_id, course_code)
);

-- 3. SECTIONS/YEAR LEVELS (For organizing students)
-- Drop old sections table and create new one
DROP TABLE IF EXISTS sections_new;

CREATE TABLE IF NOT EXISTS sections_new (
    section_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    section_name VARCHAR(20) NOT NULL,          -- 1A, 2B, 3C, 4A
    year_level TINYINT NOT NULL,                -- 1, 2, 3, 4
    school_year VARCHAR(9) NOT NULL,            -- 2024-2025
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE KEY unique_section (course_id, section_name, school_year)
);

-- 4. STUDENTS (Library users) - Rename from users
-- Note: We'll create a new students table and migrate data
CREATE TABLE IF NOT EXISTS students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    student_number VARCHAR(20) NOT NULL UNIQUE, -- School ID: 2021-00123
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    section_id INT NOT NULL,
    rfid_tag VARCHAR(50) UNIQUE,                -- For tap-in attendance
    photo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections_new(section_id)
);

-- 5. STUDENT POSITIONS (President, Officer, etc.)
CREATE TABLE IF NOT EXISTS positions (
    position_id INT PRIMARY KEY AUTO_INCREMENT,
    position_name VARCHAR(50) NOT NULL UNIQUE,  -- President, VP, Secretary...
    position_level ENUM('course', 'college', 'university') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. STUDENT POSITION ASSIGNMENTS
CREATE TABLE IF NOT EXISTS student_positions (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    position_id INT NOT NULL,
    course_id INT,                              -- NULL if college/university level
    college_id INT,                             -- NULL if course/university level
    school_year VARCHAR(9) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (position_id) REFERENCES positions(position_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (college_id) REFERENCES colleges_new(college_id),
    UNIQUE KEY unique_position (position_id, course_id, college_id, school_year)
);

-- 7. LIBRARY ATTENDANCE (Main tracking table)
CREATE TABLE IF NOT EXISTS library_attendance (
    attendance_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    check_in DATETIME NOT NULL,
    check_out DATETIME,
    purpose ENUM('study', 'borrow', 'return', 'research', 'other') DEFAULT 'study',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- 8. Add is_active to staff_users if not exists
-- We'll add this separately

-- 9. Update existing tables to add is_active columns
-- ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

SELECT 'Migration 005 - New database schema created successfully!' AS message;
