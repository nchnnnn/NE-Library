const db = require("./database");

// Seed random attendance data for testing
async function seedAttendanceData() {
    console.log("Seeding attendance data...");
    
    try {
        // Get existing students and staff
        const [students] = await db.query("SELECT id FROM students LIMIT 30");
        const [staff] = await db.query("SELECT id FROM staff_users LIMIT 10");
        
        if (students.length === 0 && staff.length === 0) {
            console.log("No users found. Please create users first.");
            return;
        }
        
        console.log(`Found ${students.length} students and ${staff.length} staff`);
        
        const users = [
            ...students.map(s => ({ id: s.id, type: 'student' })),
            ...staff.map(s => ({ id: s.id, type: 'staff' }))
        ];
        
        const reasons = [
            'Research / Thesis Work',
            'Quiet Study',
            'Group Study / Collaboration',
            'Borrowing/Returning Books',
            'Computer / Internet Access',
            'Resting / Between Classes'
        ];
        
        const records = [];
        const now = new Date();
        
        // Generate 100 records spread across different days and weeks (last 90 days)
        for (let i = 0; i < 100; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            
            // Random day within last 90 days (more spread out)
            const daysAgo = Math.floor(Math.random() * 90);
            const date = new Date(now);
            date.setDate(date.getDate() - daysAgo);
            
            // Random time between 8 AM and 6 PM
            const hour = 8 + Math.floor(Math.random() * 10);
            const minute = Math.floor(Math.random() * 60);
            date.setHours(hour, minute, 0, 0);
            
            records.push({
                user_id: user.id
            });
        }
        
        // Insert records (only user_id and time_in columns exist)
        for (const record of records) {
            await db.query(
                "INSERT INTO attendance_logs (user_id, time_in) VALUES (?, ?)",
                [record.user_id, record.time_in]
            );
        }
        
        console.log(`Successfully inserted ${records.length} attendance records!`);
        
        // Show summary
        const [count] = await db.query("SELECT COUNT(*) as total FROM attendance_logs");
        console.log(`Total attendance records: ${count.total}`);
        
    } catch (error) {
        console.error("Error seeding data:", error);
    }
    
    process.exit(0);
}

seedAttendanceData();
