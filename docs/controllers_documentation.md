# Controllers Documentation

This document explains how each controller works in the NE Library API.

---

## Table of Contents

1. [AuthController](#authcontroller)
2. [StudentController](#studentcontroller)
3. [CollegeController](#collegecontroller)
4. [ProgramController](#programcontroller)
5. [SectionController](#sectioncontroller)
6. [EventController](#eventcontroller)
7. [LogController](#logcontroller)
8. [StatsController](#statscontroller)

---

## AuthController

**File:** [`controllers/authController.js`](/controllers/authController.js)

The AuthController handles all authentication-related operations for staff and library entry verification.

### Functions

#### 1. [`login()`](/controllers/authController.js:6)
```
Purpose: Authenticate staff user and return JWT token
Method: POST
Endpoint: /auth/login
Access: Public
```

**Flow:**
1. Validates that email/employee_id and password are provided
2. Looks up user by email or employee_id
3. Verifies password matches stored hash
4. Checks if user account is active
5. Generates JWT token with user info
6. Returns token and user profile

**Request Body:**
```json
{
  "email": "admin@neu.edu.ph",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "id": 3,
    "first_name": "System",
    "last_name": "Administrator",
    "role_id": 4,
    "role_name": "admin"
  }
}
```

---

#### 2. [`register()`](/controllers/authController.js:94)
```
Purpose: Register new staff user
Method: POST
Endpoint: /auth/register
Access: Protected (Admin only via middleware)
```

**Flow:**
1. Validates required fields (first_name, last_name, password, role_id)
2. Validates role is 2, 3, or 4 (librarian, management, admin)
3. Generates email from first_name.last_name@neu.edu.ph
4. Checks for duplicate email/employee_id
5. Auto-generates employee_id if not provided
6. Creates new staff user with hashed password
7. Returns success with new user info

---

#### 3. [`getProfile()`](/controllers/authController.js:165)
```
Purpose: Get current authenticated user's profile
Method: GET
Endpoint: /auth/profile
Access: Protected (Authenticated users)
```

**Flow:**
1. Uses req.user.id from JWT token
2. Fetches user from database
3. Returns full user profile

---

#### 4. [`changePassword()`](/controllers/authController.js:189)
```
Purpose: Change current user's password
Method: POST
Endpoint: /auth/change-password
Access: Protected (Authenticated users)
```

**Flow:**
1. Validates current_password and new_password provided
2. Verifies current password matches
3. Updates password with new hashed value
4. Returns success message

---

#### 5. [`verifyLibraryEntry()`](/controllers/authController.js:241)
```
Purpose: Verify library entry for students/staff via QR or manual entry
Method: POST
Endpoint: /library/verify
Access: Public (for kiosk use)
```

**Flow:**
This is a unified endpoint that handles multiple entry methods:

**Mode 1: Student Account Login**
- Accepts email + password
- Validates credentials
- Checks if blocked or inactive
- Logs attendance

**Mode 2: QR Code or Student Number**
- Looks up student by qr_code or student_number
- Checks block status and account status
- Logs attendance

**Mode 3: Staff QR Code**
- Looks up staff by qr_code
- Checks account status
- Logs staff attendance

---

## StudentController

**File:** [`controllers/studentController.js`](/controllers/studentController.js)

The StudentController handles all CRUD operations for students.

### Functions

#### 1. [`getAllStudents()`](/controllers/studentController.js:4)
```
Purpose: Get paginated list of all students
Method: GET
Endpoint: /students
Access: Protected (Management/Admin only - role 3 or 4)
```

**Query Parameters:**
- `limit` (optional): Number of records (default: 10)
- `offset` (optional): Pagination offset (default: 0)

---

#### 2. [`getStudentsBySection()`](/controllers/studentController.js:42)
```
Purpose: Get students by section name
Method: GET
Endpoint: /students/section/:section
Access: Protected (Management/Admin only)
```

---

#### 3. [`getStudentsByProgram()`](/controllers/studentController.js:64)
```
Purpose: Get students by program ID
Method: GET
Endpoint: /students/program/:program
Access: Protected (Management/Admin only)
```

---

#### 4. [`getStudentById()`](/controllers/studentController.js:88)
```
Purpose: Get single student by ID
Method: GET
Endpoint: /students/:id
Access: Protected (Authenticated users)
```

---

#### 5. [`createStudent()`](/controllers/studentController.js:121)
```
Purpose: Create new student
Method: POST
Endpoint: /students
Access: Protected (Management/Admin only)
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "password": "password123",
  "section_id": 1,
  "status": "active"
}
```

---

#### 6. [`updateStudent()`](/controllers/studentController.js:204)
```
Purpose: Update existing student
Method: PUT
Endpoint: /students/:id
Access: Protected (Management/Admin only)
```

---

#### 7. [`deleteStudent()`](/controllers/studentController.js:273)
```
Purpose: Delete student (permanent)
Method: DELETE
Endpoint: /students/:id
Access: Protected (Admin only - role 4)
```

---

#### 8. [`blockStudent()`](/controllers/studentController.js:317)
```
Purpose: Block student from library access
Method: POST
Endpoint: /students/:id/block
Access: Protected (Librarian, Management, Admin - role 2, 3, 4)
```

**Request Body:**
```json
{
  "reason": "Violation of library rules"
}
```

---

#### 9. [`unblockStudent()`](/controllers/studentController.js:372)
```
Purpose: Unblock student to restore library access
Method: POST
Endpoint: /students/:id/unblock
Access: Protected (Librarian, Management, Admin - role 2, 3, 4)
```

---

## CollegeController

**File:** [`controllers/collegeController.js`](/controllers/collegeController.js)

Manages college/academic unit CRUD operations.

### Functions

| Function | Method | Endpoint | Access |
|----------|--------|----------|--------|
| [`getAllColleges()`](/controllers/collegeController.js:4) | GET | /colleges | Protected |
| [`getCollegeById()`](/controllers/collegeController.js:24) | GET | /colleges/:id | Protected |
| [`createCollege()`](/controllers/collegeController.js:49) | POST | /colleges | Management/Admin |
| [`updateCollege()`](/controllers/collegeController.js:76) | PUT | /colleges/:id | Management/Admin |
| [`deleteCollege()`](/controllers/collegeController.js:112) | DELETE | /colleges/:id | Admin only |

---

## ProgramController

**File:** [`controllers/programController.js`](/controllers/programController.js)

Manages academic program CRUD operations.

### Functions

| Function | Method | Endpoint | Access |
|----------|--------|----------|--------|
| [`getAllPrograms()`](/controllers/programController.js:4) | GET | /programs | Protected |
| [`getProgramsByCollege()`](/controllers/programController.js:24) | GET | /programs/college/:collegeId | Protected |
| [`getProgramById()`](/controllers/programController.js:45) | GET | /programs/:id | Protected |
| [`createProgram()`](/controllers/programController.js:70) | POST | /programs | Management/Admin |
| [`updateProgram()`](/controllers/programController.js:97) | PUT | /programs/:id | Management/Admin |
| [`deleteProgram()`](/controllers/programController.js:133) | DELETE | /programs/:id | Admin only |

---

## SectionController

**File:** [`controllers/sectionController.js`](/controllers/sectionController.js)

Manages section/year-level CRUD operations within programs.

### Functions

| Function | Method | Endpoint | Access |
|----------|--------|----------|--------|
| [`getAllSections()`](/controllers/sectionController.js:4) | GET | /sections | Protected |
| [`getSectionsByProgram()`](/controllers/sectionController.js:24) | GET | /sections/program/:programId | Protected |
| [`getSectionById()`](/controllers/sectionController.js:45) | GET | /sections/:id | Protected |
| [`createSection()`](/controllers/sectionController.js:70) | POST | /sections | Management/Admin |
| [`updateSection()`](/controllers/sectionController.js:98) | PUT | /sections/:id | Management/Admin |
| [`deleteSection()`](/controllers/sectionController.js:134) | DELETE | /sections/:id | Admin only |

---

## EventController

**File:** [`controllers/eventController.js`](/controllers/eventController.js)

Manages library events (for special hours, exhibits, etc.)

### Functions

#### 1. [`getAllEvents()`](/controllers/eventController.js:5)
```
Purpose: Get all events
Method: GET
Endpoint: /events
Access: Protected (Management/Admin)
```

#### 2. [`getActiveEvents()`](/controllers/eventController.js:29)
```
Purpose: Get currently active events
Method: GET
Endpoint: /events/active
Access: Public
```

**Used by:** QR code scanning to check if event is running

#### 3. [`getUpcomingEvents()`](/controllers/eventController.js:46)
```
Purpose: Get future events
Method: GET
Endpoint: /events/upcoming
Access: Public
```

#### 4. [`getEventById()`](/controllers/eventController.js:63)
```
Purpose: Get single event
Method: GET
Endpoint: /events/:id
Access: Protected (Management/Admin)
```

#### 5. [`createEvent()`](/controllers/eventController.js:89)
```
Purpose: Create new event
Method: POST
Endpoint: /events
Access: Protected (Management/Admin)

Request Body:
{
  "title": "Library Exhibit",
  "description": "Special exhibit",
  "start_datetime": "2026-03-10T01:00:00Z",
  "end_datetime": "2026-03-20T04:00:00Z"
}
```

#### 6. [`updateEvent()`](/controllers/eventController.js:132)
```
Purpose: Update event
Method: PUT
Endpoint: /events/:id
Access: Protected (Management/Admin)
```

#### 7. [`deleteEvent()`](/controllers/eventController.js:171)
```
Purpose: Delete event
Method: DELETE
Endpoint: /events/:id
Access: Protected (Management/Admin)
```

---

## LogController

**File:** [`controllers/logController.js`](/controllers/logController.js)

Manages attendance logs and blocked user records.

### Functions

#### 1. [`getAttendanceLogs()`](/controllers/logController.js:4)
```
Purpose: Get attendance logs with filters
Method: GET
Endpoint: /logs/attendance
Access: Protected (Librarian, Management, Admin)

Query Parameters:
- user_type: 'student' or 'staff'
- status: 'valid', 'invalid'
- start_date: ISO date
- end_date: ISO date
- limit: Number of records
- offset: Pagination offset
```

#### 2. [`getAttendanceStats()`](/controllers/logController.js:29)
```
Purpose: Get attendance statistics
Method: GET
Endpoint: /logs/attendance/stats
Access: Protected (Librarian, Management, Admin)

Returns:
- total: Total attendance records
- today: Today's attendance count
- this_week: This week's attendance count
- by_status: Breakdown by status
- by_user_type: Students vs staff
- graph_data: For charts
```

#### 3. [`getUserActivity()`](/controllers/logController.js:49)
```
Purpose: Get activity logs for specific user
Method: GET
Endpoint: /logs/activity/:user_type/:user_id
Access: Protected (Librarian, Management, Admin)
```

#### 4. [`getBlockedUsers()`](/controllers/logController.js:78)
```
Purpose: Get list of blocked users
Method: GET
Endpoint: /logs/blocked
Access: Protected (Librarian, Management, Admin)
```

---

## StatsController

**File:** [`controllers/statsController.js`](/controllers/statsController.js)

Provides dashboard and analytics data.

### Functions

#### 1. [`getDashboardStats()`](/controllers/statsController.js:8)
```
Purpose: Get dashboard summary statistics
Method: GET
Endpoint: /stats/dashboard
Access: Protected (Librarian, Management, Admin)

Returns:
{
  "students": { "total": 23 },
  "staff": { "total": 3 },
  "events": { "active": 1, "upcoming": 0 },
  "attendance": { "total": 18, "today": 18, "this_week": 18, "this_month": 18 },
  "blocked_users": 1
}
```

#### 2. [`getAttendanceGraph()`](/controllers/statsController.js:34)
```
Purpose: Get attendance data for graphing
Method: GET
Endpoint: /stats/attendance-graph
Access: Protected (Librarian, Management, Admin)

Query Parameters:
- period: 'week' | 'month' | 'year' | 'custom'
- start_date: ISO date (for custom)
- end_date: ISO date (for custom)
- college_id: Filter by college
- program_id: Filter by program
```

---

## Role-Based Access Control Summary

| Role ID | Role Name | Permissions |
|---------|-----------|-------------|
| 1 | Student | Library entry only |
| 2 | Librarian | View logs, stats, block/unblock students |
| 3 | Management | Full CRUD on students, colleges, programs, sections, events |
| 4 | Admin | Full access including delete operations |

---

## Middleware Used

- [`authenticateToken`](/middleware/auth.js) - Validates JWT token
- [`requireRole()`](/middleware/auth.js) - Checks user role
- [`requireAdmin`](/middleware/auth.js) - Admin-only access
- [`hashPassword`](/middleware/hashPassword.js) - Bcrypt password hashing
- [`generateEmployeeId`](/middleware/generateEmployeeId.js) - Auto-generate staff IDs
- [`generateStudentNum`](/middleware/generateStudentNum.js) - Auto-generate student numbers
- [`generateUUID`](/middleware/generateUUID.js) - Generate unique IDs
- [`formatDate`](/middleware/formatDate.js) - Date formatting utilities
- [`qrGenerate`](/middleware/qrGenerate.js) - QR code generation
- [`generateToken`](/middleware/generateToken.js) - JWT token generation
