# NE-Library — Complete API Reference

**Base URL**: `http://localhost:3300`  
**Auth**: All protected routes require `Authorization: Bearer <token>` header  
**Token**: Obtained from `POST /auth/login`

---

## 🔑 Role Permissions

| Role | ID | Can Access |
|------|----|-----------|
| Student | 1 | Kiosk only |
| Librarian | 2 | Logs, block/unblock, stats |
| Management | 3 | All above + create/view students, events, reports |
| Admin | 4 | Full access including delete and register staff |

---

## 📋 AUTH ROUTES

### POST /auth/login
Login as staff. Returns JWT token.

**Body:**
```json
{ "email": "admin@neu.edu.ph", "password": "yourpassword" }
```
Or using employee ID:
```json
{ "employee_id": "EMP-261000", "password": "yourpassword" }
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 3, "first_name": "System", "last_name": "Administrator", "email": "admin@neu.edu.ph", "role_id": 4, "role_name": "admin", "employee_id": "EMP-261000" }
}
```

---

### POST /auth/register 🔐 (any staff role)
Register a new staff user. `employee_id` is auto-generated if not provided.

**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepass123",
  "role_id": 2
}
```
> `role_id`: 2=Librarian, 3=Management, 4=Admin

---

### GET /auth/profile 🔐 (any staff role)
Get the currently logged-in staff profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": { "id": 3, "first_name": "System", "last_name": "Administrator", "email": "admin@neu.edu.ph", "role_id": 4, "role_name": "admin", "employee_id": "EMP-261000", "status": "active" }
}
```

---

### POST /auth/change-password 🔐 (any staff role)
Change password for the currently logged-in user.

