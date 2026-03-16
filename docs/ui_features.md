# NE-Library — UI Features & Pages Reference

> Use this document as a prompt reference when building the frontend UI.  
> Base API URL: `http://localhost:3300`  
> Auth: JWT token in `Authorization: Bearer <token>` header

---

## Pages Overview

| Page | Access | Description |
|------|--------|-------------|
| **Login** | Public | Staff login (email or employee ID + password) |
| **Kiosk** | Public | Library entrance — QR scan or student account login |
| **Dashboard** | Role 2,3,4 | Overview stats, attendance graph, quick actions |
| **Students** | Role 3,4 | Student list, create, edit, delete, block/unblock |
| **Events** | Role 3,4 | Event list, create, edit, delete |
| **Attendance Logs** | Role 2,3,4 | Filterable attendance history table |
| **Blocked Users** | Role 2,3,4 | Currently blocked students |
| **Colleges** | Role 3,4 | College list, CRUD |
| **Programs** | Role 3,4 | Program list by college, CRUD |
| **Sections** | Role 3,4 | Section list by program, CRUD |
| **Profile** | Role 2,3,4 | View/edit own profile, change password |
| **Staff Management** | Role 4 | Register new staff (admin only) |

---

## 1. Login Page

**API**: `POST /auth/login`

### UI Elements
- Email OR Employee ID input field (toggle between the two)
- Password input
- Login button
- Error message display
- NEU branding/logo

