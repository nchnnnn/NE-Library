NE-Library/
├── app.js                 # Main Express server entry point
├── database.js            # MySQL connection pool
├── package.json           # Dependencies (express, mysql2, jwt, bcryptjs)
├── .env                  # Environment variables
│
├── controllers/           # HTTP request handlers
│   ├── authController.js      # Login, register, profile, QR verification
│   ├── studentController.js   # Student CRUD, block/unblock
│   ├── eventController.js     # Event CRUD
│   ├── collegeController.js   # College CRUD
│   ├── programController.js  # Program CRUD
│   ├── sectionController.js  # Section CRUD
│   ├── logController.js       # Attendance logs, statistics
│   └── statsController.js     # Dashboard stats, attendance graph
│
├── services/              # Business logic (Service Layer Pattern)
│   ├── authServices.js        # Authentication logic
│   ├── studentServices.js     # Student operations
│   ├── eventsServices.js      # Event operations
│   ├── collegeServices.js     # College operations
│   ├── programServices.js    # Program operations
│   ├── sectionServices.js    # Section operations
│   ├── logServices.js        # Log operations
│   └── statsServices.js      # Dashboard & graph statistics
│
├── routes/                # API endpoint definitions
│   ├── authRoute.js          # /auth/* endpoints
│   ├── studentRoute.js        # /students/* endpoints
│   ├── eventRoute.js         # /events/* endpoints
│   ├── collegeRoute.js        # /colleges/* endpoints
│   ├── programRoute.js        # /programs/* endpoints
│   ├── sectionRoute.js       # /sections/* endpoints
│   ├── logRoute.js           # /api/logs/* endpoints
│   └── statsRoute.js         # /api/stats/* endpoints
│
├── middleware/            # Express middleware functions
│   ├── auth.js                # JWT verification, role checking
│   ├── hashPassword.js        # bcrypt hashing
│   ├── generateToken.js       # JWT creation
│   ├── generateUUID.js        # UUID for QR codes
│   ├── generateEmployeeId.js   # Auto EMP-YYNNNN format
│   ├── generateStudentNum.js   # Auto YY-XXXXX-XXX format
│   ├── formatDate.js          # Date formatting
│   └── qrGenerate.js          # QR code generation
│
├── docs/                  # Project documentation
│   ├── api_reference.md       # Complete API reference with examples
│   └── backend_fixes.md       # Changelog of all bug fixes
│
└── .agent/                # Agent configuration
    ├── skills.md              # This file — project blueprint
    └── neu_library_db.txt     # SQL schema reference


# NE-Library Project - Complete Documentation

## Project Overview

**NE-Library** (New Era University Library) is a comprehensive library management system built with Node.js, Express.js, and MySQL. It manages students, staff, library access, events, and attendance tracking using QR codes.

---

## Technology Stack

| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework for REST API |
| **MySQL (mysql2)** | Database driver |
| **JSON Web Token (JWT)** | Authentication |
| **bcryptjs** | Password hashing |
| **nodemon** | Development server auto-reload |

---

## Folder Structure

### 1. Root Files

| File | Description |
|------|-------------|
| [`app.js`](app.js) | Main Express application entry point. Sets up middleware, routes, database connection, and starts the server on port 3300 |
| [`database.js`](database.js) | MySQL connection pool configuration using mysql2/promise. Connects to `neu_library_db` database on port 3307 |
| [`package.json`](package.json) | Project dependencies and scripts (`npm start` runs nodemon) |
| [`.env`](.env) | Environment variables (DB credentials, JWT_SECRET) |

---

### 2. Controllers Folder (`/controllers`)

Controllers handle HTTP requests and responses. They use services for business logic.