**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{ "current_password": "oldpassword", "new_password": "newpassword123" }
```

---

### POST /library/verify 🌐 (public — for kiosk)
Verifies a student or staff for library entry. Logs attendance if allowed.

**Mode 1 — QR Code Scan:**
```json
{ "qr_code": "84f2f87a-17b0-11f1-8850-107b44a0b4fd" }
```

**Mode 2 — Student Number:**
```json
{ "student_number": "26-10001-001" }
```

**Mode 3 — Student Account Login (kiosk alternative):**
```json
{ "student_email": "james.smith@neu.edu.ph", "student_password": "test1234" }
```

**Success Response:**
```json
{
  "success": true,
  "message": "Library entry allowed",
  "user": { "student_number": "26-10001-001", "name": "Christian Leocario", "section": "1BSIT-1", "type": "student" },
  "event": null,
  "time_in": "March 15, 2026 at 11:58:49 AM"
}
```

---

## 👩‍🎓 STUDENT ROUTES

### GET /students 🔐 (Management/Admin only)
Get all students with section info. Paginated.

```
GET /students?limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [ { "id": 1, "student_number": "26-10001-001", "first_name": "Christian", "last_name": "Leocario", "email": "...", "status": "active", "section_name": "1BSIT-1" } ],
  "total": 60,
  "limit": 10,
  "offset": 0
}
```

---

### GET /students/:id 🔐 (any staff)
Get a single student by ID.

```
GET /students/1
```

---

### GET /students/section/:section 🔐 (Management/Admin)
Get students filtered by section ID.

```
GET /students/section/1?limit=10&offset=0
```

---

### GET /students/program/:program 🔐 (Management/Admin)
Get students filtered by program ID.

```
GET /students/program/1?limit=10&offset=0
```

---

### POST /students 🔐 (Management/Admin)
Create a new student. Email and student number are auto-generated.

**Body:**
```json
{
  "first_name": "Ana",
  "last_name": "Santos",
  "section_id": 1,
  "password": "optional_password",
  "status": "active"
}
```

---

### PUT /students/:id 🔐 (Management/Admin)
Update a student (partial update supported).

**Body (all fields optional):**
```json
{
  "first_name": "Ana",
  "last_name": "Santos",
  "email": "ana.santos@neu.edu.ph",
  "status": "inactive"
}
```

---

### DELETE /students/:id 🔐 (Admin only)
Delete a student permanently.

```
DELETE /students/39
```

---

### POST /students/:id/block 🔐 (Librarian/Management/Admin)
Block a student from library access.

**Body:**
```json
{ "reason": "Disruptive behavior" }
```

---

### POST /students/:id/unblock 🔐 (Librarian/Management/Admin)
Unblock a student.

```
POST /students/1/unblock
```
(No body required)

---

## 🎪 EVENT ROUTES

### GET /events/active 🌐 (public)
Get currently active events (start ≤ now ≤ end).

```
GET /events/active
```

---

### GET /events/upcoming 🌐 (public)
Get upcoming events (next 10).

```
GET /events/upcoming
```

---

### GET /events 🔐 (Management/Admin)
Get all events. Paginated.

```
GET /events?limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [ { "id": 2, "title": "Library Exhibit", "start_datetime": "2026-03-20T09:00:00.000Z", "end_datetime": "2026-03-20T12:00:00.000Z", "created_by_name": "System Administrator" } ],
  "total": 6,
  "limit": 10,
  "offset": 0
}
```

---

### GET /events/:id 🔐 (Management/Admin)
Get a single event.

```
GET /events/2
```

---

### POST /events 🔐 (Management/Admin)
Create a new event.

**Body:**
```json
{
  "title": "Reading Month",
  "description": "Annual reading month celebration",
  "start_datetime": "2026-04-01 08:00:00",
  "end_datetime": "2026-04-01 17:00:00"
}
```

---

### PUT /events/:id 🔐 (Management/Admin)
Update an event (partial update — only send what you want to change).

**Body:**
```json
{ "title": "Updated Title" }
```

---

### DELETE /events/:id 🔐 (Management/Admin)
Delete an event.

```
DELETE /events/2
```

---

## 🏫 COLLEGE ROUTES

### GET /colleges 🔐 (any staff)
Get all colleges.

```
GET /colleges?limit=10&offset=0
```

---

### GET /colleges/:id 🔐 (any staff)
Get a single college by ID.

```
GET /colleges/6
```

---

### POST /colleges 🔐 (Management/Admin)
Create a college.

**Body:**
```json
{ "college_name": "College of Architecture" }
```

---

### PUT /colleges/:id 🔐 (Management/Admin)
Update a college.

**Body:**
```json
{ "college_name": "College of Architecture and Fine Arts" }
```

---

### DELETE /colleges/:id 🔐 (Admin only)
Delete a college.

```
DELETE /colleges/18
```

---

## 📚 PROGRAM ROUTES

### GET /programs 🔐 (any staff)
Get all programs with college names.

```
GET /programs
```

---

### GET /programs/college/:collegeId 🔐 (any staff)
Get programs for a specific college.

```
GET /programs/college/6
```

---

### GET /programs/:id 🔐 (any staff)
Get a single program.

```
GET /programs/1
```

---

### POST /programs 🔐 (Management/Admin)
Create a new program.

**Body:**
```json
{
  "college_id": 6,
  "program_code": "BSDA",
  "program_name": "Bachelor of Science in Data Analytics"
}
```

---

### PUT /programs/:id 🔐 (Management/Admin)
Update a program.

**Body:**
```json
{ "program_name": "Updated Name" }
```

---

### DELETE /programs/:id 🔐 (Admin only)
Delete a program.

```
DELETE /programs/4
```

---

## 📂 SECTION ROUTES

### GET /sections 🔐 (any staff)
Get all sections with program and college info.

```
GET /sections
```

---

### GET /sections/program/:programId 🔐 (any staff)
Get sections for a specific program.

```
GET /sections/program/1
```

---

### GET /sections/:id 🔐 (any staff)
Get a single section.

```
GET /sections/1
```

---

### POST /sections 🔐 (Management/Admin)
Create a section.

**Body:**
```json
{
  "program_id": 1,
  "section_name": "4BSIT-5",
  "year_level": 4
}
```

---

### PUT /sections/:id 🔐 (Management/Admin)
Update a section.

**Body:**
```json
{ "section_name": "4BSIT-5A", "year_level": 4 }
```

---

### DELETE /sections/:id 🔐 (Admin only)
Delete a section.

```
DELETE /sections/49
```

---

## 📊 LOG ROUTES

### GET /api/logs/attendance 🔐 (Librarian/Management/Admin)
Get paginated attendance logs. All filters are optional.

```
GET /api/logs/attendance?limit=10&offset=0
GET /api/logs/attendance?user_type=student&limit=10&offset=0
GET /api/logs/attendance?user_type=staff&start_date=2026-03-01&end_date=2026-03-15
```

**Response:**
```json
{
  "success": true,
  "data": [ { "id": 35, "user_id": 39, "time_in": "2026-03-13T17:08:25.000Z", "remarks": "Library entry allowed", "user_name": "James Smith", "user_type": "student" } ],
  "total": 43,
  "limit": 10,
  "offset": 0
}
```

---

### GET /api/logs/attendance/stats 🔐 (Librarian/Management/Admin)
Get attendance statistics with chart data. All filters are optional.

```
GET /api/logs/attendance/stats
GET /api/logs/attendance/stats?start_date=2026-03-01&end_date=2026-03-15
GET /api/logs/attendance/stats?college_id=6
GET /api/logs/attendance/stats?program_id=1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 43,
    "today": 0,
    "this_week": 5,
    "by_status": [{ "status": "valid", "count": 43 }],
    "by_user_type": [{ "user_type": "student", "count": 38 }, { "user_type": "staff", "count": 5 }],
    "graph_data": [ { "date": "2026-03-13", "count": 7 }, { "date": "2026-03-14", "count": 5 } ]
  }
}
```

---

### GET /api/logs/activity/:user_type/:user_id 🔐 (Librarian/Management/Admin)
Get activity history for a specific user.

```
GET /api/logs/activity/student/1
GET /api/logs/activity/staff/3?limit=20
```

---

### GET /api/logs/blocked 🔐 (Librarian/Management/Admin)
Get all currently blocked users.

```
GET /api/logs/blocked
```

**Response:**
```json
{
  "success": true,
  "data": [ { "id": 9, "user_id": 3, "reason": "qweqw", "blocked_at": "2026-03-12T18:44:26.000Z", "unblock_at": null, "first_name": "Christian", "last_name": "Leocario", "blocked_by_name": "System" } ],
  "count": 1
}
```

---

## 📈 STATS ROUTES (NEW)

### GET /api/stats/dashboard 🔐 (Librarian/Management/Admin)
Get full dashboard summary statistics.

```
GET /api/stats/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "students": { "total": 60 },
    "staff": { "total": 3 },
    "events": { "active": 0, "upcoming": 6 },
    "attendance": { "total": 43, "today": 0, "this_week": 0, "this_month": 9 },
    "blocked_users": 2
  }
}
```

---

### GET /api/stats/attendance-graph 🔐 (Librarian/Management/Admin)
Get graph data for attendance visualization.

```
GET /api/stats/attendance-graph?period=week
GET /api/stats/attendance-graph?period=month
GET /api/stats/attendance-graph?period=year
GET /api/stats/attendance-graph?period=custom&start_date=2026-03-01&end_date=2026-03-15
GET /api/stats/attendance-graph?period=month&college_id=6
GET /api/stats/attendance-graph?period=month&program_id=1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "student": [ { "date": "2026-03-13", "count": 6, "user_type": "student" } ],
    "staff":   [ { "date": "2026-03-13", "count": 1, "user_type": "staff" } ],
    "period": "month"
  }
}
```

---

## 🧪 Quick Test Sequence

Use these in order to test the whole system:

```
1.  POST /auth/login                          → get token
2.  GET  /auth/profile                        → verify token works
3.  GET  /api/stats/dashboard                 → check dashboard stats
4.  GET  /students?limit=10&offset=0          → list students
5.  POST /students                            → create student
6.  POST /students/39/block  { reason: "..." }→ block student
7.  POST /library/verify { qr_code: "..." }   → QR entry (should be blocked)
8.  POST /students/39/unblock                 → unblock
9.  POST /library/verify { student_email, student_password } → account login
10. GET  /api/logs/attendance                 → check log was created
11. GET  /api/logs/attendance/stats           → verify stats
12. GET  /api/stats/attendance-graph?period=week → graph data
13. POST /events { title, description, start_datetime, end_datetime }
14. PUT  /events/2 { "title": "Updated" }     → partial update
15. GET  /api/logs/blocked                    → see blocked list
```
