# Services Documentation

This document explains how each service works in the NE Library API. Services handle the business logic and database operations.

---

## Table of Contents

1. [AuthService](#authservice)
2. [StudentService](#studentservice)
3. [CollegeService](#collegeservice)
4. [ProgramService](#programservice)
5. [SectionService](#sectionservice)
6. [EventsService](#eventsservice)
7. [LogService](#logservice)
8. [StatsService](#statsservice)

---

## AuthService

**File:** [`services/authServices.js`](/services/authServices.js)

Handles all authentication-related database operations.

### Functions

| Function | Purpose |
|----------|---------|
| [`findStaffByEmail(email)`](/services/authServices.js:8) | Find staff by email address |
| [`findStaffByEmployeeId(employeeId)`](/services/authServices.js:14) | Find staff by employee ID |
| [`findStaffById(id)`](/services/authServices.js:20) | Find staff by ID (includes password for verification) |
| [`getRoleName(roleId)`](/services/authServices.js:29) | Get role name from role ID |
| [`checkEmailExists(email)`](/services/authServices.js:35) | Check if email already exists |
| [`checkEmployeeIdExists(employeeId)`](/services/authServices.js:44) | Check if employee ID exists |
| [`createStaffUser(...)`](/services/authServices.js:53) | Create new staff user with hashed password |
| [`updatePassword(userId, newPassword)`](/services/authServices.js:75) | Update user password |
| [`findStudentByQR(qrCode)`](/services/authServices.js:82) | Find student by QR code |
| [`findStudentByNumber(studentNumber)`](/services/authServices.js:92) | Find student by student number |
| [`findStudentByEmail(email)`](/services/authServices.js:102) | Find student by email |
| [`findStaffByQR(qrCode)`](/services/authServices.js:112) | Find staff by QR code |
| [`isUserBlocked(userId)`](/services/authServices.js:122) | Check if user is blocked |
| [`logAttendance(userId, remarks)`](/services/authServices.js:131) | Log attendance record |
| [`logActivity(userId, actionType, description, userType, identifier)`](/services/authServices.js:139) | Log user activity |
| [`getActiveEvent()`](/services/authServices.js:147) | Get currently active event |

---

## StudentService

**File:** [`services/studentServices.js`](/services/studentServices.js)

Handles all student-related database operations.

### Functions

| Function | Purpose |
|----------|---------|
| [`getAllStudents(limit, offset)`](/services/studentServices.js:7) | Get paginated list of students with section info |
| [`getStudentsBySection(sectionId, limit, offset)`](/services/studentServices.js:22) | Get students filtered by section |
| [`getStudentsByProgram(programId, limit, offset)`](/services/studentServices.js:39) | Get students filtered by program |
| [`getStudentById(id)`](/services/studentServices.js:57) | Get single student with section name |
| [`getSectionById(sectionId)`](/services/studentServices.js:69) | Check if section exists |
| [`getStudentByEmail(email)`](/services/studentServices.js:78) | Check if student email exists |
| [`createStudent(...)`](/services/studentServices.js:87) | Create new student with auto-generated student number and QR code |
| [`getStudentByIdSimple(id)`](/services/studentServices.js:114) | Get student by ID (simple) |
| [`updateStudent(...)`](/services/studentServices.js:120) | Update student fields dynamically |
| [`deleteStudent(id)`](/services/studentServices.js:165) | Delete student |
| [`getExistingBlock(userId)`](/services/studentServices.js:171) | Check if student is already blocked |
| [`blockStudent(userId, blockedBy, reason)`](/services/studentServices.js:180) | Block student from library |
| [`unblockStudent(userId)`](/services/studentServices.js:189) | Unblock student |

### Key Features:
- Auto-generates student number using [`generateStudentNumber()`](/middleware/generateStudentNum.js)
- Auto-generates QR code using [`generateUUID()`](/middleware/qrGenerate.js)
- Auto-generates email: `firstname.lastname@neu.edu.ph`
- Default password: `firstname.lastname` if not provided

---

## CollegeService

**File:** [`services/collegeServices.js`](/services/collegeServices.js)

Handles college/academic unit database operations.

### Functions

| Function | Purpose |
|----------|---------|
| [`getAllColleges(limit, offset)`](/services/collegeServices.js:4) | Get all colleges (optional pagination) |
| [`getCollegeById(id)`](/services/collegeServices.js:18) | Get college by ID |
| [`getCollegeByIdSimple(id)`](/services/collegeServices.js:24) | Get college by ID (simple check) |
| [`createCollege(college_name)`](/services/collegeServices.js:30) | Create new college |
| [`updateCollege(id, college_name)`](/services/collegeServices.js:44) | Update college name |
| [`deleteCollege(id)`](/services/collegeServices.js:73) | Delete college |

---

## ProgramService

**File:** [`services/programServices.js`](/services/programServices.js)

Handles academic program database operations.

### Functions

| Function | Purpose |
|----------|---------|
| [`getAllPrograms(limit, offset)`](/services/programServices.js:4) | Get all programs with college info |
| [`getProgramsByCollege(collegeId, limit, offset)`](/services/programServices.js:18) | Get programs by college |
| [`getProgramById(id)`](/services/programServices.js:32) | Get program with college name |
| [`getProgramByIdSimple(id)`](/services/programServices.js:41) | Get program (simple) |
| [`createProgram(college_id, program_name, program_code)`](/services/programServices.js:47) | Create new program |
| [`updateProgram(...)`](/services/programServices.js:61) | Update program fields |
| [`deleteProgram(id)`](/services/programServices.js:98) | Delete program |

---

## SectionService

**File:** [`services/sectionServices.js`](/services/sectionServices.js)

Handles section/year-level database operations.

### Functions

| Function | Purpose |
|----------|---------|
| [`getAllSections(limit, offset)`](/services/sectionServices.js:4) | Get all sections with program/college info |
| [`getSectionsByProgram(programId, limit, offset)`](/services/sectionServices.js:18) | Get sections by program |
| [`getSectionById(id)`](/services/sectionServices.js:32) | Get section with program/college info |
| [`getSectionByIdSimple(id)`](/services/sectionServices.js:41) | Get section (simple) |
| [`createSection(program_id, section_name, year_level)`](/services/sectionServices.js:47) | Create new section |
| [`updateSection(...)`](/services/sectionServices.js:61) | Update section fields |
| [`deleteSection(id)`](/services/sectionServices.js:98) | Delete section |

---

## EventsService

**File:** [`services/eventsServices.js`](/services/eventsServices.js)

Handles library event database operations.

### Functions

| Function | Purpose |
|----------|---------|
| [`getEvents(limit, offset)`](/services/eventsServices.js:3) | Get paginated events with creator info |
| [`getActiveEvents()`](/services/eventsServices.js:18) | Get currently active events (now between start and end) |
| [`getUpcomingEvents()`](/services/eventsServices.js:29) | Get future events |
| [`getEventById(id)`](/services/eventsServices.js:41) | Get event by ID with creator name |
| [`createEvent(...)`](/services/eventsServices.js:54) | Create new event |
| [`updateEvent(...)`](/services/eventsServices.js:66) | Update event fields dynamically |
| [`isExisting(id)`](/services/eventsServices.js:101) | Check if event exists |
| [`deleteEvent(id)`](/services/eventsServices.js:107) | Delete event |

### Key Features:
- Automatically joins with staff_users to get creator's name and email
- Active events determined by: `start_datetime <= NOW() AND end_datetime >= NOW()`

---

## LogService

**File:** [`services/logServices.js`](/services/logServices.js)

Handles attendance logs and blocked user records.

### Functions

| Function | Purpose |
|----------|---------|
| [`getAttendanceLogs(...)`](/services/logServices.js:4) | Get paginated attendance logs with filters |
| [`getAttendanceStats(...)`](/services/logServices.js:48) | Get attendance statistics |
| [`getUserActivity(user_id, user_type, limit)`](/services/logServices.js:140) | Get activity for specific user |
| [`getBlockedUsers()`](/services/logServices.js:152) | Get list of blocked users |

### `getAttendanceLogs` Parameters:
- `user_type`: 'student' or 'staff'
- `status`: 'valid' or 'invalid'
- `start_date`: Filter start
- `end_date`: Filter end
- `limit`: Pagination limit
- `offset`: Pagination offset

### `getAttendanceStats` Returns:
```javascript
{
    total: Number,          // Total attendance records
    today: Number,          // Today's count
    this_week: Number,      // This week's count
    by_status: [{ status: 'valid', count: N }],
    by_user_type: [
        { user_type: 'student', count: N },
        { user_type: 'staff', count: N }
    ],
    graph_data: [{ date: '2026-03-14', count: 18 }]
}
```

---

## StatsService

**File:** [`services/statsServices.js`](/services/statsServices.js)

Handles dashboard and analytics database operations.

### Functions

| Function | Purpose |
|----------|---------|
| [`getDashboardStats()`](/services/statsServices.js:8) | Get dashboard summary |
| [`getAttendanceGraph(...)`](/services/statsServices.js:80) | Get graph data for charts |

### `getDashboardStats` Returns:
```javascript
{
    students: { total: 23 },
    staff: { total: 3 },
    events: { active: 1, upcoming: 0 },
    attendance: {
        total: 18,
        today: 18,
        this_week: 18,
        this_month: 18
    },
    blocked_users: 1
}
```

### `getAttendanceGraph` Parameters:
- `period`: 'week', 'month', 'year', or 'day'
- `start_date`: Custom start date
- `end_date`: Custom end date
- `college_id`: Filter by college
- `program_id`: Filter by program

### `getAttendanceGraph` Returns:
```javascript
{
    student: [
        { date: '2026-03-14', count: 18, user_type: 'student' }
    ],
    staff: [],
    period: 'month'
}
```

---

## Database Schema Overview

### Key Tables

| Table | Purpose |
|-------|---------|
| `staff_users` | Staff accounts (admin, librarian, management) |
| `students` | Student accounts |
| `colleges` | Academic colleges |
| `programs` | Academic programs |
| `sections` | Year-level sections within programs |
| `events` | Library events |
| `attendance_logs` | Library entry records |
| `user_blocks` | Blocked user records |
| `activity_logs` | User activity history |
| `roles` | User roles (1-4) |

---

## Middleware Used in Services

| Middleware | Purpose |
|------------|---------|
| [`hashPassword()`](/middleware/hashPassword.js) | Bcrypt password hashing |
| [`comparePassword()`](/middleware/hashPassword.js) | Password verification |
| [`generateToken()`](/middleware/generateToken.js) | JWT token generation |
| [`generateUUID()`](/middleware/generateUUID.js) | Generate unique IDs |
| [`generateStudentNumber()`](/middleware/generateStudentNum.js) | Auto-generate student numbers |
| [`generateEmployeeId()`](/middleware/generateEmployeeId.js) | Auto-generate employee IDs |
| [`qrGenerate()`](/middleware/qrGenerate.js) | QR code generation |

---

## Service-Controller Relationship

```
Controller (Request Handler)
    ↓
Service (Business Logic)
    ↓
Database (MySQL)
```

Each service is called by its corresponding controller to perform database operations. The services handle:
- Query building
- Data validation
- Database connections via [`database.js`](/database.js)
- Error handling
