// =====================================================
// Instructor CRUD Operations
// =====================================================

AdminDashboard.prototype.loadInstructors = async function() {
    // Redirect to pagination version
    if (this.loadInstructorsWithPagination) {
        return this.loadInstructorsWithPagination();
    }
    
    // Fallback to non-paginated version if pagination not available
    console.log('👨‍🏫 Loading instructors...');
    const response = await API.instructor.getAll(1, 100);
    const tbody = document.getElementById('instructorsTableBody');

    if (response.success && response.data) {
        let instructors = response.data.data || response.data;
        
        if (!Array.isArray(instructors)) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Unexpected response format</td></tr>';
            return;
        }

        if (instructors.length === 0) {
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
    } else {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load instructors</td></tr>`;
    }
};

AdminDashboard.prototype.saveInstructor = async function() {
    const btn = document.getElementById('saveInstructorBtn');
    const btnText = document.getElementById('instructorBtnText');
    const btnSpinner = document.getElementById('instructorBtnSpinner');

    // Run validation before proceeding
    const formValidator = window.adminFormValidator;
    if (formValidator && !formValidator.validateInstructorForm()) {
        this.showToast('Validation Error', 'Please fix the validation errors before submitting', 'warning');
        return;
    }

    const email = document.getElementById('instructorEmail').value.trim();
    const firstName = document.getElementById('instructorFirstName').value.trim();
    const lastName = document.getElementById('instructorLastName').value.trim();
    const contactNumber = document.getElementById('instructorPhone').value.trim();
    const departmentId = document.getElementById('instructorDepartment').value;
    const password = document.getElementById('instructorPassword').value;

    const setLoading = (loading) => {
        if (btn) btn.disabled = loading;
        if (btnSpinner) btnSpinner.classList.toggle('d-none', !loading);
    };

    if (this.editingId && this.editingType === 'instructor') {
        // EDIT MODE: Admin can only change department
        if (!departmentId) {
            this.showToast('Validation', 'Please select a department', 'warning');
            return;
        }

        const updateData = { departmentId: parseInt(departmentId) };
        setLoading(true);
        
        try {
            const response = await API.instructor.update(this.editingId, updateData);

            if (response.success) {
                this.showToast('Success', '✅ Instructor department updated successfully!', 'success');
                this.addActivity(`Updated instructor department`, 'sage');
                bootstrap.Modal.getInstance(document.getElementById('instructorModal')).hide();
                this.resetEditState();
                await this.loadInstructors();
                await this.loadInstructorSelects();
                await this.loadDashboardData();
            } else {
                this.showDetailedError('Failed to update instructor', response.data);
            }
        } catch (error) {
            this.showToast('Error', '❌ Failed to update instructor: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    } else {
        // CREATE MODE: All fields required
        if (!email || !firstName || !lastName || !departmentId) {
            this.showToast('Validation', 'Please fill in all required fields', 'warning');
            return;
        }

        const fullName = `${firstName} ${lastName}`;
        if (fullName.length < 5 || fullName.length > 150) {
            this.showToast('Validation', '❌ Full name must be 5-150 characters', 'warning');
            return;
        }

        if (!this.validateEmailFormat(email)) {
            this.showToast('Validation', '❌ Email must be university format', 'warning');
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

        if (!password || !this.validatePassword(password)) {
            this.showToast('Validation', '❌ Password must meet requirements', 'warning');
            return;
        }

        const createData = {
            email, fullName, firstName, lastName, password,
            contactNumber: contactNumber || null,
            departmentId: parseInt(departmentId)
        };

        setLoading(true);
        try {
            const response = await API.instructor.create(createData);

            if (response.success) {
                this.showToast('Success', '✅ Instructor created successfully!', 'success');
                this.addActivity(`New instructor added: ${fullName}`, 'sage');
                bootstrap.Modal.getInstance(document.getElementById('instructorModal')).hide();
                this.resetEditState();
                await this.loadInstructorsWithPagination();
                await this.loadInstructorSelects();
                await this.loadDashboardData();
            } else {
                this.showDetailedError('Failed to create instructor', response.data);
            }
        } catch (error) {
            this.showToast('Error', '❌ Failed to create instructor: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }
};

AdminDashboard.prototype.editInstructor = async function(id) {
    const response = await API.instructor.getById(id);
    
    if (response.success && response.data) {
        const instructor = response.data;
        const nameParts = (instructor.fullName || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        document.getElementById('instructorEmail').value = instructor.email || '';
        document.getElementById('instructorFirstName').value = firstName;
        document.getElementById('instructorLastName').value = lastName;
        document.getElementById('instructorPhone').value = instructor.contactNumber || '';
        document.getElementById('instructorDepartment').value = instructor.departmentId || '';
        
        const passwordField = document.getElementById('instructorPasswordField');
        if (passwordField) {
            passwordField.style.display = 'none';
        }
        const passwordInput = document.getElementById('instructorPassword');
        if (passwordInput) {
            passwordInput.required = false;
        }
        
        const businessRules = document.getElementById('instructorBusinessRules');
        const editInfo = document.getElementById('instructorEditInfo');
        if (businessRules) businessRules.style.display = 'none';
        if (editInfo) {
            editInfo.classList.remove('d-none');
            editInfo.style.display = 'block';
        }
        
        // Make fields readonly except department
        ['instructorEmail', 'instructorFirstName', 'instructorLastName', 'instructorPhone'].forEach(id => {
            const field = document.getElementById(id);
            if (field) {
                field.readOnly = true;
                field.style.backgroundColor = '#e9ecef';
                field.style.cursor = 'not-allowed';
            }
        });
        
        const modalTitle = document.getElementById('instructorModalTitle');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="bi bi-pencil-square"></i> Edit Instructor - Change Department';
        }
        const btnText = document.getElementById('instructorBtnText');
        if (btnText) {
            btnText.textContent = 'Update Instructor';
        }
        
        this.editingId = id;
        this.editingType = 'instructor';
        
        const modalElement = document.getElementById('instructorModal');
        if (modalElement) {
            new bootstrap.Modal(modalElement).show();
        }
    } else {
        this.showToast('Error', 'Failed to load instructor data', 'error');
    }
};

AdminDashboard.prototype.deleteInstructor = async function(id) {
    try {
        const instructorResponse = await API.instructor.getById(id);
        if (!instructorResponse.success) {
            this.showToast('Error', 'Failed to load instructor details', 'error');
            return;
        }
        
        const checkResponse = await fetch(`${API.baseURL}/Instructor/${id}/courses-count`, {
            method: 'GET',
            headers: API.getHeaders()
        });
        
        if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            const courseCount = checkData.courseCount || 0;
            const isHead = checkData.isHead || false;
            
            if (courseCount > 0 || isHead) {
                let reasons = [];
                if (courseCount > 0) reasons.push(`${courseCount} active course(s)`);
                if (isHead) reasons.push('Department Head role');
                
                this.showToast('Archive Blocked', 
                    `❌ Cannot archive instructor with ${reasons.join(' and ')}. Please use the Reassign button first.`, 
                    'warning', 8000);
                return;
            }
        }
        
        this.proceedWithDirectArchive(id);
    } catch (error) {
        this.showToast('Error', 'Failed to process archive request', 'error');
    }
};

AdminDashboard.prototype.proceedWithDirectArchive = function(id) {
    this.deleteType = 'instructor';
    this.deleteId = id;
    this.deleteAction = 'archive';
    
    const modalTitle = document.getElementById('deleteModalTitle');
    const modalBody = document.getElementById('deleteModalBody');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    modalTitle.innerHTML = '<i class="bi bi-archive text-warning"></i> Archive Instructor';
    modalBody.innerHTML = `
        <div class="alert alert-warning border-warning" style="border-left: 5px solid #ffc107; background-color: #fff8e1;">
            <h6 class="text-warning mb-3"><i class="bi bi-info-circle-fill"></i> <strong>Archive Confirmation</strong></h6>
            <p class="mb-2">This will make the instructor <strong>INACTIVE</strong>:</p>
            <ul class="mb-2">
                <li>No longer able to log in</li>
                <li>Will not appear in active lists</li>
                <li>All teaching records will be kept</li>
            </ul>
            <p class="mb-0 text-success"><i class="bi bi-arrow-counterclockwise"></i> <strong>Can be restored</strong> from Archived Instructors page</p>
        </div>
    `;
    confirmBtn.textContent = '📦 Archive Instructor';
    confirmBtn.classList.remove('btn-danger');
    confirmBtn.classList.add('btn-warning', 'px-4');
    
    new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
};

AdminDashboard.prototype.resetInstructorForm = function() {
    document.getElementById('instructorForm').reset();
    document.getElementById('instructorModalTitle').textContent = 'Add Instructor';
    document.getElementById('saveInstructorBtn').textContent = 'Save';
    
    document.getElementById('instructorPasswordField').style.display = 'block';
    document.getElementById('instructorPassword').required = true;
    
    ['instructorEmail', 'instructorFirstName', 'instructorLastName', 'instructorPhone'].forEach(id => {
        const field = document.getElementById(id);
        field.readOnly = false;
        field.style.backgroundColor = '';
        field.style.cursor = '';
    });
    
    document.getElementById('instructorEmailNote').textContent = '';
    this.resetEditState();
};

AdminDashboard.prototype.resetInstructorFormEnhanced = function() {
    const form = document.getElementById('instructorForm');
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

    const progressBar = document.querySelector('#instructorPasswordStrength .progress-bar');
    const strengthText = document.getElementById('strengthText');
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.className = 'progress-bar';
    }
    if (strengthText) {
        strengthText.textContent = '-';
        strengthText.className = 'text-muted';
    }

    const businessRules = document.getElementById('instructorBusinessRules');
    const editInfo = document.getElementById('instructorEditInfo');
    if (businessRules) {
        businessRules.classList.remove('d-none');
        businessRules.style.display = 'block';
    }
    if (editInfo) {
        editInfo.classList.add('d-none');
        editInfo.style.display = 'none';
    }

    document.getElementById('instructorModalTitle').innerHTML = '<i class="bi bi-person-workspace"></i> Add Instructor';
    document.getElementById('instructorBtnText').textContent = 'Add Instructor';
    document.getElementById('instructorPasswordField').style.display = 'block';
    document.getElementById('instructorPassword').required = true;

    ['instructorEmail', 'instructorFirstName', 'instructorLastName', 'instructorPhone'].forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.readOnly = false;
            field.style.backgroundColor = '';
            field.style.cursor = '';
        }
    });

    document.getElementById('instructorEmailNote').textContent = 'Must be university email format';
    this.resetEditState();
};

// Reassignment functionality
AdminDashboard.prototype.showReassignmentModal = async function(instructorId, instructor = null, courseCount = null, isHead = null, isForArchive = false) {
    this.reassignFromInstructorId = instructorId;
    this.isReassignForArchive = isForArchive;
    
    if (!instructor) {
        const response = await API.instructor.getById(instructorId);
        if (!response.success) {
            this.showToast('Error', 'Failed to load instructor details', 'error');
            return;
        }
        instructor = response.data;
    }
    
    this.reassignFromInstructor = instructor;
    
    if (courseCount === null || isHead === null) {
        try {
            const checkResp = await fetch(`${API.baseURL}/Instructor/${instructorId}/courses-count`, {
                method: 'GET',
                headers: API.getHeaders()
            });
            if (checkResp.ok) {
                const checkData = await checkResp.json();
                courseCount = checkData.courseCount || 0;
                isHead = checkData.isHead || false;
            }
        } catch (error) {
            courseCount = 0;
            isHead = false;
        }
    }
    
    let reasons = [];
    if (courseCount > 0) reasons.push(`${courseCount} active course(s)`);
    if (isHead) reasons.push('Department Head role');
    
    const reasonText = reasons.length > 0 
        ? `This instructor has ${reasons.join(' and ')} that ${isForArchive ? 'must' : 'can'} be reassigned.`
        : 'This instructor has no active courses or head role to reassign.';
    
    document.getElementById('reassignmentReason').textContent = reasonText;
    
    const coursesCheck = document.getElementById('reassignCoursesCheck');
    const headCheck = document.getElementById('reassignHeadCheck');
    const coursesLabel = document.getElementById('coursesLabel');
    const headLabel = document.getElementById('headLabel');
    
    coursesLabel.textContent = `Courses (${courseCount})`;
    headLabel.textContent = `Department Head Role (${isHead ? 'Yes' : 'No'})`;
    
    coursesCheck.disabled = courseCount === 0;
    headCheck.disabled = !isHead;
    coursesCheck.checked = courseCount > 0;
    headCheck.checked = isHead;
    
    await this.loadReplacementInstructors(instructor.departmentId, instructorId);
    
    new bootstrap.Modal(document.getElementById('reassignInstructorModal')).show();
};

AdminDashboard.prototype.loadReplacementInstructors = async function(departmentId, excludeInstructorId) {
    const select = document.getElementById('replacementInstructor');
    select.innerHTML = '<option value="">Loading...</option>';
    
    try {
        const response = await API.instructor.getByDepartment(departmentId);
        
        if (response.success && response.data) {
            let instructors = response.data.data || response.data;
            instructors = instructors.filter(i => i.instructorId !== excludeInstructorId);
            
            if (instructors.length === 0) {
                select.innerHTML = '<option value="">No other instructors in this department</option>';
                this.showToast('Warning', 'No other instructors found in the same department', 'warning');
                return;
            }
            
            select.innerHTML = '<option value="">Select replacement instructor...</option>' + 
                instructors.map(inst => `<option value="${inst.instructorId}">${inst.fullName}</option>`).join('');
        } else {
            select.innerHTML = '<option value="">Failed to load instructors</option>';
        }
    } catch (error) {
        select.innerHTML = '<option value="">Error loading instructors</option>';
    }
};

AdminDashboard.prototype.executeReassignment = async function() {
    const toInstructorId = document.getElementById('replacementInstructor').value;
    const reassignCourses = document.getElementById('reassignCoursesCheck').checked;
    const reassignHead = document.getElementById('reassignHeadCheck').checked;
    
    if (!toInstructorId) {
        this.showToast('Validation', 'Please select a replacement instructor', 'warning');
        return;
    }
    
    if (!reassignCourses && !reassignHead) {
        this.showToast('Validation', 'Please select at least one item to reassign', 'warning');
        return;
    }
    
    const confirmBtn = document.getElementById('confirmReassignBtn');
    const spinner = document.getElementById('reassignSpinner');
    
    try {
        confirmBtn.disabled = true;
        if (spinner) spinner.classList.remove('d-none');
        
        let results = [];
        let allSuccess = true;
        
        if (reassignCourses) {
            try {
                const courseResponse = await fetch(`${API.baseURL}/Instructor/${this.reassignFromInstructorId}/reassign-courses-only/${toInstructorId}`, {
                    method: 'POST',
                    headers: API.getHeaders()
                });
                const courseResult = await courseResponse.json();
                
                if (courseResponse.ok) {
                    results.push(`✅ ${courseResult.message || courseResult.Message}`);
                } else {
                    results.push(`❌ Courses: ${courseResult.Message || courseResult.message}`);
                    allSuccess = false;
                }
            } catch (error) {
                results.push(`❌ Courses: ${error.message}`);
                allSuccess = false;
            }
        }
        
        if (reassignHead) {
            try {
                const headResponse = await fetch(`${API.baseURL}/Instructor/${this.reassignFromInstructorId}/transfer-head-role/${toInstructorId}`, {
                    method: 'POST',
                    headers: API.getHeaders()
                });
                const headResult = await headResponse.json();
                
                if (headResponse.ok) {
                    results.push(`✅ ${headResult.message || headResult.Message}`);
                } else {
                    results.push(`❌ Head Role: ${headResult.Message || headResult.message}`);
                    allSuccess = false;
                }
            } catch (error) {
                results.push(`❌ Head Role: ${error.message}`);
                allSuccess = false;
            }
        }
        
        const resultMessage = results.join('\\n');
        if (allSuccess) {
            this.showToast('✅ Reassignment Complete', resultMessage, 'success');
            bootstrap.Modal.getInstance(document.getElementById('reassignInstructorModal')).hide();
            await this.loadInstructorsWithPagination();
            await this.loadDashboardData();
        } else {
            this.showToast('Partial Success', resultMessage, 'warning');
        }
    } catch (error) {
        this.showToast('Error', '❌ Failed to execute reassignment', 'error');
    } finally {
        confirmBtn.disabled = false;
        if (spinner) spinner.classList.add('d-none');
    }
};