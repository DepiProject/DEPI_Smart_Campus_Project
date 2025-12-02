// =====================================================
// Admin Dashboard Core - Main Class & Initialization
// =====================================================

class AdminDashboard {
    constructor() {
        this.editingId = null;
        this.editingType = null;
        this.allEnrollments = [];
        this.charts = {};
        this.deleteId = null;
        this.deleteType = null;
        this.deleteAction = null;
        this.reassignFromInstructorId = null;
        this.reassignFromInstructor = null;
        this.isReassignForArchive = false;
        
        this.initializeEventListeners();
        this.setupValidation();
        this.loadDashboardData();
        this.loadUserName();
        this.initializeCharts();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Modal save buttons
        document.getElementById('saveInstructorBtn')?.addEventListener('click', () => this.saveInstructor());
        document.getElementById('saveStudentBtn')?.addEventListener('click', () => this.saveStudent());
        document.getElementById('saveDepartmentBtn')?.addEventListener('click', () => this.saveDepartment());
        document.getElementById('saveCourseBtn')?.addEventListener('click', () => this.saveCourse());

        // Enrollment search and filter
        const enrollmentSearchInput = document.getElementById('enrollmentSearchInput');
        const enrollmentSearchBtn = document.getElementById('enrollmentSearchBtn');
        const enrollmentStatusFilter = document.getElementById('enrollmentStatusFilter');

        enrollmentSearchInput?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.filterEnrollments();
        });
        enrollmentSearchBtn?.addEventListener('click', () => this.filterEnrollments());
        enrollmentStatusFilter?.addEventListener('change', () => this.filterEnrollments());

        // Profile form
        document.getElementById('profileForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        // Modal reset on close
        document.getElementById('instructorModal')?.addEventListener('hidden.bs.modal', () => this.resetInstructorFormEnhanced());
        document.getElementById('studentModal')?.addEventListener('hidden.bs.modal', () => this.resetStudentFormEnhanced());
        document.getElementById('departmentModal')?.addEventListener('hidden.bs.modal', () => this.resetDepartmentFormEnhanced());
        document.getElementById('courseModal')?.addEventListener('hidden.bs.modal', () => this.resetCourseFormEnhanced());
        
        // Course modal setup on show
        document.getElementById('courseModal')?.addEventListener('shown.bs.modal', () => {
            console.log('📋 Course modal opened - setting up form listeners');
            this.setupCourseFormListeners();
        });

        // Delete confirmation
        document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => this.executeDelete());
        
        // Reassignment
        document.getElementById('confirmReassignBtn')?.addEventListener('click', () => this.executeReassignment());
    }

    // Setup all validation handlers
    setupValidation() {
        this.setupInstructorValidation();
        this.setupStudentFormValidation();
        this.setupDepartmentValidation();
        this.setupCourseValidation();
    }

    // ===== LOAD DASHBOARD DATA =====
    async loadDashboardData() {
        console.log('📊 Loading dashboard data...');
        
        // Load students count
        const studentsResponse = await API.student.getAll(1, 100);
        if (studentsResponse.success && studentsResponse.data) {
            const students = studentsResponse.data.data || studentsResponse.data;
            const count = Array.isArray(students) ? students.length : 0;
            document.getElementById('totalStudents').textContent = count;
        }

        // Load instructors count
        const instructorsResponse = await API.instructor.getAll(1, 100);
        if (instructorsResponse.success && instructorsResponse.data) {
            const instructors = instructorsResponse.data.data || instructorsResponse.data;
            const count = Array.isArray(instructors) ? instructors.length : 0;
            document.getElementById('totalInstructors').textContent = count;
        }

        // Load departments count
        const departmentsResponse = await API.department.getAll(1, 100);
        if (departmentsResponse.success && departmentsResponse.data) {
            const departments = departmentsResponse.data.data || departmentsResponse.data;
            const count = Array.isArray(departments) ? departments.length : 0;
            document.getElementById('totalDepartments').textContent = count;
        }

        // Load courses count
        const coursesResponse = await API.course.getAll(1, 100);
        if (coursesResponse.success && coursesResponse.data) {
            const courses = coursesResponse.data.data || coursesResponse.data;
            const count = Array.isArray(courses) ? courses.length : 0;
            document.getElementById('totalCourses').textContent = count;
        }

        // Load enrollments count
        const enrollmentsResponse = await API.enrollment.getAll();
        if (enrollmentsResponse.success && enrollmentsResponse.data) {
            let enrollments = enrollmentsResponse.data.Data || enrollmentsResponse.data.data || enrollmentsResponse.data;
            let count = 0;
            if (Array.isArray(enrollments)) {
                count = enrollments.filter(e => (e.Status || e.status) === 'Enrolled').length;
            }
            const countElement = document.getElementById('totalEnrollments');
            if (countElement) countElement.textContent = count;
        }

        this.addActivity('Dashboard statistics loaded', 'sage');
    }

    // ===== LOAD USER NAME FOR NAVBAR =====
    async loadUserName() {
        try {
            const profileResponse = await API.admin.getMyProfile();
            if (profileResponse.success && profileResponse.data) {
                const profile = profileResponse.data.Data || profileResponse.data.data || profileResponse.data;
                const firstName = profile.firstName || profile.FirstName || '';
                const lastName = profile.lastName || profile.LastName || '';
                const fullName = `${firstName} ${lastName}`.trim() || 'Admin';
                
                const userNameElement = document.getElementById('userName');
                if (userNameElement) userNameElement.textContent = fullName;
            }
        } catch (error) {
            console.error('❌ Error loading user name:', error);
        }
    }

    // ===== HELPER METHODS =====
    resetEditState() {
        this.editingId = null;
        this.editingType = null;
    }

    showToast(title, message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        
        const icons = {
            'info': 'info-circle',
            'error': 'exclamation-triangle-fill',
            'danger': 'exclamation-triangle-fill',
            'success': 'check-circle-fill',
            'warning': 'exclamation-circle'
        };

        const alertClass = type === 'error' ? 'danger' : type;
        const icon = icons[type] || icons.info;
        
        const borderColors = {
            'danger': '#dc3545',
            'success': '#198754',
            'warning': '#ffc107',
            'info': '#0dcaf0'
        };

        const borderStyle = `border-left: 5px solid ${borderColors[alertClass] || borderColors.info};`;
        
        const toastHtml = `
            <div class="alert alert-${alertClass} alert-dismissible fade show shadow-sm" role="alert" 
                 style="${borderStyle} border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 1rem;">
                <div class="d-flex align-items-start">
                    <i class="bi bi-${icon} fs-4 me-3 mt-1"></i>
                    <div class="flex-grow-1">
                        <strong class="d-block mb-1" style="font-size: 1.1rem;">${title}</strong>
                        <div style="font-size: 0.95rem; line-height: 1.5;">${message}</div>
                    </div>
                    <button type="button" class="btn-close ms-3" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        alertContainer.innerHTML = toastHtml;

        const dismissTime = (type === 'error' || type === 'danger') ? 8000 : 5000;
        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) new bootstrap.Alert(alert).close();
        }, dismissTime);
    }

    showDetailedError(title, responseData) {
        console.error('❌ Error:', responseData);
        
        let errorMsg = 'Unknown error occurred';
        let details = '';

        if (typeof responseData === 'object') {
            // Extract the main error message - prioritize the message field
            errorMsg = responseData.message || responseData.Message || 
                      responseData.error || responseData.Error || 
                      responseData.title || errorMsg;
            
            // Clean up technical error messages to be user-friendly
            if (errorMsg.includes('InvalidOperationException')) {
                // Extract the actual message after the exception type
                const match = errorMsg.match(/InvalidOperationException:\s*(.+?)(?:\s+at\s+|$)/);
                if (match && match[1]) {
                    errorMsg = match[1].trim();
                }
            }
            
            // Handle validation errors
            if (responseData.errors) {
                const errors = responseData.errors;
                if (typeof errors === 'object' && !Array.isArray(errors)) {
                    const errorList = [];
                    for (const field in errors) {
                        if (Array.isArray(errors[field])) {
                            errorList.push(errors[field].join(', '));
                        } else {
                            errorList.push(errors[field]);
                        }
                    }
                    details = errorList.join('\n');
                } else if (Array.isArray(errors)) {
                    details = errors.join('\n');
                }
            }
        } else if (typeof responseData === 'string') {
            errorMsg = responseData;
            // Clean up technical error messages
            if (errorMsg.includes('InvalidOperationException')) {
                const match = errorMsg.match(/InvalidOperationException:\s*(.+?)(?:\s+at\s+|$)/);
                if (match && match[1]) {
                    errorMsg = match[1].trim();
                }
            }
        }

        // Show the cleaned error message
        this.showToast('Error', errorMsg, 'error');

        if (details) {
            console.error('📋 Validation Details:\n' + details);
            setTimeout(() => this.showDetailedToast('Validation Errors', details), 500);
        }
    }

    showDetailedToast(title, message) {
        const alertContainer = document.getElementById('alertContainer');
        const lines = message.split('\n').filter(l => l.trim());
        const itemsList = lines.map(line => `<li>${line}</li>`).join('');
        
        const toastHtml = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>${title}</strong>
                <ul class="mb-0 mt-2">${itemsList}</ul>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        alertContainer.innerHTML = toastHtml;

        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) new bootstrap.Alert(alert).close();
        }, 8000);
    }

    logActivity(action, details) {
        const timestamp = new Date().toLocaleString();
        console.log(`[${timestamp}] ${action}: ${details}`);
        
        try {
            const activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
            activities.unshift({ timestamp, action, details });
            if (activities.length > 50) activities.pop();
            localStorage.setItem('adminActivities', JSON.stringify(activities));
        } catch (e) {
            console.error('Failed to log activity:', e);
        }
    }

    addActivity(text, type = 'sage') {
        const activityFeed = document.getElementById('activityFeed');
        if (!activityFeed) return;
        
        const icons = {
            'sage': 'bi-check-circle-fill',
            'warm': 'bi-exclamation-triangle-fill',
            'beige': 'bi-info-circle-fill'
        };
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon ${type}">
                <i class="bi ${icons[type] || icons.sage}"></i>
            </div>
            <div class="activity-content">
                <p class="activity-text">${text}</p>
                <small class="activity-time">Just now</small>
            </div>
        `;
        
        activityFeed.insertBefore(activityItem, activityFeed.firstChild);
        
        while (activityFeed.children.length > 5) {
            activityFeed.removeChild(activityFeed.lastChild);
        }
    }

    async loadDepartmentSelects() {
        const response = await API.department.getAll(1, 100);
        const selectElements = [
            document.getElementById('courseDepartment'),
            document.getElementById('studentDepartment'),
            document.getElementById('instructorDepartment')
        ];

        if (response.success && response.data) {
            let departments = response.data.data || response.data;
            if (!Array.isArray(departments)) departments = [];

            const optionsHtml = departments.map(dept => 
                `<option value="${dept.id || dept.departmentId}">${dept.name}</option>`
            ).join('');

            selectElements.forEach(select => {
                if (select) {
                    const currentValue = select.value;
                    select.innerHTML = '<option value="">Select Department</option>' + optionsHtml;
                    if (currentValue) select.value = currentValue;
                }
            });
        }
    }

    async loadInstructorSelects() {
        const response = await API.instructor.getAll(1, 100);
        const selectElement = document.getElementById('departmentHead');

        if (response.success && response.data && selectElement) {
            let instructors = response.data.data || response.data;
            if (!Array.isArray(instructors)) instructors = [];

            // For new department: only show instructors without a department OR who are not heads
            const unassignedInstructors = instructors.filter(instr => 
                !instr.departmentId && !instr.DepartmentId
            );

            const currentValue = selectElement.value;
            
            if (unassignedInstructors.length === 0) {
                selectElement.innerHTML = '<option value="">No instructors assign yet</option>';
            } else {
                const optionsHtml = unassignedInstructors.map(instr => 
                    `<option value="${instr.instructorId || instr.id}">${instr.fullName}</option>`
                ).join('');
                selectElement.innerHTML = '<option value="">No instructors assign yet</option>' + optionsHtml;
                if (currentValue) selectElement.value = currentValue;
            }
        }
    }

    async loadDepartmentHeadInstructors(departmentId) {
        const selectElement = document.getElementById('departmentHead');
        if (!selectElement) return;

        try {
            const response = await API.instructor.getAll(1, 100);
            
            if (response.success && response.data) {
                let instructors = response.data.data || response.data;
                if (!Array.isArray(instructors)) instructors = [];

                // Filter instructors by department if departmentId is provided
                if (departmentId) {
                    instructors = instructors.filter(instr => 
                        (instr.departmentId || instr.DepartmentId) == departmentId
                    );
                }

                const currentValue = selectElement.value;
                
                if (instructors.length === 0) {
                    selectElement.innerHTML = '<option value="">No instructors in this department yet</option>';
                } else {
                    const optionsHtml = instructors.map(instr => 
                        `<option value="${instr.instructorId || instr.id}">${instr.fullName}</option>`
                    ).join('');
                    selectElement.innerHTML = '<option value="">No Head (Assign Later)</option>' + optionsHtml;
                    if (currentValue) selectElement.value = currentValue;
                }
            }
        } catch (error) {
            console.error('Failed to load instructors:', error);
            selectElement.innerHTML = '<option value="">Error loading instructors</option>';
        }
    }
}

