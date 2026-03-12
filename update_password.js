const db = require("./database");
const authController = require("./controllers/authController");


const updatePassword = async () => {
  try {
    // Hash "admin123" with SHA256
    const hashedPassword = authController.hashPassword("admin123");
    
    // Update admin user (id = 6)
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, 6]);
    
    console.log("Admin password updated successfully!");
    
    // Also update the faculty user (id = 4 and 5)
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, 4]);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, 5]);
    
    console.log("All user passwords updated!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

updatePassword();
