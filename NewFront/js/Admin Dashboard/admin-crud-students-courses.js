// =====================================================
// Student & Course CRUD Operations
// =====================================================

// ===== STUDENT CRUD =====
AdminDashboard.prototype.loadStudents = async function() {
    const response = await API.student.getAll(1, 100);
    const tbody = document.getElementById('studentsTableBody');

    if (response.success && response.data) {
        let students = response.data.data || response.data;
        
        if (!Array.isArray(students)) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Unexpected response format</td></tr>';
            return;
        }

        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No students found</td></tr>';
            return;
        }

        tbody.innerHTML = students.map(student => `
            <tr>
                <td>${student.studentCode || 'N/A'}</td>
                <td>${student.fullName || 'N/A'}</td>
                <td><small>${student.email || student.Email || '-'}</small></td>
                <td><span class="badge bg-info">${student.level || 'N/A'}</span></td>
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
    } else {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load students</td></tr>`;
    }
};

AdminDashboard.prototype.saveStudent = async function() {
    const btn = document.getElementById('saveStudentBtn');
    const btnText = document.getElementById('studentBtnText');
    const originalText = btnText.textContent;

    this.clearStudentValidation();

    const email = document.getElementById('studentEmail').value.trim();
    const firstName = document.getElementById('studentFirstName').value.trim();
    const lastName = document.getElementById('studentLastName').value.trim();
    const contactNumber = document.getElementById('studentPhone').value.trim();
    const level = document.getElementById('studentLevel').value;
    const departmentId = document.getElementById('studentDepartment').value;
    const password = document.getElementById('studentPassword').value;

    if (this.editingId) {
        // ADMIN UPDATE: Only Level and Department
        if (!level || !departmentId) {
            this.showToast('Validation', 'Please select level and department', 'warning');
            return;
        }

        if (!/^[1-4]$/.test(level)) {
            this.showToast('Validation', 'Level must be 1, 2, 3, or 4', 'warning');
            return;
        }

        btn.disabled = true;
        btnText.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

        const updateData = { level, departmentId: parseInt(departmentId) };
        
        try {
            const response = await API.student.update(this.editingId, updateData);
            if (response.success) {
                this.showToast('Success', '✅ Student updated successfully!', 'success');
                this.logActivity('Student Updated', `Updated student ID: ${this.editingId}`);
                bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
                this.resetStudentFormEnhanced();
                this.loadStudents();
                this.loadDashboardData();
            } else {
                this.showDetailedError('Failed to update student', response.data);
            }
        } catch (error) {
            this.showToast('Error', '❌ Failed to update student', 'error');
        } finally {
            btn.disabled = false;
            btnText.textContent = originalText;
        }
    } else {
        // CREATE NEW STUDENT
        let hasError = false;

        if (!email || !this.validateEmailFormat(email)) {
            this.showStudentFieldError('studentEmail', 'Valid university email required');
            hasError = true;
        }

        if (!firstName || !this.validateNameFormat(firstName)) {
            this.showStudentFieldError('studentFirstName', 'Valid first name required');
            hasError = true;
        }

        if (!lastName || !this.validateNameFormat(lastName)) {
            this.showStudentFieldError('studentLastName', 'Valid last name required');
            hasError = true;
        }

        if (contactNumber) {
            const validation = this.validateContactNumber(contactNumber);
            if (!validation.valid) {
                this.showStudentFieldError('studentPhone', validation.message);
                hasError = true;
            }
        }

        if (!level || !/^[1-4]$/.test(level)) {
            this.showStudentFieldError('studentLevel', 'Level must be 1, 2, 3, or 4');
            hasError = true;
        }

        if (!departmentId) {
            this.showStudentFieldError('studentDepartment', 'Department required');
            hasError = true;
        }

        if (!password || !this.validatePassword(password)) {
            this.showStudentFieldError('studentPassword', 'Password must meet requirements');
            hasError = true;
        }

        if (hasError) return;

        btn.disabled = true;
        btnText.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

        const fullName = firstName + ' ' + lastName;
        const createData = {
            email, fullName, password, firstName, lastName,
            contactNumber, level, departmentId: parseInt(departmentId)
        };

        try {
            const response = await API.student.create(createData);
            if (response.success) {
                this.showToast('Success', '✅ Student created successfully!', 'success');
                this.logActivity('Student Created', `New student: ${fullName}`);
                bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
                this.resetStudentFormEnhanced();
                this.loadStudents();
                this.loadDashboardData();
            } else {
                this.showDetailedError('Failed to create student', response.data);
            }
        } catch (error) {
            this.showToast('Error', '❌ Failed to create student', 'error');
        } finally {
            btn.disabled = false;
            btnText.textContent = originalText;
        }
    }
};