// Initialize on page load
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    if (!token || API.isTokenExpired()) {
        window.location.href = '../index.html';
    } else {
        adminDashboard = new AdminDashboard();

        // Setup section navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                
                document.querySelectorAll('.section').forEach(s => s.classList.add('d-none'));
                const selectedSection = document.getElementById(section);
                if (selectedSection) {
                    selectedSection.classList.remove('d-none');
                    
                    // Load data for section with pagination
                    if (section === 'instructors') {
                        adminDashboard.loadInstructorSelects();
                        adminDashboard.loadInstructorsWithPagination();
                    }
                    if (section === 'students') adminDashboard.loadStudentsWithPagination();
                    if (section === 'departments') {
                        adminDashboard.loadInstructorSelects();
                        adminDashboard.loadDepartmentsWithPagination();
                    }
                    if (section === 'courses') {
                        adminDashboard.loadDepartmentSelects();
                        adminDashboard.loadCoursesWithPagination();
                    }
                    if (section === 'enrollments') adminDashboard.loadEnrollmentsWithPagination();
                    if (section === 'profile') adminDashboard.loadAdminProfile();
                }

                document.querySelectorAll('[data-section]').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        adminDashboard.loadDepartmentSelects();
        adminDashboard.loadInstructorSelects();
        adminDashboard.setupCourseFormListeners();
    }
});

