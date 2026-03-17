// Portal Page Logic
// Handles navigation, data fetching, and user interactions

// State
let currentView = "view-dashboard";
let currentUser = null;
let attendanceChart = null;
let currentUserType = "staff"; // 'staff' or 'student'
let selectedUser = null;

// Helper function to get ISO week number
function getWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// Filter state
let dashboardFilters = {
  search: "",
  college_id: "",
  program_id: "",
  year_level: "",
  user_type: "",
};

// Pagination state for each table
const paginationState = {
  dashboard: { offset: 0, limit: 10, loading: false, hasMore: true },
  students: { offset: 0, limit: 10, loading: false, hasMore: true },
  staff: { offset: 0, limit: 10, loading: false, hasMore: true },
  events: { offset: 0, limit: 10, loading: false, hasMore: true },
  logs: { offset: 0, limit: 10, loading: false, hasMore: true },
  staffUsers: { offset: 0, limit: 10, loading: false, hasMore: true },
  studentUsers: { offset: 0, limit: 10, loading: false, hasMore: true },
};

// DOM Elements
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const navBtns = document.querySelectorAll(".nav-btn");
const viewSections = document.querySelectorAll(".view-section");
const userAvatar = document.getElementById("user-avatar");
const userName = document.getElementById("user-name");
const userRole = document.getElementById("user-role");
const btnLogout = document.getElementById("btn-logout");

// Initialize
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await checkAuth();
  setupEventListeners();
  setupFilterListeners();
  setupEditPanelListeners(); // New: setup searchable dropdown listeners
  await loadColleges();
  await loadDashboard();
  setupInfiniteScroll();

  // Check admin access and show admin section
  checkAdminAccess();

  // Initialize navigation groups - expand first group by default
  const firstGroupToggle = document.querySelector(".nav-group-toggle");
  const firstGroupItems = document.querySelector(".nav-group-items");
  if (firstGroupToggle && firstGroupItems) {
    firstGroupToggle.classList.add("active");
    firstGroupItems.classList.add("show");
  }
}

// Setup infinite scroll
function setupInfiniteScroll() {
  const tables = document.querySelectorAll(".table-scroll");

  tables.forEach((tableContainer) => {
    tableContainer.addEventListener("scroll", () => {
      const { scrollTop, scrollHeight, clientHeight } = tableContainer;

      // Load more when near bottom (100px threshold)
      if (scrollHeight - scrollTop - clientHeight < 100) {
        const tableId = tableContainer.closest(".view-section").id;

        loadMoreForView(tableId);
      }
    });
  });
}

// Load more data for specific view
async function loadMoreForView(viewId) {
  let key = "";
  let loadFn = null;

  switch (viewId) {
    case "view-dashboard":
      key = "dashboard";
      loadFn = loadMoreDashboardLogs;
      break;
    case "view-students":
      key = "students";
      loadFn = loadMoreStudents;
      break;
    case "view-staff":
      key = "staff";
      loadFn = loadMoreStaff;
      break;
    case "view-events":
      key = "events";
      loadFn = loadMoreEvents;
      break;
    case "view-logs":
      key = "logs";
      loadFn = loadMoreLogs;
      break;
  }

  if (
    loadFn &&
    paginationState[key] &&
    !paginationState[key].loading &&
    paginationState[key].hasMore
  ) {
    await loadFn();
  }
}

// Check authentication
async function checkAuth() {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  try {
    const res = await fetch("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Unauthorized");

    const data = await res.json();
    currentUser = data.user;
    updateUserInfo();
  } catch (err) {
    console.error("Auth check failed:", err);
    localStorage.removeItem("auth_token");
    window.location.href = "/login.html";
  }
}

// Update user info in header
function updateUserInfo() {
  const fullName = `${currentUser.first_name} ${currentUser.last_name}`;
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  userAvatar.textContent = initials;
  userName.textContent = fullName;
  userRole.textContent =
    currentUser.role_name || currentUser.role_id || "Staff";
}

// Setup event listeners
function setupEventListeners() {
  // Sidebar toggle
  sidebarToggle?.addEventListener("click", toggleSidebar);

  // Navigation group toggles (collapsible)
  const navGroupToggles = document.querySelectorAll(".nav-group-toggle");
  navGroupToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const groupId = toggle.dataset.group;
      const groupItems = document.getElementById(`group-${groupId}`);

      // Toggle the active state on the toggle button
      toggle.classList.toggle("active");

      // Toggle the show class on the group items
      groupItems?.classList.toggle("show");
    });
  });

  // Navigation buttons
  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      switchView(target);
    });
  });

  // Logout
  btnLogout?.addEventListener("click", logout);

  // User type tabs
  const userTabBtns = document.querySelectorAll(".user-tab-btn");
  userTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const userType = btn.dataset.userType;
      switchUserType(userType);
    });
  });

  // Detail tabs
  const detailTabBtns = document.querySelectorAll(".detail-tab-btn");
  detailTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.detailTab;
      switchDetailTab(tab);
    });
  });
}

// Setup filter listeners
function setupFilterListeners() {
  const searchInput = document.getElementById("search-name");
  const collegeInput = document.getElementById("filter-college");
  const programInput = document.getElementById("filter-program");
  const yearInput = document.getElementById("filter-year");
  const roleInput = document.getElementById("filter-role");

  // Search input - debounce
  let searchTimeout;
  searchInput?.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      dashboardFilters.search = e.target.value.trim();
      loadDashboard();
    }, 300);
  });

  // Search on Enter key
  searchInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      clearTimeout(searchTimeout);
      dashboardFilters.search = e.target.value.trim();
      loadDashboard();
    }
  });

  // College filter
  collegeInput?.addEventListener("input", (e) => {
    dashboardFilters.college_id = e.target.value.trim();
    loadDashboard();
  });

  // Program filter
  programInput?.addEventListener("input", (e) => {
    dashboardFilters.program_id = e.target.value.trim();
    loadDashboard();
  });

  // Year filter
  yearInput?.addEventListener("input", (e) => {
    dashboardFilters.year_level = e.target.value.trim();
    loadDashboard();
  });

  // Role filter
  roleInput?.addEventListener("input", (e) => {
    dashboardFilters.user_type = e.target.value.trim().toLowerCase();
    if (
      dashboardFilters.user_type === "student" ||
      dashboardFilters.user_type === "staff"
    ) {
      loadDashboard();
    } else if (dashboardFilters.user_type === "") {
      loadDashboard();
    }
  });

  // Clear buttons
  document.getElementById("clear-search")?.addEventListener("click", () => {
    searchInput.value = "";
    dashboardFilters.search = "";
    loadDashboard();
  });

  document.getElementById("clear-college")?.addEventListener("click", () => {
    collegeInput.value = "";
    dashboardFilters.college_id = "";
    loadDashboard();
  });

  document.getElementById("clear-role")?.addEventListener("click", () => {
    roleInput.value = "";
    dashboardFilters.user_type = "";
    loadDashboard();
  });

  // Clear all filters button
  document
    .getElementById("clear-all-filters")
    ?.addEventListener("click", () => {
      searchInput.value = "";
      collegeInput.value = "";
      roleInput.value = "";
      dashboardFilters.search = "";
      dashboardFilters.college_id = "";
      dashboardFilters.user_type = "";
      loadDashboard();
    });
}

// Load colleges for filter
async function loadColleges() {
  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch("/colleges", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const colleges = data.data || [];

    // Populate datalist for college filter
    const collegeList = document.getElementById("college-list");
    colleges.forEach((college) => {
      const option = document.createElement("option");
      option.value = college.college_name;
      collegeList.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load colleges:", err);
  }
}

// Toggle sidebar collapsed state
function toggleSidebar() {
  sidebar.classList.toggle("collapsed");
}

// Switch between views
function switchView(viewId) {
  // Update nav buttons
  navBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.target === viewId);
  });

  // Update view sections
  viewSections.forEach((section) => {
    section.classList.toggle("active", section.id === viewId);
  });

  currentView = viewId;

  // Reset pagination when switching views
  const viewKey = viewId.replace("view-", "");
  if (paginationState[viewKey]) {
    paginationState[viewKey].offset = 0;
    paginationState[viewKey].hasMore = true;
  }

  // Load data for the view
  switch (viewId) {
    case "view-dashboard":
      loadDashboard();
      break;
    case "view-statistics":
      loadStatistics();
      break;
    case "view-students":
      loadStudents();
      break;
    case "view-staff":
      loadStaff();
      break;
    case "view-events":
      loadEvents();
      break;
    case "view-logs":
      loadLogs();
      break;
    case "view-users":
      loadUsers();
      break;
    case "view-colleges":
      loadCollegesAdmin();
      break;
    case "view-programs":
      loadPrograms();
      break;
    case "view-sections":
      loadSections();
      break;
  }
}

