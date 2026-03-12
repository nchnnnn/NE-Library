const db = require("./database");

const runMigration = async () => {
  try {
    console.log("Adding library_access column...");
    await db.query("ALTER TABLE users ADD COLUMN library_access ENUM('allowed', 'blocked') DEFAULT 'allowed'");
    console.log("Added library_access column!");
    
    console.log("Adding block_reason column...");
    await db.query("ALTER TABLE users ADD COLUMN block_reason TEXT");
    console.log("Added block_reason column!");
    
    console.log("Adding blocked_at column...");
    await db.query("ALTER TABLE users ADD COLUMN blocked_at TIMESTAMP NULL");
    console.log("Added blocked_at column!");
    
    console.log("Adding blocked_by column...");
    await db.query("ALTER TABLE users ADD COLUMN blocked_by INT");
    console.log("Added blocked_by column!");
    
    console.log("All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error.message);
    process.exit(1);
  }
};

runMigration();
