/**
 * Script to reset all admin staff passwords to "admin123"
 * Run with: node reset-admin-passwords.js
 */

const db = require("./database");
const bcrypt = require("bcryptjs");

async function resetAdminPasswords() {
  console.log("Starting password reset for admin users...\n");

  try {
    // First, find all admin staff users (role_id = 4)
    const [admins] = await db.query(
      "SELECT id, employee_id, first_name, last_name, email FROM staff_users WHERE role_id = 4",
    );

    if (admins.length === 0) {
      console.log("No admin users found with role_id = 4");
      return;
    }

    console.log(`Found ${admins.length} admin user(s):`);
    admins.forEach((admin) => {
      console.log(
        `  - ID: ${admin.id}, Employee ID: ${admin.employee_id}, Name: ${admin.first_name} ${admin.last_name}, Email: ${admin.email}`,
      );
    });
    console.log("");

    // Hash the new password
    const newPassword = "admin123";
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    console.log(`New password: ${newPassword}`);
    console.log(`Hashed password: ${hashedPassword}\n`);

    // Update all admin passwords
    for (const admin of admins) {
      await db.query("UPDATE staff_users SET password = ? WHERE id = ?", [
        hashedPassword,
        admin.id,
      ]);
      console.log(
        `✓ Updated password for admin: ${admin.employee_id} (${admin.first_name} ${admin.last_name})`,
      );
    }

    console.log("\n✅ All admin passwords have been reset to 'admin123'");
  } catch (error) {
    console.error("Error resetting passwords:", error.message);
  } finally {
    process.exit(0);
  }
}

resetAdminPasswords();