// Logout
async function logout() {
  try {
    const token = localStorage.getItem("auth_token");
    await fetch("/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    localStorage.removeItem("auth_token");
    window.location.href = "/login.html";
  }
}

// ===================
// DATA LOADING
// ===================

// Load dashboard data
async function loadDashboard() {
  try {
    const token = localStorage.getItem("auth_token");

    // Reset pagination
    paginationState.dashboard.offset = 0;
    paginationState.dashboard.hasMore = true;

    // Fetch stats and logs with filters
    const params = new URLSearchParams();
    params.append("limit", paginationState.dashboard.limit);
    if (dashboardFilters.search)
      params.append("search", dashboardFilters.search);
    if (dashboardFilters.college_id)
      params.append("college_id", dashboardFilters.college_id);
    if (dashboardFilters.program_id)
      params.append("program_id", dashboardFilters.program_id);
    if (dashboardFilters.year_level)
      params.append("year_level", dashboardFilters.year_level);
    if (dashboardFilters.user_type)
      params.append("user_type", dashboardFilters.user_type);

    const [statsRes, logsRes] = await Promise.all([
      fetch("/stats/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`/logs/attendance?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const statsData = await statsRes.json();
    const logsData = await logsRes.json();

    const stats = statsData.data || {};
    const logs = logsData.data || [];

    // Update pagination state
    paginationState.dashboard.hasMore =
      logs.length >= paginationState.dashboard.limit;
    paginationState.dashboard.offset = logs.length;

    // Update stat cards
    document.getElementById("stat-total").textContent =
      stats.attendance?.total || 0;
    document.getElementById("stat-today").textContent =
      stats.attendance?.today || 0;
    document.getElementById("stat-students").textContent =
      stats.students?.total || 0;
    document.getElementById("stat-blocked").textContent =
      stats.blocked_users || 0;

    // Update logs table
    renderDashboardLogs(logs, true);
  } catch (err) {
    console.error("Failed to load dashboard:", err);
  }
}

// Load statistics data
async function loadStatistics() {
  try {
    const token = localStorage.getItem("auth_token");

    // Fetch dashboard stats
    const statsRes = await fetch("/stats/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statsData = await statsRes.json();
    const stats = statsData.data || {};

    // Update stat cards
    document.getElementById("stat-stats-total").textContent =
      stats.attendance?.total || 0;
    document.getElementById("stat-stats-today").textContent =
      stats.attendance?.today || 0;
    document.getElementById("stat-stats-week").textContent =
      stats.attendance?.this_week || 0;
    document.getElementById("stat-stats-month").textContent =
      stats.attendance?.this_month || 0;

    // Load chart - default to today
    loadChart("today");
  } catch (err) {
    console.error("Failed to load statistics:", err);
  }
}

// Load chart data
async function loadChart(period = "week") {
  try {
    const token = localStorage.getItem("auth_token");

    const res = await fetch(`/stats/attendance-graph?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    const graphData = data.data || { student: [], staff: [] };

    // Prepare chart data
    const labels = [];
    const studentData = [];
    const staffData = [];

    // Merge and sort all dates
    const allDates = new Set();
    graphData.student.forEach((d) => allDates.add(d.date));
    graphData.staff.forEach((d) => allDates.add(d.date));
    const sortedDates = Array.from(allDates).sort();

    sortedDates.forEach((date) => {
      let label;
      if (period === "today") {
        // Hourly format: "09:00"
        label = date;
      } else if (period === "week") {
        // Daily format: "Mar 15"
        label = new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      } else if (period === "month") {
        // Weekly format: "Week 9", "Week 10", etc.
        label = "Week " + date;
      } else if (period === "year") {
        // Monthly format: "Jan", "Feb", etc.
        label = new Date(date + "-01").toLocaleDateString("en-US", {
          month: "short",
        });
      } else {
        label = new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
      labels.push(label);
      const student = graphData.student.find((d) => d.date === date);
      const staff = graphData.staff.find((d) => d.date === date);
      studentData.push(student ? student.count : 0);
      staffData.push(staff ? staff.count : 0);
    });

    const ctx = document.getElementById("attendance-chart").getContext("2d");

    if (attendanceChart) {
      attendanceChart.destroy();
    }

    attendanceChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Students",
            data: studentData,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Staff",
            data: staffData,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "#64748b",
              usePointStyle: true,
              padding: 20,
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.05)",
            },
            ticks: {
              color: "#64748b",
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(255, 255, 255, 0.05)",
            },
            ticks: {
              color: "#64748b",
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("Failed to load chart:", err);
  }
}

// Setup chart period buttons
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("period-btn")) {
      document
        .querySelectorAll(".period-btn")
        .forEach((btn) => btn.classList.remove("active"));
      e.target.classList.add("active");
      loadChart(e.target.dataset.period);
    }
  });
});

// Load more dashboard logs
async function loadMoreDashboardLogs() {
  if (paginationState.dashboard.loading || !paginationState.dashboard.hasMore)
    return;

  paginationState.dashboard.loading = true;
  showLoadingIndicator("dash-logs-table", true);

  try {
    const token = localStorage.getItem("auth_token");
    const offset = paginationState.dashboard.offset;
    const limit = paginationState.dashboard.limit;

    const params = new URLSearchParams();
    params.append("limit", limit);
    params.append("offset", offset);
    if (dashboardFilters.search)
      params.append("search", dashboardFilters.search);
    if (dashboardFilters.college_id)
      params.append("college_id", dashboardFilters.college_id);
    if (dashboardFilters.user_type)
      params.append("user_type", dashboardFilters.user_type);

    const res = await fetch(`/logs/attendance?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    const logs = data.data || [];

    paginationState.dashboard.hasMore = logs.length >= limit;
    paginationState.dashboard.offset += logs.length;

    renderDashboardLogs(logs, false);
  } catch (err) {
    console.error("Failed to load more dashboard logs:", err);
  } finally {
    paginationState.dashboard.loading = false;
    showLoadingIndicator("dash-logs-table", false);
  }
}

// Show/hide loading indicator
function showLoadingIndicator(tableId, show) {
  const table = document.getElementById(tableId);
  let loader = table.parentElement.querySelector(".table-loader");

  if (show) {
    if (!loader) {
      loader = document.createElement("div");
      loader.className = "table-loader";
      loader.innerHTML =
        '<div class="loader-spinner"></div><span>Loading more...</span>';
      table.parentElement.appendChild(loader);
    }
    loader.style.display = "flex";
  } else if (loader) {
    loader.style.display = "none";
  }
}

// Render dashboard logs
function renderDashboardLogs(logs, replace = true) {
  const tbody = document.querySelector("#dash-logs-table tbody");

  console.log(logs);
  if (replace) {
    tbody.innerHTML = "";
  }

  logs.forEach((log) => {
    const tr = document.createElement("tr");

    const logDate = new Date(log.time_in);
    const date = logDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const time = logDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const type = log.user_type === "student" ? "Student" : "Staff";
    const reason = log.reason || "Library Entry";

    // Get student number or staff ID
    const idNumber = log.student_number || "-";
    const college = log.college_name || "-";
    const program = log.program_name || "-";

    // Generate initials avatar
    const name = log.user_name || "Unknown";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const colors = [
      "#10b981",
      "#3b82f6",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
    ];
    const bgColor = colors[name.charCodeAt(0) % colors.length];

    // User status (active/inactive)
    const userStatus = log.user_status || "active";
    const statusClass =
      userStatus === "active" ? "status-active" : "status-inactive";
    const statusLabel = userStatus === "active" ? "Active" : "Inactive";

    // Library attendance - always show as Present
    tr.innerHTML = `
            <td class="profile-cell">
                <div class="table-avatar" style="background: ${bgColor}">${initials}</div>
            </td>
            <td>
                <div class="cell-primary">${name}</div>
                <div class="cell-secondary">${idNumber}</div>
            </td>
            <td>
                <div class="cell-primary">${college}</div>
                <div class="cell-secondary">${program}</div>
            </td>
            <td>${type}</td>
            <td>
                <div class="cell-primary">${date}</div>
                <div class="cell-secondary">${time}</div>
            </td>
            <td>${reason}</td>
            <td><span class="status-badge ${statusClass}"><span class="status-dot"></span>${statusLabel}</span></td>
        `;
    tbody.appendChild(tr);
  });

  if (replace && logs.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;color:var(--portal-text-muted)">No recent activity</td></tr>';
  }
}

// Load students
async function loadStudents() {
  try {
    const token = localStorage.getItem("auth_token");

    // Reset pagination
    paginationState.students.offset = 0;
    paginationState.students.hasMore = true;

    const res = await fetch("/students?limit=10", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    const students = data.data || [];
    const total = data.total || 0;

    // Update pagination state
    paginationState.students.hasMore =
      students.length >= paginationState.students.limit;
    paginationState.students.offset = students.length;

    // Update total count display
    document.getElementById("students-count").textContent = `Total: ${total}`;

    renderStudentsTable(students, true);
  } catch (err) {
    console.error("Failed to load students:", err);
  }
}

// Load more students
async function loadMoreStudents() {
  if (paginationState.students.loading || !paginationState.students.hasMore)
    return;

  paginationState.students.loading = true;
  showLoadingIndicator("students-table", true);

  try {
    const token = localStorage.getItem("auth_token");
    const offset = paginationState.students.offset;
    const limit = paginationState.students.limit;

    const res = await fetch(`/students?limit=${limit}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    const students = data.data || [];

    paginationState.students.hasMore = students.length >= limit;
    paginationState.students.offset += students.length;

    renderStudentsTable(students, false);
  } catch (err) {
    console.error("Failed to load more students:", err);
  } finally {
    paginationState.students.loading = false;
    showLoadingIndicator("students-table", false);
  }
}

// Render students table
function renderStudentsTable(students, replace = true) {
  const tbody = document.querySelector("#students-table tbody");

  if (replace) {
    tbody.innerHTML = "";
  }

  students.forEach((student) => {
    const tr = document.createElement("tr");

    // Generate initials avatar for profile
    const fullName =
      `${student.first_name || ""} ${student.last_name || ""}`.trim();
    const initials =
      fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";
    const colors = [
      "#10b981",
      "#3b82f6",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
    ];
    const bgColor = colors[fullName.charCodeAt(0) % colors.length];

    // Format registered date
    let registeredDate = "-";
    if (student.created_at) {
      const date = new Date(student.created_at);
      registeredDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    tr.innerHTML = `
            <td class="profile-cell">
                <div class="table-avatar" style="background: ${bgColor}">${initials}</div>
            </td>
            <td>${student.student_number || "-"}</td>
            <td>${fullName || "-"}</td>
            <td>${student.email || "-"}</td>
            <td>${student.program_name || "-"}</td>
            <td>${student.section_name || "-"}</td>
            <td>
                <span class="badge ${student.status === "active" ? "badge-active" : "badge-inactive"}">
                    ${student.status || "Active"}
                </span>
            </td>
            <td>${registeredDate}</td>
        `;
    tbody.appendChild(tr);
  });

  if (replace && students.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;color:var(--portal-text-muted)">No students found</td></tr>';
  }
}

// Load staff
async function loadStaff() {
  try {
    const token = localStorage.getItem("auth_token");

    // Reset pagination
    paginationState.staff.offset = 0;
    paginationState.staff.hasMore = true;

    const res = await fetch("/staff?limit=10", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    const staff = data.data || [];
    const total = data.total || 0;

    // Update pagination state
    paginationState.staff.hasMore = staff.length >= paginationState.staff.limit;
    paginationState.staff.offset = staff.length;

    // Update total count display
    document.getElementById("staff-count").textContent = `Total: ${total}`;

    renderStaffTable(staff, true);
  } catch (err) {
    console.error("Failed to load staff:", err);
  }
}

// Load more staff
async function loadMoreStaff() {
  if (paginationState.staff.loading || !paginationState.staff.hasMore) return;

  paginationState.staff.loading = true;
  showLoadingIndicator("staff-table", true);

  try {
    const token = localStorage.getItem("auth_token");
    const offset = paginationState.staff.offset;
    const limit = paginationState.staff.limit;

    const res = await fetch(`/staff?limit=${limit}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    const staff = data.data || [];

    paginationState.staff.hasMore = staff.length >= limit;
    paginationState.staff.offset += staff.length;

    renderStaffTable(staff, false);
  } catch (err) {
    console.error("Failed to load more staff:", err);
  } finally {
    paginationState.staff.loading = false;
    showLoadingIndicator("staff-table", false);
  }
}

// Render staff table
function renderStaffTable(staff, replace = true) {
  const tbody = document.querySelector("#staff-table tbody");

  if (replace) {
    tbody.innerHTML = "";
  }

  staff.forEach((member) => {
    const tr = document.createElement("tr");

    // Generate initials avatar for profile
    const fullName =
      `${member.first_name || ""} ${member.last_name || ""}`.trim();
    const initials =
      fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";
    const colors = [
      "#10b981",
      "#3b82f6",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
    ];
    const bgColor = colors[fullName.charCodeAt(0) % colors.length];

    // Format registered date
    let registeredDate = "-";
    if (member.created_at) {
      const date = new Date(member.created_at);
      registeredDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    // Format status
    const statusClass =
      member.status === "active" ? "badge-active" : "badge-inactive";
    const statusLabel = member.status === "active" ? "Active" : "Inactive";

    tr.innerHTML = `
            <td class="profile-cell">
                <div class="table-avatar" style="background: ${bgColor}">${initials}</div>
            </td>
            <td>${member.employee_id || "-"}</td>
            <td>${fullName || "-"}</td>
            <td>${member.email || "-"}</td>
            <td>${member.role_name || "-"}</td>
            <td>
                <span class="badge ${statusClass}">
                    ${statusLabel}
                </span>
            </td>
            <td>${registeredDate}</td>
        `;
    tbody.appendChild(tr);
  });

  if (replace && staff.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;color:var(--portal-text-muted)">No staff found</td></tr>';
  }
}

// Load events
async function loadEvents() {
  try {
    const token = localStorage.getItem("auth_token");

    // Reset pagination
    paginationState.events.offset = 0;
    paginationState.events.hasMore = true;

    const res = await fetch("/events?limit=10", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    const events = data.data || [];

    // Update pagination state
    paginationState.events.hasMore =
      events.length >= paginationState.events.limit;
    paginationState.events.offset = events.length;

    renderEventsTable(events, true);
  } catch (err) {
    console.error("Failed to load events:", err);
  }
}

// Load more events
async function loadMoreEvents() {
  if (paginationState.events.loading || !paginationState.events.hasMore) return;

  paginationState.events.loading = true;
  showLoadingIndicator("events-table", true);

  try {
    const token = localStorage.getItem("auth_token");
    const offset = paginationState.events.offset;
    const limit = paginationState.events.limit;

    const res = await fetch(`/events?limit=${limit}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    const events = data.data || [];

    paginationState.events.hasMore = events.length >= limit;
    paginationState.events.offset += events.length;

    renderEventsTable(events, false);
  } catch (err) {
    console.error("Failed to load more events:", err);
  } finally {
    paginationState.events.loading = false;
    showLoadingIndicator("events-table", false);
  }
}

// Render events table
function renderEventsTable(events, replace = true) {
  const tbody = document.querySelector("#events-table tbody");

  if (replace) {
    tbody.innerHTML = "";
  }

  events.forEach((event) => {
    const tr = document.createElement("tr");

    const startDate = new Date(event.start_datetime).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const endDate = new Date(event.end_datetime).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    tr.innerHTML = `
            <td>${event.title || "-"}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>${event.creatorName || "-"}</td>
        `;
    tbody.appendChild(tr);
  });

  if (replace && events.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align:center;color:var(--portal-text-muted)">No events found</td></tr>';
  }
}

// Load logs
async function loadLogs() {
  try {
    const token = localStorage.getItem("auth_token");

    // Reset pagination
    paginationState.logs.offset = 0;
    paginationState.logs.hasMore = true;

    const res = await fetch("/logs/attendance?limit=10", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    const logs = data.data || [];

    // Update pagination state
    paginationState.logs.hasMore = logs.length >= paginationState.logs.limit;
    paginationState.logs.offset = logs.length;

    renderLogsTable(logs, true);
  } catch (err) {
    console.error("Failed to load logs:", err);
  }
}

// Load more logs
async function loadMoreLogs() {
  if (paginationState.logs.loading || !paginationState.logs.hasMore) return;

  paginationState.logs.loading = true;
  showLoadingIndicator("logs-table", true);

  try {
    const token = localStorage.getItem("auth_token");
    const offset = paginationState.logs.offset;
    const limit = paginationState.logs.limit;

    const res = await fetch(
      `/logs/attendance?limit=${limit}&offset=${offset}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await res.json();
    const logs = data.data || [];

    paginationState.logs.hasMore = logs.length >= limit;
    paginationState.logs.offset += logs.length;

    renderLogsTable(logs, false);
  } catch (err) {
    console.error("Failed to load more logs:", err);
  } finally {
    paginationState.logs.loading = false;
    showLoadingIndicator("logs-table", false);
  }
}

// Render logs table
function renderLogsTable(logs, replace = true) {
  const tbody = document.querySelector("#logs-table tbody");

  if (replace) {
    tbody.innerHTML = "";
  }

  logs.forEach((log) => {
    const tr = document.createElement("tr");

    const logDate = new Date(log.time_in);
    const date = logDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const time = logDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const type = log.user_type === "student" ? "Student" : "Staff";

    tr.innerHTML = `
            <td>${log.id || "-"}</td>
            <td>${date}</td>
            <td>${log.user_name || "Unknown"}</td>
            <td>${type}</td>
            <td>${time}</td>
            <td><span class="status-badge status-present"><span class="status-dot"></span>Present</span></td>
        `;
    tbody.appendChild(tr);
  });

  if (replace && logs.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;color:var(--portal-text-muted)">No logs found</td></tr>';
  }
}

// ===================
// EXPORT AND PRINT FUNCTIONS
// ===================

// Export table to CSV - fetches all data from API
async function exportTableToCSV(tableId, prefix) {
  const table = document.getElementById(tableId);
  if (!table) {
    console.error("Table not found:", tableId);
    return;
  }

  const token = localStorage.getItem("auth_token");
  let allData = [];
  let headers = [];

  // Fetch ALL data from API based on table type
  try {
    switch (tableId) {
      case "dash-logs-table":
      case "logs-table":
        // Fetch all logs - use a large limit to get everything
        const logsRes = await fetch(`/logs/attendance?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const logsData = await logsRes.json();
        allData = logsData.data || [];
        headers = [
          "Profile",
          "ID",
          "Program/College",
          "Role",
          "Date/Time",
          "Reason",
          "Status",
        ];
        break;

      case "students-table":
        // Fetch all students
        const studentsRes = await fetch(`/students?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const studentsData = await studentsRes.json();
        allData = studentsData.data || [];
        headers = [
          "Profile",
          "Student No.",
          "Name",
          "Email",
          "Department",
          "Section",
          "Status",
          "Registered",
        ];
        break;

      case "staff-table":
        // Fetch all staff
        const staffRes = await fetch(`/staff?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const staffData = await staffRes.json();
        allData = staffData.data || [];
        headers = [
          "Profile",
          "Employee No.",
          "Name",
          "Email",
          "Role",
          "Status",
          "Registered",
        ];
        break;

      case "events-table":
        // Fetch all events
        const eventsRes = await fetch(`/events?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const eventsData = await eventsRes.json();
        allData = eventsData.data || [];
        headers = ["Title", "Starts", "Ends", "Creator"];
        break;

      case "users-table":
        // Fetch all staff users
        const usersRes = await fetch(`/staff?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = await usersRes.json();
        allData = usersData.data || [];
        headers = [
          "Profile",
          "Employee No.",
          "Name",
          "Email",
          "Role",
          "Status",
          "Registered",
        ];
        break;

      case "colleges-table":
        // Fetch all colleges
        const collegesRes = await fetch(`/colleges?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const collegesData = await collegesRes.json();
        allData = collegesData.data || [];
        headers = ["ID", "College Code", "College Name", "Created"];
        break;

      case "programs-table":
        // Fetch all programs
        const programsRes = await fetch(`/programs?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const programsData = await programsRes.json();
        allData = programsData.data || [];
        headers = ["ID", "Program Code", "Program Name", "College", "Created"];
        break;

      case "sections-table":
        // Fetch all sections
        const sectionsRes = await fetch(`/sections?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sectionsData = await sectionsRes.json();
        allData = sectionsData.data || [];
        headers = ["ID", "Section Name", "Program", "Year Level", "Created"];
        break;

      default:
        // Fallback to table data
        const tableHeaders = table.querySelectorAll("thead th");
        tableHeaders.forEach((th) => headers.push(th.textContent.trim()));
        const tableRows = table.querySelectorAll("tbody tr");
        tableRows.forEach((tr) => {
          const row = [];
          tr.querySelectorAll("td").forEach((td) =>
            row.push(td.textContent.trim()),
          );
          if (row.length > 0) allData.push(row);
        });
    }
  } catch (err) {
    console.error("Error fetching data for export:", err);
    alert("Failed to fetch data for export");
    return;
  }

  if (allData.length === 0) {
    alert("No data to export");
    return;
  }

  // Format data based on table type
  let rows = [];
  switch (tableId) {
    case "dash-logs-table":
    case "logs-table":
      rows = allData.map((log) => {
        const logDate = new Date(log.time_in);
        const date = logDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const time = logDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        const name = log.user_name || "Unknown";
        const id = log.student_number || log.employee_id || "-";
        const program = log.program_name || log.college_name || "-";
        const role =
          log.user_type === "student"
            ? "STUDENT"
            : log.user_type === "staff"
              ? "EMPLOYEE"
              : "-";
        const timestamp = `${date} ${time}`;
        const reason = log.reason || "Library Entry";
        const status = (log.user_status || "active").toUpperCase();
        return [name, id, program, role, timestamp, reason, status];
      });
      break;

    case "students-table":
      rows = allData.map((s) => {
        const fullName = `${s.first_name || ""} ${s.last_name || ""}`.trim();
        const registered = s.created_at
          ? new Date(s.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-";
        return [
          fullName,
          s.student_number || "-",
          fullName,
          s.email || "-",
          s.program_name || "-",
          s.section_name || "-",
          (s.status || "active").toUpperCase(),
          registered,
        ];
      });
      break;

    case "staff-table":
      rows = allData.map((s) => {
        const fullName = `${s.first_name || ""} ${s.last_name || ""}`.trim();
        const registered = s.created_at
          ? new Date(s.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-";
        return [
          fullName,
          s.employee_id || "-",
          fullName,
          s.email || "-",
          s.role_name || "-",
          (s.status || "active").toUpperCase(),
          registered,
        ];
      });
      break;

    case "events-table":
      rows = allData.map((e) => {
        const start = new Date(e.start_datetime).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const end = new Date(e.end_datetime).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        return [e.title || "-", start, end, e.creatorName || "-"];
      });
      break;

    case "users-table":
      rows = allData.map((s) => {
        const fullName = `${s.first_name || ""} ${s.last_name || ""}`.trim();
        const registered = s.created_at
          ? new Date(s.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-";
        return [
          fullName,
          s.employee_id || "-",
          fullName,
          s.email || "-",
          s.role_name || "-",
          (s.status || "active").toUpperCase(),
          registered,
        ];
      });
      break;

    case "colleges-table":
      rows = allData.map((c) => {
        const created = c.created_at
          ? new Date(c.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-";
        return [c.id, c.college_code || "-", c.college_name || "-", created];
      });
      break;

    case "programs-table":
      rows = allData.map((p) => {
        const created = p.created_at
          ? new Date(p.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-";
        return [
          p.id,
          p.program_code || "-",
          p.program_name || "-",
          p.college_name || "-",
          created,
        ];
      });
      break;

    case "sections-table":
      rows = allData.map((s) => {
        const created = s.created_at
          ? new Date(s.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-";
        return [
          s.id,
          s.section_name || "-",
          s.program_name || "-",
          s.year_level || "-",
          created,
        ];
      });
      break;
  }

  // Build CSV content
  let csvContent = headers.map((h) => `"${h}"`).join(",") + "\n";
  rows.forEach((row) => {
    csvContent +=
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",") +
      "\n";
  });

  // Generate filename with date
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear();
  const filename = `Library_${prefix}_${month}_${day}_${year}.csv`;

  // Download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ---- Searchable Dropdown Helper ----
function clearEditInput(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.value = "";

  // Clear the associated hidden ID field
  const hiddenId = inputId.replace("-input", "");
  const hiddenField = document.getElementById(hiddenId);
  if (hiddenField) hiddenField.value = "";

  // Trigger any change events needed
  input.dispatchEvent(new Event("change"));
  input.dispatchEvent(new Event("input"));
}

// Global cached options for dynamic selects
let cachedOptions = {
  colleges: [],
  programs: [],
  sections: [],
};

async function loadEditOptions() {
  const token = localStorage.getItem("auth_token");
  try {
    const [cRes, pRes, sRes] = await Promise.all([
      fetch("/colleges?limit=500", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/programs?limit=500", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/sections?limit=1000", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const [cData, pData, sData] = await Promise.all([
      cRes.json(),
      pRes.json(),
      sRes.json(),
    ]);

    cachedOptions.colleges = cData.data || [];
    cachedOptions.programs = pData.data || [];
    cachedOptions.sections = sData.data || [];

    updateEditDatalists();
  } catch (err) {
    console.error("Failed to load edit options:", err);
  }
}

function updateEditDatalists() {
  const collegeId = document.getElementById("edit-college").value;
  const programId = document.getElementById("edit-program").value;
  const yearLevel = document.getElementById("edit-year").value;

  // Filter Colleges (all)
  const collegeDatalist = document.getElementById("edit-college-list");
  collegeDatalist.innerHTML = cachedOptions.colleges
    .map((c) => `<option value="${c.college_name}" data-id="${c.id}">`)
    .join("");

  // Filter Programs by College
  const programDatalist = document.getElementById("edit-program-list");
  const filteredPrograms = collegeId
    ? cachedOptions.programs.filter((p) => p.college_id == collegeId)
    : cachedOptions.programs;
  programDatalist.innerHTML = filteredPrograms
    .map((p) => `<option value="${p.program_name}" data-id="${p.id}">`)
    .join("");

  // Filter Sections by Program and Year Level
  // When year is 1st year, ONLY show 1st year sections for the selected program
  const sectionDatalist = document.getElementById("edit-section-list");
  const filteredSections = cachedOptions.sections.filter((s) => {
    const programMatch = programId ? s.program_id == programId : true;
    // Strict year level filtering: must match exactly when both program and year are selected
    const yearMatch = yearLevel ? s.year_level == yearLevel : true;
    return programMatch && yearMatch;
  });
  sectionDatalist.innerHTML = filteredSections
    .map((s) => `<option value="${s.section_name}" data-id="${s.id}">`)
    .join("");
}

function setupEditPanelListeners() {
  // Helper to handle datalist selection
  function handleDatalistInput(inputId, datalistId, hiddenId, onChange) {
    const input = document.getElementById(inputId);
    const datalist = document.getElementById(datalistId);
    const hidden = document.getElementById(hiddenId);

    input.addEventListener("input", () => {
      const option = Array.from(datalist.options).find(
        (opt) => opt.value === input.value,
      );
      if (option) {
        hidden.value = option.dataset.id;
        if (onChange) onChange();
      } else {
        hidden.value = "";
      }
    });
  }

  // Role listener
  handleDatalistInput("edit-role-input", "edit-role-list", "edit-role");

  // College -> Program cascade
  handleDatalistInput(
    "edit-college-input",
    "edit-college-list",
    "edit-college",
    () => {
      document.getElementById("edit-program-input").value = "";
      document.getElementById("edit-program").value = "";
      document.getElementById("edit-section-input").value = "";
      document.getElementById("edit-section").value = "";
      updateEditDatalists();
    },
  );

  // Program -> Section cascade
  handleDatalistInput(
    "edit-program-input",
    "edit-program-list",
    "edit-program",
    () => {
      document.getElementById("edit-section-input").value = "";
      document.getElementById("edit-section").value = "";
      updateEditDatalists();
    },
  );

  // Year Level -> Section cascade
  document.getElementById("edit-year").addEventListener("change", () => {
    document.getElementById("edit-section-input").value = "";
    document.getElementById("edit-section").value = "";
    updateEditDatalists();
  });

  // Section input (just set ID)
  handleDatalistInput(
    "edit-section-input",
    "edit-section-list",
    "edit-section",
  );
}

// ---- Add User Modal Helpers ----
async function loadAddUserOptions() {
  const token = localStorage.getItem("auth_token");
  try {
    const [cRes, pRes, sRes] = await Promise.all([
      fetch("/colleges?limit=500", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/programs?limit=500", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/sections?limit=1000", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const [cData, pData, sData] = await Promise.all([
      cRes.json(),
      pRes.json(),
      sRes.json(),
    ]);

    cachedOptions.colleges = cData.data || [];
    cachedOptions.programs = pData.data || [];
    cachedOptions.sections = sData.data || [];

    updateAddUserDatalists();
  } catch (err) {
    console.error("Failed to load add user options:", err);
  }
}

function updateAddUserDatalists() {
  const collegeId = document.getElementById("add-college")?.value;
  const programId = document.getElementById("add-program")?.value;
  const yearLevel = document.getElementById("add-year")?.value;

  if (document.getElementById("add-college-list")) {
    document.getElementById("add-college-list").innerHTML =
      cachedOptions.colleges
        .map((c) => `<option value="${c.college_name}" data-id="${c.id}">`)
        .join("");
  }

  if (document.getElementById("add-program-list")) {
    const filteredPrograms = collegeId
      ? cachedOptions.programs.filter((p) => p.college_id == collegeId)
      : cachedOptions.programs;
    document.getElementById("add-program-list").innerHTML = filteredPrograms
      .map((p) => `<option value="${p.program_name}" data-id="${p.id}">`)
      .join("");
  }

  if (document.getElementById("add-section-list")) {
    const filteredSections = cachedOptions.sections.filter((s) => {
      const programMatch = programId ? s.program_id == programId : true;
      const yearMatch = yearLevel ? s.year_level == yearLevel : true;
      return programMatch && yearMatch;
    });
    document.getElementById("add-section-list").innerHTML = filteredSections
      .map((s) => `<option value="${s.section_name}" data-id="${s.id}">`)
      .join("");
  }
}

function setupAddUserModalListeners(type) {
  function handleDatalistInput(inputId, datalistId, hiddenId, onChange) {
    const input = document.getElementById(inputId);
    const datalist = document.getElementById(datalistId);
    const hidden = document.getElementById(hiddenId);
    if (!input || !datalist || !hidden) return;

    input.addEventListener("input", () => {
      const option = Array.from(datalist.options).find(
        (opt) => opt.value === input.value,
      );
      if (option) {
        hidden.value = option.dataset.id;
        if (onChange) onChange();
      } else {
        hidden.value = "";
        if (onChange) onChange();
      }
    });
  }

  if (type === "staff") {
    handleDatalistInput("add-role-input", "add-role-list", "add-role");
  } else {
    handleDatalistInput(
      "add-college-input",
      "add-college-list",
      "add-college",
      () => {
        document.getElementById("add-program-input").value = "";
        document.getElementById("add-program").value = "";
        document.getElementById("add-section-input").value = "";
        document.getElementById("add-section").value = "";
        updateAddUserDatalists();
      },
    );

    handleDatalistInput(
      "add-program-input",
      "add-program-list",
      "add-program",
      () => {
        document.getElementById("add-section-input").value = "";
        document.getElementById("add-section").value = "";
        updateAddUserDatalists();
      },
    );

    document.getElementById("add-year")?.addEventListener("change", () => {
      document.getElementById("add-section-input").value = "";
      document.getElementById("add-section").value = "";
      updateAddUserDatalists();
    });

    handleDatalistInput("add-section-input", "add-section-list", "add-section");
  }
}

// Print table - fetches all data from API
async function printTable(tableId) {
  const table = document.getElementById(tableId);
  if (!table) {
    console.error("Table not found:", tableId);
    return;
  }

  // Get the title based on table ID
  const titleMap = {
    "dash-logs-table": "Dashboard - Recent Activity",
    "students-table": "Student Management",
    "staff-table": "Staff Management",
    "events-table": "Event Management",
    "logs-table": "Attendance Logs",
    "users-table": "User Management",
    "colleges-table": "Colleges Management",
    "programs-table": "Programs Management",
    "sections-table": "Sections Management",
  };
  const title = titleMap[tableId] || "Table";

  // Get current date
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Fetch all data from API
  const token = localStorage.getItem("auth_token");
  let allData = [];
  let headers = [];

  try {
    switch (tableId) {
      case "dash-logs-table":
      case "logs-table":
        const logsRes = await fetch(`/logs/attendance?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const logsData = await logsRes.json();
        allData = logsData.data || [];
        headers = [
          "Visitor",
          "ID",
          "Program",
          "Role",
          "Timestamp",
          "Reason",
          "Status",
        ];
        break;

      case "students-table":
        const studentsRes = await fetch(`/students?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const studentsData = await studentsRes.json();
        allData = studentsData.data || [];
        headers = [
          "Profile",
          "Student No.",
          "Name",
          "Email",
          "Department",
          "Section",
          "Status",
          "Registered",
        ];
        break;

      case "staff-table":
        const staffRes = await fetch(`/staff?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const staffData = await staffRes.json();
        allData = staffData.data || [];
        headers = [
          "Profile",
          "Employee No.",
          "Name",
          "Email",
          "Role",
          "Status",
          "Registered",
        ];
        break;

      case "events-table":
        const eventsRes = await fetch(`/events?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const eventsData = await eventsRes.json();
        allData = eventsData.data || [];
        headers = ["Title", "Starts", "Ends", "Creator"];
        break;

      case "users-table":
        const usersRes = await fetch(`/staff?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = await usersRes.json();
        allData = usersData.data || [];
        headers = [
          "Profile",
          "Employee No.",
          "Name",
          "Email",
          "Role",
          "Status",
          "Registered",
        ];
        break;

      case "colleges-table":
        const collegesRes = await fetch(`/colleges?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const collegesData = await collegesRes.json();
        allData = collegesData.data || [];
        headers = ["ID", "College Code", "College Name", "Created"];
        break;

      case "programs-table":
        const programsRes = await fetch(`/programs?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const programsData = await programsRes.json();
        allData = programsData.data || [];
        headers = ["ID", "Program Code", "Program Name", "College", "Created"];
        break;

      case "sections-table":
        const sectionsRes = await fetch(`/sections?limit=10000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sectionsData = await sectionsRes.json();
        allData = sectionsData.data || [];
        headers = ["ID", "Section Name", "Program", "Year Level", "Created"];
        break;
    }
  } catch (err) {
    console.error("Error fetching data for print:", err);
    alert("Failed to fetch data for print");
    return;
  }

  // Build table HTML
  let tableHtml = "<thead><tr>";
  headers.forEach((h) => {
    tableHtml += `<th>${h}</th>`;
  });
  tableHtml += "</tr></thead><tbody>";

  // Add rows based on data type
  switch (tableId) {
    case "dash-logs-table":
    case "logs-table":
      allData.forEach((log) => {
        const logDate = new Date(log.time_in);
        const date = logDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const time = logDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const name = log.user_name || "Unknown";
        const id = log.student_number || log.employee_id || "-";
        // const college = log
        const program = log.program_name || log.college_name || "-";
        const role =
          log.user_type === "student"
            ? "STUDENT"
            : log.user_type === "staff"
              ? "EMPLOYEE"
              : "-";
        const timestamp = `${date} ${time}`;
        const reason = log.reason || "Library Entry";
        const status = (log.user_status || "active").toUpperCase();

        // Generate avatar color
        const colors = [
          "#10b981",
          "#3b82f6",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
        ];
        const bgColor = colors[name.charCodeAt(0) % colors.length];
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        tableHtml += `<tr>
                    <td><div class="profile-cell"><div class="table-avatar" style="background:${bgColor}">${initials}</div></div></td>
                    <td>${id}</td>
                    <td>${name}</td>
                    <td>${program}</td>
                    <td>${role}</td>
                    <td>${timestamp}</td>
                    <td>${reason}</td>
                    <td>${status}</td>
                </tr>`;
      });
      break;

    case "students-table":
      allData.forEach((s) => {
        const fullName = `${s.first_name || ""} ${s.last_name || ""}`.trim();
        const initials =
          fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?";
        const colors = [
          "#10b981",
          "#3b82f6",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
        ];
        const bgColor = colors[fullName.charCodeAt(0) % colors.length];
        const registered = s.created_at
          ? new Date(s.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-";
        const statusClass =
          s.status === "active" ? "badge-active" : "badge-inactive";

        tableHtml += `<tr>
                    <td><div class="profile-cell"><div class="table-avatar" style="background:${bgColor}">${initials}</div></div></td>
                    <td>${s.student_number || "-"}</td>
                    <td>${fullName}</td>
                    <td>${s.email || "-"}</td>
                    <td>${s.program_name || "-"}</td>
                    <td>${s.section_name || "-"}</td>
                    <td><span class="badge ${statusClass}">${(s.status || "active").toUpperCase()}</span></td>
                    <td>${registered}</td>
                </tr>`;
      });
      break;

    case "staff-table":
      allData.forEach((s) => {
        const fullName = `${s.first_name || ""} ${s.last_name || ""}`.trim();
        const initials =
          fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?";
        const colors = [
          "#10b981",
          "#3b82f6",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
        ];
        const bgColor = colors[fullName.charCodeAt(0) % colors.length];
        const registered = s.created_at
          ? new Date(s.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-";
        const statusClass =
          s.status === "active" ? "badge-active" : "badge-inactive";

        tableHtml += `<tr>
                    <td><div class="profile-cell"><div class="table-avatar" style="background:${bgColor}">${initials}</div></div></td>
                    <td>${s.employee_id || "-"}</td>
                    <td>${fullName}</td>
                    <td>${s.email || "-"}</td>
                    <td>${s.role_name || "-"}</td>
                    <td><span class="badge ${statusClass}">${(s.status || "active").toUpperCase()}</span></td>
                    <td>${registered}</td>
                </tr>`;
      });
      break;

    case "events-table":
      allData.forEach((e) => {
        const start = new Date(e.start_datetime).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const end = new Date(e.end_datetime).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        tableHtml += `<tr>
                    <td>${e.title || "-"}</td>
                    <td>${start}</td>
                    <td>${end}</td>
                    <td>${e.creatorName || "-"}</td>
                </tr>`;
      });
      break;

    case "users-table":
      allData.forEach((s) => {
        const fullName = `${s.first_name || ""} ${s.last_name || ""}`.trim();
        const initials =
          fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?";
        const colors = [
          "#10b981",
          "#3b82f6",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
        ];
        const bgColor = colors[fullName.charCodeAt(0) % colors.length];
        const registered = s.created_at
          ? new Date(s.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-";
        const statusClass =
          s.status === "active" ? "badge-active" : "badge-inactive";

        tableHtml += `<tr>
                    <td><div class="profile-cell"><div class="table-avatar" style="background:${bgColor}">${initials}</div></div></td>
                    <td>${s.employee_id || "-"}</td>
                    <td>${fullName}</td>
                    <td>${s.email || "-"}</td>
                    <td>${s.role_name || "-"}</td>
                    <td><span class="badge ${statusClass}">${(s.status || "active").toUpperCase()}</span></td>
                    <td>${registered}</td>
                </tr>`;
      });
      break;

    case "colleges-table":
      allData.forEach((c) => {
        const created = c.created_at
          ? new Date(c.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-";

        tableHtml += `<tr>
                    <td>${c.id}</td>
                    <td>${c.college_code || "-"}</td>
                    <td>${c.college_name || "-"}</td>
                    <td>${created}</td>
                </tr>`;
      });
      break;

    case "programs-table":
      allData.forEach((p) => {
        const created = p.created_at
          ? new Date(p.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-";

        tableHtml += `<tr>
                    <td>${p.id}</td>
                    <td>${p.program_code || "-"}</td>
                    <td>${p.program_name || "-"}</td>
                    <td>${p.college_name || "-"}</td>
                    <td>${created}</td>
                </tr>`;
      });
      break;

    case "sections-table":
      allData.forEach((s) => {
        const created = s.created_at
          ? new Date(s.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-";

        tableHtml += `<tr>
                    <td>${s.id}</td>
                    <td>${s.section_name || "-"}</td>
                    <td>${s.program_name || "-"}</td>
                    <td>${s.year_level || "-"}</td>
                    <td>${created}</td>
                </tr>`;
      });
      break;
  }

  tableHtml += "</tbody>";

  // Build print content
  let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { font-size: 18px; margin-bottom: 5px; }
                .date { color: #666; font-size: 12px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; }
                th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
                th { background-color: #f5f5f5; font-weight: bold; }
                tr:nth-child(even) { background-color: #fafafa; }
                .profile-cell { display: flex; align-items: center; gap: 8px; }
                .table-avatar { 
                    width: 24px; height: 24px; border-radius: 50%; 
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-size: 10px; font-weight: bold;
                }
                .badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
                .badge-active { background: #d1fae5; color: #059669; }
                .badge-inactive { background: #fee2e2; color: #dc2626; }
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <p class="date">Generated: ${dateStr}</p>
            <table>${tableHtml}</table>
        </body>
        </html>
    `;

  // Open print window
  const printWindow = window.open("", "_blank");
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();

  // Wait for content to load then print
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

// ===================
// ADMIN MANAGEMENT FUNCTIONS
// ===================

// Check if user is admin and show admin section
function checkAdminAccess() {
  const adminSection = document.getElementById("admin-section");
  if (!adminSection) return;
  if (currentUser && currentUser.role_id === 4) {
    adminSection.style.display = "flex";
    adminSection.classList.add("visible");
  }
}

// ---- Toast Notifications ----
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid fa-${type === "success" ? "circle-check" : "circle-xmark"} toast-icon"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    toast.style.transition = "all 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ---- Switch User Type Tabs ----
function switchUserType(type) {
  currentUserType = type;
  document.querySelectorAll(".user-tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.userType === type);
  });
  document.querySelectorAll(".user-table-card").forEach((card) => {
    card.classList.remove("active");
  });
  if (type === "staff") {
    document.getElementById("staff-users-card")?.classList.add("active");
    loadStaffUsers();
  } else {
    document.getElementById("student-users-card")?.classList.add("active");
    loadStudentUsers();
  }
}

// ---- Load Users (entry point) ----
async function loadUsers() {
  // Force initial tab load if none selected
  if (!currentUserType) currentUserType = "staff";

  // Ensure the tab buttons are updated
  document.querySelectorAll(".user-tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.userType === currentUserType);
  });

  // trigger actual data fetching
  switchUserType(currentUserType);
}

// ---- Load Staff Users ----
async function loadStaffUsers() {
  const token = localStorage.getItem("auth_token");
  try {
    const res = await fetch("/staff?limit=500", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const users = data.data || [];
    document.getElementById("staff-users-count").textContent =
      `Total: ${data.total || users.length}`;
    renderStaffUsersTable(users);
  } catch (err) {
    console.error("Failed to load staff users:", err);
  }
}

// ---- Render Staff Users Table ----
function renderStaffUsersTable(users) {
  const tbody = document.querySelector("#staff-users-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  users.forEach((member) => {
    const fullName =
      `${member.first_name || ""} ${member.last_name || ""}`.trim();
    const initials =
      fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";
    const colors = [
      "#10b981",
      "#3b82f6",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
    ];
    const bgColor = colors[fullName.charCodeAt(0) % colors.length];
    const registered = member.created_at
      ? new Date(member.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "-";
    const isActive = member.status === "active";
    const statusClass = isActive ? "badge-active" : "badge-inactive";
    const statusLabel = isActive ? "Active" : "Inactive";
    const roleName =
      member.role_name.charAt(0).toUpperCase() + member.role_name.slice(1);

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td class="profile-cell"><div class="table-avatar" style="background:${bgColor}">${initials}</div></td>
            <td>${member.employee_id || "-"}</td>
            <td>${fullName || "-"}</td>
            <td>${member.email || "-"}</td>
            <td>${roleName || "-"}</td>
            <td><span class="badge ${statusClass}">${statusLabel}</span></td>
            <td>${registered}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="openUserPanel(${member.id}, 'staff')" title="View Details">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="action-btn delete" onclick="confirmDeleteUser(${member.id}, 'staff', '${fullName}')" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>`;
    tbody.appendChild(tr);
  });

  if (users.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;color:var(--portal-text-muted)">No staff found</td></tr>';
  }
}

// ---- Load Student Users ----
async function loadStudentUsers() {
  const token = localStorage.getItem("auth_token");
  try {
    const res = await fetch("/students?limit=500", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const students = data.data || [];
    document.getElementById("student-users-count").textContent =
      `Total: ${data.total || students.length}`;
    renderStudentUsersTable(students);
  } catch (err) {
    console.error("Failed to load student users:", err);
  }
}

// ---- Render Student Users Table ----
function renderStudentUsersTable(students) {
  const tbody = document.querySelector("#student-users-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  students.forEach((student) => {
    const fullName =
      `${student.first_name || ""} ${student.last_name || ""}`.trim();
    const initials =
      fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";
    const colors = [
      "#10b981",
      "#3b82f6",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
    ];
    const bgColor = colors[fullName.charCodeAt(0) % colors.length];
    const registered = student.created_at
      ? new Date(student.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "-";
    const isActive = student.status === "active";
    const statusClass = isActive ? "badge-active" : "badge-inactive";
    const statusLabel = isActive ? "Active" : "Inactive";

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td class="profile-cell"><div class="table-avatar" style="background:${bgColor}">${initials}</div></td>
            <td>${student.student_number || "-"}</td>
            <td>${fullName || "-"}</td>
            <td>${student.email || "-"}</td>
            <td>${student.program_name || "-"}</td>
            <td>${student.section_name || "-"}</td>
            <td><span class="badge ${statusClass}">${statusLabel}</span></td>
            <td>${registered}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="openUserPanel(${student.id}, 'student')" title="View Details">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="action-btn delete" onclick="confirmDeleteUser(${student.id}, 'student', '${fullName}')" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>`;
    tbody.appendChild(tr);
  });

  if (students.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="9" style="text-align:center;color:var(--portal-text-muted)">No students found</td></tr>';
  }
}

// ===================
// USER DETAIL PANEL
// ===================

function openUserPanel(id, type) {
  selectedUser = { id, type };
  const panel = document.getElementById("user-detail-panel");
  const overlay = document.getElementById("user-panel-overlay");
  panel.classList.add("open");
  overlay.classList.add("open");

  // Reset to details tab
  switchPanelTab("details");

  // Load user data
  loadPanelUser(id, type);

  // Attach panel tab listeners
  document.querySelectorAll(".panel-tab-btn").forEach((btn) => {
    btn.onclick = () => switchPanelTab(btn.dataset.panelTab);
  });
}

function closeUserPanel() {
  document.getElementById("user-detail-panel")?.classList.remove("open");
  document.getElementById("user-panel-overlay")?.classList.remove("open");
  selectedUser = null;
}

function switchPanelTab(tab) {
  document
    .querySelectorAll(".panel-tab-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.panelTab === tab));
  document
    .querySelectorAll(".panel-tab-content")
    .forEach((c) => c.classList.toggle("active", c.id === `panel-tab-${tab}`));

  if (!selectedUser) return;
  if (tab === "activity") loadUserActivity(selectedUser.id, selectedUser.type);
  if (tab === "attendance")
    loadUserAttendance(selectedUser.id, selectedUser.type);
}

async function loadPanelUser(id, type) {
  const token = localStorage.getItem("auth_token");
  try {
    const url = type === "staff" ? `/staff/${id}` : `/students/${id}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) {
      showToast("Failed to load user", "error");
      return;
    }

    const user = data.data;
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const initials =
      fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";
    const colors = [
      "#10b981",
      "#3b82f6",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
    ];
    const bgColor = colors[fullName.charCodeAt(0) % colors.length];

    // Update panel header
    document.getElementById("panel-avatar").textContent = initials;
    document.getElementById("panel-avatar").style.background =
      `linear-gradient(135deg, ${bgColor}, ${bgColor}cc)`;
    document.getElementById("panel-user-name").textContent = fullName;
    document.getElementById("panel-user-id").textContent =
      type === "staff"
        ? `Employee ID: ${user.employee_id || "-"}`
        : `Student No: ${user.student_number || "-"}`;
    document.getElementById("panel-role-badge").textContent =
      type === "staff" ? user.role_name || "Staff" : "Student";

    // Status
    const isBlocked = user.is_blocked;
    const statusBar = document.getElementById("panel-status-badge");
    if (isBlocked) {
      statusBar.className = "panel-status-blocked";
      statusBar.innerHTML = `<i class="fa-solid fa-ban"></i> Blocked${user.block_reason ? ` — ${user.block_reason}` : ""}`;
    } else {
      statusBar.className = "panel-status-active";
      statusBar.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${user.status === "active" ? "Active Account" : "Inactive Account"}`;
    }

    // Block button
    const blockBtn = document.getElementById("panel-block-btn");
    const blockLabel = document.getElementById("panel-block-label");
    if (isBlocked) {
      blockBtn.className = "panel-block-btn unblock";
      blockBtn.querySelector("i").className = "fa-solid fa-unlock";
      blockLabel.textContent = "Unblock";
    } else {
      blockBtn.className = "panel-block-btn";
      blockBtn.querySelector("i").className = "fa-solid fa-ban";
      blockLabel.textContent = "Block";
    }
    // Fill form fields
    document.getElementById("edit-user-id").value = user.id;
    document.getElementById("edit-user-type").value = type;
    document.getElementById("edit-first-name").value = user.first_name || "";
    document.getElementById("edit-last-name").value = user.last_name || "";
    document.getElementById("edit-email").value = user.email || "";
    document.getElementById("edit-status").value = user.status || "active";
    document.getElementById("edit-password").value = "";

    const roleGroup = document.getElementById("edit-role-group");
    const studentFields = document.getElementById("edit-student-fields");

    if (type === "staff") {
      roleGroup.style.display = "";
      studentFields.style.display = "none";
      // Set role display and hidden ID
      const rolesMap = { 2: "Librarian", 3: "Management", 4: "Admin" };
      const roleName = rolesMap[user.role_id] || "Librarian";
      document.getElementById("edit-role-input").value = roleName;
      document.getElementById("edit-role").value = user.role_id || 2;
    } else {
      roleGroup.style.display = "none";
      studentFields.style.display = "";

      // Set College, Program, Year, Section
      document.getElementById("edit-college-input").value =
        user.college_name || "";
      document.getElementById("edit-college").value = user.college_id || "";
      document.getElementById("edit-program-input").value =
        user.program_name || "";
      document.getElementById("edit-program").value = user.program_id || "";
      document.getElementById("edit-year").value = user.year_level || 1;
      document.getElementById("edit-section-input").value =
        user.section_name || "";
      document.getElementById("edit-section").value = user.section_id || "";
    }
  } catch (err) {
    console.error("Error loading user:", err);
    showToast("Error loading user details", "error");
  }
}

// ---- Save User Details ----
async function saveUserDetails() {
  const id = document.getElementById("edit-user-id").value;
  const type = document.getElementById("edit-user-type").value;
  const token = localStorage.getItem("auth_token");

  const payload = {
    first_name: document.getElementById("edit-first-name").value.trim(),
    last_name: document.getElementById("edit-last-name").value.trim(),
    email: document.getElementById("edit-email").value.trim(),
    status: document.getElementById("edit-status").value,
  };

  const password = document.getElementById("edit-password").value;
  if (password) payload.password = password;

  if (type === "staff") {
    payload.role_id = document.getElementById("edit-role").value;
  } else {
    payload.section_id = document.getElementById("edit-section").value;
    if (!payload.section_id) {
      showToast("Please select a valid section", "error");
      return;
    }
  }

  const url = type === "staff" ? `/staff/${id}` : `/students/${id}`;

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      showToast("User updated successfully");
      loadPanelUser(id, type);
      // Reload the table too
      if (type === "staff") loadStaffUsers();
      else loadStudentUsers();
    } else {
      showToast(data.message || "Failed to update user", "error");
    }
  } catch (err) {
    console.error("Error saving user:", err);
    showToast("Error saving user details", "error");
  }
}

// ---- Block / Unblock ----
async function toggleUserBlock() {
  if (!selectedUser) return;
  const { id, type } = selectedUser;
  const token = localStorage.getItem("auth_token");

  const blockBtn = document.getElementById("panel-block-btn");
  const isUnblock = blockBtn.classList.contains("unblock");

  if (isUnblock) {
    // Unblock directly
    const url =
      type === "staff" ? `/staff/${id}/unblock` : `/students/${id}/unblock`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast("User has been unblocked");
        loadPanelUser(id, type);

        if (type === "staff") loadStaffUsers();
        else loadStudentUsers();
      } else {
        showToast(data.message || "Failed to unblock", "error");
      }
    } catch (err) {
      showToast("Error unblocking user", "error");
    }
  } else {
    // Show block reason dialog
    showBlockReasonDialog(id, type);
  }
}

function showBlockReasonDialog(id, type) {
  // Create dialog if not exists
  let overlay = document.getElementById("block-reason-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "block-reason-overlay";
    overlay.className = "block-reason-overlay";
    overlay.innerHTML = `
            <div class="block-reason-dialog">
                <h4><i class="fa-solid fa-ban"></i> Block User</h4>
                <p>Enter a reason for blocking this user. They will be denied library entry.</p>
                <textarea id="block-reason-text" placeholder="Enter reason (optional)..."></textarea>
                <div class="block-reason-actions">
                    <button class="btn btn-secondary btn-sm" onclick="closeBlockDialog()">Cancel</button>
                    <button class="btn btn-danger btn-sm" onclick="confirmBlockUser()">Block User</button>
                </div>
            </div>`;
    document.body.appendChild(overlay);
  }
  overlay.dataset.userId = id;
  overlay.dataset.userType = type;
  document.getElementById("block-reason-text").value = "";
  overlay.classList.add("open");
}

function closeBlockDialog() {
  document.getElementById("block-reason-overlay")?.classList.remove("open");
}

async function confirmBlockUser() {
  const overlay = document.getElementById("block-reason-overlay");
  const id = overlay.dataset.userId;
  const type = overlay.dataset.userType;
  const reason = document.getElementById("block-reason-text").value.trim();
  const token = localStorage.getItem("auth_token");

  const url = type === "staff" ? `/staff/${id}/block` : `/students/${id}/block`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    closeBlockDialog();
    if (data.success) {
      showToast("User has been blocked");
      loadPanelUser(id, type);
      if (type === "staff") loadStaffUsers();
      else loadStudentUsers();
    } else {
      showToast(data.message || "Failed to block user", "error");
    }
  } catch (err) {
    closeBlockDialog();
    showToast("Error blocking user", "error");
  }
}

// ---- Load Activity Logs ----
async function loadUserActivity(id, type) {
  const token = localStorage.getItem("auth_token");
  const timeline = document.getElementById("activity-timeline");
  timeline.innerHTML =
    '<div class="panel-loading"><div class="loader-spinner"></div><span>Loading activity...</span></div>';

  try {
    const url =
      type === "staff" ? `/staff/${id}/activity` : `/students/${id}/activity`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const logs = data.data || [];

    if (logs.length === 0) {
      timeline.innerHTML = `<div class="panel-empty"><i class="fa-solid fa-timeline"></i><p>No activity logs yet</p></div>`;
      return;
    }

    timeline.innerHTML = logs
      .map((log) => {
        const actionType = (log.action_type || "").toLowerCase();
        let iconClass = "default";
        let icon = "fa-circle-info";
        let actionLabel = log.action_type || "Action";

        if (actionType.includes("block")) {
          iconClass = "blocked";
          icon = "fa-ban";
          actionLabel = "Blocked";
        } else if (actionType.includes("unblock")) {
          iconClass = "unblocked";
          icon = "fa-unlock";
          actionLabel = "Unblocked";
        } else if (
          actionType.includes("update") ||
          actionType.includes("profile")
        ) {
          iconClass = "updated";
          icon = "fa-pen";
          actionLabel = "Profile Updated";
        } else if (
          actionType.includes("entry") ||
          actionType.includes("blocked_entry")
        ) {
          iconClass = "blocked";
          icon = "fa-door-closed";
          actionLabel = "Entry Denied";
        }

        const time = log.created_at
          ? new Date(log.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-";

        return `<div class="activity-item">
                <div class="activity-icon ${iconClass}"><i class="fa-solid ${icon}"></i></div>
                <div class="activity-content">
                    <div class="activity-action">${actionLabel}</div>
                    <div class="activity-desc">${log.description || "-"}</div>
                    <div class="activity-time">${time}</div>
                </div>
            </div>`;
      })
      .join("");
  } catch (err) {
    timeline.innerHTML = `<div class="panel-empty"><i class="fa-solid fa-exclamation-circle"></i><p>Failed to load activity</p></div>`;
  }
}

// ---- Load Attendance Logs ----
async function loadUserAttendance(id, type) {
  const token = localStorage.getItem("auth_token");
  const container = document.getElementById("attendance-list");
  container.innerHTML =
    '<div class="panel-loading"><div class="loader-spinner"></div><span>Loading attendance...</span></div>';

  try {
    const url =
      type === "staff"
        ? `/staff/${id}/attendance`
        : `/students/${id}/attendance`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const logs = data.data || [];

    if (logs.length === 0) {
      container.innerHTML = `<div class="panel-empty"><i class="fa-solid fa-clipboard-check"></i><p>No attendance records yet</p></div>`;
      return;
    }

    container.innerHTML = logs
      .map((log) => {
        const date = log.time_in
          ? new Date(log.time_in).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-";
        const time = log.time_in
          ? new Date(log.time_in).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "-";
        const remarks = log.remarks || "Library entry recorded";

        return `<div class="attendance-card">
                <div class="attendance-card-icon"><i class="fa-solid fa-door-open"></i></div>
                <div class="attendance-card-info">
                    <div class="attendance-date">${date}</div>
                    <div class="attendance-time"><i class="fa-regular fa-clock" style="opacity:0.5;font-size:11px;"></i> ${time}</div>
                    <div class="attendance-remarks">${remarks}</div>
                </div>
            </div>`;
      })
      .join("");
  } catch (err) {
    container.innerHTML = `<div class="panel-empty"><i class="fa-solid fa-exclamation-circle"></i><p>Failed to load attendance</p></div>`;
  }
}

// ---- Delete User ----
async function confirmDeleteUser(id, type, name) {
  if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
  const token = localStorage.getItem("auth_token");
  const url = type === "staff" ? `/staff/${id}` : `/students/${id}`;
  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      showToast(`${name} has been deleted`);
      if (type === "staff") loadStaffUsers();
      else loadStudentUsers();
    } else {
      showToast(data.message || "Failed to delete", "error");
    }
  } catch (err) {
    showToast("Error deleting user", "error");
  }
}

// ===================
// ADD USER MODAL
// ===================

async function showAddUserModal(type) {
  let overlay = document.getElementById("add-user-modal-overlay");
  if (overlay) overlay.remove();

  const title = type === "staff" ? "Add New Staff" : "Add New Student";
  const icon = type === "staff" ? "fa-user-tie" : "fa-user-graduate";

  overlay = document.createElement("div");
  overlay.id = "add-user-modal-overlay";
  overlay.className = "add-modal-overlay";
  overlay.innerHTML = `
        <div class="add-modal">
            <div class="add-modal-header">
                <h3><i class="fa-solid ${icon}"></i> ${title}</h3>
                <button class="panel-close-btn" onclick="closeAddUserModal()"><i class="fa-solid fa-times"></i></button>
            </div>
            <div class="add-modal-body">
                <div class="panel-form-row">
                    <div class="panel-form-group">
                        <label>First Name *</label>
                        <input type="text" id="add-first-name" class="panel-input" placeholder="First name">
                    </div>
                    <div class="panel-form-group">
                        <label>Last Name *</label>
                        <input type="text" id="add-last-name" class="panel-input" placeholder="Last name">
                    </div>
                </div>
                
                ${
                  type === "staff"
                    ? `
                <div class="panel-form-group">
                    <label>Role *</label>
                    <div class="filter-input-wrapper">
                        <input type="text" id="add-role-input" class="filter-input" placeholder="Search Role..." list="add-role-list">
                        <button type="button" class="filter-clear-btn" onclick="clearEditInput('add-role-input')"><i class="fa-solid fa-times"></i></button>
                    </div>
                    <datalist id="add-role-list">
                        <option value="Librarian" data-id="2">
                        <option value="Management" data-id="3">
                        <option value="Admin" data-id="4">
                    </datalist>
                    <input type="hidden" id="add-role">
                </div>`
                    : `
                <div class="panel-form-group">
                    <label>College *</label>
                    <div class="filter-input-wrapper">
                        <input type="text" id="add-college-input" class="filter-input" placeholder="Search College..." list="add-college-list">
                        <button type="button" class="filter-clear-btn" onclick="clearEditInput('add-college-input')"><i class="fa-solid fa-times"></i></button>
                    </div>
                    <datalist id="add-college-list"></datalist>
                    <input type="hidden" id="add-college">
                </div>
                <div class="panel-form-group">
                    <label>Program *</label>
                    <div class="filter-input-wrapper">
                        <input type="text" id="add-program-input" class="filter-input" placeholder="Search Program..." list="add-program-list">
                        <button type="button" class="filter-clear-btn" onclick="clearEditInput('add-program-input')"><i class="fa-solid fa-times"></i></button>
                    </div>
                    <datalist id="add-program-list"></datalist>
                    <input type="hidden" id="add-program">
                </div>
                <div class="panel-form-row">
                    <div class="panel-form-group">
                        <label>Year Level *</label>
                        <select id="add-year" class="panel-select">
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                            <option value="5">5th Year</option>
                        </select>
                    </div>
                    <div class="panel-form-group">
                        <label>Section *</label>
                        <div class="filter-input-wrapper">
                            <input type="text" id="add-section-input" class="filter-input" placeholder="Search Section..." list="add-section-list">
                            <button type="button" class="filter-clear-btn" onclick="clearEditInput('add-section-input')"><i class="fa-solid fa-times"></i></button>
                        </div>
                        <datalist id="add-section-list"></datalist>
                        <input type="hidden" id="add-section">
                    </div>
                </div>`
                }

                <div class="panel-form-group">
                    <label>Password *</label>
                    <input type="password" id="add-password" class="panel-input" placeholder="Password" autocomplete="new-password">
                </div>
                <div class="panel-form-group">
                    <label style="font-size:0.75rem;color:var(--portal-text-muted)">
                        Email will be auto-generated: firstname.lastname@neu.edu.ph
                    </label>
                </div>
            </div>
            <div class="add-modal-footer">
                <button class="btn btn-secondary btn-sm" onclick="closeAddUserModal()">Cancel</button>
                <button class="btn btn-primary btn-sm" onclick="submitAddUser('${type}')">
                    <i class="fa-solid fa-plus"></i> Create ${type === "staff" ? "Staff" : "Student"}
                </button>
            </div>
        </div>`;
  document.body.appendChild(overlay);

  // Initialize searchable dropdowns for the modal
  setupAddUserModalListeners(type);

  // Load initial options if student
  if (type === "student") await loadAddUserOptions();

  setTimeout(() => overlay.classList.add("open"), 10);
}

function closeAddUserModal() {
  const overlay = document.getElementById("add-user-modal-overlay");
  if (overlay) {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 200);
  }
}

async function submitAddUser(type) {
  const firstName = document.getElementById("add-first-name").value.trim();
  const lastName = document.getElementById("add-last-name").value.trim();
  const password = document.getElementById("add-password").value;

  if (!firstName || !lastName || !password) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  const token = localStorage.getItem("auth_token");
  let payload, url;

  if (type === "staff") {
    const role_id = document.getElementById("add-role").value;
    if (!role_id) {
      showToast("Please select a valid role", "error");
      return;
    }
    payload = { first_name: firstName, last_name: lastName, password, role_id };
    url = "/auth/register";
  } else {
    const section_id = document.getElementById("add-section").value;
    if (!section_id) {
      showToast("Please select a valid section", "error");
      return;
    }
    payload = {
      first_name: firstName,
      last_name: lastName,
      password,
      section_id,
    };
    url = "/students";
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      showToast(
        `${type === "staff" ? "Staff" : "Student"} created successfully`,
      );
      closeAddUserModal();
      if (type === "staff") loadStaffUsers();
      else loadStudentUsers();
    } else {
      showToast(data.message || "Failed to create user", "error");
    }
  } catch (err) {
    showToast("Error creating user", "error");
  }
}

// ===================
// COLLEGES, PROGRAMS, SECTIONS (Admin)
// ===================

async function loadCollegesAdmin() {
  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch("/colleges?limit=1000", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    renderCollegesTable(data.data || []);
  } catch (err) {
    console.error("Failed to load colleges:", err);
  }
}

function renderCollegesTable(colleges) {
  const tbody = document.querySelector("#colleges-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  colleges.forEach((college) => {
    const created = college.created_at
      ? new Date(college.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${college.id}</td>
            <td>${college.college_code || "-"}</td>
            <td>${college.college_name || "-"}</td>
            <td>${created}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editCollege(${college.id})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete" onclick="deleteCollege(${college.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>`;
    tbody.appendChild(tr);
  });
  if (colleges.length === 0)
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;color:var(--portal-text-muted)">No colleges found</td></tr>';
}

async function loadPrograms() {
  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch("/programs?limit=1000", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    renderProgramsTable(data.data || []);
  } catch (err) {
    console.error("Failed to load programs:", err);
  }
}

function renderProgramsTable(programs) {
  const tbody = document.querySelector("#programs-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  programs.forEach((program) => {
    const created = program.created_at
      ? new Date(program.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${program.id}</td>
            <td>${program.program_code || "-"}</td>
            <td>${program.program_name || "-"}</td>
            <td>${program.college_name || "-"}</td>
            <td>${created}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editProgram(${program.id})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete" onclick="deleteProgram(${program.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>`;
    tbody.appendChild(tr);
  });
  if (programs.length === 0)
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;color:var(--portal-text-muted)">No programs found</td></tr>';
}

async function loadSections() {
  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch("/sections?limit=1000", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    renderSectionsTable(data.data || []);
  } catch (err) {
    console.error("Failed to load sections:", err);
  }
}

function renderSectionsTable(sections) {
  const tbody = document.querySelector("#sections-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  sections.forEach((section) => {
    const created = section.created_at
      ? new Date(section.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${section.id}</td>
            <td>${section.section_name || "-"}</td>
            <td>${section.program_name || "-"}</td>
            <td>${section.year_level || "-"}</td>
            <td>${created}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editSection(${section.id})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete" onclick="deleteSection(${section.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>`;
    tbody.appendChild(tr);
  });
  if (sections.length === 0)
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;color:var(--portal-text-muted)">No sections found</td></tr>';
}

// Stub CRUD for colleges/programs/sections (alerts for now - can be expanded)
function showAddCollegeModal() {
  alert("Add College — Coming soon");
}
function editCollege(id) {
  alert(`Edit College ${id} — Coming soon`);
}
function deleteCollege(id) {
  if (confirm("Delete this college?"))
    alert(`Delete College ${id} — Coming soon`);
}
function showAddProgramModal() {
  alert("Add Program — Coming soon");
}
function editProgram(id) {
  alert(`Edit Program ${id} — Coming soon`);
}
function deleteProgram(id) {
  if (confirm("Delete this program?"))
    alert(`Delete Program ${id} — Coming soon`);
}
function showAddSectionModal() {
  alert("Add Section — Coming soon");
}
function editSection(id) {
  alert(`Edit Section ${id} — Coming soon`);
}
function deleteSection(id) {
  if (confirm("Delete this section?"))
    alert(`Delete Section ${id} — Coming soon`);
}

// End of User Management and Admin Implementation
