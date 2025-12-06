// =====================================================
// Admin Dashboard Pagination Integration
// Applies pagination to all admin tables (10 records per page)
// =====================================================

// Initialize pagination managers for each table
const adminPaginationManagers = {
    instructors: null,
    students: null,
    departments: null,
    courses: null,
    enrollments: null
};

// Initialize pagination for instructors table
function initInstructorsPagination() {
    adminPaginationManagers.instructors = createPagination({
        itemsPerPage: 10,
        onPageChange: (currentPage, totalPages) => {
            console.log(`📄 Instructors page ${currentPage} of ${totalPages}`);
        },
        onDataChange: (pageData) => {
            renderInstructorsTable(pageData);
        }
    });
}

// Initialize pagination for students table
function initStudentsPagination() {
    adminPaginationManagers.students = createPagination({
        itemsPerPage: 10,
        onPageChange: (currentPage, totalPages) => {
            console.log(`📄 Students page ${currentPage} of ${totalPages}`);
        },
        onDataChange: (pageData) => {
            renderStudentsTable(pageData);
        }
    });
}

// Initialize pagination for departments table
function initDepartmentsPagination() {
    adminPaginationManagers.departments = createPagination({
        itemsPerPage: 10,
        onPageChange: (currentPage, totalPages) => {
            console.log(`📄 Departments page ${currentPage} of ${totalPages}`);
        },
        onDataChange: (pageData) => {
            renderDepartmentsTable(pageData);
        }
    });
}

// Initialize pagination for courses table
function initCoursesPagination() {
    adminPaginationManagers.courses = createPagination({
        itemsPerPage: 10,
        onPageChange: (currentPage, totalPages) => {
            console.log(`📄 Courses page ${currentPage} of ${totalPages}`);
        },
        onDataChange: (pageData) => {
            renderCoursesTable(pageData);
        }
    });
}

// Initialize pagination for enrollments table
function initEnrollmentsPagination() {
    adminPaginationManagers.enrollments = createPagination({
        itemsPerPage: 10,
        onPageChange: (currentPage, totalPages) => {
            console.log(`📄 Enrollments page ${currentPage} of ${totalPages}`);
        },
        onDataChange: (pageData) => {
            renderEnrollmentsTable(pageData);
        }
    });
}

// ===== RENDER FUNCTIONS FOR EACH TABLE =====

function renderInstructorsTable(instructors) {
    const tbody = document.getElementById('instructorsTableBody');
    if (!tbody) return;

    if (!instructors || instructors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No instructors found</td></tr>';
        return;
    }

    tbody.innerHTML = instructors.map(instructor => `
        <tr>
            <td>${instructor.fullName || 'N/A'}</td>
            <td><small>${instructor.email || '-'}</small></td>
            <td><small>${instructor.departmentName || 'Not Assigned'}</small></td>
            <td>${instructor.contactNumber || '-'}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="adminDashboard.editInstructor(${instructor.instructorId})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="adminDashboard.showReassignmentModal(${instructor.instructorId}, ${JSON.stringify(instructor).replace(/"/g, '&quot;')})" title="Reassign Courses & Head Role">
                    <i class="bi bi-arrow-right-circle"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="adminDashboard.deleteInstructor(${instructor.instructorId})" title="Archive">
                    <i class="bi bi-archive"></i> 
                </button>
            </td>
        </tr>
    `).join('');
}