AdminDashboard.prototype.editStudent = async function(id) {
    const response = await API.student.getById(id);
    
    if (response.success && response.data) {
        const student = response.data;
        const nameParts = (student.fullName || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        document.getElementById('studentEmail').value = student.email || '';
        document.getElementById('studentFirstName').value = firstName;
        document.getElementById('studentLastName').value = lastName;
        document.getElementById('studentPhone').value = student.contactNumber || '';
        document.getElementById('studentLevel').value = student.level || '';
        document.getElementById('studentDepartment').value = student.departmentId || '';
        
        document.getElementById('studentPasswordField').style.display = 'none';
        document.getElementById('studentPassword').required = false;
        
        ['studentEmail', 'studentFirstName', 'studentLastName', 'studentPhone'].forEach(id => {
            const field = document.getElementById(id);
            field.readOnly = true;
            field.style.backgroundColor = '#e9ecef';
            field.style.cursor = 'not-allowed';
        });
        
        const businessRules = document.getElementById('studentBusinessRules');
        const editInfo = document.getElementById('studentEditInfo');
        if (businessRules) businessRules.style.display = 'none';
        if (editInfo) {
            editInfo.classList.remove('d-none');
            editInfo.style.display = 'block';
        }
        
        document.getElementById('studentEmailNote').textContent = '⚠️ Admin can only update Level and Department';
        document.getElementById('studentModalTitle').textContent = 'Edit Student (Level & Department)';
        document.getElementById('studentBtnText').textContent = 'Update Student';
        
        this.editingId = id;
        this.editingType = 'student';
        
        new bootstrap.Modal(document.getElementById('studentModal')).show();
    } else {
        this.showToast('Error', 'Failed to load student data', 'error');
    }
};

AdminDashboard.prototype.deleteStudent = function(id) {
    this.deleteType = 'student';
    this.deleteId = id;
    this.deleteAction = 'archive';
    
    document.getElementById('deleteModalTitle').innerHTML = '<i class="bi bi-archive"></i> Archive Student';
    document.getElementById('deleteModalBody').innerHTML = `
        <p>This will make the student <strong>INACTIVE</strong>.</p>
        <ul>
            <li>Cannot log in</li>
            <li>Not in active lists</li>
            <li>All records preserved</li>
        </ul>
        <p class="text-success"><i class="bi bi-check-circle"></i> Can be restored from archived students page</p>
    `;
    document.getElementById('confirmDeleteBtn').textContent = 'Archive';
    document.getElementById('confirmDeleteBtn').className = 'btn btn-warning';
    
    new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
};

AdminDashboard.prototype.permanentDeleteStudent = function(id) {
    this.deleteType = 'student';
    this.deleteId = id;
    this.deleteAction = 'permanent';
    
    document.getElementById('deleteModalTitle').innerHTML = '<i class="bi bi-trash-fill text-danger"></i> Delete Student';
    document.getElementById('deleteModalBody').innerHTML = `
        <div class="alert alert-danger">
            <h6><i class="bi bi-exclamation-triangle-fill"></i> Permanently Delete Student</h6>
            <p><strong>⚠️ This ONLY works if NO enrollments exist</strong></p>
            <p class="text-danger fw-bold">This action CANNOT be undone!</p>
        </div>
    `;
    document.getElementById('confirmDeleteBtn').textContent = 'Delete Forever';
    document.getElementById('confirmDeleteBtn').className = 'btn btn-danger';
    
    new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
};

AdminDashboard.prototype.showStudentFieldError = function(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.add('is-invalid');
    const errorElement = document.getElementById(fieldId + 'Error') || field.parentElement.querySelector('.invalid-feedback');
    if (errorElement) errorElement.textContent = message;
};

AdminDashboard.prototype.clearStudentValidation = function() {
    const form = document.getElementById('studentForm');
    if (!form) return;

    form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
        el.classList.remove('is-invalid', 'is-valid');
    });
    form.classList.remove('was-validated');
};