| File | Functions |
|------|-----------|
| [`authController.js`](controllers/authController.js) | `login`, `register`, `getProfile`, `changePassword`, `verifyLibraryEntry` |
| [`studentController.js`](controllers/studentController.js) | `getAllStudents`, `getStudentById`, `createStudent`, `updateStudent`, `deleteStudent`, `blockStudent`, `unblockStudent`, `getStudentsBySection`, `getStudentsByProgram` |
| [`eventController.js`](controllers/eventController.js) | `getAllEvents`, `getActiveEvents`, `getUpcomingEvents`, `getEventById`, `createEvent`, `updateEvent`, `deleteEvent` |
| [`collegeController.js`](controllers/collegeController.js) | `getAllColleges`, `getCollegeById`, `createCollege`, `updateCollege`, `deleteCollege` |
| [`programController.js`](controllers/programController.js) | `getAllPrograms`, `getProgramsByCollege`, `getProgramById`, `createProgram`, `updateProgram`, `deleteProgram` |
| [`sectionController.js`](controllers/sectionController.js) | `getAllSections`, `getSectionsByProgram`, `getSectionById`, `createSection`, `updateSection`, `deleteSection` |
| [`logController.js`](controllers/logController.js) | `getAttendanceLogs`, `getAttendanceStats`, `getUserActivity`, `getBlockedUsers` |
| [`statsController.js`](controllers/statsController.js) | `getDashboardStats`, `getAttendanceGraph` |

---

### 3. Services Folder (`/services`)

Services contain business logic and database operations (Service Layer Pattern).

| File | Functions |
|------|-----------|
| [`authServices.js`](services/authServices.js) | Staff authentication, student/staff QR verification, student email login, password management, activity/attendance logging |
| [`studentServices.js`](services/studentServices.js) | Student CRUD, blocking/unblocking, section/program queries. Returns `{rows, total}` for pagination |
| [`eventsServices.js`](services/eventsServices.js) | Event CRUD operations. Dynamic partial update support. Returns `{rows, total}` for pagination |
| [`collegeServices.js`](services/collegeServices.js) | College CRUD operations |
| [`programServices.js`](services/programServices.js) | Program CRUD operations |
| [`sectionServices.js`](services/sectionServices.js) | Section CRUD operations |
| [`logServices.js`](services/logServices.js) | Attendance logs (paginated with `{logs, total}`), statistics with student/staff breakdown, blocked users |
| [`statsServices.js`](services/statsServices.js) | Dashboard summary stats, attendance graph data with period/college/program filters |

---

### 4. Routes Folder (`/routes`)

Routes define API endpoints and attach controllers with middleware.

| File | Endpoints |
|------|-----------|
| [`authRoute.js`](routes/authRoute.js) | `POST /auth/login`, `POST /auth/register`, `POST /library/verify`, `GET /auth/profile`, `POST /auth/change-password` |
| [`studentRoute.js`](routes/studentRoute.js) | `GET/POST/PUT/DELETE /students`, `POST /students/:id/block`, `POST /students/:id/unblock` |
| [`eventRoute.js`](routes/eventRoute.js) | `GET/POST/PUT/DELETE /events`, `GET /events/active`, `GET /events/upcoming` |
| [`collegeRoute.js`](routes/collegeRoute.js) | `GET/POST/PUT/DELETE /colleges` |
| [`programRoute.js`](routes/programRoute.js) | `GET/POST/PUT/DELETE /programs`, `GET /programs/college/:collegeId` |
| [`sectionRoute.js`](routes/sectionRoute.js) | `GET/POST/PUT/DELETE /sections`, `GET /sections/program/:programId` |
| [`logRoute.js`](routes/logRoute.js) | `GET /api/logs/attendance`, `GET /api/logs/attendance/stats`, `GET /api/logs/activity/:user_type/:user_id`, `GET /api/logs/blocked` |
| [`statsRoute.js`](routes/statsRoute.js) | `GET /api/stats/dashboard`, `GET /api/stats/attendance-graph` |

---

### 5. Middleware Folder (`/middleware`)

Middleware functions that run before route handlers.

| File | Functions |
|------|-----------|
| [`auth.js`](middleware/auth.js) | `authenticateToken` (verifies JWT), `requireAdmin` (role_id=4), `requireRole` (specific roles) |
| [`hashPassword.js`](middleware/hashPassword.js) | `hashPassword` (bcrypt), `comparePassword` |
| [`generateToken.js`](middleware/generateToken.js) | `generateToken` (creates JWT with userId, role_id, email, expires in 24h) |
| [`generateUUID.js`](middleware/generateUUID.js) | `generateUUID` (v4 UUID for QR codes) |
| [`generateEmployeeId.js`](middleware/generateEmployeeId.js) | `generateEmployeeId` (auto-generates format: EMP-YYNNNN) |
| [`generateStudentNum.js`](middleware/generateStudentNum.js) | `generateStudentNumber` (format: YY-XXXXX-XXX) |
| [`formatDate.js`](middleware/formatDate.js) | `formatDate` (returns formatted date string) |
| [`qrGenerate.js`](middleware/qrGenerate.js) | `generateUUID` (alias for QR generation) |


