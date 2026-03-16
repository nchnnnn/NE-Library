# Pagination Feature (Infinite Scroll)

## Overview
Implemented backend and frontend logic to support infinite scrolling on large data tables. The initial limit is set to 10 rows per fetch, and the tables load more data dynamically as the user scrolls.

## Files Modified
*   **Backend Services**: `studentServices.js`, `collegeServices.js`, `programServices.js`, `sectionServices.js`, `eventsServices.js`, `logServices.js`. Added `limit` and `offset` parameters to the respective `getAll` and data fetching functions to modify the original SQL queries.
*   **Backend Controllers**: `studentController.js`, `collegeController.js`, `programController.js`, `sectionController.js`, `eventController.js`, `logController.js`. Updated API endpoints to properly extract caching parameters like `req.query.limit` and `req.query.offset`.
*   **Frontend API Layer**: `public/js/api.js`. Added `params` support down to the `apiFetch` URLs for events, colleges, programs, sections, and staff endpoints.
*   **Frontend Views**: 
    *   `librarian/students.js`: Re-wrote `libSearchStudents` to use limits and infinite scrolling intersection observers logic.
    *   `librarian/attendance.js`: Added limit logic and intersection observer appended loaders.
    *   `admin/users.js`: Restructured `renderStudentsTab` to include intersecting observer loaders.
