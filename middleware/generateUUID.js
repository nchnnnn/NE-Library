const crypto = require("crypto");

// Generate UUID v4 using cryptographically secure random
const generateUUID = () => {
  return crypto.randomUUID();
};

module.exports = {
  generateUUID,
};
