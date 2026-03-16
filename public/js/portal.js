// Portal Page Logic
// Handles navigation, data fetching, and user interactions

// State
let currentView = 'view-dashboard';
let currentUser = null;
let attendanceChart = null;

// Helper function to get ISO week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Filter state
let dashboardFilters = {
    search: '',
    college_id: '',
    user_type: ''
};

// Pagination state for each table
const paginationState = {
    dashboard: { offset: 0, limit: 10, loading: false, hasMore: true },
    students: { offset: 0, limit: 10, loading: false, hasMore: true },
    staff: { offset: 0, limit: 10, loading: false, hasMore: true },
    events: { offset: 0, limit: 10, loading: false, hasMore: true },
    logs: { offset: 0, limit: 10, loading: false, hasMore: true },
    users: { offset: 0, limit: 10, loading: false, hasMore: true }
};

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const navBtns = document.querySelectorAll('.nav-btn');
const viewSections = document.querySelectorAll('.view-section');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userRole = document.getElementById('user-role');
const btnLogout = document.getElementById('btn-logout');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    await checkAuth();
    setupEventListeners();
    setupFilterListeners();
    await loadColleges();
    await loadDashboard();
    setupInfiniteScroll();
    
    // Check admin access and show admin section
    checkAdminAccess();
    
    // Initialize navigation groups - expand first group by default
    const firstGroupToggle = document.querySelector('.nav-group-toggle');
    const firstGroupItems = document.querySelector('.nav-group-items');
    if (firstGroupToggle && firstGroupItems) {
        firstGroupToggle.classList.add('active');
        firstGroupItems.classList.add('show');
    }
}

// Setup infinite scroll
function setupInfiniteScroll() {
    const tables = document.querySelectorAll('.table-scroll');
    
    tables.forEach(tableContainer => {
        tableContainer.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = tableContainer;
            
            // Load more when near bottom (100px threshold)
            if (scrollHeight - scrollTop - clientHeight < 100) {
                const tableId = tableContainer.closest('.view-section').id;
                loadMoreForView(tableId);
            }
        });
    });
}

// Load more data for specific view
async function loadMoreForView(viewId) {
    let key = '';
    let loadFn = null;
    
    switch(viewId) {
        case 'view-dashboard':
            key = 'dashboard';
            loadFn = loadMoreDashboardLogs;
            break;
        case 'view-students':
            key = 'students';
            loadFn = loadMoreStudents;
            break;
        case 'view-staff':
            key = 'staff';
            loadFn = loadMoreStaff;
            break;
        case 'view-events':
            key = 'events';
            loadFn = loadMoreEvents;
            break;
        case 'view-logs':
            key = 'logs';
            loadFn = loadMoreLogs;
            break;
    }
    
    if (loadFn && paginationState[key] && !paginationState[key].loading && paginationState[key].hasMore) {
        await loadFn();
    }
}

// Check authentication
async function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const res = await fetch('/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Unauthorized');
        
        const data = await res.json();
        currentUser = data.user;
        updateUserInfo();
    } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('auth_token');
        window.location.href = '/login.html';
    }
}

// Update user info in header
function updateUserInfo() {
    const fullName = `${currentUser.first_name} ${currentUser.last_name}`;
    const initials = fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    
    userAvatar.textContent = initials;
    userName.textContent = fullName;
    userRole.textContent = currentUser.role_name || currentUser.role_id || 'Staff';
}

// Setup event listeners
function setupEventListeners() {
    // Sidebar toggle
    sidebarToggle?.addEventListener('click', toggleSidebar);

    // Navigation group toggles (collapsible)
    const navGroupToggles = document.querySelectorAll('.nav-group-toggle');
    navGroupToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const groupId = toggle.dataset.group;
            const groupItems = document.getElementById(`group-${groupId}`);
            
            // Toggle the active state on the toggle button
            toggle.classList.toggle('active');
            
            // Toggle the show class on the group items
            groupItems?.classList.toggle('show');
        });
    });

    // Navigation buttons
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            switchView(target);
        });
    });

    // Logout
    btnLogout?.addEventListener('click', logout);
}

// Setup filter listeners
function setupFilterListeners() {
    const searchInput = document.getElementById('search-name');
    const collegeInput = document.getElementById('filter-college');
    const roleInput = document.getElementById('filter-role');

    // Search input - debounce
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            dashboardFilters.search = e.target.value.trim();
            loadDashboard();
        }, 300);
    });
    
    // Search on Enter key
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            dashboardFilters.search = e.target.value.trim();
            loadDashboard();
        }
    });

    // College filter
    collegeInput?.addEventListener('input', (e) => {
        dashboardFilters.college_id = e.target.value.trim();
        loadDashboard();
    });

    // Role filter
    roleInput?.addEventListener('input', (e) => {
        dashboardFilters.user_type = e.target.value.trim().toLowerCase();
        if (dashboardFilters.user_type === 'student' || dashboardFilters.user_type === 'staff') {
            loadDashboard();
        } else if (dashboardFilters.user_type === '') {
            loadDashboard();
        }
    });

    // Clear buttons
    document.getElementById('clear-search')?.addEventListener('click', () => {
        searchInput.value = '';
        dashboardFilters.search = '';
        loadDashboard();
    });

    document.getElementById('clear-college')?.addEventListener('click', () => {
        collegeInput.value = '';
        dashboardFilters.college_id = '';
        loadDashboard();
    });

    document.getElementById('clear-role')?.addEventListener('click', () => {
        roleInput.value = '';
        dashboardFilters.user_type = '';
        loadDashboard();
    });

    // Clear all filters button
    document.getElementById('clear-all-filters')?.addEventListener('click', () => {
        searchInput.value = '';
        collegeInput.value = '';
        roleInput.value = '';
        dashboardFilters.search = '';
        dashboardFilters.college_id = '';
        dashboardFilters.user_type = '';
        loadDashboard();
    });
}

