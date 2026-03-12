const mysql = require("mysql2/promise");

const dotenv = require("dotenv");
dotenv.config();

const mysqlPool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "neu_library_db",
  port: process.env.DB_PORT || 3307,
});

module.exports = mysqlPool;