function renderStudentsTable(students) {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    if (!students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No students found</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${student.studentCode || 'N/A'}</td>
            <td>${student.fullName || 'N/A'}</td>
            <td><small>${student.email || student.Email || '-'}</small></td>
            <td>${student.level || 'N/A'}</td>
            <td><small>${student.departmentName || student.DepartmentName || 'Not Assigned'}</small></td>
            <td>${student.contactNumber || '-'}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="adminDashboard.editStudent(${student.studentId})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="adminDashboard.deleteStudent(${student.studentId})" title="Archive">
                    <i class="bi bi-archive"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderDepartmentsTable(departments) {
    const tbody = document.getElementById('departmentsTableBody');
    if (!tbody) return;

    if (!departments || departments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No departments found</td></tr>';
        return;
    }

    tbody.innerHTML = departments.map(dept => `
        <tr>
            <td>${dept.name || 'N/A'}</td>
            <td>${dept.building || '-'}</td>
            <td><small>${dept.headFullName || dept.headName || 'No Head Assigned'}</small></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="adminDashboard.editDepartment(${dept.id})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="adminDashboard.deleteDepartment(${dept.id})" title="Archive">
                    <i class="bi bi-archive"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderCoursesTable(courses) {
    const tbody = document.getElementById('coursesTableBody');
    if (!tbody) return;

    if (!courses || courses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No courses found</td></tr>';
        return;
    }

    tbody.innerHTML = courses.map(course => `
        <tr>
            <td><strong>${course.courseCode || '-'}</strong></td>
            <td>${course.name || course.courseName || 'N/A'}</td>
            <td><small>${course.departmentName || 'Not Assigned'}</small></td>
            <td><small>${course.instructorName || '-'}</small></td>
            <td>${course.creditHours || '-'}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="adminDashboard.editCourse(${course.id})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="adminDashboard.deleteCourse(${course.id})" title="Archive">
                    <i class="bi bi-archive"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderEnrollmentsTable(enrollments) {
    const tbody = document.getElementById('enrollmentsTableBody');
    if (!tbody) return;

    if (!enrollments || enrollments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No enrollments found</td></tr>';
        return;
    }

    tbody.innerHTML = enrollments.map(enrollment => {
        const status = enrollment.status || enrollment.Status || 'Unknown';
        const statusBadgeClass = status === 'Enrolled' ? 'bg-success' : 
                                  status === 'Pending' ? 'bg-warning' : 
                                  status === 'Completed' ? 'bg-info' : 'bg-secondary';
        
        return `
            <tr>
                <td><small>${enrollment.studentName || enrollment.StudentName || 'N/A'}</small></td>
                <td><small>${enrollment.courseName || enrollment.CourseName || 'N/A'}</small></td>
                <td>${enrollment.courseCode || enrollment.CourseCode || 'N/A'}</td>
                <td><small>${enrollment.departmentName || enrollment.DepartmentName || 'N/A'}</small></td>
                <td>${enrollment.creditHours || enrollment.CreditHours || 0}</td>
                <td><span class="badge ${statusBadgeClass}">${status}</span></td>
                <td>${enrollment.grade || enrollment.Grade || '-'}</td>
                <td><small>${enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : '-'}</small></td>
                <td>
                    ${status === 'Pending' ? `
                        <button class="btn btn-sm btn-success" onclick="adminDashboard.approveEnrollment(${enrollment.enrollmentId || enrollment.EnrollmentId})" title="Approve">
                            <i class="bi bi-check-lg"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.rejectEnrollment(${enrollment.enrollmentId || enrollment.EnrollmentId})" title="Reject">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    ` : status === 'Enrolled' ? `
                        <button class="btn btn-sm btn-primary" onclick="adminDashboard.gradeEnrollment(${enrollment.enrollmentId || enrollment.EnrollmentId})" title="Grade">
                            <i class="bi bi-award"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// ===== SEARCH AND FILTER INTEGRATION =====

function setupInstructorsSearch() {
    const searchInput = document.getElementById('instructorSearchInput');
    const deptFilter = document.getElementById('instructorDepartmentFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const manager = adminPaginationManagers.instructors;
            if (!manager) return;
            
            const searchTerm = e.target.value.toLowerCase().trim();
            const deptValue = deptFilter ? deptFilter.value : '';
            
            manager.clearFilters();
            
            if (searchTerm || deptValue) {
                manager.addFilter('combined', (item) => {
                    const matchSearch = !searchTerm || 
                        (item.fullName || '').toLowerCase().includes(searchTerm) ||
                        (item.email || '').toLowerCase().includes(searchTerm) ||
                        (item.departmentName || '').toLowerCase().includes(searchTerm);
                    
                    const matchDept = !deptValue || 
                        (item.departmentName || '') === deptValue;
                    
                    return matchSearch && matchDept;
                });
            }
            
            manager.renderControls('instructorsPaginationControls');
        });
    }
    
    if (deptFilter) {
        deptFilter.addEventListener('change', () => {
            if (searchInput) searchInput.dispatchEvent(new Event('input'));
        });
    }
}

function setupStudentsSearch() {
    const searchInput = document.getElementById('studentSearchInput');
    const levelFilter = document.getElementById('studentLevelFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const manager = adminPaginationManagers.students;
            if (!manager) return;
            
            const searchTerm = e.target.value.toLowerCase().trim();
            const levelValue = levelFilter ? levelFilter.value : '';
            
            manager.clearFilters();
            
            if (searchTerm || levelValue) {
                manager.addFilter('combined', (item) => {
                    const matchSearch = !searchTerm || 
                        (item.studentCode || '').toLowerCase().includes(searchTerm) ||
                        (item.fullName || '').toLowerCase().includes(searchTerm) ||
                        (item.email || '').toLowerCase().includes(searchTerm) ||
                        (item.departmentName || '').toLowerCase().includes(searchTerm);
                    
                    const matchLevel = !levelValue || 
                        String(item.level) === levelValue;
                    
                    return matchSearch && matchLevel;
                });
            }
            
            manager.renderControls('studentsPaginationControls');
        });
    }
    
    if (levelFilter) {
        levelFilter.addEventListener('change', () => {
            if (searchInput) searchInput.dispatchEvent(new Event('input'));
        });
    }
}

function setupDepartmentsSearch() {
    const searchInput = document.getElementById('departmentSearchInput');
    const buildingFilter = document.getElementById('departmentBuildingFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const manager = adminPaginationManagers.departments;
            if (!manager) return;
            
            const searchTerm = e.target.value.toLowerCase().trim();
            const buildingValue = buildingFilter ? buildingFilter.value : '';
            
            manager.clearFilters();
            
            if (searchTerm || buildingValue) {
                manager.addFilter('combined', (item) => {
                    const matchSearch = !searchTerm || 
                        (item.name || '').toLowerCase().includes(searchTerm) ||
                        (item.building || '').toLowerCase().includes(searchTerm) ||
                        (item.headFullName || '').toLowerCase().includes(searchTerm) ||
                        (item.headName || '').toLowerCase().includes(searchTerm);
                    
                    const matchBuilding = !buildingValue || 
                        (item.building || '') === buildingValue;
                    
                    return matchSearch && matchBuilding;
                });
            }
            
            manager.renderControls('departmentsPaginationControls');
        });
    }
    
    if (buildingFilter) {
        buildingFilter.addEventListener('change', () => {
            if (searchInput) searchInput.dispatchEvent(new Event('input'));
        });
    }
}

function setupCoursesSearch() {
    const searchInput = document.getElementById('courseSearchInput');
    const deptFilter = document.getElementById('courseDepartmentFilter');
    const creditFilter = document.getElementById('courseCreditFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const manager = adminPaginationManagers.courses;
            if (!manager) return;
            
            const searchTerm = e.target.value.toLowerCase().trim();
            const deptValue = deptFilter ? deptFilter.value : '';
            const creditValue = creditFilter ? creditFilter.value : '';
            
            manager.clearFilters();
            
            if (searchTerm || deptValue || creditValue) {
                manager.addFilter('combined', (item) => {
                    const matchSearch = !searchTerm || 
                        (item.courseCode || '').toLowerCase().includes(searchTerm) ||
                        (item.name || item.courseName || '').toLowerCase().includes(searchTerm) ||
                        (item.instructorName || '').toLowerCase().includes(searchTerm) ||
                        (item.departmentName || '').toLowerCase().includes(searchTerm);
                    
                    const matchDept = !deptValue || 
                        (item.departmentName || '') === deptValue;
                    
                    const matchCredit = !creditValue || 
                        String(item.creditHours) === creditValue;
                    
                    return matchSearch && matchDept && matchCredit;
                });
            }
            
            manager.renderControls('coursesPaginationControls');
        });
    }
    
    if (deptFilter) {
        deptFilter.addEventListener('change', () => {
            if (searchInput) searchInput.dispatchEvent(new Event('input'));
        });
    }
    
    if (creditFilter) {
        creditFilter.addEventListener('change', () => {
            if (searchInput) searchInput.dispatchEvent(new Event('input'));
        });
    }
}

