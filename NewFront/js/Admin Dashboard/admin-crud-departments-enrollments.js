// =====================================================
// Department & Enrollment CRUD Operations + Delete Handler
// =====================================================

// ===== DEPARTMENT CRUD =====
AdminDashboard.prototype.loadDepartments = async function() {
    const response = await API.department.getAll(1, 100);
    const tbody = document.getElementById('departmentsTableBody');

    if (response.success && response.data) {
        let departments = response.data.data || response.data;

        if (!Array.isArray(departments)) departments = [];

        if (departments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No departments found</td></tr>';
            return;
        }

        tbody.innerHTML = departments.map(dept => `
            <tr>
                <td>${dept.name || 'N/A'}</td>
                <td>${dept.building || '-'}</td>
                <td><small>${dept.headFullName || dept.headName || '-'}</small></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="adminDashboard.editDepartment(${dept.id})" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="adminDashboard.deleteDepartment(${dept.id})" title="Archive">
                        <i class="bi bi-archive"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.permanentDeleteDepartment(${dept.id})" title="Delete Forever">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Failed to load departments</td></tr>';
    }
};

AdminDashboard.prototype.saveDepartment = async function() {
    const btn = document.getElementById('saveDepartmentBtn');
    const btnText = document.getElementById('departmentBtnText');
    const btnSpinner = document.getElementById('departmentBtnSpinner');

    if (!btn) return;

    const name = document.getElementById('departmentName').value.trim();
    const building = document.getElementById('departmentBuilding').value;
    const headId = document.getElementById('departmentHead').value;

    btn.disabled = true;
    if (btnText) btnText.textContent = 'Saving...';
    if (btnSpinner) btnSpinner.classList.remove('d-none');

    if (!name || !building) {
        this.showToast('Validation', 'Name and Building are required', 'warning');
        btn.disabled = false;
        if (btnText) btnText.textContent = this.editingId ? 'Update Department' : 'Save Department';
        if (btnSpinner) btnSpinner.classList.add('d-none');
        return;
    }

    if (name.length < 3 || name.length > 100) {
        this.showToast('Validation', '❌ Department name must be 3-100 characters', 'warning');
        btn.disabled = false;
        if (btnText) btnText.textContent = this.editingId ? 'Update Department' : 'Save Department';
        if (btnSpinner) btnSpinner.classList.add('d-none');
        return;
    }

    if (!/^[a-zA-Z\s\-']+$/.test(name)) {
        this.showToast('Validation', '❌ Name must contain only letters, spaces, hyphens, apostrophes', 'warning');
        btn.disabled = false;
        if (btnText) btnText.textContent = this.editingId ? 'Update Department' : 'Save Department';
        if (btnSpinner) btnSpinner.classList.add('d-none');
        return;
    }

    if (!building.startsWith('Building ')) {
        this.showToast('Validation', '❌ Please select a valid building', 'warning');
        btn.disabled = false;
        if (btnText) btnText.textContent = this.editingId ? 'Update Department' : 'Save Department';
        if (btnSpinner) btnSpinner.classList.add('d-none');
        return;
    }

    const departmentData = { 
        name,
        building,
        headId: headId ? parseInt(headId) : null
    };

    try {
        let response;
        if (this.editingId && this.editingType === 'department') {
            response = await API.department.update(this.editingId, departmentData);
            if (response.success) {
                this.showToast('Success', '✅ Department updated successfully!', 'success');
                this.logActivity('Department Updated', `Department: ${name}`);
            }
        } else {
            response = await API.department.create(departmentData);
            if (response.success) {
                this.showToast('Success', '✅ Department created successfully!', 'success');
                this.logActivity('Department Created', `New department: ${name}`);
            }
        }

        if (response.success) {
            bootstrap.Modal.getInstance(document.getElementById('departmentModal')).hide();
            this.resetDepartmentFormEnhanced();
            this.loadDepartments();
            this.loadDepartmentSelects();
            this.loadDashboardData();
        } else {
            this.showDetailedError('Failed to save department', response.data);
        }
    } catch (error) {
        this.showToast('Error', '❌ Failed to save department', 'error');
    } finally {
        btn.disabled = false;
        if (btnText) btnText.textContent = this.editingId ? 'Update Department' : 'Save Department';
        if (btnSpinner) btnSpinner.classList.add('d-none');
    }
};

AdminDashboard.prototype.editDepartment = async function(id) {
    const response = await API.department.getById(id);
    if (response.success && response.data) {
        const dept = response.data;
        document.getElementById('departmentName').value = dept.name || '';
        document.getElementById('departmentBuilding').value = dept.building || '';
        document.getElementById('departmentHead').value = dept.headId || '';
        
        document.getElementById('departmentModalTitle').textContent = 'Edit Department';
        document.getElementById('saveDepartmentBtn').textContent = 'Update';
        
        this.editingId = id;
        this.editingType = 'department';
        
        new bootstrap.Modal(document.getElementById('departmentModal')).show();
    } else {
        this.showToast('Error', 'Failed to load department', 'error');
    }
};

AdminDashboard.prototype.deleteDepartment = function(id) {
    this.deleteType = 'department';
    this.deleteId = id;
    this.deleteAction = 'archive';
    
    document.getElementById('deleteModalTitle').innerHTML = '<i class="bi bi-archive"></i> Archive Department';
    document.getElementById('deleteModalBody').innerHTML = `
        <p>This will make the department <strong>INACTIVE</strong>.</p>
        <ul>
            <li>Not appear in active lists</li>
            <li>Cannot accept new students/instructors</li>
            <li>All data preserved</li>
        </ul>
        <p class="text-success"><i class="bi bi-check-circle"></i> Can be restored</p>
    `;
    document.getElementById('confirmDeleteBtn').textContent = 'Archive';
    document.getElementById('confirmDeleteBtn').className = 'btn btn-warning';
    
    new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
};

AdminDashboard.prototype.permanentDeleteDepartment = function(id) {
    this.deleteType = 'department';
    this.deleteId = id;
    this.deleteAction = 'permanent';
    
    document.getElementById('deleteModalTitle').innerHTML = '<i class="bi bi-exclamation-triangle"></i> Permanent Delete';
    document.getElementById('deleteModalBody').innerHTML = `
        <div class="alert alert-danger">
            <h6><i class="bi bi-exclamation-circle"></i> This will PERMANENTLY delete the department.</h6>
            <p class="mb-0"><strong>ALL data will be LOST</strong></p>
        </div>
    `;
    document.getElementById('confirmDeleteBtn').textContent = 'Delete Forever';
    document.getElementById('confirmDeleteBtn').className = 'btn btn-danger';
    
    new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
};

AdminDashboard.prototype.resetDepartmentFormEnhanced = function() {
    const form = document.getElementById('departmentForm');
    if (form) {
        form.reset();
        form.classList.remove('was-validated');
        form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
            el.classList.remove('is-invalid', 'is-valid');
        });
    }

    document.getElementById('departmentModalTitle').innerHTML = '<i class="bi bi-building"></i> Add Department';
    document.getElementById('departmentBtnText').textContent = 'Save Department';
    this.resetEditState();
};

// ===== ENROLLMENT CRUD =====
AdminDashboard.prototype.loadEnrollments = async function() {
    console.log('📋 Loading enrollments...');
    this.allEnrollments = [];
    
    const response = await API.enrollment.getAll();
    const tbody = document.getElementById('enrollmentsTableBody');

    if (response.success && response.data) {
        let enrollments = response.data.Data || response.data.data || response.data;
        
        if (!Array.isArray(enrollments)) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Unexpected data format</td></tr>';
            return;
        }
        
        this.allEnrollments = enrollments;
        this.displayEnrollments(enrollments);
    } else {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Failed to load enrollments</td></tr>`;
    }
};

AdminDashboard.prototype.displayEnrollments = function(enrollments) {
    const tbody = document.getElementById('enrollmentsTableBody');
    
    if (enrollments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No enrollments found</td></tr>';
        return;
    }

    tbody.innerHTML = enrollments.map(enroll => {
        const studentName = enroll.StudentName || enroll.studentName || 'N/A';
        const courseName = enroll.CourseName || enroll.courseName || 'N/A';
        const courseCode = enroll.CourseCode || enroll.courseCode || '-';
        const deptName = enroll.DepartmentName || enroll.departmentName || '-';
        const credits = enroll.CreditHours || enroll.creditHours || '-';
        const status = enroll.Status || enroll.status || 'Enrolled';
        const finalGrade = enroll.FinalGrade || enroll.finalGrade;
        const gradeLetter = enroll.GradeLetter || enroll.gradeLetter;
        const enrollmentId = enroll.EnrollmentId || enroll.enrollmentId;
        const enrollDate = enroll.EnrollmentDate || enroll.enrollmentDate;
        
        const statusBadge = {
            'Enrolled': 'bg-success',
            'Pending': 'bg-warning',
            'Rejected': 'bg-danger',
            'Completed': 'bg-info'
        }[status] || 'bg-secondary';
        
        const gradeDisplay = finalGrade ? `${finalGrade.toFixed(1)}% (${gradeLetter || '-'})` : '-';
        const dateDisplay = enrollDate ? new Date(enrollDate).toLocaleDateString() : '-';
        
        let actionButtons = '';
        if (status === 'Pending') {
            actionButtons = `
                <button class="btn btn-sm btn-success me-1" onclick="adminDashboard.approveEnrollment(${enrollmentId})" title="Approve">
                    <i class="bi bi-check-circle"></i> Approve
                </button>
                <button class="btn btn-sm btn-warning" onclick="adminDashboard.rejectEnrollment(${enrollmentId})" title="Reject">
                    <i class="bi bi-x-circle"></i> Reject
                </button>
            `;
        } else {
            actionButtons = `
                <button class="btn btn-sm btn-danger" onclick="adminDashboard.hardDeleteEnrollment(${enrollmentId})" title="Delete">
                    <i class="bi bi-trash-fill"></i>
                </button>
            `;
        }
        
        return `
        <tr>
            <td><small>${studentName}</small></td>
            <td><small>${courseName}</small></td>
            <td><strong>${courseCode}</strong></td>
            <td><small>${deptName}</small></td>
            <td>${credits}</td>
            <td><span class="badge ${statusBadge}">${status}</span></td>
            <td><small>${gradeDisplay}</small></td>
            <td><small>${dateDisplay}</small></td>
            <td>${actionButtons}</td>
        </tr>
    `}).join('');
};

AdminDashboard.prototype.filterEnrollments = function() {
    const searchText = document.getElementById('enrollmentSearchInput').value.toLowerCase().trim();
    const statusFilter = document.getElementById('enrollmentStatusFilter').value;

    if (!this.allEnrollments || !Array.isArray(this.allEnrollments)) return;

    let filtered = this.allEnrollments;

    if (statusFilter) {
        filtered = filtered.filter(enroll => {
            const status = enroll.Status || enroll.status || '';
            return status === statusFilter;
        });
    }

    if (searchText) {
        filtered = filtered.filter(enroll => {
            const studentName = (enroll.StudentName || enroll.studentName || '').toLowerCase();
            const courseName = (enroll.CourseName || enroll.courseName || '').toLowerCase();
            const courseCode = (enroll.CourseCode || enroll.courseCode || '').toLowerCase();
            const deptName = (enroll.DepartmentName || enroll.departmentName || '').toLowerCase();
            
            return studentName.includes(searchText) || 
                   courseName.includes(searchText) || 
                   courseCode.includes(searchText) ||
                   deptName.includes(searchText);
        });
    }

    this.displayEnrollments(filtered);
};

AdminDashboard.prototype.approveEnrollment = async function(enrollmentId) {
    try {
        const response = await API.enrollment.approve(enrollmentId);
        
        if (response.success) {
            this.showToast('Success', 'Enrollment approved successfully!', 'success');
            await this.loadEnrollments();
            this.filterEnrollments();
            this.loadDashboardData();
        } else {
            let errorMsg = response.error || response.data?.Message || 'Failed to approve';
            this.showToast('Error', errorMsg, 'error');
        }
    } catch (error) {
        this.showToast('Error', '❌ Failed to approve enrollment', 'error');
    }
};

AdminDashboard.prototype.rejectEnrollment = async function(enrollmentId) {
    try {
        const response = await API.enrollment.reject(enrollmentId);
        
        if (response.success) {
            this.showToast('Success', 'Enrollment rejected successfully!', 'success');
            await this.loadEnrollments();
            this.filterEnrollments();
            this.loadDashboardData();
        } else {
            let errorMsg = response.error || response.data?.Message || 'Failed to reject';
            this.showToast('Error', errorMsg, 'error');
        }
    } catch (error) {
        this.showToast('Error', '❌ Failed to reject enrollment', 'error');
    }
};

AdminDashboard.prototype.hardDeleteEnrollment = function(enrollmentId) {
    this.deleteType = 'enrollment';
    this.deleteId = enrollmentId;
    this.deleteAction = 'permanent';
    
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    document.getElementById('deleteMessage').textContent = `⚠️ WARNING: This will PERMANENTLY delete enrollment ID ${enrollmentId}. Cannot be undone!`;
    
    window.deleteConfirmId = enrollmentId;
    window.deleteConfirmType = 'enrollment-hard';
    
    deleteModal.show();
};

// ===== UNIFIED DELETE HANDLER =====
AdminDashboard.prototype.executeDelete = async function() {
    const id = this.deleteId;
    const type = this.deleteType;
    const action = this.deleteAction;

    if (!id) return;

    try {
        let response;
        
        if (action === 'archive') {
            if (type === 'instructor') response = await API.instructor.archive(id);
            else if (type === 'student') response = await API.student.archive(id);
            else if (type === 'department') response = await API.department.delete(id);
            else if (type === 'course') response = await API.course.delete(id);
            else if (type === 'enrollment') response = await API.enrollment.softDelete(id);
        } else if (action === 'permanent') {
            if (type === 'instructor') response = await API.instructor.delete(id);
            else if (type === 'student') response = await API.student.delete(id);
            else if (type === 'department') response = await API.department.permanentDelete(id);
            else if (type === 'course') response = await API.course.permanentDelete(id);
            else if (type === 'enrollment') response = await API.enrollment.hardDelete(id);
        }
        
        // Close modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        if (deleteModal) deleteModal.hide();
        
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        
        if (response.success) {
            let successMessage = action === 'archive' 
                ? `✅ ${type} archived successfully!` 
                : `✅ ${type} permanently deleted!`;
            
            this.showToast('Success', successMessage, 'success');
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Reload appropriate section
            if (type === 'instructor') this.loadInstructors();
            else if (type === 'student') this.loadStudents();
            else if (type === 'department') this.loadDepartments();
            else if (type === 'course') this.loadCourses();
            else if (type === 'enrollment') this.loadEnrollments();
            
            this.loadDashboardData();
        } else {
            let errorMessage = 'Operation failed';
            if (response.data && typeof response.data === 'object') {
                errorMessage = response.data.Message || response.data.message || 
                              response.data.Error || response.error || errorMessage;
            }
            
            this.showToast('Operation Failed', errorMessage, 'error');
        }
    } catch (error) {
        this.showToast('Error', error.message, 'error');
    } finally {
        this.deleteId = null;
        this.deleteType = null;
        this.deleteAction = null;
    }
};

// ===== ADMIN PROFILE =====
AdminDashboard.prototype.loadAdminProfile = async function() {
    try {
        const profileResponse = await API.admin.getMyProfile();
        
        if (profileResponse.success && profileResponse.data) {
            const profile = profileResponse.data.Data || profileResponse.data.data || profileResponse.data;

            const safeSetText = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };

            const safeSetValue = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.value = value;
            };

            safeSetText('displayFirstName', profile.firstName || profile.FirstName || '-');
            safeSetText('displayLastName', profile.lastName || profile.LastName || '-');
            safeSetText('displayEmail', profile.email || profile.Email || '-');
            safeSetText('displayContactNumber', profile.contactNumber || profile.ContactNumber || '-');
            
            const createdDate = profile.createdDate || profile.CreatedDate;
            safeSetText('displayCreatedDate', createdDate ? new Date(createdDate).toLocaleDateString() : '-');

            const firstName = profile.firstName || profile.FirstName || '';
            const lastName = profile.lastName || profile.LastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Administrator';
            safeSetText('summaryName', fullName);
            safeSetText('summaryEmail', profile.email || profile.Email || '-');

            safeSetValue('profileFirstName', firstName);
            safeSetValue('profileLastName', lastName);
            safeSetValue('profileEmail', profile.email || profile.Email || '');
            safeSetValue('profileContactNumber', profile.contactNumber || profile.ContactNumber || '');

            safeSetText('userName', fullName || 'Admin');

            this.showDisplayProfileView();
        } else {
            this.showToast('Error', 'Failed to load profile', 'error');
        }
    } catch (error) {
        this.showToast('Error', 'An error occurred while loading profile', 'error');
    }
};

