const db = require("../database");

const generateStudentNumber = async () => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = currentYear.toString().slice(-2); // Get last 2 digits

  // Get the last user's student_number to increment from
  const [lastUser] = await db.query(
    "SELECT student_number FROM users ORDER BY id DESC LIMIT 1",
  );

  let nextMiddle = 10001; // Default starting value
  let nextLast = 1; // Default starting value

  if (lastUser.length > 0 && lastUser[0].student_number) {
    // Parse the last student number (format: YY-XXXXX-XXX)
    const parts = lastUser[0].student_number.split("-");
    if (parts.length === 3) {
      // Increment the middle and last parts
      nextMiddle = parseInt(parts[1]) + 1;
      nextLast = parseInt(parts[2]) + 1;

      // Reset if exceeds limits
      if (nextMiddle > 99999) nextMiddle = 10001;
      if (nextLast > 999) nextLast = 1;
    }
  }

  const middlePart = String(nextMiddle).padStart(5, "0");
  const lastPart = String(nextLast).padStart(3, "0");

  return `${yearPrefix}-${middlePart}-${lastPart}`;
};


module.exports = { generateStudentNumber };