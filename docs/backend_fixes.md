# Backend Fixes & New Features Changelog

**Date**: 2026-03-15  
**Author**: Antigravity (Senior Full Stack AI Agent)  
**Project**: NE-Library (New Era University Library System)

---

## 🐛 Bug Fixes

### BUG 1 — Email/Credential Whitespace (authController.js)
**File**: `controllers/authController.js`  
**Issue**: Admin account email in DB had trailing `\r\n` whitespace. Login input was not trimmed.  
**Fix**: Applied `.trim()` to `email` and `employee_id` inputs in `login` handler.

---

### BUG 2 — Missing `generateEmployeeId` Import (CRITICAL CRASH)
**File**: `controllers/authController.js`  
**Issue**: `generateEmployeeId()` was called on line 109 for auto-ID generation in `register`, but the function was **never imported** into the file. Every call to `POST /auth/register` without a manual `employee_id` crashed the server with `ReferenceError: generateEmployeeId is not defined`.  
**Fix**: Added `const { generateEmployeeId } = require("../middleware/generateEmployeeId");` at the top.  
**Also**: Moved field validation (`first_name`, `last_name`, `password`, `role_id`) **before** the async `generateEmployeeId()` call, so invalid payloads fail fast without unnecessary DB queries.

---

### BUG 3 — `logActivity` Missing Schema Columns
**File**: `services/authServices.js`  
**Issue**: The `logActivity()` function only wrote `(user_id, action_type, description)` to `activity_logs`, missing the `user_type` (enum: student/staff/admin) and `identifier` columns defined in the schema.  
**Fix**: Updated signature to `logActivity(userId, actionType, description, userType = null, identifier = null)` and updated all call sites to pass the appropriate values.

---

### BUG 4 — `updateEvent` Overwrites All Fields (Partial Update Broken)
**File**: `services/eventsServices.js`  
**Issue**: `UPDATE events SET title=?, description=?, start_datetime=?, end_datetime=?` always set all 4 fields regardless of what was provided. Sending `{ "title": "New Title" }` would NULL out dates.  
**Fix**: Rewrote `updateEvent` using dynamic field building (same pattern as `studentServices.updateStudent`) — only updates fields that are explicitly provided.

---

### BUG 5 — `getAllStudents` Response Key Inconsistency
**File**: `controllers/studentController.js`  
**Issue**: `GET /students` returned `{ rows: [...] }` while every other endpoint returns `{ data: [...] }`. This inconsistency broke any frontend code expecting `data`.  
**Fix**: Changed `rows` → `data` in response. Also standardized to always paginate (default limit=10, offset=0).

---

### BUG 6 — `by_user_type` in Attendance Stats Hardcoded Wrong
**File**: `services/logServices.js`  
**Issue**: `getAttendanceStats` returned `by_user_type: [{user_type: 'student', count: <TOTAL_ALL>}]` — always showing the overall total as students, never computing staff count separately.  
**Fix**: Added two separate COUNT queries — one for students (joined via `students` table) and one for staff (joined via `staff_users` table). Returns proper breakdown: `[{user_type:'student', count: N}, {user_type:'staff', count: M}]`.

---

## ✨ New Features

### Feature 1 — Pagination Total Count for All List Endpoints
All list endpoints now return `{ data, total, limit, offset }` so the frontend can implement proper infinite-scroll with a known stopping point.

| Endpoint | Before | After |
|----------|--------|-------|
| `GET /students` | `{ rows: [...] }` | `{ data: [...], total: N, limit, offset }` |
| `GET /events` | `{ data: [...] }` | `{ data: [...], total: N, limit, offset }` |
| `GET /api/logs/attendance` | `{ data: [...], count }` | `{ data: [...], total, limit, offset }` |

---

### Feature 2 — Dashboard Statistics Endpoint
**New Files**: `services/statsServices.js`, `controllers/statsController.js`, `routes/statsRoute.js`

#### `GET /api/stats/dashboard`
Returns summary for the staff dashboard first-view:
```json
{
  "students": { "total": 60 },
  "staff": { "total": 3 },
  "events": { "active": 0, "upcoming": 6 },
  "attendance": { "total": 43, "today": 0, "this_week": 0, "this_month": 9 },
  "blocked_users": 2
}
```

#### `GET /api/stats/attendance-graph`
Returns daily/monthly graph data for the stats curved graph on dashboard.  
**Query params**: `period` (week/month/year/custom), `start_date`, `end_date`, `college_id`, `program_id`  
Returns student and staff entries separately for stacked graph visualizations.

---

### Feature 3 — Kiosk Student Account Login
**File**: `controllers/authController.js` (`verifyLibraryEntry`)  
`POST /library/verify` now accepts **3 input modes**:

| Mode | Fields | Description |
|------|--------|-------------|
| QR Scan | `qr_code` | Standard QR code scan (existing) |
| Student Number | `student_number` | Lookup by student number (existing) |
| **Account Login** | `student_email` + `student_password` | **New** — manual kiosk entry for students who can't scan QR |

For account login, the student's bcrypt password is verified before logging attendance. The response also now includes the student's full `name` field for the kiosk display.

---

## 📁 Files Modified

| File | Type |
|------|------|
| `controllers/authController.js` | Bug 1, 2 fix + Feature 3 |
| `services/authServices.js` | Bug 3 fix + `findStudentByEmail` |
| `services/eventsServices.js` | Bug 4 fix + pagination total |
| `controllers/studentController.js` | Bug 5 fix + pagination |
| `services/studentServices.js` | Pagination `{rows,total}` |
| `services/logServices.js` | Bug 6 fix + pagination `{logs,total}` |
| `controllers/logController.js` | Pagination destructure |
| `controllers/eventController.js` | Pagination destructure |
| `app.js` | Added `statsRoute` |

## 📁 Files Created

| File | Purpose |
|------|---------|
| `services/statsServices.js` | Dashboard stats + graph queries |
| `controllers/statsController.js` | Stats API handlers |
| `routes/statsRoute.js` | `/api/stats/*` route definitions |
| `docs/backend_fixes.md` | This document |