AdminDashboard.prototype.resetStudentFormEnhanced = function() {
    const form = document.getElementById('studentForm');
    if (form) {
        form.reset();
        this.clearStudentValidation();
    }

    const progressBar = document.querySelector('#studentPasswordStrength .progress-bar');
    const strengthText = document.getElementById('studentStrengthText');
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.className = 'progress-bar';
    }
    if (strengthText) {
        strengthText.textContent = '-';
        strengthText.className = 'text-muted';
    }

    const businessRules = document.getElementById('studentBusinessRules');
    const editInfo = document.getElementById('studentEditInfo');
    if (businessRules) {
        businessRules.classList.remove('d-none');
        businessRules.style.display = 'block';
    }
    if (editInfo) {
        editInfo.classList.add('d-none');
        editInfo.style.display = 'none';
    }

    document.getElementById('studentModalTitle').innerHTML = '<i class="bi bi-people"></i> Add Student';
    document.getElementById('studentBtnText').textContent = 'Add Student';
    document.getElementById('studentPasswordField').style.display = 'block';
    document.getElementById('studentPassword').required = true;

    ['studentEmail', 'studentFirstName', 'studentLastName', 'studentPhone'].forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.readOnly = false;
            field.style.backgroundColor = '';
            field.style.cursor = '';
        }
    });

    document.getElementById('studentEmailNote').textContent = 'Must be university email format';
    this.resetEditState();
};