// Load colleges for filter
async function loadColleges() {
    try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/colleges', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const colleges = data.data || [];
        
        // Populate datalist for college filter
        const collegeList = document.getElementById('college-list');
        colleges.forEach(college => {
            const option = document.createElement('option');
            option.value = college.college_name;
            collegeList.appendChild(option);
        });
    } catch (err) {
        console.error('Failed to load colleges:', err);
    }
}

// Toggle sidebar collapsed state
function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
}

// Switch between views
function switchView(viewId) {
    // Update nav buttons
    navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.target === viewId);
    });

    // Update view sections
    viewSections.forEach(section => {
        section.classList.toggle('active', section.id === viewId);
    });

    currentView = viewId;

    // Reset pagination when switching views
    const viewKey = viewId.replace('view-', '');
    if (paginationState[viewKey]) {
        paginationState[viewKey].offset = 0;
        paginationState[viewKey].hasMore = true;
    }

    // Load data for the view
    switch(viewId) {
        case 'view-dashboard':
            loadDashboard();
            break;
        case 'view-statistics':
            loadStatistics();
            break;
        case 'view-students':
            loadStudents();
            break;
        case 'view-staff':
            loadStaff();
            break;
        case 'view-events':
            loadEvents();
            break;
        case 'view-logs':
            loadLogs();
            break;
        case 'view-users':
            loadUsers();
            break;
        case 'view-colleges':
            loadCollegesAdmin();
            break;
        case 'view-programs':
            loadPrograms();
            break;
        case 'view-sections':
            loadSections();
            break;
    }
}

