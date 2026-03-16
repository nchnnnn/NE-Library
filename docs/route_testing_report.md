# API Route Testing Report

**Test Date:** 2026-03-15  
**Server:** http://localhost:3300  
**Test User:** admin@neu.edu.ph (role: admin)

---

## Summary

All routes have been tested and are working correctly. The API provides proper responses for both successful requests and error cases.

---

## Test Results

### Authentication Routes

| Endpoint | Method | Status | Response |
|----------|--------|--------|----------|
| [`/auth/login`](/routes/authRoute.js:7) | POST | ✅ Working | Returns JWT token on valid credentials |
| [`/auth/register`](/routes/authRoute.js:8) | POST | ✅ Working | Registers new staff user (requires admin token) |
| [`/auth/profile`](/routes/authRoute.js:12) | GET | ✅ Working | Returns current user profile |
| [`/auth/change-password`](/routes/authRoute.js:13) | POST | ✅ Working | Successfully changes user password |
| [`/library/verify`](/routes/authRoute.js:9) | POST | ✅ Working | Verifies library entry via QR/student number |

---

### Student Routes

| Endpoint | Method | Status | Response |
|----------|--------|--------|----------|
| [`/students`](/routes/studentRoute.js:12) | GET | ✅ Working | Returns paginated list of students (requires role 3 or 4) |
| [`/students/:id`](/routes/studentRoute.js:34) | GET | ✅ Working | Returns student by ID |
| [`/students/section/:section`](/routes/studentRoute.js:19) | GET | ✅ Working | Returns students by section name |
| [`/students/program/:program`](/routes/studentRoute.js:26) | GET | ✅ Working | Returns students by program |
| [`/students`](/routes/studentRoute.js:37) | POST | ✅ Working | Creates new student (requires role 3 or 4) |
| [`/students/:id`](/routes/studentRoute.js:45) | PUT | ✅ Working | Updates student (requires role 3 or 4) |
| [`/students/:id`](/routes/studentRoute.js:53) | DELETE | ✅ Working | Deletes student (requires role 4) |
| [`/students/:id/block`](/routes/studentRoute.js:61) | POST | ✅ Working | Blocks student (requires role 2, 3, or 4) |
| [`/students/:id/unblock`](/routes/studentRoute.js:69) | POST | ✅ Working | Unblocks student (requires role 2, 3, or 4) |

---

### College Routes

| Endpoint | Method | Status | Response |
|----------|--------|--------|----------|
| [`/colleges`](/routes/collegeRoute.js:7) | GET | ✅ Working | Returns list of 17 colleges |
| [`/colleges/:id`](/routes/collegeRoute.js:8) | GET | ✅ Working | Returns college by ID |
| [`/colleges`](/routes/collegeRoute.js:11) | POST | ✅ Working | Creates college (requires role 3 or 4) |
| [`/colleges/:id`](/routes/collegeRoute.js:12) | PUT | ✅ Working | Updates college (requires role 3 or 4) |
| [`/colleges/:id`](/routes/collegeRoute.js:13) | DELETE | ✅ Working | Deletes college (requires role 4) |

---

### Program Routes

| Endpoint | Method | Status | Response |
|----------|--------|--------|----------|
| [`/programs`](/routes/programRoute.js:7) | GET | ✅ Working | Returns list of programs |
| [`/programs/college/:collegeId`](/routes/programRoute.js:8) | GET | ✅ Working | Returns programs by college ID |
| [`/programs/:id`](/routes/programRoute.js:9) | GET | ✅ Working | Returns program by ID |
| [`/programs`](/routes/programRoute.js:12) | POST | ✅ Working | Creates program (requires role 3 or 4) |
| [`/programs/:id`](/routes/programRoute.js:13) | PUT | ✅ Working | Updates program (requires role 3 or 4) |
| [`/programs/:id`](/routes/programRoute.js:14) | DELETE | ✅ Working | Deletes program (requires role 4) |

---

### Section Routes

| Endpoint | Method | Status | Response |
|----------|--------|--------|----------|
| [`/sections`](/routes/sectionRoute.js:7) | GET | ✅ Working | Returns list of 48 sections |
| [`/sections/program/:programId`](/routes/sectionRoute.js:8) | GET | ✅ Working | Returns sections by program ID |
| [`/sections/:id`](/routes/sectionRoute.js:9) | GET | ✅ Working | Returns section by ID |
| [`/sections`](/routes/sectionRoute.js:12) | POST | ✅ Working | Creates section (requires role 3 or 4) |
| [`/sections/:id`](/routes/sectionRoute.js:13) | PUT | ✅ Working | Updates section (requires role 3 or 4) |
| [`/sections/:id`](/routes/sectionRoute.js:14) | DELETE | ✅ Working | Deletes section (requires role 4) |

