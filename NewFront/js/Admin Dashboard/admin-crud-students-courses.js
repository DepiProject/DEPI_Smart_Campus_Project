// =====================================================
// Student & Course CRUD Operations
// =====================================================

// ===== STUDENT CRUD =====
AdminDashboard.prototype.loadStudents = async function() {
    // Redirect to pagination version
    if (this.loadStudentsWithPagination) {
        return this.loadStudentsWithPagination();
    }
    
    // Fallback to non-paginated version if pagination not available
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
    console.log('🚀 saveStudent called');
    const btn = document.getElementById('saveStudentBtn');
    const btnText = document.getElementById('studentBtnText');
    const originalText = btnText.textContent;

    console.log('📋 Form elements found:', {
        btn: !!btn,
        btnText: !!btnText,
        editingId: this.editingId
    });

    // Run validation before proceeding
    const formValidator = window.adminFormValidator;
    if (formValidator && !formValidator.validateStudentForm()) {
        console.log('❌ Form validation failed');
        this.showToast('Validation Error', 'Please fix the validation errors before submitting', 'warning');
        return;
    }
    
    console.log('✅ Form validation passed');

    // Ensure all required validation functions are available
    if (!this.validateEmailFormat || !this.validateNameFormat || !this.validateContactNumber || !this.validatePassword) {
        console.error('❌ Missing validation functions:', {
            validateEmailFormat: !!this.validateEmailFormat,
            validateNameFormat: !!this.validateNameFormat,
            validateContactNumber: !!this.validateContactNumber,
            validatePassword: !!this.validatePassword
        });
        this.showToast('Error', 'Validation system not properly loaded. Please refresh the page.', 'error');
        return;
    }

    this.clearStudentValidation();

    const email = document.getElementById('studentEmail')?.value?.trim() || '';
    const firstName = document.getElementById('studentFirstName')?.value?.trim() || '';
    const lastName = document.getElementById('studentLastName')?.value?.trim() || '';
    const contactNumber = document.getElementById('studentPhone')?.value?.trim() || '';
    const level = document.getElementById('studentLevel')?.value || '';
    const departmentId = document.getElementById('studentDepartment')?.value || '';
    const password = document.getElementById('studentPassword')?.value || '';

        console.log('📝 Form data collected:', {
        email,
        firstName,
        lastName,
        contactNumber,
        level,
        departmentId,
        password: password ? '[HIDDEN]' : 'empty'
    });

    // Check if departments are loaded
    const departmentSelect = document.getElementById('studentDepartment');
    const departmentOptions = departmentSelect ? departmentSelect.options.length : 0;
    console.log('🏢 Department options available:', departmentOptions);
    
    if (departmentOptions <= 1) { // Only default "Select Department" option
        this.showToast('Warning', 'No departments available. Please ensure departments are loaded.', 'warning');
        console.log('❌ No departments loaded, cannot create student');
        btn.disabled = false;
        btnText.textContent = originalText;
        return;
    }    if (this.editingId) {
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
            console.log('📥 Student update response:', response);
            
            if (response.success || response.status === 200) {
                this.showToast('Success', '✅ Student updated successfully!', 'success');
                if (this.logActivity) {
                    this.logActivity('Student Updated', `Updated student ID: ${this.editingId}`);
                }
                const modalElement = document.getElementById('studentModal');
                if (modalElement) {
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) modalInstance.hide();
                }
                this.resetStudentFormEnhanced();
                setTimeout(() => {
                    if (this.loadStudentsWithPagination) this.loadStudentsWithPagination();
                    if (this.loadDashboardData) this.loadDashboardData();
                }, 100);
            } else {
                console.error('❌ Student update failed:', response);
                let errorMsg = 'Failed to update student';
                if (response.data && response.data.message) {
                    errorMsg = response.data.message;
                } else if (response.error) {
                    errorMsg = response.error;
                }
                this.showToast('Error', `❌ ${errorMsg}`, 'error');
            }
        } catch (error) {
            console.error('❌ Update error:', error);
            this.showToast('Error', `❌ ${error.message || 'Failed to update student'}`, 'error');
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

        if (!departmentId || isNaN(parseInt(departmentId))) {
            console.log('❌ Department validation failed:', { departmentId, parsed: parseInt(departmentId) });
            this.showStudentFieldError('studentDepartment', 'Valid department required');
            hasError = true;
        } else {
            console.log('✅ Department validation passed:', { departmentId, parsed: parseInt(departmentId) });
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
            email: email.trim(),
            fullName: fullName.trim(),
            password: password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            contactNumber: contactNumber ? contactNumber.trim() : null,
            level: level.toString(),
            departmentId: parseInt(departmentId)
        };

        console.log('📝 Creating student with data:', createData);

        try {
            const response = await API.student.create(createData);
            console.log('📥 Student create response:', response);
            
            if (response.success || response.status === 201) {
                console.log('🎉 Student created successfully!');
                this.showToast('Success', '✅ Student created successfully!', 'success');
                
                // Log activity safely
                if (this.logActivity) {
                    this.logActivity('Student Created', `New student: ${fullName}`);
                }
                
                // Safely hide modal
                try {
                    const modalElement = document.getElementById('studentModal');
                    if (modalElement) {
                        const modalInstance = bootstrap.Modal.getInstance(modalElement);
                        if (modalInstance) {
                            modalInstance.hide();
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ Modal hide error (non-critical):', error.message);
                }
                
                // Reset form and reload data
                this.resetStudentFormEnhanced();
                
                // Reload data safely with a small delay to prevent race conditions
                setTimeout(() => {
                    if (this.loadStudentsWithPagination) {
                        this.loadStudentsWithPagination().catch(err => console.warn('⚠️ Load students error:', err));
                    }
                    if (this.loadDashboardData) {
                        this.loadDashboardData().catch(err => console.warn('⚠️ Load dashboard error:', err));
                    }
                }, 100);
            } else {
                console.error('❌ Student creation failed:', response);
                
                // Handle validation errors specifically
                if (response.status === 400 && response.data) {
                    if (typeof response.data === 'object' && response.data.message) {
                        this.showToast('Validation Error', response.data.message, 'error');
                    } else if (Array.isArray(response.data)) {
                        const errors = response.data.map(err => err.errorMessage || err.message || err).join(', ');
                        this.showToast('Validation Error', errors, 'error');
                    } else {
                        this.showDetailedError('Failed to create student', response.data);
                    }
                } else {
                    this.showDetailedError('Failed to create student', response.data);
                }
            }
        } catch (error) {
            console.error('❌ Student creation error:', error);
            this.showToast('Error', '❌ Failed to create student: ' + error.message, 'error');
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
        
        const passwordField = document.getElementById('studentPasswordField');
        if (passwordField) {
            passwordField.style.display = 'none';
        }
        const passwordInput = document.getElementById('studentPassword');
        if (passwordInput) {
            passwordInput.required = false;
        }
        
        ['studentEmail', 'studentFirstName', 'studentLastName', 'studentPhone'].forEach(id => {
            const field = document.getElementById(id);
            if (field) {
                field.readOnly = true;
                field.style.backgroundColor = '#e9ecef';
                field.style.cursor = 'not-allowed';
            }
        });
        
        const businessRules = document.getElementById('studentBusinessRules');
        const editInfo = document.getElementById('studentEditInfo');
        if (businessRules) businessRules.style.display = 'none';
        if (editInfo) {
            editInfo.classList.remove('d-none');
            editInfo.style.display = 'block';
        }
        
        const modalTitle = document.getElementById('studentModalTitle');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="bi bi-pencil-square"></i> Edit Student (Level & Department)';
        }
        const btnText = document.getElementById('studentBtnText');
        if (btnText) {
            btnText.textContent = 'Update Student';
        }
        
        this.editingId = id;
        this.editingType = 'student';
        
        const modalElement = document.getElementById('studentModal');
        if (modalElement) {
            new bootstrap.Modal(modalElement).show();
        }
    } else {
        this.showToast('Error', 'Failed to load student data', 'error');
    }
};

AdminDashboard.prototype.deleteStudent = function(id) {
    this.deleteType = 'student';
    this.deleteId = id;
    this.deleteAction = 'archive';
    
    document.getElementById('deleteModalTitle').innerHTML = '<i class="bi bi-archive text-warning"></i> Archive Student';
    document.getElementById('deleteModalBody').innerHTML = `
        <div class="alert alert-warning border-warning" style="border-left: 5px solid #ffc107; background-color: #fff8e1;">
            <h6 class="text-warning mb-3"><i class="bi bi-info-circle-fill"></i> <strong>Archive Confirmation</strong></h6>
            <p class="mb-2">This will make the student <strong>INACTIVE</strong>:</p>
            <ul class="mb-2">
                <li>Cannot log in to the system</li>
                <li>Will not appear in active lists</li>
                <li>All records will be preserved</li>
            </ul>
            <p class="mb-0 text-success"><i class="bi bi-arrow-counterclockwise"></i> <strong>Can be restored</strong> from archived students page</p>
        </div>
    `;
    document.getElementById('confirmDeleteBtn').textContent = '📦 Archive Student';
    document.getElementById('confirmDeleteBtn').className = 'btn btn-warning px-4';
    
    new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
};

AdminDashboard.prototype.permanentDeleteStudent = function(id) {
    this.deleteType = 'student';
    this.deleteId = id;
    this.deleteAction = 'permanent';
    
    document.getElementById('deleteModalTitle').innerHTML = '<i class="bi bi-trash-fill text-danger"></i> Permanent Delete';
    document.getElementById('deleteModalBody').innerHTML = `
        <div class="alert alert-danger border-danger" style="border-left: 5px solid #dc3545; background-color: #ffe6e6;">
            <h6 class="text-danger mb-3"><i class="bi bi-exclamation-triangle-fill"></i> <strong>Permanently Delete Student</strong></h6>
            <p class="mb-2"><strong>⚠️ This ONLY works if NO enrollments exist</strong></p>
            <p class="text-danger fw-bold mb-2">⛔ This action CANNOT be undone!</p>
            <p class="mb-0"><small>All student data will be lost permanently.</small></p>
        </div>
    `;
    document.getElementById('confirmDeleteBtn').textContent = '🗑️ Delete Forever';
    document.getElementById('confirmDeleteBtn').className = 'btn btn-danger px-4';
    
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
    console.log('🔄 Resetting student form...');
    
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

    // Safely update modal elements
    const modalTitle = document.getElementById('studentModalTitle');
    const btnText = document.getElementById('studentBtnText');
    const passwordField = document.getElementById('studentPasswordField');
    const passwordInput = document.getElementById('studentPassword');
    const emailNote = document.getElementById('studentEmailNote');

    if (modalTitle) {
        modalTitle.innerHTML = '<i class="bi bi-people"></i> Add Student';
    }
    if (btnText) {
        btnText.textContent = 'Add Student';
    }
    if (passwordField) {
        passwordField.style.display = 'block';
    }
    if (passwordInput) {
        passwordInput.required = true;
    }
    if (emailNote) {
        emailNote.textContent = 'Must be university email format';
    }

    // Safely reset field properties
    ['studentEmail', 'studentFirstName', 'studentLastName', 'studentPhone'].forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.readOnly = false;
            field.style.backgroundColor = '';
            field.style.cursor = '';
        }
    });

    if (this.resetEditState) {
        this.resetEditState();
    }
    
    console.log('✅ Student form reset completed');
};