function setupEnrollmentsSearch() {
    const searchInput = document.getElementById('enrollmentSearchInput');
    const statusFilter = document.getElementById('enrollmentStatusFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const manager = adminPaginationManagers.enrollments;
            if (!manager) return;
            
            const searchTerm = e.target.value.toLowerCase().trim();
            const statusValue = statusFilter ? statusFilter.value : '';
            
            manager.clearFilters();
            
            if (searchTerm || statusValue) {
                manager.addFilter('combined', (item) => {
                    const matchSearch = !searchTerm || 
                        (item.studentName || item.StudentName || '').toLowerCase().includes(searchTerm) ||
                        (item.courseName || item.CourseName || '').toLowerCase().includes(searchTerm) ||
                        (item.courseCode || item.CourseCode || '').toLowerCase().includes(searchTerm);
                    
                    const matchStatus = !statusValue || 
                        (item.status || item.Status) === statusValue;
                    
                    return matchSearch && matchStatus;
                });
            }
            
            manager.renderControls('enrollmentsPaginationControls');
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            if (searchInput) searchInput.dispatchEvent(new Event('input'));
        });
    }
}

// Initialize all pagination on page load
document.addEventListener('DOMContentLoaded', () => {
    initInstructorsPagination();
    initStudentsPagination();
    initDepartmentsPagination();
    initCoursesPagination();
    initEnrollmentsPagination();
    
    setupInstructorsSearch();
    setupStudentsSearch();
    setupDepartmentsSearch();
    setupCoursesSearch();
    setupEnrollmentsSearch();
});
