# Role-Based Access Control (RBAC) Matrix

## Overview
This document defines the complete authorization structure for the NEU Library Attendance System. It specifies exactly what actions and features each role is permitted to access.

---

## System Roles

| Role ID | Role Name | Description |
|---------|-----------|-------------|
| 1 | student | Library visitor student |
| 2 | librarian | Library staff |
| 3 | management | School management |
| 4 | admin | System administrator |

---

## Permissions

| Permission ID | Permission Name | Description |
|---------------|-----------------|-------------|
| 1 | scan_qr | Scan QR for attendance |
| 2 | view_own_attendance | View personal attendance history |
| 3 | open_session | Open library session |
| 4 | close_session | Close library session |
| 5 | view_all_attendance | View all attendance logs |
| 6 | export_reports | Export attendance reports |
| 7 | manage_users | Create and manage users |
| 8 | assign_roles | Assign roles to users |
| 9 | block_user | Block a user from entering library |

---

## Application Features & Pages

### Portal Pages

| Page | Description |
|------|-------------|
| Dashboard | Overview of library statistics and recent activity |
| Statistics | Attendance analytics with charts and trends |
| Students | Student management view |
| Events | Library event management |
| Logs | Complete attendance logs |

### Kiosk Features

| Feature | Description |
|---------|-------------|
| QR Scanner | Scan student/staff QR code for attendance |
| Manual Entry | Enter student number or employee ID manually |
| Session Control | Open/Close library sessions |

---

## Role Permission Matrix

### STUDENT (Role ID: 1)

**CAN DO:**
- ✅ Access Kiosk QR Scanner
- ✅ Scan personal QR code for attendance
- ✅ View own attendance history (via student portal)

**CANNOT DO:**
- ❌ Access Staff Portal
- ❌ View Dashboard
- ❌ View Statistics
- ❌ View all attendance logs
- ❌ Manage students
- ❌ Manage events
- ❌ Export reports
- ❌ Block users
- ❌ Manage users
- ❌ Assign roles
- ❌ Open/Close library sessions

---

### LIBRARIAN (Role ID: 2)

**CAN DO:**
- ✅ Access Staff Portal
- ✅ View Dashboard (own college only)
- ✅ View Statistics
- ✅ View all attendance logs
- ✅ View Students list (read-only)
- ✅ View Events list (read-only)
- ✅ Access Kiosk mode
- ✅ Scan QR codes for attendance
- ✅ Open library session
- ✅ Close library session
- ✅ Block/unblock users

**CANNOT DO:**
- ❌ Export reports
- ❌ Create/Edit/Delete students
- ❌ Create/Edit/Delete events
- ❌ Create/Edit/Delete staff users
- ❌ Assign roles to users
- ❌ Access System Admin features
- ❌ Manage colleges/programs/sections

---

### MANAGEMENT (Role ID: 3)

**CAN DO:**
- ✅ Access Staff Portal (full access)
- ✅ View Dashboard (all colleges)
- ✅ View Statistics
- ✅ View all attendance logs
- ✅ View Students list
- ✅ View Events list
- ✅ Access Kiosk mode
- ✅ Scan QR codes for attendance
- ✅ Open library session
- ✅ Close library session
- ✅ Block/unblock users
- ✅ Export attendance reports
- ✅ View all colleges, programs, sections

**CANNOT DO:**
- ❌ Create/Edit/Delete students
- ❌ Create/Edit/Delete events
- ❌ Create/Edit/Delete staff users
- ❌ Assign roles to users
- ❌ Access System Admin features
- ❌ Modify system settings

---

### ADMIN / SYSTEM ADMIN (Role ID: 4)

**CAN DO:**
- ✅ **FULL ACCESS** - All features enabled
- ✅ Access Staff Portal (full access)
- ✅ Access Kiosk mode
- ✅ View Dashboard (all colleges)
- ✅ View Statistics
- ✅ View all attendance logs
- ✅ Export attendance reports
- ✅ View/Manage Students (CRUD)
- ✅ View/Manage Events (CRUD)
- ✅ View/Manage Staff Users (CRUD)
- ✅ View/Manage Colleges
- ✅ View/Manage Programs
- ✅ View/Manage Sections
- ✅ Block/unblock users
- ✅ Assign roles to users
- ✅ Open/Close library sessions
- ✅ System configuration
- ✅ Database management

**CANNOT DO:**
- Nothing restricted - Full superuser access

---

## Navigation Access by Role

