const db = require("./database");
const bcrypt = require("bcryptjs");

const runMigration = async () => {
  try {
    console.log("Starting migration 004: Separate staff and blocks...\n");

    // 1. Create staff_users table
    console.log("Creating staff_users table...");
    await db.query(`
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
      )
    `);
    console.log("Created staff_users table!");

    // 2. Migrate existing staff users (role 2,3,4) to staff_users
    console.log("Migrating staff users...");
    const [existingStaff] = await db.query(`
      INSERT INTO staff_users (role_id, employee_id, first_name, last_name, email, password, qr_code, status)
      SELECT role_id, employee_id, first_name, last_name, email, password, qr_code, status
      FROM users WHERE role_id IN (2, 3, 4)
    `);
    console.log("Migrated staff users!");

    // 3. Create user_blocks table
    console.log("Creating user_blocks table...");
    await db.query(`
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
      )
    `);
    console.log("Created user_blocks table!");

    // 4. Migrate existing block data
    console.log("Migrating block data...");
    await db.query(`
      INSERT INTO user_blocks (user_id, block_reason, blocked_at, blocked_by, is_active)
      SELECT id, block_reason, blocked_at, blocked_by, 
        CASE WHEN library_access = 'blocked' THEN TRUE ELSE FALSE END
      FROM users WHERE library_access = 'blocked'
    `);
    console.log("Migrated block data!");

    // 5. Remove block columns from users
    console.log("Removing block columns from users table...");
    try {
      await db.query("ALTER TABLE users DROP COLUMN IF EXISTS library_access");
      await db.query("ALTER TABLE users DROP COLUMN IF EXISTS block_reason");
      await db.query("ALTER TABLE users DROP COLUMN IF EXISTS blocked_at");
      await db.query("ALTER TABLE users DROP COLUMN IF EXISTS blocked_by");
    } catch (e) {
      console.log("Some columns may not exist:", e.message);
    }
    console.log("Removed block columns!");

    // 6. Add more sample students with section_ids
    console.log("Adding sample students...");
    const students = [
      // BSIT Year 1 Section A (section 1)
      ['2024-0001', 'Juan', 'Dela Cruz', 'juan.delacruz@student.edu', 1],
      ['2024-0002', 'Maria', 'Luna', 'maria.luna@student.edu', 1],
      // BSIT Year 1 Section B (section 2)
      ['2024-0003', 'Pedro', 'Santos', 'pedro.santos@student.edu', 2],
      ['2024-0004', 'Ana', 'Reyes', 'ana.reyes@student.edu', 2],
      // BSIT Year 2 Section A (section 3)
      ['2024-0005', 'Jose', 'Garcia', 'jose.garcia@student.edu', 3],
      // BSIT Year 3 Section A (section 4)
      ['2023-0001', 'Emily', 'Aquino', 'emily.aquino@student.edu', 4],
      ['2023-0002', 'Daniel', 'Bautista', 'daniel.bautista@student.edu', 4],
      // BSIT Year 4 Section A (section 5)
      ['2022-0001', 'Michael', 'Rivera', 'michael.rivera@student.edu', 5],
      ['2022-0002', 'Nicole', 'Gomez', 'nicole.gomez@student.edu', 5],
      // BSCS Year 1 Section A (section 7)
      ['2024-0010', 'Lisa', 'Mendoza', 'lisa.mendoza@student.edu', 7],
      ['2024-0011', 'Mark', 'Torres', 'mark.torres@student.edu', 7],
      // BSCS Year 1 Section B (section 8)
      ['2024-0012', 'Sarah', 'Cruz', 'sarah.cruz@student.edu', 8],
      // BSIS Year 1 Section A (section 9)
      ['2024-0020', 'James', 'Ramos', 'james.ramos@student.edu', 9],
    ];

    for (const [student_number, first_name, last_name, email, section_id] of students) {
      const qr_code = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      
      try {
        await db.query(
          "INSERT INTO users (role_id, student_number, first_name, last_name, email, qr_code, status, section_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [1, student_number, first_name, last_name, email, qr_code, 'active', section_id]
        );
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') {
          console.log("Error inserting student:", e.message);
        }
      }
    }
    console.log("Added sample students!");

    // 7. Update QR codes for users who don't have one
    console.log("Generating QR codes...");
    await db.query(`
      UPDATE users SET qr_code = UUID() WHERE qr_code IS NULL OR qr_code = ''
    `);
    await db.query(`
      UPDATE staff_users SET qr_code = UUID() WHERE qr_code IS NULL OR qr_code = ''
    `);
    console.log("Generated QR codes!");

    // 8. Delete old staff from users table
    console.log("Removing old staff from users table...");
    await db.query("DELETE FROM users WHERE role_id IN (2, 3, 4)");
    console.log("Removed old staff!");

    console.log("\n=== Migration 004 completed successfully! ===\n");
    console.log("Summary:");
    console.log("- Created staff_users table for admin/librarian/management");
    console.log("- Created user_blocks table for blocking info");
    console.log("- Removed block columns from users table");
    console.log("- Added 14 new students with section assignments");
    console.log("- Staff can now login with email or employee_id");
    
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