### Behavior
- On success: store JWT token, redirect to Dashboard
- On failure: show error message ("Invalid credentials")
- Remember: roles 2,3,4 only (students can't login here)

---

## 2. Kiosk Page (Library Entrance)

**API**: `POST /library/verify`

### UI Elements
- **Camera QR Scanner** — live camera feed with QR overlay
- **Toggle**: Switch between "QR Scan" and "Student Account Login"
- **Student Account Form** (when toggled):
  - Email input
  - Password input
  - Submit button
- **Result Display**:
  - ✅ Green card: Student name, student number, section, time_in, event (if active)
  - ❌ Red card: Blocked reason or inactive message
- Auto-reset after 5 seconds to scan next student

### 3 Input Modes
```
Mode 1: { "qr_code": "uuid-string" }           → QR camera scan
Mode 2: { "student_number": "26-10001-001" }    → Manual number entry
Mode 3: { "email": "...", "password": "..." }   → Student account login
```

### Response Fields
```json
{
  "user": {
    "student_number": "26-10001-001",
    "name": "Christian Leocario",
    "section": "1BSIT-1",
    "type": "student"
  },
  "event": { "name": "Library Exhibit", "start": "...", "end": "..." },
  "time_in": "March 15, 2026 at 11:58:49 AM"
}
```

---

## 3. Dashboard Page

**APIs**:
- `GET /api/stats/dashboard` — summary cards
- `GET /api/stats/attendance-graph?period=week` — chart data

### UI Elements

#### Summary Cards (top row)
| Card | Data Source |
|------|------------|
| Total Students | `data.students.total` |
| Total Staff | `data.staff.total` |
| Active Events | `data.events.active` |
| Upcoming Events | `data.events.upcoming` |
| Today's Attendance | `data.attendance.today` |
| This Week | `data.attendance.this_week` |
| This Month | `data.attendance.this_month` |
| Blocked Users | `data.blocked_users` |

#### Attendance Graph (curved line chart)
- X-axis: dates, Y-axis: entry count
- Two lines: Student (blue) vs Staff (orange)
- **Period filter dropdown**: This Week / This Month / This Year / Custom Date Range
- **Department filter**: dropdown of colleges from `GET /colleges`
- **Program filter**: dropdown of programs from `GET /programs/college/:id`

Graph API: `GET /api/stats/attendance-graph?period=month&college_id=6&program_id=1`

Response:
```json
{
  "student": [{ "date": "2026-03-13", "count": 6 }, ...],
  "staff": [{ "date": "2026-03-13", "count": 1 }, ...]
}
```

---

## 4. Students Page

**APIs**:
- `GET /students?limit=10&offset=0` — paginated list
- `GET /students/:id` — single student detail
- `POST /students` — create
- `PUT /students/:id` — update (partial)
- `DELETE /students/:id` — delete (admin only)
- `POST /students/:id/block` — block
- `POST /students/:id/unblock` — unblock
- `GET /students/section/:id` — filter by section
- `GET /students/program/:id` — filter by program

### UI Elements
- **Search/filter bar**: by section, by program
- **Student table** with columns: Profile Image, Student Number, Name, Email, Section, Status, Actions
- **Infinite scroll**: load next 10 when scrolling to bottom (stop when `offset + limit >= total`)
- **Profile image**: show `profile_image` if set, otherwise show default avatar icon
- **Action buttons per row**: View, Edit, Block/Unblock, Delete (admin only)
- **Create Student modal/form**:
  - first_name, last_name, section_id (dropdown), password (optional)
  - Student number and email are auto-generated
- **Block modal**: reason input field
- **Status badge**: green = active, red = inactive, orange = blocked

---

## 5. Events Page

**APIs**:
- `GET /events?limit=10&offset=0` — all events (paginated)
- `GET /events/active` — currently active
- `GET /events/upcoming` — future events
- `POST /events` — create
- `PUT /events/:id` — update (partial — only sends changed fields)
- `DELETE /events/:id` — delete

### UI Elements
- **Event list/cards** with: title, description, start date, end date, created by, status badge (active/upcoming/past)
- **Create Event form**: title, description, start_datetime (datetime picker), end_datetime (datetime picker)
- **Edit Event modal**: pre-filled fields, only sends what changed
- **Infinite scroll pagination**
- **Tab filter**: All / Active / Upcoming

---

## 6. Attendance Logs Page

**APIs**:
- `GET /api/logs/attendance?limit=10&offset=0` — paginated logs
- `GET /api/logs/attendance/stats` — statistics

### UI Elements
- **Filter bar**:
  - User type dropdown: All / Student / Staff
  - Date range picker: start_date, end_date
- **Logs table**: Name, User Type, Time In, Remarks, Status
- **Infinite scroll pagination**
- **Stats panel** (top or sidebar):
  - Total entries
  - Today / This Week
  - By user type: Student count, Staff count
  - Mini graph (daily counts)

---

## 7. Blocked Users Page

**API**: `GET /api/logs/blocked`

### UI Elements
- **Table**: Student Name, Student Number, Reason, Blocked By, Blocked At, Actions
- **Action**: Unblock button → `POST /students/:id/unblock`

---

## 8. Colleges / Programs / Sections Pages

### Colleges
- `GET /colleges` — list all
- `POST /colleges` — create `{ "college_name": "..." }`
- `PUT /colleges/:id` — update
- `DELETE /colleges/:id` — delete (admin only)

### Programs
- `GET /programs` — all programs
- `GET /programs/college/:collegeId` — filter by college
- `POST /programs` — create `{ "college_id": 6, "program_code": "BSIT", "program_name": "..." }`
- `PUT /programs/:id` — update
- `DELETE /programs/:id` — delete (admin only)

### Sections
- `GET /sections` — all sections
- `GET /sections/program/:programId` — filter by program
- `POST /sections` — create `{ "program_id": 1, "section_name": "1BSIT-1", "year_level": 1 }`
- `PUT /sections/:id` — update
- `DELETE /sections/:id` — delete (admin only)

### UI Pattern (same for all 3)
- Table with CRUD actions
- Create/Edit modal
- Cascading dropdowns: College → Program → Section
- Delete only visible for admin (role 4)

---

## 9. Profile Page

**APIs**:
- `GET /auth/profile` — get current user
- `POST /auth/change-password` — change password

### UI Elements
- **Profile card**: avatar (profile_image or default), name, email, employee ID, role badge
- **Change password form**: current password, new password, confirm new password
- **Edit profile** (future): upload profile image

---

## 10. Staff Management (Admin Only)

**API**: `POST /auth/register`

### UI Elements
- **Register Staff form**:
  - first_name, last_name
  - Role dropdown: Librarian (2) / Management (3) / Admin (4)
  - Password input
  - Employee ID (optional — auto-generated if empty)
- Email is auto-generated: `firstname.lastname@neu.edu.ph`

---

## Global UI Components

### Sidebar Navigation
- Dashboard
- Students
- Events
- Attendance Logs
- Blocked Users
- Colleges / Programs / Sections (nested or grouped)
- Staff Management (admin only)
- Profile
- Kiosk Mode (opens in new tab/fullscreen)
- Logout

### Header Bar
- User name + role badge
- Profile image (or default avatar)
- Notifications (future)
- Logout button

### Profile Image Handling
- Both `students` and `staff_users` have `profile_image` column (VARCHAR, nullable)
- If `null` → show default avatar icon/placeholder
- If set → show the image URL

### Toast Notifications
- Success: green toast (created, updated, deleted, unblocked)
- Error: red toast (failed operations)
- Warning: yellow toast (blocked user, inactive account)

### Pagination Pattern
All list endpoints return:
```json
{ "data": [...], "total": 60, "limit": 10, "offset": 0 }
```
- Use infinite scroll
- Load next batch: `offset += limit`
- Stop loading when `offset >= total`

---

## Role-Based UI Visibility

| Element | Librarian (2) | Management (3) | Admin (4) |
|---------|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ |
| Students (view) | ❌ | ✅ | ✅ |
| Students (create/edit) | ❌ | ✅ | ✅ |
| Students (delete) | ❌ | ❌ | ✅ |
| Block/Unblock | ✅ | ✅ | ✅ |
| Events | ❌ | ✅ | ✅ |
| Attendance Logs | ✅ | ✅ | ✅ |
| Colleges/Programs/Sections | ❌ | ✅ | ✅ |
| Register Staff | ❌ | ❌ | ✅ |
| Delete anything | ❌ | ❌ | ✅ |