---

## Database Schema

### Core Tables

| Table | Columns |
|-------|---------|
| **students** | id, role_id, student_number, first_name, last_name, email, profile_image, password, qr_code, section_id, status |
| **staff_users** | id, role_id, employee_id, first_name, last_name, email, profile_image, password, qr_code, status |
| **roles** | id (1=student, 2=librarian, 3=management, 4=admin), role_name, role_description, permissions |
| **colleges** | id, college_name, college_code, description, status |
| **programs** | id, college_id (FK), program_name, program_code, description, status |
| **sections** | id, program_id (FK), section_name, year_level, status |
| **events** | id, title, description, start_datetime, end_datetime, created_by |
| **attendance_logs** | id, user_id, time_in, remarks |
| **activity_logs** | id, user_id, user_type, identifier, action_type, description, created_at |
| **user_blocks** | id, user_id, blocked_by, reason, blocked_at, unblock_at |
| **library_sessions** | id, user_id, time_in, time_out, status |

---

## API Features

### Authentication
- **Login**: Staff login with email/employee_id + password
- **Register**: Admin can register new staff (auto-generates employee_id and email)
- **JWT Token**: 24-hour expiry, contains userId, role_id, email
- **Password Change**: Authenticated users can change password

### Library Access (Kiosk Entry)
- **QR Code Scan**: Student scans QR code at kiosk
- **Student Number**: Manual entry using student number
- **Student Account Login**: Email + password for students who can't scan QR (alternative)
- Checks: user exists → blocked? → active? → log attendance → allow entry

### Student Management
- View all students (Management/Admin only) — paginated with `{data, total, limit, offset}`
- Create/Update/Delete students (partial update supported)
- Block/Unblock from library access
- View by section or program

### Event Management
- Create/Update/Delete events (partial update supported — only updates provided fields)
- View active/upcoming events (public)
- Events show in kiosk mode

### Dashboard Statistics
- **GET /api/stats/dashboard** — total students, staff, events, blocked users, attendance (today/week/month)
- **GET /api/stats/attendance-graph** — daily/monthly graph data with period, date range, college, and program filters
- Separate student vs staff attendance breakdown

### Reporting
- Attendance logs with filters (user_type, date range) — paginated with total count
- Statistics with student AND staff breakdown (`by_user_type`)
- Blocked users list
- User activity history

### Pagination
- All list endpoints return `{data, total, limit, offset}`
- Default limit: 10 items per request
- Frontend uses infinite scroll — stops when `offset + limit >= total`

---

## User Roles & Permissions

| Role ID | Role Name | Permissions |
|---------|-----------|-------------|
| 1 | Student | Library entry via kiosk (QR / student number / email+password) |
| 2 | Librarian | Library entry, manage students, block/unblock users, view logs & stats |
| 3 | Management | All librarian permissions + create/edit events, view reports, manage colleges/programs/sections |
| 4 | Admin | Full system access including delete operations and staff registration |

"Books are in the future feature not for now"

---

## Key Features Summary

1. **QR Code Library Entry** - Students scan QR to enter library
2. **Student Account Login** - Alternative kiosk entry using email + password
3. **Attendance Tracking** - Automatic logging with event association
4. **Event Management** - Create library events visible on kiosk
5. **User Blocking** - Librarians can block problematic users
6. **Role-Based Access** - Different features for different user types
7. **Student Management** - CRUD operations with auto-generated student numbers
8. **Staff Management** - Admin can add/manage staff with auto-generated employee IDs
9. **Dashboard Statistics** - Total counts, attendance today/week/month, graph data with filters
10. **Attendance Graph** - Visual data with period filter (week/month/year/custom) and college/program filter
11. **Pagination** - All list endpoints return `{data, total, limit, offset}` for infinite scroll
12. **Profile Image** - Both students and staff have `profile_image` column (default null = show default avatar)
13. **Reporting** - Attendance statistics with student/staff breakdown and logs
14. **Kiosk Mode** - Standalone interface for library entrance (computer with camera for QR scanning)