// Logout
async function logout() {
    try {
        const token = localStorage.getItem('auth_token');
        await fetch('/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (err) {
        console.error('Logout error:', err);
    } finally {
        localStorage.removeItem('auth_token');
        window.location.href = '/login.html';
    }
}

// ===================
// DATA LOADING
// ===================

// Load dashboard data
async function loadDashboard() {
    try {
        const token = localStorage.getItem('auth_token');
        
        // Reset pagination
        paginationState.dashboard.offset = 0;
        paginationState.dashboard.hasMore = true;
        
        // Fetch stats and logs with filters
        const params = new URLSearchParams();
        params.append('limit', paginationState.dashboard.limit);
        if (dashboardFilters.search) params.append('search', dashboardFilters.search);
        if (dashboardFilters.college_id) params.append('college_id', dashboardFilters.college_id);
        if (dashboardFilters.user_type) params.append('user_type', dashboardFilters.user_type);

        const [statsRes, logsRes] = await Promise.all([
            fetch('/stats/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`/logs/attendance?${params.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const statsData = await statsRes.json();
        const logsData = await logsRes.json();

        const stats = statsData.data || {};
        const logs = logsData.data || [];

        // Update pagination state
        paginationState.dashboard.hasMore = logs.length >= paginationState.dashboard.limit;
        paginationState.dashboard.offset = logs.length;

        // Update stat cards
        document.getElementById('stat-total').textContent = stats.attendance?.total || 0;
        document.getElementById('stat-today').textContent = stats.attendance?.today || 0;
        document.getElementById('stat-students').textContent = stats.students?.total || 0;
        document.getElementById('stat-blocked').textContent = stats.blocked_users || 0;

        // Update logs table
        renderDashboardLogs(logs, true);
    } catch (err) {
        console.error('Failed to load dashboard:', err);
    }
}

// Load statistics data
async function loadStatistics() {
    try {
        const token = localStorage.getItem('auth_token');
        
        // Fetch dashboard stats
        const statsRes = await fetch('/stats/dashboard', { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        const statsData = await statsRes.json();
        const stats = statsData.data || {};

        // Update stat cards
        document.getElementById('stat-stats-total').textContent = stats.attendance?.total || 0;
        document.getElementById('stat-stats-today').textContent = stats.attendance?.today || 0;
        document.getElementById('stat-stats-week').textContent = stats.attendance?.this_week || 0;
        document.getElementById('stat-stats-month').textContent = stats.attendance?.this_month || 0;

        // Load chart - default to today
        loadChart('today');
    } catch (err) {
        console.error('Failed to load statistics:', err);
    }
}

// Load chart data
async function loadChart(period = 'week') {
    try {
        const token = localStorage.getItem('auth_token');
        
        const res = await fetch(`/stats/attendance-graph?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        const graphData = data.data || { student: [], staff: [] };
        
        // Prepare chart data
        const labels = [];
        const studentData = [];
        const staffData = [];
        
        // Merge and sort all dates
        const allDates = new Set();
        graphData.student.forEach(d => allDates.add(d.date));
        graphData.staff.forEach(d => allDates.add(d.date));
        const sortedDates = Array.from(allDates).sort();
        
        sortedDates.forEach(date => {
            let label;
            if (period === 'today') {
                // Hourly format: "09:00"
                label = date;
            } else if (period === 'week') {
                // Daily format: "Mar 15"
                label = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else if (period === 'month') {
                // Weekly format: "Week 9", "Week 10", etc.
                label = 'Week ' + date;
            } else if (period === 'year') {
                // Monthly format: "Jan", "Feb", etc.
                label = new Date(date + '-01').toLocaleDateString('en-US', { month: 'short' });
            } else {
                label = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            labels.push(label);
            const student = graphData.student.find(d => d.date === date);
            const staff = graphData.staff.find(d => d.date === date);
            studentData.push(student ? student.count : 0);
            staffData.push(staff ? staff.count : 0);
        });

        const ctx = document.getElementById('attendance-chart').getContext('2d');
        
        if (attendanceChart) {
            attendanceChart.destroy();
        }
        
        attendanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Students',
                        data: studentData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Staff',
                        data: staffData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#64748b',
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error('Failed to load chart:', err);
    }
}

// Setup chart period buttons
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('period-btn')) {
            document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            loadChart(e.target.dataset.period);
        }
    });
});

// Load more dashboard logs
async function loadMoreDashboardLogs() {
    if (paginationState.dashboard.loading || !paginationState.dashboard.hasMore) return;
    
    paginationState.dashboard.loading = true;
    showLoadingIndicator('dash-logs-table', true);
    
    try {
        const token = localStorage.getItem('auth_token');
        const offset = paginationState.dashboard.offset;
        const limit = paginationState.dashboard.limit;
        
        const params = new URLSearchParams();
        params.append('limit', limit);
        params.append('offset', offset);
        if (dashboardFilters.search) params.append('search', dashboardFilters.search);
        if (dashboardFilters.college_id) params.append('college_id', dashboardFilters.college_id);
        if (dashboardFilters.user_type) params.append('user_type', dashboardFilters.user_type);
        
        const res = await fetch(`/logs/attendance?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        const logs = data.data || [];
        
        paginationState.dashboard.hasMore = logs.length >= limit;
        paginationState.dashboard.offset += logs.length;
        
        renderDashboardLogs(logs, false);
    } catch (err) {
        console.error('Failed to load more dashboard logs:', err);
    } finally {
        paginationState.dashboard.loading = false;
        showLoadingIndicator('dash-logs-table', false);
    }
}

// Show/hide loading indicator
function showLoadingIndicator(tableId, show) {
    const table = document.getElementById(tableId);
    let loader = table.parentElement.querySelector('.table-loader');
    
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.className = 'table-loader';
            loader.innerHTML = '<div class="loader-spinner"></div><span>Loading more...</span>';
            table.parentElement.appendChild(loader);
        }
        loader.style.display = 'flex';
    } else if (loader) {
        loader.style.display = 'none';
    }
}

// Render dashboard logs
function renderDashboardLogs(logs, replace = true) {
    const tbody = document.querySelector('#dash-logs-table tbody');
    
    if (replace) {
        tbody.innerHTML = '';
    }

    logs.forEach(log => {
        const tr = document.createElement('tr');
        
        const logDate = new Date(log.time_in);
        const date = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const time = logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const type = log.user_type === 'student' ? 'Student' : 'Staff';
        const reason = log.reason || 'Library Entry';
        
        // Get student number or staff ID
        const idNumber = log.student_number || '-';
        const programCollege = log.program_name || log.college_name || '';

        // Generate initials avatar
        const name = log.user_name || 'Unknown';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const bgColor = colors[name.charCodeAt(0) % colors.length];

        // User status (active/inactive)
        const userStatus = log.user_status || 'active';
        const statusClass = userStatus === 'active' ? 'status-active' : 'status-inactive';
        const statusLabel = userStatus === 'active' ? 'Active' : 'Inactive';

        // Library attendance - always show as Present
        tr.innerHTML = `
            <td class="profile-cell">
                <div class="table-avatar" style="background: ${bgColor}">${initials}</div>
            </td>
            <td>
                <div class="cell-primary">${name}</div>
                <div class="cell-secondary">${idNumber}</div>
            </td>
            <td>${programCollege}</td>
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
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--portal-text-muted)">No recent activity</td></tr>';
    }
}

// Load students
async function loadStudents() {
    try {
        const token = localStorage.getItem('auth_token');
        
        // Reset pagination
        paginationState.students.offset = 0;
        paginationState.students.hasMore = true;
        
        const res = await fetch('/students?limit=10', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        const students = data.data || [];
        const total = data.total || 0;
        
        // Update pagination state
        paginationState.students.hasMore = students.length >= paginationState.students.limit;
        paginationState.students.offset = students.length;
        
        // Update total count display
        document.getElementById('students-count').textContent = `Total: ${total}`;
        
        renderStudentsTable(students, true);
    } catch (err) {
        console.error('Failed to load students:', err);
    }
}

// Load more students
async function loadMoreStudents() {
    if (paginationState.students.loading || !paginationState.students.hasMore) return;
    
    paginationState.students.loading = true;
    showLoadingIndicator('students-table', true);
    
    try {
        const token = localStorage.getItem('auth_token');
        const offset = paginationState.students.offset;
        const limit = paginationState.students.limit;
        
        const res = await fetch(`/students?limit=${limit}&offset=${offset}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        const students = data.data || [];
        
        paginationState.students.hasMore = students.length >= limit;
        paginationState.students.offset += students.length;
        
        renderStudentsTable(students, false);
    } catch (err) {
        console.error('Failed to load more students:', err);
    } finally {
        paginationState.students.loading = false;
        showLoadingIndicator('students-table', false);
    }
}

// Render students table
function renderStudentsTable(students, replace = true) {
    const tbody = document.querySelector('#students-table tbody');
    
    if (replace) {
        tbody.innerHTML = '';
    }

    students.forEach(student => {
        const tr = document.createElement('tr');
        
        // Generate initials avatar for profile
        const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
        const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const bgColor = colors[fullName.charCodeAt(0) % colors.length];
        
        // Format registered date
        let registeredDate = '-';
        if (student.created_at) {
            const date = new Date(student.created_at);
            registeredDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        
        tr.innerHTML = `
            <td class="profile-cell">
                <div class="table-avatar" style="background: ${bgColor}">${initials}</div>
            </td>
            <td>${student.student_number || '-'}</td>
            <td>${fullName || '-'}</td>
            <td>${student.email || '-'}</td>
            <td>${student.program_name || '-'}</td>
            <td>${student.section_name || '-'}</td>
            <td>
                <span class="badge ${student.status === 'active' ? 'badge-active' : 'badge-inactive'}">
                    ${student.status || 'Active'}
                </span>
            </td>
            <td>${registeredDate}</td>
        `;
        tbody.appendChild(tr);
    });

    if (replace && students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--portal-text-muted)">No students found</td></tr>';
    }
}

// Load staff
async function loadStaff() {
    try {
        const token = localStorage.getItem('auth_token');
        
        // Reset pagination
        paginationState.staff.offset = 0;
        paginationState.staff.hasMore = true;
        
        const res = await fetch('/staff?limit=10', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        const staff = data.data || [];
        const total = data.total || 0;
        
        // Update pagination state
        paginationState.staff.hasMore = staff.length >= paginationState.staff.limit;
        paginationState.staff.offset = staff.length;
        
        // Update total count display
        document.getElementById('staff-count').textContent = `Total: ${total}`;
        
        renderStaffTable(staff, true);
    } catch (err) {
        console.error('Failed to load staff:', err);
    }
}

// Load more staff
async function loadMoreStaff() {
    if (paginationState.staff.loading || !paginationState.staff.hasMore) return;
    
    paginationState.staff.loading = true;
    showLoadingIndicator('staff-table', true);
    
    try {
        const token = localStorage.getItem('auth_token');
        const offset = paginationState.staff.offset;
        const limit = paginationState.staff.limit;
        
        const res = await fetch(`/staff?limit=${limit}&offset=${offset}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        const staff = data.data || [];
        
        paginationState.staff.hasMore = staff.length >= limit;
        paginationState.staff.offset += staff.length;
        
        renderStaffTable(staff, false);
    } catch (err) {
        console.error('Failed to load more staff:', err);
    } finally {
        paginationState.staff.loading = false;
        showLoadingIndicator('staff-table', false);
    }
}

// Render staff table
function renderStaffTable(staff, replace = true) {
    const tbody = document.querySelector('#staff-table tbody');
    
    if (replace) {
        tbody.innerHTML = '';
    }

    staff.forEach(member => {
        const tr = document.createElement('tr');
        
        // Generate initials avatar for profile
        const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
        const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const bgColor = colors[fullName.charCodeAt(0) % colors.length];
        
        // Format registered date
        let registeredDate = '-';
        if (member.created_at) {
            const date = new Date(member.created_at);
            registeredDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        
        // Format status
        const statusClass = member.status === 'active' ? 'badge-active' : 'badge-inactive';
        const statusLabel = member.status === 'active' ? 'Active' : 'Inactive';
        
        tr.innerHTML = `
            <td class="profile-cell">
                <div class="table-avatar" style="background: ${bgColor}">${initials}</div>
            </td>
            <td>${member.employee_id || '-'}</td>
            <td>${fullName || '-'}</td>
            <td>${member.email || '-'}</td>
            <td>${member.role_name || '-'}</td>
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
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--portal-text-muted)">No staff found</td></tr>';
    }
}

// Load events
async function loadEvents() {
    try {
        const token = localStorage.getItem('auth_token');
        
        // Reset pagination
        paginationState.events.offset = 0;
        paginationState.events.hasMore = true;
        
        const res = await fetch('/events?limit=10', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        const events = data.data || [];
        
        // Update pagination state
        paginationState.events.hasMore = events.length >= paginationState.events.limit;
        paginationState.events.offset = events.length;
        
        renderEventsTable(events, true);
    } catch (err) {
        console.error('Failed to load events:', err);
    }
}

// Load more events
async function loadMoreEvents() {
    if (paginationState.events.loading || !paginationState.events.hasMore) return;
    
    paginationState.events.loading = true;
    showLoadingIndicator('events-table', true);
    
    try {
        const token = localStorage.getItem('auth_token');
        const offset = paginationState.events.offset;
        const limit = paginationState.events.limit;
        
        const res = await fetch(`/events?limit=${limit}&offset=${offset}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        const events = data.data || [];
        
        paginationState.events.hasMore = events.length >= limit;
        paginationState.events.offset += events.length;
        
        renderEventsTable(events, false);
    } catch (err) {
        console.error('Failed to load more events:', err);
    } finally {
        paginationState.events.loading = false;
        showLoadingIndicator('events-table', false);
    }
}

// Render events table
function renderEventsTable(events, replace = true) {
    const tbody = document.querySelector('#events-table tbody');
    
    if (replace) {
        tbody.innerHTML = '';
    }

    events.forEach(event => {
        const tr = document.createElement('tr');
        
        const startDate = new Date(event.start_datetime).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const endDate = new Date(event.end_datetime).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        tr.innerHTML = `
            <td>${event.title || '-'}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>${event.creatorName || '-'}</td>
        `;
        tbody.appendChild(tr);
    });

    if (replace && events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--portal-text-muted)">No events found</td></tr>';
    }
}

// Load logs
async function loadLogs() {
    try {
        const token = localStorage.getItem('auth_token');
        
        // Reset pagination
        paginationState.logs.offset = 0;
        paginationState.logs.hasMore = true;
        
        const res = await fetch('/logs/attendance?limit=10', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        const logs = data.data || [];
        
        // Update pagination state
        paginationState.logs.hasMore = logs.length >= paginationState.logs.limit;
        paginationState.logs.offset = logs.length;
        
        renderLogsTable(logs, true);
    } catch (err) {
        console.error('Failed to load logs:', err);
    }
}

// Load more logs
async function loadMoreLogs() {
    if (paginationState.logs.loading || !paginationState.logs.hasMore) return;
    
    paginationState.logs.loading = true;
    showLoadingIndicator('logs-table', true);
    
    try {
        const token = localStorage.getItem('auth_token');
        const offset = paginationState.logs.offset;
        const limit = paginationState.logs.limit;
        
        const res = await fetch(`/logs/attendance?limit=${limit}&offset=${offset}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        const logs = data.data || [];
        
        paginationState.logs.hasMore = logs.length >= limit;
        paginationState.logs.offset += logs.length;
        
        renderLogsTable(logs, false);
    } catch (err) {
        console.error('Failed to load more logs:', err);
    } finally {
        paginationState.logs.loading = false;
        showLoadingIndicator('logs-table', false);
    }
}

// Render logs table
function renderLogsTable(logs, replace = true) {
    const tbody = document.querySelector('#logs-table tbody');
    
    if (replace) {
        tbody.innerHTML = '';
    }

    logs.forEach(log => {
        const tr = document.createElement('tr');
        
        const logDate = new Date(log.time_in);
        const date = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const time = logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const type = log.user_type === 'student' ? 'Student' : 'Staff';

        tr.innerHTML = `
            <td>${log.id || '-'}</td>
            <td>${date}</td>
            <td>${log.user_name || 'Unknown'}</td>
            <td>${type}</td>
            <td>${time}</td>
            <td><span class="status-badge status-present"><span class="status-dot"></span>Present</span></td>
        `;
        tbody.appendChild(tr);
    });

    if (replace && logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--portal-text-muted)">No logs found</td></tr>';
    }
}

// ===================
// EXPORT AND PRINT FUNCTIONS
// ===================

// Export table to CSV - fetches all data from API
async function exportTableToCSV(tableId, prefix) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error('Table not found:', tableId);
        return;
    }

    const token = localStorage.getItem('auth_token');
    let allData = [];
    let headers = [];

    // Fetch ALL data from API based on table type
    try {
        switch(tableId) {
            case 'dash-logs-table':
            case 'logs-table':
                // Fetch all logs - use a large limit to get everything
                const logsRes = await fetch(`/logs/attendance?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const logsData = await logsRes.json();
                allData = logsData.data || [];
                headers = ['Profile', 'ID', 'Program/College', 'Role', 'Date/Time', 'Reason', 'Status'];
                break;

            case 'students-table':
                // Fetch all students
                const studentsRes = await fetch(`/students?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const studentsData = await studentsRes.json();
                allData = studentsData.data || [];
                headers = ['Profile', 'Student No.', 'Name', 'Email', 'Department', 'Section', 'Status', 'Registered'];
                break;

            case 'staff-table':
                // Fetch all staff
                const staffRes = await fetch(`/staff?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const staffData = await staffRes.json();
                allData = staffData.data || [];
                headers = ['Profile', 'Employee No.', 'Name', 'Email', 'Role', 'Status', 'Registered'];
                break;

            case 'events-table':
                // Fetch all events
                const eventsRes = await fetch(`/events?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const eventsData = await eventsRes.json();
                allData = eventsData.data || [];
                headers = ['Title', 'Starts', 'Ends', 'Creator'];
                break;

            case 'users-table':
                // Fetch all staff users
                const usersRes = await fetch(`/staff?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const usersData = await usersRes.json();
                allData = usersData.data || [];
                headers = ['Profile', 'Employee No.', 'Name', 'Email', 'Role', 'Status', 'Registered'];
                break;

            case 'colleges-table':
                // Fetch all colleges
                const collegesRes = await fetch(`/colleges?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const collegesData = await collegesRes.json();
                allData = collegesData.data || [];
                headers = ['ID', 'College Code', 'College Name', 'Created'];
                break;

            case 'programs-table':
                // Fetch all programs
                const programsRes = await fetch(`/programs?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const programsData = await programsRes.json();
                allData = programsData.data || [];
                headers = ['ID', 'Program Code', 'Program Name', 'College', 'Created'];
                break;

            case 'sections-table':
                // Fetch all sections
                const sectionsRes = await fetch(`/sections?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const sectionsData = await sectionsRes.json();
                allData = sectionsData.data || [];
                headers = ['ID', 'Section Name', 'Program', 'Year Level', 'Created'];
                break;

            default:
                // Fallback to table data
                const tableHeaders = table.querySelectorAll('thead th');
                tableHeaders.forEach(th => headers.push(th.textContent.trim()));
                const tableRows = table.querySelectorAll('tbody tr');
                tableRows.forEach(tr => {
                    const row = [];
                    tr.querySelectorAll('td').forEach(td => row.push(td.textContent.trim()));
                    if (row.length > 0) allData.push(row);
                });
        }
    } catch (err) {
        console.error('Error fetching data for export:', err);
        alert('Failed to fetch data for export');
        return;
    }

    if (allData.length === 0) {
        alert('No data to export');
        return;
    }

    // Format data based on table type
    let rows = [];
    switch(tableId) {
        case 'dash-logs-table':
        case 'logs-table':
            rows = allData.map(log => {
                const logDate = new Date(log.time_in);
                const date = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const time = logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                const name = log.user_name || 'Unknown';
                const id = log.student_number || log.employee_id || '-';
                const program = log.program_name || log.college_name || '-';
                const role = log.user_type === 'student' ? 'STUDENT' : (log.user_type === 'staff' ? 'EMPLOYEE' : '-');
                const timestamp = `${date} ${time}`;
                const reason = log.reason || 'Library Entry';
                const status = (log.user_status || 'active').toUpperCase();
                return [name, id, program, role, timestamp, reason, status];
            });
            break;

        case 'students-table':
            rows = allData.map(s => {
                const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
                const registered = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                return [fullName, s.student_number || '-', fullName, s.email || '-', s.program_name || '-', s.section_name || '-', (s.status || 'active').toUpperCase(), registered];
            });
            break;

        case 'staff-table':
            rows = allData.map(s => {
                const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
                const registered = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                return [fullName, s.employee_id || '-', fullName, s.email || '-', s.role_name || '-', (s.status || 'active').toUpperCase(), registered];
            });
            break;

        case 'events-table':
            rows = allData.map(e => {
                const start = new Date(e.start_datetime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                const end = new Date(e.end_datetime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                return [e.title || '-', start, end, e.creatorName || '-'];
            });
            break;

        case 'users-table':
            rows = allData.map(s => {
                const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
                const registered = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                return [fullName, s.employee_id || '-', fullName, s.email || '-', s.role_name || '-', (s.status || 'active').toUpperCase(), registered];
            });
            break;

        case 'colleges-table':
            rows = allData.map(c => {
                const created = c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                return [c.id, c.college_code || '-', c.college_name || '-', created];
            });
            break;

        case 'programs-table':
            rows = allData.map(p => {
                const created = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                return [p.id, p.program_code || '-', p.program_name || '-', p.college_name || '-', created];
            });
            break;

        case 'sections-table':
            rows = allData.map(s => {
                const created = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                return [s.id, s.section_name || '-', s.program_name || '-', s.year_level || '-', created];
            });
            break;
    }

    // Build CSV content
    let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    // Generate filename with date
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const year = now.getFullYear();
    const filename = `Library_${prefix}_${month}_${day}_${year}.csv`;

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

// Print table - fetches all data from API
async function printTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error('Table not found:', tableId);
        return;
    }

    // Get the title based on table ID
    const titleMap = {
        'dash-logs-table': 'Dashboard - Recent Activity',
        'students-table': 'Student Management',
        'staff-table': 'Staff Management',
        'events-table': 'Event Management',
        'logs-table': 'Attendance Logs',
        'users-table': 'User Management',
        'colleges-table': 'Colleges Management',
        'programs-table': 'Programs Management',
        'sections-table': 'Sections Management'
    };
    const title = titleMap[tableId] || 'Table';

    // Get current date
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Fetch all data from API
    const token = localStorage.getItem('auth_token');
    let allData = [];
    let headers = [];

    try {
        switch(tableId) {
            case 'dash-logs-table':
            case 'logs-table':
                const logsRes = await fetch(`/logs/attendance?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const logsData = await logsRes.json();
                allData = logsData.data || [];
                headers = ['Visitor', 'ID', 'Program', 'Role', 'Timestamp', 'Reason', 'Status'];
                break;

            case 'students-table':
                const studentsRes = await fetch(`/students?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const studentsData = await studentsRes.json();
                allData = studentsData.data || [];
                headers = ['Profile', 'Student No.', 'Name', 'Email', 'Department', 'Section', 'Status', 'Registered'];
                break;

            case 'staff-table':
                const staffRes = await fetch(`/staff?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const staffData = await staffRes.json();
                allData = staffData.data || [];
                headers = ['Profile', 'Employee No.', 'Name', 'Email', 'Role', 'Status', 'Registered'];
                break;

            case 'events-table':
                const eventsRes = await fetch(`/events?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const eventsData = await eventsRes.json();
                allData = eventsData.data || [];
                headers = ['Title', 'Starts', 'Ends', 'Creator'];
                break;

            case 'users-table':
                const usersRes = await fetch(`/staff?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const usersData = await usersRes.json();
                allData = usersData.data || [];
                headers = ['Profile', 'Employee No.', 'Name', 'Email', 'Role', 'Status', 'Registered'];
                break;

            case 'colleges-table':
                const collegesRes = await fetch(`/colleges?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const collegesData = await collegesRes.json();
                allData = collegesData.data || [];
                headers = ['ID', 'College Code', 'College Name', 'Created'];
                break;

            case 'programs-table':
                const programsRes = await fetch(`/programs?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const programsData = await programsRes.json();
                allData = programsData.data || [];
                headers = ['ID', 'Program Code', 'Program Name', 'College', 'Created'];
                break;

            case 'sections-table':
                const sectionsRes = await fetch(`/sections?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const sectionsData = await sectionsRes.json();
                allData = sectionsData.data || [];
                headers = ['ID', 'Section Name', 'Program', 'Year Level', 'Created'];
                break;
        }
    } catch (err) {
        console.error('Error fetching data for print:', err);
        alert('Failed to fetch data for print');
        return;
    }

    // Build table HTML
    let tableHtml = '<thead><tr>';
    headers.forEach(h => {
        tableHtml += `<th>${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    // Add rows based on data type
    switch(tableId) {
        case 'dash-logs-table':
        case 'logs-table':
            allData.forEach(log => {
                const logDate = new Date(log.time_in);
                const date = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const time = logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                const name = log.user_name || 'Unknown';
                const id = log.student_number || log.employee_id || '-';
                const program = log.program_name || log.college_name || '-';
                const role = log.user_type === 'student' ? 'STUDENT' : (log.user_type === 'staff' ? 'EMPLOYEE' : '-');
                const timestamp = `${date} ${time}`;
                const reason = log.reason || 'Library Entry';
                const status = (log.user_status || 'active').toUpperCase();
                
                // Generate avatar color
                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                const bgColor = colors[name.charCodeAt(0) % colors.length];
                const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                
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

        case 'students-table':
            allData.forEach(s => {
                const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
                const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                const bgColor = colors[fullName.charCodeAt(0) % colors.length];
                const registered = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                const statusClass = s.status === 'active' ? 'badge-active' : 'badge-inactive';
                
                tableHtml += `<tr>
                    <td><div class="profile-cell"><div class="table-avatar" style="background:${bgColor}">${initials}</div></div></td>
                    <td>${s.student_number || '-'}</td>
                    <td>${fullName}</td>
                    <td>${s.email || '-'}</td>
                    <td>${s.program_name || '-'}</td>
                    <td>${s.section_name || '-'}</td>
                    <td><span class="badge ${statusClass}">${(s.status || 'active').toUpperCase()}</span></td>
                    <td>${registered}</td>
                </tr>`;
            });
            break;

        case 'staff-table':
            allData.forEach(s => {
                const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
                const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                const bgColor = colors[fullName.charCodeAt(0) % colors.length];
                const registered = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                const statusClass = s.status === 'active' ? 'badge-active' : 'badge-inactive';
                
                tableHtml += `<tr>
                    <td><div class="profile-cell"><div class="table-avatar" style="background:${bgColor}">${initials}</div></div></td>
                    <td>${s.employee_id || '-'}</td>
                    <td>${fullName}</td>
                    <td>${s.email || '-'}</td>
                    <td>${s.role_name || '-'}</td>
                    <td><span class="badge ${statusClass}">${(s.status || 'active').toUpperCase()}</span></td>
                    <td>${registered}</td>
                </tr>`;
            });
            break;

        case 'events-table':
            allData.forEach(e => {
                const start = new Date(e.start_datetime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                const end = new Date(e.end_datetime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                
                tableHtml += `<tr>
                    <td>${e.title || '-'}</td>
                    <td>${start}</td>
                    <td>${end}</td>
                    <td>${e.creatorName || '-'}</td>
                </tr>`;
            });
            break;

        case 'users-table':
            allData.forEach(s => {
                const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
                const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                const bgColor = colors[fullName.charCodeAt(0) % colors.length];
                const registered = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                const statusClass = s.status === 'active' ? 'badge-active' : 'badge-inactive';
                
                tableHtml += `<tr>
                    <td><div class="profile-cell"><div class="table-avatar" style="background:${bgColor}">${initials}</div></div></td>
                    <td>${s.employee_id || '-'}</td>
                    <td>${fullName}</td>
                    <td>${s.email || '-'}</td>
                    <td>${s.role_name || '-'}</td>
                    <td><span class="badge ${statusClass}">${(s.status || 'active').toUpperCase()}</span></td>
                    <td>${registered}</td>
                </tr>`;
            });
            break;

        case 'colleges-table':
            allData.forEach(c => {
                const created = c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                
                tableHtml += `<tr>
                    <td>${c.id}</td>
                    <td>${c.college_code || '-'}</td>
                    <td>${c.college_name || '-'}</td>
                    <td>${created}</td>
                </tr>`;
            });
            break;

        case 'programs-table':
            allData.forEach(p => {
                const created = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                
                tableHtml += `<tr>
                    <td>${p.id}</td>
                    <td>${p.program_code || '-'}</td>
                    <td>${p.program_name || '-'}</td>
                    <td>${p.college_name || '-'}</td>
                    <td>${created}</td>
                </tr>`;
            });
            break;

        case 'sections-table':
            allData.forEach(s => {
                const created = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                
                tableHtml += `<tr>
                    <td>${s.id}</td>
                    <td>${s.section_name || '-'}</td>
                    <td>${s.program_name || '-'}</td>
                    <td>${s.year_level || '-'}</td>
                    <td>${created}</td>
                </tr>`;
            });
            break;
    }

    tableHtml += '</tbody>';

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
    const printWindow = window.open('', '_blank');
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
    const adminSection = document.getElementById('admin-section');
    if (!adminSection) return;
    
    // Check if user is admin (role_id === 4)
    if (currentUser && currentUser.role_id === 4) {
        adminSection.style.display = 'flex';
        adminSection.classList.add('visible');
    }
}

// Load Users Management
async function loadUsers() {
    try {
        const token = localStorage.getItem('auth_token');
        
        paginationState.users = paginationState.users || { offset: 0, limit: 10, loading: false, hasMore: true };
        paginationState.users.offset = 0;
        paginationState.users.hasMore = true;
        
        const res = await fetch('/staff?limit=10', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        const users = data.data || [];
        const total = data.total || 0;
        
        paginationState.users.hasMore = users.length >= paginationState.users.limit;
        paginationState.users.offset = users.length;
        
        // Update total count
        document.getElementById('users-count').textContent = `Total: ${total}`;
        
        renderUsersTable(users, true);
    } catch (err) {
        console.error('Failed to load users:', err);
    }
}

// Render users table with admin actions
function renderUsersTable(users, replace = true) {
    const tbody = document.querySelector('#users-table tbody');
    if (!tbody) return;
    
    if (replace) {
        tbody.innerHTML = '';
    }

    users.forEach(member => {
        const tr = document.createElement('tr');
        
        const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
        const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const bgColor = colors[fullName.charCodeAt(0) % colors.length];
        
        let registeredDate = '-';
        if (member.created_at) {
            const date = new Date(member.created_at);
            registeredDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        
        const statusClass = member.status === 'active' ? 'badge-active' : 'badge-inactive';
        const statusLabel = member.status === 'active' ? 'Active' : 'Inactive';
        
        tr.innerHTML = `
            <td class="profile-cell">
                <div class="table-avatar" style="background: ${bgColor}">${initials}</div>
            </td>
            <td>${member.employee_id || '-'}</td>
            <td>${fullName || '-'}</td>
            <td>${member.email || '-'}</td>
            <td>${member.role_name || '-'}</td>
            <td>
                <span class="badge ${statusClass}">
                    ${statusLabel}
                </span>
            </td>
            <td>${registeredDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editUser(${member.id})" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn ${member.status === 'active' ? 'block' : 'edit'}" onclick="toggleUserStatus(${member.id}, '${member.status}')" title="${member.status === 'active' ? 'Block' : 'Unblock'}">
                        <i class="fa-solid fa-${member.status === 'active' ? 'ban' : 'check'}"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteUser(${member.id})" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (replace && users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--portal-text-muted)">No users found</td></tr>';
    }
}

// Load Colleges for Admin Management
async function loadCollegesAdmin() {
    try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/colleges?limit=1000', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        const colleges = data.data || [];
        
        renderCollegesTable(colleges);
    } catch (err) {
        console.error('Failed to load colleges:', err);
    }
}

// Render colleges table
function renderCollegesTable(colleges) {
    const tbody = document.querySelector('#colleges-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    colleges.forEach(college => {
        const tr = document.createElement('tr');
        
        let createdDate = '-';
        if (college.created_at) {
            const date = new Date(college.created_at);
            createdDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        
        tr.innerHTML = `
            <td>${college.id}</td>
            <td>${college.college_code || '-'}</td>
            <td>${college.college_name || '-'}</td>
            <td>${createdDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editCollege(${college.id})" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteCollege(${college.id})" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (colleges.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--portal-text-muted)">No colleges found</td></tr>';
    }
}

// Load Programs
async function loadPrograms() {
    try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/programs?limit=1000', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        const programs = data.data || [];
        
        renderProgramsTable(programs);
    } catch (err) {
        console.error('Failed to load programs:', err);
    }
}

// Render programs table
function renderProgramsTable(programs) {
    const tbody = document.querySelector('#programs-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    programs.forEach(program => {
        const tr = document.createElement('tr');
        
        let createdDate = '-';
        if (program.created_at) {
            const date = new Date(program.created_at);
            createdDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        
        tr.innerHTML = `
            <td>${program.id}</td>
            <td>${program.program_code || '-'}</td>
            <td>${program.program_name || '-'}</td>
            <td>${program.college_name || '-'}</td>
            <td>${createdDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editProgram(${program.id})" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteProgram(${program.id})" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (programs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--portal-text-muted)">No programs found</td></tr>';
    }
}

// Load Sections
async function loadSections() {
    try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/sections?limit=1000', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        const sections = data.data || [];
        
        renderSectionsTable(sections);
    } catch (err) {
        console.error('Failed to load sections:', err);
    }
}

// Render sections table
function renderSectionsTable(sections) {
    const tbody = document.querySelector('#sections-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    sections.forEach(section => {
        const tr = document.createElement('tr');
        
        let createdDate = '-';
        if (section.created_at) {
            const date = new Date(section.created_at);
            createdDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        
        tr.innerHTML = `
            <td>${section.id}</td>
            <td>${section.section_name || '-'}</td>
            <td>${section.program_name || '-'}</td>
            <td>${section.year_level || '-'}</td>
            <td>${createdDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editSection(${section.id})" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteSection(${section.id})" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (sections.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--portal-text-muted)">No sections found</td></tr>';
    }
}

// Placeholder functions for admin actions
function showAddUserModal() {
    alert('Add User modal - Coming soon');
}

function editUser(id) {
    alert(`Edit user ${id} - Coming soon`);
}

function toggleUserStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (confirm(`Are you sure you want to ${newStatus === 'active' ? 'unblock' : 'block'} this user?`)) {
        alert(`Toggle user status ${id} to ${newStatus} - Coming soon`);
    }
}

function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        alert(`Delete user ${id} - Coming soon`);
    }
}

function showAddCollegeModal() {
    alert('Add College modal - Coming soon');
}

function editCollege(id) {
    alert(`Edit college ${id} - Coming soon`);
}

function deleteCollege(id) {
    if (confirm('Are you sure you want to delete this college?')) {
        alert(`Delete college ${id} - Coming soon`);
    }
}

function showAddProgramModal() {
    alert('Add Program modal - Coming soon');
}

function editProgram(id) {
    alert(`Edit program ${id} - Coming soon`);
}

function deleteProgram(id) {
    if (confirm('Are you sure you want to delete this program?')) {
        alert(`Delete program ${id} - Coming soon`);
    }
}

function showAddSectionModal() {
    alert('Add Section modal - Coming soon');
}

function editSection(id) {
    alert(`Edit section ${id} - Coming soon`);
}

function deleteSection(id) {
    if (confirm('Are you sure you want to delete this section?')) {
        alert(`Delete section ${id} - Coming soon`);
    }
}