AdminDashboard.prototype.showDisplayProfileView = function() {
    document.getElementById('profileDisplayView').classList.remove('d-none');
    document.getElementById('profileEditView').classList.add('d-none');
};

AdminDashboard.prototype.showEditProfileForm = function() {
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    
    document.getElementById('profileDisplayView').classList.add('d-none');
    document.getElementById('profileEditView').classList.remove('d-none');
};

AdminDashboard.prototype.saveProfile = async function() {
    const firstName = document.getElementById('profileFirstName').value.trim();
    const lastName = document.getElementById('profileLastName').value.trim();
    const contactNumber = document.getElementById('profileContactNumber').value.trim();
    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();

    if (!firstName || !lastName || !currentPassword) {
        this.showToast('Validation', 'First Name, Last Name, and Current Password are required', 'warning');
        return;
    }

    if (!this.validateNameFormat(firstName) || !this.validateNameFormat(lastName)) {
        this.showToast('Validation', '❌ Names must contain only letters, spaces, hyphens, apostrophes', 'warning');
        return;
    }

    if (contactNumber) {
        const validation = this.validateContactNumber(contactNumber);
        if (!validation.valid) {
            this.showToast('Validation', '❌ ' + validation.message, 'warning');
            return;
        }
    }

    if (newPassword && !this.validatePassword(newPassword)) {
        this.showToast('Validation', '❌ Password must meet requirements', 'warning');
        return;
    }

    try {
        const profileData = {
            firstName,
            lastName,
            currentPassword
        };

        if (contactNumber) profileData.contactNumber = contactNumber;
        if (newPassword) profileData.newPassword = newPassword;
        
        const response = await API.admin.updateMyProfile(profileData);

        if (response.success) {
            const responseData = response.data?.Data || response.data?.data || response.data;
            if (responseData && responseData.token) {
                localStorage.setItem('authToken', responseData.token);
                const userInfo = API.decodeToken(responseData.token);
                if (userInfo) localStorage.setItem('userInfo', JSON.stringify(userInfo));
            }

            this.showToast('Success', 'Profile updated successfully!', 'success');
            await this.loadAdminProfile();
            this.showDisplayProfileView();
        } else {
            let errorMsg = 'Unknown error';
            if (response.data) {
                errorMsg = response.data.Message || response.data.message || 
                          response.data.Error || response.data.error || errorMsg;
                
                if (response.data.Errors && Array.isArray(response.data.Errors)) {
                    errorMsg = response.data.Errors.join(', ');
                }
            }
            
            this.showToast('Error', `Failed to update profile: ${errorMsg}`, 'error');
        }
    } catch (error) {
        this.showToast('Error', `❌ Failed to save profile: ${error.message}`, 'error');
    }
};