// ===== COURSE CRUD =====
AdminDashboard.prototype.loadCourses = async function() {
    const response = await API.course.getAll(1, 100);
    const tbody = document.getElementById('coursesTableBody');

    if (response.success && response.data && response.data.data) {
        const courses = response.data.data;
        
        if (courses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No courses found</td></tr>';
            return;
        }

        tbody.innerHTML = courses.map(course => `
            <tr>
                <td><strong>${course.courseCode || '-'}</strong></td>
                <td>${course.name}</td>
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
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load courses</td></tr>';
    }
};

AdminDashboard.prototype.saveCourse = async function() {
    const btn = document.getElementById('saveCourseBtn');
    const btnText = document.getElementById('courseBtnText');
    const originalText = btnText.textContent;

    btn.disabled = true;
    btnText.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

    const name = document.getElementById('courseName').value.trim();
    const departmentId = document.getElementById('courseDepartment').value;
    const instructorId = document.getElementById('courseInstructor').value;
    const credits = document.getElementById('courseCredits').value;

    if (!name || !departmentId || !instructorId || !credits) {
        this.showToast('Validation', 'All fields required', 'warning');
        btn.disabled = false;
        btnText.textContent = originalText;
        return;
    }

    if (name.length < 3 || name.length > 80 || !/[a-zA-Z]/.test(name) || !/^[a-zA-Z0-9\s\-]+$/.test(name)) {
        this.showToast('Validation', '❌ Invalid course name', 'warning');
        btn.disabled = false;
        btnText.textContent = originalText;
        return;
    }

    const creditsNum = parseInt(credits);
    if (creditsNum < 1 || creditsNum > 6) {
        this.showToast('Validation', '❌ Credits must be 1-6', 'warning');
        btn.disabled = false;
        btnText.textContent = originalText;
        return;
    }

    const courseData = { 
        name, 
        departmentId: parseInt(departmentId), 
        instructorId: parseInt(instructorId),
        creditHours: creditsNum
    };

    try {
        let response;
        if (this.editingId && this.editingType === 'course') {
            response = await API.course.update(this.editingId, courseData);
            if (response.success) {
                this.showToast('Success', '✅ Course updated successfully!', 'success');
                this.logActivity('Course Updated', `Course: ${name}`);
            }
        } else {
            response = await API.course.create(courseData);
            if (response.success) {
                this.showToast('Success', '✅ Course created successfully!', 'success');
                this.logActivity('Course Created', `New course: ${name}`);
            }
        }

        if (response.success) {
            bootstrap.Modal.getInstance(document.getElementById('courseModal')).hide();
            this.resetCourseFormEnhanced();
            this.loadCourses();
            this.loadDashboardData();
        } else {
            this.showDetailedError('Failed to save course', response.data);
        }
    } catch (error) {
        this.showToast('Error', '❌ Failed to save course', 'error');
    } finally {
        btn.disabled = false;
        btnText.textContent = originalText;
    }
};

AdminDashboard.prototype.editCourse = async function(id) {
    const response = await API.course.getById(id);
    let course = response.data?.data || response.data;
    
    if (response.success && course) {
        document.getElementById('courseForm').reset();
        document.getElementById('courseName').value = course.name || course.Name || '';
        document.getElementById('courseCredits').value = course.creditHours || course.CreditHours || '';
        
        const deptId = course.departmentId || course.DepartmentId || '';
        document.getElementById('courseDepartment').value = deptId;
        
        if (deptId) {
            await this.loadInstructorsByDepartment(deptId);
        }
        
        setTimeout(() => {
            const instId = course.instructorId || course.InstructorId || '';
            document.getElementById('courseInstructor').value = instId;
        }, 200);
        
        document.getElementById('courseModalTitle').textContent = 'Edit Course';
        document.getElementById('saveCourseBtn').textContent = 'Update';
        
        this.editingId = id;
        this.editingType = 'course';
        
        new bootstrap.Modal(document.getElementById('courseModal')).show();
    } else {
        this.showToast('Error', 'Failed to load course details', 'error');
    }
};

AdminDashboard.prototype.deleteCourse = function(id) {
    this.deleteType = 'course';
    this.deleteId = id;
    this.deleteAction = 'archive';
    
    document.getElementById('deleteModalTitle').innerHTML = '<i class="bi bi-archive"></i> Archive Course';
    document.getElementById('deleteModalBody').innerHTML = `
        <p>This will make the course <strong>INACTIVE</strong>.</p>
        <ul>
            <li>Students cannot enroll</li>
            <li>Not in active lists</li>
            <li>All records preserved</li>
        </ul>
        <p class="text-success"><i class="bi bi-check-circle"></i> Can be restored from archived courses page</p>
    `;
    document.getElementById('confirmDeleteBtn').textContent = 'Archive';
    document.getElementById('confirmDeleteBtn').className = 'btn btn-warning';
    
    new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
};

AdminDashboard.prototype.loadInstructorsByDepartment = async function(departmentId) {
    const select = document.getElementById('courseInstructor');
    if (!select) return;

    try {
        const response = await API.instructor.getAll(1, 100);
        
        if (response.success && response.data) {
            let instructors = response.data.data || response.data;
            const filtered = instructors.filter(instr => 
                (instr.departmentId || instr.DepartmentId) == departmentId
            );

            if (filtered.length === 0) {
                select.innerHTML = '<option value="">No instructors in this department</option>';
            } else {
                const optionsHtml = filtered.map(instr => 
                    `<option value="${instr.instructorId || instr.id}">${instr.fullName}</option>`
                ).join('');
                select.innerHTML = '<option value="">Select Instructor</option>' + optionsHtml;
            }
        }
    } catch (error) {
        select.innerHTML = '<option value="">Error loading instructors</option>';
    }
};

AdminDashboard.prototype.setupCourseFormListeners = function() {
    const departmentSelect = document.getElementById('courseDepartment');
    if (departmentSelect) {
        departmentSelect.addEventListener('change', (e) => {
            const deptId = e.target.value;
            if (deptId) {
                this.loadInstructorsByDepartment(deptId);
            } else {
                const instSelect = document.getElementById('courseInstructor');
                if (instSelect) {
                    instSelect.innerHTML = '<option value="">Select Department First</option>';
                }
            }
        });
    }
};

AdminDashboard.prototype.resetCourseFormEnhanced = function() {
    const form = document.getElementById('courseForm');
    if (form) {
        form.reset();
        form.classList.remove('was-validated');
        form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
            el.classList.remove('is-invalid', 'is-valid');
        });
    }

    document.getElementById('courseModalTitle').innerHTML = '<i class="bi bi-book"></i> Add Course';
    document.getElementById('courseBtnText').textContent = 'Add Course';
    document.getElementById('courseInstructor').innerHTML = '<option value="">Select Department First</option>';
    this.resetEditState();
};