---

### Event Routes

| Endpoint | Method | Status | Response |
|----------|--------|--------|----------|
| [`/events/active`](/routes/eventRoute.js:8) | GET | ✅ Working | Returns active events (public) |
| [`/events/upcoming`](/routes/eventRoute.js:11) | GET | ✅ Working | Returns upcoming events (public) |
| [`/events`](/routes/eventRoute.js:14) | GET | ✅ Working | Returns all events (requires role 3 or 4) |
| [`/events/:id`](/routes/eventRoute.js:21) | GET | ✅ Working | Returns event by ID |
| [`/events`](/routes/eventRoute.js:28) | POST | ✅ Working | Creates event (requires role 3 or 4) |
| [`/events/:id`](/routes/eventRoute.js:35) | PUT | ✅ Working | Updates event (requires role 3 or 4) |
| [`/events/:id`](/routes/eventRoute.js:42) | DELETE | ✅ Working | Deletes event (requires role 3 or 4) |

---

### Log Routes

| Endpoint | Method | Status | Response |
|----------|--------|--------|----------|
| [`/logs/attendance`](/routes/logRoute.js:7) | GET | ✅ Working | Returns attendance logs (requires role 2, 3, or 4) |
| [`/logs/attendance/stats`](/routes/logRoute.js:14) | GET | ✅ Working | Returns attendance statistics |
| [`/logs/activity/:user_type/:user_id`](/routes/logRoute.js:21) | GET | ✅ Working | Returns user activity logs |
| [`/logs/blocked`](/routes/logRoute.js:28) | GET | ✅ Working | Returns list of blocked users |

---

### Stats Routes

| Endpoint | Method | Status | Response |
|----------|--------|--------|----------|
| [`/stats/dashboard`](/routes/statsRoute.js:7) | GET | ✅ Working | Returns dashboard statistics |
| [`/stats/attendance-graph`](/routes/statsRoute.js:15) | GET | ✅ Working | Returns attendance graph data |

---

## Error Handling Tests

| Test Case | Endpoint | Expected | Actual | Status |
|-----------|----------|----------|--------|--------|
| No token provided | GET /colleges | 401 Unauthorized | `{"success":false,"message":"Access denied. No token provided."}` | ✅ Working |
| Invalid login credentials | POST /auth/login | 401 Unauthorized | `{"success":false,"message":"Invalid credentials"}` | ✅ Working |
| Non-existent user verify | POST /library/verify | 404 Not Found | `{"success":false,"message":"No user found with provided credentials"}` | ✅ Working |

---

## Sample Responses

### GET /auth/login (Success)
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 3,
    "first_name": "System",
    "last_name": "Administrator",
    "email": "admin@neu.edu.ph",
    "role_id": 4,
    "role_name": "admin",
    "employee_id": "EMP-261000"
  }
}
```

### GET /stats/dashboard
```json
{
  "success": true,
  "data": {
    "students": { "total": 23 },
    "staff": { "total": 3 },
    "events": { "active": 1, "upcoming": 0 },
    "attendance": { "total": 18, "today": 18, "this_week": 18, "this_month": 18 },
    "blocked_users": 1
  }
}
```

### GET /events/active (Public)
```json
{
  "success": true,
  "data": [
    {
      "id": 9,
      "title": "Library Exhibit",
      "description": "Library Exhibit",
      "start_datetime": "2026-03-10T01:00:00.000Z",
      "end_datetime": "2026-03-20T04:00:00.000Z"
    }
  ]
}
```

---

## Role-Based Access Control

| Role ID | Role Name | Access Level |
|---------|-----------|--------------|
| 1 | Student | Library entry only |
| 2 | Librarian | Logs, Stats, Block/Unblock students |
| 3 | Management | All CRUD operations |
| 4 | Admin | Full access including delete |

---

## Conclusion

All 44+ routes in the NE Library API are working correctly. The API properly handles:
- ✅ Authentication with JWT tokens
- ✅ Role-based access control
- ✅ CRUD operations for all entities
- ✅ Error handling with appropriate HTTP status codes
- ✅ Public routes for library entry verification
- ✅ Pagination support for list endpoints

**Test completed successfully on 2026-03-15**
