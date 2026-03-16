const db = require("../database");

const generateEmployeeId = async () => {
  // Get the last staff user's employee_id to increment from
  const [lastStaff] = await db.query(
    "SELECT employee_id FROM staff_users ORDER BY CAST(SUBSTRING(employee_id, 5) AS UNSIGNED) DESC LIMIT 1",
  );

  // Current year prefix (2 digits)
  const yearPrefix = new Date().getFullYear().toString().slice(-2);
  const currentYear = parseInt(yearPrefix);

  let nextNumber = 1; // Default starting value

  if (lastStaff.length > 0 && lastStaff[0].employee_id) {
    // Parse the last employee_id
    const empId = lastStaff[0].employee_id;
    // Extract the numeric part after "EMP-"
    const match = empId.match(/EMP-(\d+)/);
    if (match) {
      const currentNum = parseInt(match[1]);
      
      // Check if it's old format (less than 6 digits) - start fresh with new year format
      if (currentNum < 100000) {
        // Old format - start new sequence with current year
        nextNumber = currentYear * 10000 + 1;
      } else {
        // New format (6 digits: YYXXXX)
        // Extract year prefix (first 2 digits) and sequence (last 4 digits)
        const currentYearPrefix = Math.floor(currentNum / 10000);
        const currentSequence = currentNum % 10000;
        
        if (currentYearPrefix === currentYear) {
          // Same year - increment sequence
          const nextSequence = currentSequence + 1;
          
          // If current ends in 9 (i.e., 0009, 1009, 2009, etc.), jump to next thousand
          if (currentSequence >= 0 && currentSequence <= 9 && nextSequence === 10) {
            // After 000-009, jump to 1000
            nextNumber = currentYearPrefix * 10000 + 1000;
          } else {
            // Normal increment
            nextNumber = currentYearPrefix * 10000 + nextSequence;
          }
        } else {
          // Different year - start with 0001
          nextNumber = currentYear * 10000 + 1;
        }
      }
    }
  } else {
    // No existing records - start with year + 0001
    nextNumber = currentYear * 10000 + 1;
  }

  // Format with leading zeros (6 digits total)
  const numberPart = String(nextNumber).padStart(6, "0");

  return `EMP-${numberPart}`;
};


module.exports = { generateEmployeeId };