// =====================================================
// Paginated Load Functions
// =====================================================

AdminDashboard.prototype.loadInstructorsWithPagination = async function() {
    console.log('👨‍🏫 Loading instructors with pagination...');
    const response = await API.instructor.getAll(1, 100);

    if (response.success && response.data) {
        let instructors = response.data.data || response.data;
        
        if (!Array.isArray(instructors)) {
            instructors = [];
        }

        // Populate department filter dropdown
        this.populateInstructorDepartmentFilter(instructors);

        // Set data in pagination manager
        if (adminPaginationManagers.instructors) {
            adminPaginationManagers.instructors.setData(instructors);
            adminPaginationManagers.instructors.renderControls('instructorsPaginationControls');
        }
    } else {
        const tbody = document.getElementById('instructorsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load instructors</td></tr>';
    }
};

AdminDashboard.prototype.populateInstructorDepartmentFilter = function(instructors) {
    const filterSelect = document.getElementById('instructorDepartmentFilter');
    if (!filterSelect) return;

    // Get unique department names
    const departments = [...new Set(instructors.map(i => i.departmentName).filter(d => d))];
    
    // Keep current selection
    const currentValue = filterSelect.value;
    
    // Rebuild options
    let optionsHtml = '<option value="">All Departments</option>';
    departments.sort().forEach(dept => {
        optionsHtml += `<option value="${dept}">${dept}</option>`;
    });
    
    filterSelect.innerHTML = optionsHtml;
    
    // Restore selection if it still exists
    if (currentValue && departments.includes(currentValue)) {
        filterSelect.value = currentValue;
    }
};

AdminDashboard.prototype.loadStudentsWithPagination = async function() {
    console.log('👨‍🎓 Loading students with pagination...');
    const response = await API.student.getAll(1, 100);

    if (response.success && response.data) {
        let students = response.data.data || response.data;
        
        if (!Array.isArray(students)) {
            students = [];
        }

        // Set data in pagination manager
        if (adminPaginationManagers.students) {
            adminPaginationManagers.students.setData(students);
            adminPaginationManagers.students.renderControls('studentsPaginationControls');
        }
    } else {
        const tbody = document.getElementById('studentsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load students</td></tr>';
    }
};

AdminDashboard.prototype.loadDepartmentsWithPagination = async function() {
    console.log('🏢 Loading departments with pagination...');
    const response = await API.department.getAll(1, 100);

    if (response.success && response.data) {
        let departments = response.data.data || response.data;
        
        if (!Array.isArray(departments)) {
            departments = [];
        }

        // Set data in pagination manager
        if (adminPaginationManagers.departments) {
            adminPaginationManagers.departments.setData(departments);
            adminPaginationManagers.departments.renderControls('departmentsPaginationControls');
        }
    } else {
        const tbody = document.getElementById('departmentsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Failed to load departments</td></tr>';
    }
};

AdminDashboard.prototype.loadCoursesWithPagination = async function() {
    console.log('📚 Loading courses with pagination...');
    const response = await API.course.getAll(1, 100);

    if (response.success && response.data) {
        let courses = response.data.data || response.data;
        
        if (!Array.isArray(courses)) {
            courses = [];
        }

        // Populate department filter dropdown
        this.populateCourseDepartmentFilter(courses);

        // Set data in pagination manager
        if (adminPaginationManagers.courses) {
            adminPaginationManagers.courses.setData(courses);
            adminPaginationManagers.courses.renderControls('coursesPaginationControls');
        }
    } else {
        const tbody = document.getElementById('coursesTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load courses</td></tr>';
    }
};

AdminDashboard.prototype.populateCourseDepartmentFilter = function(courses) {
    const filterSelect = document.getElementById('courseDepartmentFilter');
    if (!filterSelect) return;

    // Get unique department names
    const departments = [...new Set(courses.map(c => c.departmentName).filter(d => d))];
    
    // Keep current selection
    const currentValue = filterSelect.value;
    
    // Rebuild options
    let optionsHtml = '<option value="">All Departments</option>';
    departments.sort().forEach(dept => {
        optionsHtml += `<option value="${dept}">${dept}</option>`;
    });
    
    filterSelect.innerHTML = optionsHtml;
    
    // Restore selection if it still exists
    if (currentValue && departments.includes(currentValue)) {
        filterSelect.value = currentValue;
    }
};

AdminDashboard.prototype.loadEnrollmentsWithPagination = async function() {
    console.log('📝 Loading enrollments with pagination...');
    const response = await API.enrollment.getAll();

    if (response.success && response.data) {
        let enrollments = response.data.Data || response.data.data || response.data;
        
        if (!Array.isArray(enrollments)) {
            enrollments = [];
        }

        // Set data in pagination manager
        if (adminPaginationManagers.enrollments) {
            adminPaginationManagers.enrollments.setData(enrollments);
            adminPaginationManagers.enrollments.renderControls('enrollmentsPaginationControls');
        }
    } else {
        const tbody = document.getElementById('enrollmentsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Failed to load enrollments</td></tr>';
    }
};