// ===== COURSE CRUD =====
AdminDashboard.prototype.loadCourses = async function() {
    // Redirect to pagination version
    if (this.loadCoursesWithPagination) {
        return this.loadCoursesWithPagination();
    }
    
    // Fallback to non-paginated version if pagination not available
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
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.showDeleteChoice(${course.id})" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load courses</td></tr>';
    }
};

AdminDashboard.prototype.saveCourse = async function() {
    console.log('🚀 saveCourse called');
    
    const btn = document.getElementById('saveCourseBtn');
    let btnText = btn; // For edit mode, the button itself contains the text
    
    // Try to find the button text span if it exists
    const btnTextSpan = document.getElementById('courseBtnText');
    if (btnTextSpan) {
        btnText = btnTextSpan;
    }
    
    if (!btn) {
        console.error('❌ Course form save button not found');
        this.showToast('Error', 'Form elements not found. Please refresh the page.', 'error');
        return;
    }
    
    const originalText = btnText.textContent;

    // Run validation before proceeding
    const formValidator = window.adminFormValidator;
    if (formValidator && !formValidator.validateCourseForm()) {
        console.log('❌ Course form validation failed');
        this.showToast('Validation Error', 'Please fix the validation errors before submitting', 'warning');
        return;
    }
    
    console.log('✅ Course form validation passed');

    btn.disabled = true;
    btnText.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

    const nameField = document.getElementById('courseName');
    const deptField = document.getElementById('courseDepartment');
    const instField = document.getElementById('courseInstructor');
    const creditsField = document.getElementById('courseCredits');
    
    console.log('🔍 Department field state:', {
        exists: !!deptField,
        value: deptField?.value,
        display: deptField?.style.display,
        lockedValue: deptField?.getAttribute('data-locked-value'),
        innerHTML: deptField?.innerHTML.substring(0, 100)
    });

    const name = nameField?.value?.trim() || '';
    // Use locked value if field is hidden (edit mode), otherwise use current value
    const departmentId = deptField?.getAttribute('data-locked-value') || deptField?.value || '';
    const instructorId = instField?.value || '';
    const credits = creditsField?.value || '';
    
    console.log('📝 Course form data collected:', {
        name,
        departmentId,
        instructorId,
        credits,
        editingId: this.editingId,
        editingType: this.editingType
    });

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

    let courseData;
    
    if (this.editingId && this.editingType === 'course') {
        // Edit mode: allow instructor and credit hours changes
        if (!instructorId) {
            this.showToast('Validation', '❌ Instructor selection required', 'warning');
            btn.disabled = false;
            if (btnText.textContent !== undefined) {
                btnText.textContent = originalText;
            } else {
                btnText.innerHTML = originalText;
            }
            return;
        }
        
        if (creditsNum < 1 || creditsNum > 6) {
            this.showToast('Validation', '❌ Credits must be 1-6', 'warning');
            btn.disabled = false;
            if (btnText.textContent !== undefined) {
                btnText.textContent = originalText;
            } else {
                btnText.innerHTML = originalText;
            }
            return;
        }
        
        // Include all required fields (preserve name and department, allow instructor and credits changes)
        courseData = {
            name: name, // Preserve original name 
            departmentId: parseInt(departmentId), // Preserve original department
            instructorId: parseInt(instructorId), // Allow change
            creditHours: creditsNum // Allow change
        };
        
        console.log('📝 Edit mode - updating instructor and credits (preserving name/dept):', courseData);
    } else {
        // Create mode: validate all fields
        courseData = { 
            name, 
            departmentId: parseInt(departmentId), 
            instructorId: parseInt(instructorId),
            creditHours: creditsNum
        };
        
        console.log('📝 Create mode - full course data:', courseData);
    }

    try {
        let response;
        if (this.editingId && this.editingType === 'course') {
            console.log('📤 Updating course with ID:', this.editingId);
            response = await API.course.update(this.editingId, courseData);
            console.log('📥 Course update response:', response);
            
            if (response.success) {
                this.showToast('Success', '✅ Course updated successfully!', 'success');
                if (this.logActivity) {
                    this.logActivity('Course Updated', `Course: ${name}`);
                }
            }
        } else {
            console.log('📤 Creating new course');
            response = await API.course.create(courseData);
            console.log('📥 Course create response:', response);
            
            if (response.success) {
                this.showToast('Success', '✅ Course created successfully!', 'success');
                if (this.logActivity) {
                    this.logActivity('Course Created', `New course: ${name}`);
                }
            }
        }

        if (response.success) {
            // Safely hide modal
            try {
                const modalElement = document.getElementById('courseModal');
                if (modalElement) {
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                }
            } catch (error) {
                console.warn('⚠️ Modal hide error (non-critical):', error.message);
            }
            
            this.resetCourseFormEnhanced();
            
            // Reload data safely with delay
            setTimeout(() => {
                if (this.loadCoursesWithPagination) {
                    this.loadCoursesWithPagination().catch(err => console.warn('⚠️ Load courses error:', err));
                }
                if (this.loadDashboardData) {
                    this.loadDashboardData().catch(err => console.warn('⚠️ Load dashboard error:', err));
                }
            }, 100);
        } else {
            console.error('❌ Course save failed:', response);
            
            // Handle validation errors specifically
            if (response.status === 400 && response.data) {
                if (typeof response.data === 'object' && response.data.message) {
                    this.showToast('Validation Error', response.data.message, 'error');
                } else if (Array.isArray(response.data)) {
                    const errors = response.data.map(err => err.errorMessage || err.message || err).join(', ');
                    this.showToast('Validation Error', errors, 'error');
                } else {
                    this.showDetailedError('Failed to save course', response.data);
                }
            } else {
                this.showDetailedError('Failed to save course', response.data);
            }
        }
    } catch (error) {
        console.error('❌ Course save error:', error);
        this.showToast('Error', '❌ Failed to save course: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btnText.textContent = originalText;
    }
};

AdminDashboard.prototype.editCourse = async function(id) {
    console.log('✏️ Editing course with ID:', id);
    
    try {
        const response = await API.course.getById(id);
        console.log('📥 Course data response:', response);
        
        let course = response.data?.data || response.data;
        
        if (response.success && course) {
            console.log('📋 Course loaded successfully:', course);
            
            // Reset form first
            const form = document.getElementById('courseForm');
            if (form) {
                form.reset();
                console.log('✅ Form reset complete');
            }
            
            // Load departments to populate the dropdown
            if (this.loadDepartmentSelects) {
                console.log('🔄 Loading department selects...');
                await this.loadDepartmentSelects();
                console.log('✅ Department selects loaded');
            }
            
            // Get form fields
            const nameField = document.getElementById('courseName');
            const creditsField = document.getElementById('courseCredits');
            const deptField = document.getElementById('courseDepartment');
            const deptId = course.departmentId || course.DepartmentId || '';
            
            console.log('📝 Department ID from course:', deptId);
            console.log('📝 Department field element:', deptField);
            console.log('📝 Department field options:', deptField ? deptField.innerHTML : 'Field not found');
            
            // Set course name (read-only)
            if (nameField) {
                nameField.value = course.name || course.Name || '';
                nameField.readOnly = true;
                nameField.style.backgroundColor = '#e9ecef';
                nameField.style.cursor = 'not-allowed';
                console.log('✅ Course name set:', nameField.value);
            }
            
            // Set credit hours (editable)
            if (creditsField) {
                creditsField.value = course.creditHours || course.CreditHours || '';
                creditsField.readOnly = false;
                creditsField.style.backgroundColor = '';
                creditsField.style.cursor = '';
                console.log('✅ Credit hours set:', creditsField.value);
            }
            
            // Set department (locked but visible)
            if (deptField && deptId) {
                console.log('⏳ Setting department value in 100ms...');
                // Set value after a small delay to ensure options are loaded
                setTimeout(() => {
                    console.log('🔄 Attempting to set department value:', deptId);
                    console.log('📋 Available options before setting:', Array.from(deptField.options).map(o => `${o.value}: ${o.text}`));
                    
                    deptField.value = deptId;
                    
                    // Store department ID as data attribute for retrieval later
                    deptField.setAttribute('data-locked-value', deptId);
                    
                    console.log('📋 Department field value after setting:', deptField.value);
                    const selectedText = deptField.selectedOptions[0]?.text || 'None selected';
                    console.log('📋 Selected option text:', selectedText);
                    
                    // Hide the select and show the selected value as readonly text
                    deptField.style.display = 'none';
                    
                    // Create or update a readonly input to display the department name
                    let displayInput = document.getElementById('courseDepartmentDisplay');
                    if (!displayInput) {
                        displayInput = document.createElement('input');
                        displayInput.type = 'text';
                        displayInput.id = 'courseDepartmentDisplay';
                        displayInput.className = 'form-control';
                        deptField.parentNode.insertBefore(displayInput, deptField);
                    }
                    
                    displayInput.value = selectedText;
                    displayInput.readOnly = true;
                    displayInput.style.backgroundColor = '#e9ecef';
                    displayInput.style.cursor = 'not-allowed';
                    displayInput.style.display = 'block';
                    
                    // Remove any validation errors
                    deptField.classList.remove('is-invalid');
                    deptField.classList.add('is-valid');
                    const errorElement = document.getElementById(deptField.id + 'Error');
                    if (errorElement) {
                        errorElement.style.display = 'none';
                    }
                    
                    console.log('✅ Department field styled and locked');
                }, 100);
            } else {
                console.warn('⚠️ Department field or ID missing:', { deptField: !!deptField, deptId });
            }
            
            // Load instructors for the department
            if (deptId && this.loadInstructorsByDepartment) {
                console.log('🔄 Loading instructors for department:', deptId);
                await this.loadInstructorsByDepartment(deptId);
                
                // Set instructor AFTER instructors are loaded (no timeout needed - await ensures completion)
                const instField = document.getElementById('courseInstructor');
                if (instField) {
                    const instId = course.instructorId || course.InstructorId || '';
                    instField.value = instId;
                    instField.style.backgroundColor = '';
                    instField.style.cursor = '';
                    console.log('👨‍🏫 Set instructor ID:', instId);
                }
            }
            
            // Update modal title and button
            const modalTitle = document.getElementById('courseModalTitle');
            const saveBtn = document.getElementById('saveCourseBtn');
            
            if (modalTitle) modalTitle.textContent = 'Edit Course - Instructor & Credits';
            if (saveBtn) saveBtn.textContent = 'Update Course';
            
            // Set editing state
            this.editingId = id;
            this.editingType = 'course';
            
            console.log('📝 Edit state set:', { editingId: this.editingId, editingType: this.editingType });
            
            // Show modal
            const modalElement = document.getElementById('courseModal');
            if (modalElement) {
                new bootstrap.Modal(modalElement).show();
            }
        } else {
            console.error('❌ Failed to load course:', response);
            this.showToast('Error', 'Failed to load course details', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading course for edit:', error);
        this.showToast('Error', 'Error loading course: ' + error.message, 'error');
    }
};

AdminDashboard.prototype.deleteCourse = function(id) {
    this.deleteType = 'course';
    this.deleteId = id;
    this.deleteAction = 'archive';
    
    document.getElementById('deleteModalTitle').innerHTML = '<i class="bi bi-archive text-warning"></i> Archive Course';
    document.getElementById('deleteModalBody').innerHTML = `
        <div class="alert alert-warning border-warning" style="border-left: 5px solid #ffc107; background-color: #fff8e1;">
            <h6 class="text-warning mb-3"><i class="bi bi-info-circle-fill"></i> <strong>Archive Confirmation</strong></h6>
            <p class="mb-2">The course will be:</p>
            <ul class="mb-2">
                <li>Removed from active course lists</li>
                <li>Hidden from new enrollments</li>
                <li>Preserved with all data intact</li>
            </ul>
            <p class="mb-0 text-success"><i class="bi bi-arrow-counterclockwise"></i> <strong>Can be restored later</strong></p>
        </div>
    `;
    document.getElementById('confirmDeleteBtn').textContent = '📦 Archive Course';
    document.getElementById('confirmDeleteBtn').className = 'btn btn-warning px-4';
    
    new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
};

AdminDashboard.prototype.loadInstructorsByDepartment = async function(departmentId) {
    console.log(`📤 Loading instructors for department ID: ${departmentId}`);
    
    // Get select element
    const select = document.getElementById('courseInstructor');
    if (!select) {
        console.error('❌ Instructor select element not found');
        return;
    }
    
    // Show loading state
    select.disabled = true;
    select.innerHTML = '<option value="">Loading...</option>';
    
    try {
        const response = await API.instructor.getByDepartment(departmentId);
        console.log('📥 API Response:', response);
        
        if (response.success && response.data) {
            let instructors = response.data;
            
            // Handle wrapped response
            if (!Array.isArray(instructors)) {
                if (instructors.$values) instructors = instructors.$values;
                else if (instructors.data) instructors = instructors.data;
                else instructors = [];
            }
            
            console.log(`✅ Found ${instructors.length} instructors`);
            
            if (instructors.length === 0) {
                select.innerHTML = '<option value="">No instructors in this department</option>';
            } else {
                let html = '<option value="">Select Instructor</option>';
                instructors.forEach(inst => {
                    const id = inst.instructorId || inst.InstructorId;
                    const name = inst.fullName || inst.FullName || '';
                    if (id && name) {
                        html += `<option value="${id}">${name}</option>`;
                    }
                });
                select.innerHTML = html;
            }
        } else {
            select.innerHTML = '<option value="">Failed to load</option>';
        }
    } catch (error) {
        console.error('❌ Error:', error);
        select.innerHTML = '<option value="">Error loading</option>';
    } finally {
        select.disabled = false;
    }
};

AdminDashboard.prototype.setupCourseFormListeners = function() {
    console.log('🔧 Setting up course form listeners...');
    
    const departmentSelect = document.getElementById('courseDepartment');
    if (!departmentSelect) {
        console.warn('⚠️ Department select element not found');
        return;
    }
    
    // Remove ALL existing change listeners by cloning the element
    const newDeptSelect = departmentSelect.cloneNode(true);
    departmentSelect.parentNode.replaceChild(newDeptSelect, departmentSelect);
    
    // Add the change listener to the new element
    newDeptSelect.addEventListener('change', async (e) => {
        const deptId = e.target.value;
        console.log('📋 Department changed to:', deptId);
        
        if (deptId) {
            await this.loadInstructorsByDepartment(deptId);
        } else {
            const instSelect = document.getElementById('courseInstructor');
            if (instSelect) {
                instSelect.disabled = false;
                instSelect.innerHTML = '<option value="">Select Department First</option>';
            }
        }
    });
    
    console.log('✅ Course form listeners set up successfully');
};

AdminDashboard.prototype.resetCourseFormEnhanced = function() {
    console.log('🔄 Resetting course form...');
    
    const form = document.getElementById('courseForm');
    if (form) {
        form.reset();
        form.classList.remove('was-validated');
        form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
            el.classList.remove('is-invalid', 'is-valid', 'user-touched');
            // Clear error messages
            const errorElement = document.getElementById(el.id + 'Error');
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
        });
    }

    // Reset field styles and properties
    const nameField = document.getElementById('courseName');
    const creditsField = document.getElementById('courseCredits');
    const deptField = document.getElementById('courseDepartment');
    const instField = document.getElementById('courseInstructor');
    
    if (nameField) {
        nameField.readOnly = false;
        nameField.style.backgroundColor = '';
        nameField.style.cursor = '';
    }
    
    if (creditsField) {
        creditsField.readOnly = false;
        creditsField.style.backgroundColor = '';
        creditsField.style.cursor = '';
    }
    
    if (deptField) {
        deptField.disabled = false;
        deptField.style.backgroundColor = '';
        deptField.style.cursor = '';
        deptField.style.display = ''; // Show the select field
        
        // Hide/remove the display input if it exists
        const displayInput = document.getElementById('courseDepartmentDisplay');
        if (displayInput) {
            displayInput.style.display = 'none';
        }
    }
    
    if (instField) {
        instField.innerHTML = '<option value="">Select Department First</option>';
    }

    const modalTitle = document.getElementById('courseModalTitle');
    const saveBtn = document.getElementById('saveCourseBtn');
    
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="bi bi-book"></i> Add Course';
    }
    
    if (saveBtn) {
        saveBtn.textContent = 'Add Course';
    }
    
    this.resetEditState();
    
    console.log('✅ Course form reset completed');
};