const bcrypt = require("bcryptjs");

// Helper function to hash password (using bcrypt)
const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

// Helper function to compare password
const comparePassword = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword);
};

module.exports = { hashPassword, comparePassword };