| Navigation Item | Student | Librarian | Management | Admin |
|---------------|:-------:|:---------:|:----------:|:-----:|
| **Attendance Group** | | | | |
| Dashboard | ❌ | ✅ (limited) | ✅ | ✅ |
| Statistics | ❌ | ✅ | ✅ | ✅ |
| **Data Group** | | | | |
| Students | ❌ | 👁️ (view) | 👁️ (view) | ✅ (full) |
| Events | ❌ | 👁️ (view) | 👁️ (view) | ✅ (full) |
| Logs | ❌ | ✅ | ✅ | ✅ |
| **System** | | | | |
| User Management | ❌ | ❌ | ❌ | ✅ |
| Settings | ❌ | ❌ | ❌ | ✅ |

**Legend:**
- ✅ = Full Access
- 👁️ = View Only (read)
- ❌ = No Access

---

## API Endpoint Access Matrix

| Endpoint | Student | Librarian | Management | Admin |
|----------|:-------:|:---------:|:----------:|:-----:|
| `GET /stats/dashboard` | ❌ | ✅* | ✅ | ✅ |
| `GET /stats/attendance-graph` | ❌ | ✅ | ✅ | ✅ |
| `GET /logs/attendance` | ❌ | ✅ | ✅ | ✅ |
| `GET /students` | ❌ | ✅ | ✅ | ✅ |
| `POST /students` | ❌ | ❌ | ❌ | ✅ |
| `PUT /students/:id` | ❌ | ❌ | ❌ | ✅ |
| `DELETE /students/:id` | ❌ | ❌ | ❌ | ✅ |
| `GET /events` | ❌ | ✅ | ✅ | ✅ |
| `POST /events` | ❌ | ❌ | ❌ | ✅ |
| `PUT /events/:id` | ❌ | ❌ | ❌ | ✅ |
| `DELETE /events/:id` | ❌ | ❌ | ❌ | ✅ |
| `GET /staff` | ❌ | ❌ | ✅ | ✅ |
| `POST /staff` | ❌ | ❌ | ❌ | ✅ |
| `PUT /staff/:id` | ❌ | ❌ | ❌ | ✅ |
| `DELETE /staff/:id` | ❌ | ❌ | ❌ | ✅ |
| `POST /auth/block` | ❌ | ✅ | ✅ | ✅ |
| `GET /colleges` | ❌ | ✅ | ✅ | ✅ |
| `GET /programs` | ❌ | ✅ | ✅ | ✅ |
| `GET /sections` | ❌ | ✅ | ✅ | ✅ |

*Note: Librarian sees limited data based on their assigned college

---

## Data Scope by Role

| Data Type | Student | Librarian | Management | Admin |
|-----------|:-------:|:---------:|:----------:|:-----:|
| Own attendance | ✅ | ✅ | ✅ | ✅ |
| Own college logs | ❌ | ✅ | ✅ | ✅ |
| All college logs | ❌ | ❌ | ✅ | ✅ |
| Own college students | ❌ | ✅ | ✅ | ✅ |
| All students | ❌ | ❌ | ✅ | ✅ |
| Own college staff | ❌ | ✅ | ✅ | ✅ |
| All staff | ❌ | ❌ | ✅ | ✅ |

---

## Implementation Notes

### Middleware Requirements
1. **AuthMiddleware** - Validates JWT token
2. **RoleMiddleware** - Checks user role against required permissions
3. **ScopeMiddleware** - Filters data based on user's college assignment

### Recommended Implementation
```javascript
// Example permission check
const hasPermission = (userRole, permission) => {
  const rolePermissions = {
    student: ['scan_qr', 'view_own_attendance'],
    librarian: ['scan_qr', 'open_session', 'close_session', 'view_all_attendance', 'block_user'],
    management: ['scan_qr', 'view_own_attendance', 'open_session', 'close_session', 
                  'view_all_attendance', 'export_reports', 'manage_users', 'assign_roles', 'block_user'],
    admin: ['scan_qr', 'view_own_attendance', 'open_session', 'close_session', 
            'view_all_attendance', 'export_reports', 'manage_users', 'assign_roles', 'block_user']
  };
  return rolePermissions[userRole]?.includes(permission);
};
```

### Session Management
- Librarians can open/close library sessions
- Management can open/close library sessions  
- Students cannot control sessions
- Admin can control sessions

---

## Current Database Role-Permission Assignments

| Role | Permissions Assigned |
|------|---------------------|
| student | scan_qr, view_own_attendance |
| librarian | scan_qr, open_session, close_session, view_all_attendance, block_user |
| management | scan_qr, view_own_attendance, open_session, close_session, view_all_attendance, export_reports, manage_users, assign_roles, block_user |
| admin | ALL (scan_qr, view_own_attendance, open_session, close_session, view_all_attendance, export_reports, manage_users, assign_roles, block_user) |

---

*Document Version: 1.0*
*Last Updated: 2026-03-16*
