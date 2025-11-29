// =====================================================
// Admin Dashboard CRUD Handler
// =====================================================

class AdminDashboard {
    constructor() {
        this.editingId = null;
        this.editingType = null;
        this.allEnrollments = []; // Store all enrollments for filtering
        this.charts = {}; // Store chart instances
        this.initializeEventListeners();
        this.setupInstructorValidation(); // Setup real-time validation
        this.loadDashboardData();
        this.loadUserName(); // Load user name for navbar
        this.initializeCharts(); // Initialize dashboard charts
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Instructor modal buttons
        document.getElementById('saveInstructorBtn').addEventListener('click', () => this.saveInstructor());
        
        // Student modal buttons
        document.getElementById('saveStudentBtn').addEventListener('click', () => this.saveStudent());
        
        // Department modal buttons
        document.getElementById('saveDepartmentBtn').addEventListener('click', () => this.saveDepartment());
        
        // Course modal buttons
        document.getElementById('saveCourseBtn').addEventListener('click', () => this.saveCourse());

        // Enrollment search and filter listeners
        const enrollmentSearchInput = document.getElementById('enrollmentSearchInput');
        const enrollmentSearchBtn = document.getElementById('enrollmentSearchBtn');
        const enrollmentStatusFilter = document.getElementById('enrollmentStatusFilter');

        if (enrollmentSearchInput) {
            enrollmentSearchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') this.filterEnrollments();
            });
        }

        if (enrollmentSearchBtn) {
            enrollmentSearchBtn.addEventListener('click', () => this.filterEnrollments());
        }

        if (enrollmentStatusFilter) {
            enrollmentStatusFilter.addEventListener('change', () => this.filterEnrollments());
        }

        // Profile form submit listener
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        // Modal reset on close
        document.getElementById('instructorModal').addEventListener('hidden.bs.modal', () => this.resetInstructorFormEnhanced());
        document.getElementById('studentModal').addEventListener('hidden.bs.modal', () => this.resetStudentFormEnhanced());
        document.getElementById('departmentModal').addEventListener('hidden.bs.modal', () => this.resetDepartmentFormEnhanced());
        document.getElementById('courseModal').addEventListener('hidden.bs.modal', () => this.resetCourseFormEnhanced());

        // Delete confirmation modal - single handler for both buttons
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.executeDelete());
    }

    // ===== LOAD DASHBOARD DATA =====
    async loadDashboardData() {
        console.log('📊 Loading dashboard data...');
        
        // Load students count
        const studentsResponse = await API.student.getAll(1, 100);
        if (studentsResponse.success && studentsResponse.data) {
            let count = 0;
            if (studentsResponse.data.data && Array.isArray(studentsResponse.data.data)) {
                count = studentsResponse.data.data.length;
            } else if (Array.isArray(studentsResponse.data)) {
                count = studentsResponse.data.length;
            }
            document.getElementById('totalStudents').textContent = count;
        }

        // Load instructors count
        const instructorsResponse = await API.instructor.getAll(1, 100);
        if (instructorsResponse.success && instructorsResponse.data) {
            let count = 0;
            if (instructorsResponse.data.data && Array.isArray(instructorsResponse.data.data)) {
                count = instructorsResponse.data.data.length;
            } else if (Array.isArray(instructorsResponse.data)) {
                count = instructorsResponse.data.length;
            }
            document.getElementById('totalInstructors').textContent = count;
        }

        // Load departments count
        const departmentsResponse = await API.department.getAll(1, 100);
        if (departmentsResponse.success && departmentsResponse.data) {
            let count = 0;
            if (departmentsResponse.data.data && Array.isArray(departmentsResponse.data.data)) {
                count = departmentsResponse.data.data.length;
            } else if (Array.isArray(departmentsResponse.data)) {
                count = departmentsResponse.data.length;
            }
            document.getElementById('totalDepartments').textContent = count;
        }

        // Load courses count
        const coursesResponse = await API.course.getAll(1, 100);
        if (coursesResponse.success && coursesResponse.data) {
            let count = 0;
            if (coursesResponse.data.data && Array.isArray(coursesResponse.data.data)) {
                count = coursesResponse.data.data.length;
            } else if (Array.isArray(coursesResponse.data)) {
                count = coursesResponse.data.length;
            }
            document.getElementById('totalCourses').textContent = count;
        }

        // Load enrollments count - FORCE FRESH DATA
        const enrollmentsResponse = await API.enrollment.getAll();
        console.log('📊 Dashboard enrollment count response:', enrollmentsResponse);
        if (enrollmentsResponse.success && enrollmentsResponse.data) {
            let enrollments = enrollmentsResponse.data.Data || enrollmentsResponse.data.data || enrollmentsResponse.data;
            let count = 0;
            if (Array.isArray(enrollments)) {
                // Count only active enrolled enrollments (not rejected, not deleted)
                count = enrollments.filter(e => (e.Status || e.status) === 'Enrolled').length;
                console.log(`📈 Total active enrolled: ${count} (from ${enrollments.length} total active)`);
            }
            const countElement = document.getElementById('totalEnrollments');
            if (countElement) {
                countElement.textContent = count;
            }
        }

        // Add activity log for dashboard load
        this.addActivity('Dashboard statistics loaded', 'sage');
    }

    // ===== INSTRUCTOR CRUD =====
    async loadInstructors() {
        console.log('👨‍🏫 Loading instructors...');
        const response = await API.instructor.getAll(1, 100);
        const tbody = document.getElementById('instructorsTableBody');

        console.log('📥 Full Instructor response:', response);
        console.log('📊 Instructor data:', response.data);

        if (response.success && response.data) {
            // Handle both paginated and flat response structures
            let instructors = [];
            
            if (response.data.data && Array.isArray(response.data.data)) {
                instructors = response.data.data;
            } else if (Array.isArray(response.data)) {
                instructors = response.data;
            } else {
                console.warn('⚠️ Unexpected response structure:', response.data);
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Unexpected response format</td></tr>';
                return;
            }

            if (instructors.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No instructors found</td></tr>';
                return;
            }

            // Log first instructor to see what fields are available
            console.log('👤 First instructor object:', instructors[0]);

            tbody.innerHTML = instructors.map(instructor => `
                <tr>
                    <td>${instructor.fullName || 'N/A'}</td>
                    <td><small>${instructor.email || '-'}</small></td>
                    <td><small>${instructor.departmentName || '-'}</small></td>
                    <td>${instructor.contactNumber || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="adminDashboard.editInstructor(${instructor.instructorId})" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="adminDashboard.deleteInstructor(${instructor.instructorId})" title="Archive">
                            <i class="bi bi-archive"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.permanentDeleteInstructor(${instructor.instructorId})" title="Delete Forever">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            console.error('❌ Failed to load instructors:', response.error);
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load instructors: ${response.error}</td></tr>`;
        }
    }

    async saveInstructor() {
        // Get button and spinner references
        const btn = document.getElementById('saveInstructorBtn');
        const btnText = document.getElementById('instructorBtnText');
        const btnSpinner = document.getElementById('instructorBtnSpinner');

        const email = document.getElementById('instructorEmail').value.trim();
        const firstName = document.getElementById('instructorFirstName').value.trim();
        const lastName = document.getElementById('instructorLastName').value.trim();
        const contactNumber = document.getElementById('instructorPhone').value.trim();
        const departmentId = document.getElementById('instructorDepartment').value;
        const password = document.getElementById('instructorPassword').value;

        // Show loading state
        const setLoading = (loading) => {
            if (btn) btn.disabled = loading;
            if (btnSpinner) btnSpinner.classList.toggle('d-none', !loading);
        };

        if (this.editingId && this.editingType === 'instructor') {
            // ========== EDIT MODE: Admin can only change department ==========
            if (!departmentId) {
                this.showToast('Validation', 'Please select a department', 'warning');
                return;
            }

            const updateData = { 
                departmentId: parseInt(departmentId)
            };
            console.log('💾 Updating instructor department:', updateData);
            
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
                console.error('❌ Update error:', error);
                this.showToast('Error', '❌ Failed to update instructor: ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        } else {
            // ========== CREATE MODE: All fields required ==========
            // Validation - Check required fields
            if (!email || !firstName || !lastName || !departmentId) {
                this.showToast('Validation', 'Please fill in all required fields (email, name, department)', 'warning');
                return;
            }

            // Full name length check (5-150 chars as per DTO)
            const fullName = `${firstName} ${lastName}`;
            if (fullName.length < 5) {
                this.showToast('Validation', '❌ Full name must be at least 5 characters', 'warning');
                return;
            }
            if (fullName.length > 150) {
                this.showToast('Validation', '❌ Full name cannot exceed 150 characters', 'warning');
                return;
            }

            // Email format validation (frontend)
            if (!this.validateEmailFormat(email)) {
                this.showToast('Validation', '❌ Email must be university format: user@institution.edu.eg', 'warning');
                document.getElementById('instructorEmail').classList.add('is-invalid');
                return;
            }

            // FirstName/LastName validation (letters only)
            if (!this.validateNameFormat(firstName)) {
                this.showToast('Validation', '❌ First Name must contain only letters, spaces, hyphens, apostrophes', 'warning');
                document.getElementById('instructorFirstName').classList.add('is-invalid');
                return;
            }

            if (!this.validateNameFormat(lastName)) {
                this.showToast('Validation', '❌ Last Name must contain only letters, spaces, hyphens, apostrophes', 'warning');
                document.getElementById('instructorLastName').classList.add('is-invalid');
                return;
            }

            // Contact number validation (exactly 11 digits if provided)
            if (contactNumber && !this.validateContactNumber(contactNumber)) {
                this.showToast('Validation', '❌ Contact Number must be EXACTLY 11 digits (e.g., 01234567890)', 'warning');
                document.getElementById('instructorPhone').classList.add('is-invalid');
                return;
            }

            if (!password) {
                this.showToast('Validation', 'Password is required for new instructors', 'warning');
                return;
            }

            // Password validation
            if (!this.validatePassword(password)) {
                this.showToast('Validation', '❌ Password must have: UPPERCASE, lowercase, number, special char (@$!%*?&), min 8 chars', 'warning');
                document.getElementById('instructorPassword').classList.add('is-invalid');
                return;
            }

            const createData = {
                email,
                fullName,
                firstName,
                lastName,
                password,
                contactNumber: contactNumber || null,
                departmentId: parseInt(departmentId)
            };
            console.log('💾 Creating instructor with data:', createData);

            setLoading(true);
            try {
                const response = await API.instructor.create(createData);

                if (response.success) {
                    this.showToast('Success', '✅ Instructor created successfully!', 'success');
                    this.addActivity(`New instructor added: ${fullName}`, 'sage');
                    bootstrap.Modal.getInstance(document.getElementById('instructorModal')).hide();
                    this.resetEditState();
                    await this.loadInstructors();
                    await this.loadInstructorSelects();
                    await this.loadDashboardData();
                } else {
                    console.error('❌ Create failed');
                    this.showDetailedError('Failed to create instructor', response.data);
                }
            } catch (error) {
                console.error('❌ Create error:', error);
                this.showToast('Error', '❌ Failed to create instructor: ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        }
    }

    async editInstructor(id) {
        console.log('✏️ Editing instructor:', id);
        const response = await API.instructor.getById(id);
        
        if (response.success && response.data) {
            const instructor = response.data;
            console.log('👤 Instructor data:', instructor);
            
            // Parse fullName into first and last name
            const nameParts = (instructor.fullName || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            document.getElementById('instructorEmail').value = instructor.email || '';
            document.getElementById('instructorFirstName').value = firstName;
            document.getElementById('instructorLastName').value = lastName;
            document.getElementById('instructorPhone').value = instructor.contactNumber || '';
            document.getElementById('instructorDepartment').value = instructor.departmentId || '';
            
            // Hide password field when editing (can't change via update endpoint)
            document.getElementById('instructorPasswordField').style.display = 'none';
            document.getElementById('instructorPassword').required = false;
            
            // Show edit mode alert, hide business rules
            const businessRules = document.getElementById('instructorBusinessRules');
            const editInfo = document.getElementById('instructorEditInfo');
            if (businessRules) businessRules.classList.add('d-none');
            if (editInfo) editInfo.classList.remove('d-none');
            
            // Make email, name, and contact number readonly when editing
            // Admin can only change department assignment
            document.getElementById('instructorEmail').readOnly = true;
            document.getElementById('instructorEmail').style.backgroundColor = '#e9ecef';
            document.getElementById('instructorEmail').style.cursor = 'not-allowed';
            document.getElementById('instructorEmailNote').innerHTML = '<i class="bi bi-lock"></i> Personal details locked';
            
            document.getElementById('instructorFirstName').readOnly = true;
            document.getElementById('instructorFirstName').style.backgroundColor = '#e9ecef';
            document.getElementById('instructorFirstName').style.cursor = 'not-allowed';
            
            document.getElementById('instructorLastName').readOnly = true;
            document.getElementById('instructorLastName').style.backgroundColor = '#e9ecef';
            document.getElementById('instructorLastName').style.cursor = 'not-allowed';
            
            document.getElementById('instructorPhone').readOnly = true;
            document.getElementById('instructorPhone').style.backgroundColor = '#e9ecef';
            document.getElementById('instructorPhone').style.cursor = 'not-allowed';
            
            document.getElementById('instructorModalTitle').innerHTML = '<i class="bi bi-pencil-square"></i> Edit Instructor - Change Department';
            document.getElementById('instructorBtnText').textContent = 'Update Department';
            
            this.editingId = id;
            this.editingType = 'instructor';
            
            new bootstrap.Modal(document.getElementById('instructorModal')).show();
        } else {
            console.error('❌ Failed to fetch instructor:', response.error);
            this.showToast('Error', 'Failed to load instructor data: ' + response.error, 'error');
        }
    }

    async deleteInstructor(id) {
        this.deleteType = 'instructor';
        this.deleteId = id;
        this.deleteAction = 'archive';
        
        const modalTitle = document.getElementById('deleteModalTitle');
        const modalBody = document.getElementById('deleteModalBody');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        modalTitle.innerHTML = '<i class="bi bi-archive"></i> Archive Instructor';
        modalBody.innerHTML = `
            <p>This will make the instructor <strong>INACTIVE</strong> (preserves all data).</p>
            <p>The instructor will:</p>
            <ul>
                <li>No longer be able to log in</li>
                <li>Not appear in active lists</li>
                <li>Keep all teaching records and history</li>
            </ul>
            <p class="text-success"><i class="bi bi-check-circle"></i> Can be restored from Archived Instructors page</p>
        `;
        confirmBtn.textContent = 'Archive';
        confirmBtn.classList.remove('btn-danger');
        confirmBtn.classList.add('btn-warning');
        
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
    }

    resetInstructorForm() {
        document.getElementById('instructorForm').reset();
        document.getElementById('instructorModalTitle').textContent = 'Add Instructor';
        document.getElementById('saveInstructorBtn').textContent = 'Save';
        
        // Show password field when adding new instructor
        document.getElementById('instructorPasswordField').style.display = 'block';
        document.getElementById('instructorPassword').required = true;
        
        // Re-enable all fields for creation mode
        document.getElementById('instructorEmail').readOnly = false;
        document.getElementById('instructorEmail').style.backgroundColor = '';
        document.getElementById('instructorEmail').style.cursor = '';
        document.getElementById('instructorEmailNote').textContent = '';
        
        document.getElementById('instructorFirstName').readOnly = false;
        document.getElementById('instructorFirstName').style.backgroundColor = '';
        document.getElementById('instructorFirstName').style.cursor = '';
        
        document.getElementById('instructorLastName').readOnly = false;
        document.getElementById('instructorLastName').style.backgroundColor = '';
        document.getElementById('instructorLastName').style.cursor = '';
        
        document.getElementById('instructorPhone').readOnly = false;
        document.getElementById('instructorPhone').style.backgroundColor = '';
        document.getElementById('instructorPhone').style.cursor = '';
        
        this.resetEditState();
    }

    // ===== STUDENT CRUD =====
    async loadStudents() {
        console.log('📚 Loading students...');
        const response = await API.student.getAll(1, 100);
        const tbody = document.getElementById('studentsTableBody');

        console.log('📥 Full Student response:', response);
        console.log('📊 Student data:', response.data);

        if (response.success && response.data) {
            // Handle both paginated and flat response structures
            let students = [];
            
            if (response.data.data && Array.isArray(response.data.data)) {
                students = response.data.data;
            } else if (Array.isArray(response.data)) {
                students = response.data;
            } else {
                console.warn('⚠️ Unexpected response structure:', response.data);
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Unexpected response format</td></tr>';
                return;
            }

            if (students.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No students found</td></tr>';
                return;
            }

            // Log first student to see what fields are available
            console.log('👤 First student object:', students[0]);
            console.log('📧 Email field:', students[0].email);
            console.log('🏢 Department Name field:', students[0].departmentName);

            tbody.innerHTML = students.map(student => `
                <tr>
                    <td>${student.studentCode || 'N/A'}</td>
                    <td>${student.fullName || 'N/A'}</td>
                    <td><small>${student.email || student.Email || '-'}</small></td>
                    <td>
                        <span class="badge bg-info">${student.level || 'N/A'}</span>
                    </td>
                    <td><small>${student.departmentName || student.DepartmentName || '-'}</small></td>
                    <td>${student.contactNumber || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="adminDashboard.editStudent(${student.studentId})" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="adminDashboard.deleteStudent(${student.studentId})" title="Archive">
                            <i class="bi bi-archive"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.permanentDeleteStudent(${student.studentId})" title="Delete Forever">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            console.error('❌ Failed to load students:', response.error);
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load students: ${response.error}</td></tr>`;
        }
    }

    async saveStudent() {
        const btn = document.getElementById('saveStudentBtn');
        const btnText = document.getElementById('studentBtnText');
        const originalText = btnText.textContent;

        // Show loading state
        btn.disabled = true;
        btnText.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

        const email = document.getElementById('studentEmail').value.trim();
        const firstName = document.getElementById('studentFirstName').value.trim();
        const lastName = document.getElementById('studentLastName').value.trim();
        const studentCode = document.getElementById('studentCode').value.trim();
        const contactNumber = document.getElementById('studentPhone').value.trim();
        const level = document.getElementById('studentLevel').value;
        const departmentId = document.getElementById('studentDepartment').value;
        const password = document.getElementById('studentPassword').value;

        if (this.editingId) {
            // ========== ADMIN UPDATE: Only Level and Department ==========
            if (!level || !departmentId) {
                this.showToast('Validation', 'Level and Department are required', 'warning');
                btn.disabled = false;
                btnText.textContent = originalText;
                return;
            }

            if (!/^[1-4]$/.test(level)) {
                this.showToast('Validation', '❌ Level must be 1, 2, 3, or 4', 'warning');
                btn.disabled = false;
                btnText.textContent = originalText;
                return;
            }

            const updateData = { 
                level,
                departmentId: parseInt(departmentId)
            };
            
            try {
                const response = await fetch(`https://smartcampus-university.runasp.net/api/Student/${this.editingId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(updateData)
                });

                const responseData = await response.json();

                if (response.ok) {
                    this.showToast('Success', '✅ Student updated successfully!', 'success');
                    this.logActivity('Student Updated', `Updated level & department for student ID: ${this.editingId}`);
                    bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
                    this.resetStudentFormEnhanced();
                    this.loadStudents();
                    this.loadDashboardData();
                } else {
                    this.showDetailedError('Failed to update student', responseData);
                }
            } catch (error) {
                this.showToast('Error', '❌ Failed to update student: ' + error.message, 'error');
            } finally {
                btn.disabled = false;
                btnText.textContent = originalText;
            }
        } else {
            // ========== CREATE NEW STUDENT ==========
            if (!email || !firstName || !lastName || !studentCode || !level || !departmentId) {
                this.showToast('Validation', 'Please fill in all required fields', 'warning');
                btn.disabled = false;
                btnText.textContent = originalText;
                return;
            }

            if (!this.validateEmailFormat(email)) {
                this.showToast('Validation', '❌ Invalid email format (must be .edu.eg)', 'warning');
                btn.disabled = false;
                btnText.textContent = originalText;
                return;
            }

            if (!this.validateNameFormat(firstName) || !this.validateNameFormat(lastName)) {
                this.showToast('Validation', '❌ Names must contain only letters, spaces, hyphens, apostrophes', 'warning');
                btn.disabled = false;
                btnText.textContent = originalText;
                return;
            }

            if (!this.validateStudentCode(studentCode)) {
                this.showToast('Validation', '❌ Student Code must start with a letter', 'warning');
                btn.disabled = false;
                btnText.textContent = originalText;
                return;
            }

            if (contactNumber && !this.validateContactNumber(contactNumber)) {
                this.showToast('Validation', '❌ Contact Number must be 11 digits', 'warning');
                btn.disabled = false;
                btnText.textContent = originalText;
                return;
            }

            if (!/^[1-4]$/.test(level)) {
                this.showToast('Validation', '❌ Level must be 1, 2, 3, or 4', 'warning');
                btn.disabled = false;
                btnText.textContent = originalText;
                return;
            }

            if (!password) {
                this.showToast('Validation', 'Password is required', 'warning');
                btn.disabled = false;
                btnText.textContent = originalText;
                return;
            }

            if (!this.validatePassword(password)) {
                this.showToast('Validation', '❌ Password requirements not met', 'warning');
                btn.disabled = false;
                btnText.textContent = originalText;
                return;
            }

            const fullName = firstName + ' ' + lastName;
            const createData = {
                email,
                fullName,
                password,
                firstName,
                lastName,
                studentCode,
                contactNumber,
                level,
                departmentId: parseInt(departmentId)
            };

            try {
                const response = await fetch('https://smartcampus-university.runasp.net/api/Student', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(createData)
                });

                const responseData = await response.json();

                if (response.ok) {
                    this.showToast('Success', '✅ Student created successfully!', 'success');
                    this.logActivity('Student Created', `New student: ${fullName} (${studentCode})`);
                    bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
                    this.resetStudentFormEnhanced();
                    this.loadStudents();
                    this.loadDashboardData();
                } else {
                    this.showDetailedError('Failed to create student', responseData);
                }
            } catch (error) {
                this.showToast('Error', '❌ Failed to create student: ' + error.message, 'error');
            } finally {
                btn.disabled = false;
                btnText.textContent = originalText;
            }
        }
    }

    async permanentDeleteInstructor(id) {
        const confirmed = confirm('⚠️ PERMANENT DELETE\n\nThis will PERMANENTLY delete the instructor.\n\n🚨 ALL data will be LOST:\n• Instructor account\n• All teaching assignments\n• All course history\n• All exam records\n\n❌ This action CANNOT be undone!\n\nContinue?');
        if (!confirmed) return;

        try {
            const response = await API.instructor.permanentDelete(id);
            if (response.success) {
                this.showToast('Success', 'Instructor permanently deleted!', 'success');
                await this.loadInstructors();
            } else {
                this.showToast('Error', response.error || 'Failed to delete instructor', 'error');
            }
        } catch (error) {
            this.showToast('Error', error.message, 'error');
        }
    }

    async editStudent(id) {
        console.log('✏️ Editing student:', id);
        const response = await API.student.getById(id);
        
        if (response.success && response.data) {
            const student = response.data;
            console.log('👤 Student data:', student);
            
            // Parse fullName into first and last name (for display only)
            const nameParts = (student.fullName || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            // Set all fields for display
            document.getElementById('studentEmail').value = student.email || '';
            document.getElementById('studentFirstName').value = firstName;
            document.getElementById('studentLastName').value = lastName;
            document.getElementById('studentCode').value = student.studentCode || '';
            document.getElementById('studentPhone').value = student.contactNumber || '';
            document.getElementById('studentLevel').value = student.level || '';
            document.getElementById('studentDepartment').value = student.departmentId || '';
            
            // Hide password field when editing
            document.getElementById('passwordField').style.display = 'none';
            document.getElementById('studentPassword').required = false;
            
            // ========== ADMIN EDIT: Disable name, email, code, contact ==========
            // Make non-editable fields readonly and visually distinct
            document.getElementById('studentEmail').readOnly = true;
            document.getElementById('studentEmail').style.backgroundColor = '#e9ecef';
            document.getElementById('studentEmail').style.cursor = 'not-allowed';
            
            document.getElementById('studentFirstName').readOnly = true;
            document.getElementById('studentFirstName').style.backgroundColor = '#e9ecef';
            document.getElementById('studentFirstName').style.cursor = 'not-allowed';
            
            document.getElementById('studentLastName').readOnly = true;
            document.getElementById('studentLastName').style.backgroundColor = '#e9ecef';
            document.getElementById('studentLastName').style.cursor = 'not-allowed';
            
            document.getElementById('studentCode').readOnly = true;
            document.getElementById('studentCode').style.backgroundColor = '#e9ecef';
            document.getElementById('studentCode').style.cursor = 'not-allowed';
            
            document.getElementById('studentPhone').readOnly = true;
            document.getElementById('studentPhone').style.backgroundColor = '#e9ecef';
            document.getElementById('studentPhone').style.cursor = 'not-allowed';
            
            // Show clear note about what admin can edit
            document.getElementById('emailNote').textContent = '⚠️ Admin can only update Level and Department';
            document.getElementById('studentCode').title = 'Cannot be changed';
            
            document.getElementById('studentModalTitle').textContent = 'Edit Student (Level & Department)';
            document.getElementById('saveStudentBtn').textContent = 'Update';
            
            this.editingId = id;
            this.editingType = 'student';
            
            new bootstrap.Modal(document.getElementById('studentModal')).show();
        } else {
            console.error('❌ Failed to fetch student:', response.error);
            this.showToast('Error', 'Failed to load student data: ' + response.error, 'error');
        }
    }

    async deleteStudent(id) {
        this.deleteType = 'student';
        this.deleteId = id;
        this.deleteAction = 'archive';
        
        const modalTitle = document.getElementById('deleteModalTitle');
        const modalBody = document.getElementById('deleteModalBody');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        modalTitle.innerHTML = '<i class="bi bi-archive"></i> Archive Student';
        modalBody.innerHTML = `
            <p>This will make the student <strong>INACTIVE</strong> (preserves all data).</p>
            <p>The student will:</p>
            <ul>
                <li>No longer be able to log in</li>
                <li>Not appear in active lists</li>
                <li>Keep all enrollments, grades, and records</li>
            </ul>
            <p class="text-success"><i class="bi bi-check-circle"></i> Can be restored from Archived Students page</p>
        `;
        confirmBtn.textContent = 'Archive';
        confirmBtn.classList.remove('btn-danger');
        confirmBtn.classList.add('btn-warning');
        
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
    }

    async permanentDeleteStudent(id) {
        this.deleteType = 'student';
        this.deleteId = id;
        this.deleteAction = 'permanent';
        
        const modalTitle = document.getElementById('deleteModalTitle');
        const modalBody = document.getElementById('deleteModalBody');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        modalTitle.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Permanent Delete';
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                <h6><i class="bi bi-exclamation-circle"></i> This will PERMANENTLY delete the student.</h6>
                <p class="mb-0"><strong>ALL data will be LOST:</strong></p>
                <ul class="mb-0">
                    <li>Student account</li>
                    <li>All enrollments</li>
                    <li>All grades and exam records</li>
                    <li>All academic history</li>
                </ul>
                <p class="text-danger mt-2 mb-0"><strong>This action CANNOT be undone!</strong></p>
            </div>
        `;
        confirmBtn.textContent = 'Delete Forever';
        confirmBtn.classList.remove('btn-warning');
        confirmBtn.classList.add('btn-danger');
        
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
    }

    async executeDelete() {
        const id = this.deleteId;
        const type = this.deleteType;
        const action = this.deleteAction;

        console.log('⚡ EXECUTE DELETE CALLED - Type:', type, 'ID:', id, 'Action:', action);

        if (!id) {
            console.error('❌ No ID to delete!');
            return;
        }

        try {
            let response;
            
            // Handle archive (soft delete)
            if (action === 'archive') {
                if (type === 'instructor') {
                    response = await API.instructor.delete(id);
                } else if (type === 'student') {
                    response = await API.student.delete(id);
                } else if (type === 'department') {
                    response = await API.department.delete(id);
                } else if (type === 'course') {
                    response = await API.course.delete(id);
                } else if (type === 'enrollment') {
                    response = await API.enrollment.softDelete(id);
                }
            }
            // Handle permanent delete
            else if (action === 'permanent') {
                if (type === 'instructor') {
                    response = await API.instructor.permanentDelete(id);
                } else if (type === 'student') {
                    response = await API.student.permanentDelete(id);
                } else if (type === 'department') {
                    response = await API.department.permanentDelete(id);
                } else if (type === 'course') {
                    response = await API.course.permanentDelete(id);
                } else if (type === 'enrollment') {
                    response = await API.enrollment.hardDelete(id);
                }
            }

            console.log('📊 Delete response:', { type, id, action, status: response.status, ok: response.success, fullResponse: response });
            
            // Close the modal FIRST and wait for it to close
            const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
            if (deleteModal) {
                deleteModal.hide();
            }
            
            // Remove modal backdrop if it exists
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
            
            if (response.success) {
                let successMessage = '';
                
                if (action === 'archive') {
                    if (type === 'instructor') {
                        successMessage = 'Instructor archived successfully! View archived instructors in the Archived Instructors page.';
                    } else if (type === 'student') {
                        successMessage = 'Student archived successfully! View archived students in the Archived Students page.';
                    } else if (type === 'department') {
                        successMessage = 'Department archived successfully! View archived departments in the Archived Departments page.';
                    } else if (type === 'course') {
                        successMessage = 'Course archived successfully! View archived courses in the Archived Courses page.';
                    } else if (type === 'enrollment') {
                        successMessage = 'Enrollment archived successfully!';
                    }
                } else if (action === 'permanent') {
                    successMessage = `${type.charAt(0).toUpperCase() + type.slice(1)} permanently deleted!`;
                }
                
                this.showToast('Success', successMessage, 'success');
                
                // Wait for modal to fully close before reloading
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Reload appropriate section
                if (type === 'instructor') this.loadInstructors();
                else if (type === 'student') this.loadStudents();
                else if (type === 'department') this.loadDepartments();
                else if (type === 'course') {
                    // Check if we're on deleted courses page
                    if (document.getElementById('deletedCoursesTableBody')) {
                        this.loadDeletedCourses();
                    } else {
                        this.loadCourses();
                    }
                }
                else if (type === 'enrollment') {
                    if (document.getElementById('enrollmentsTableBody')) {
                        this.loadEnrollments();
                    }
                    if (document.getElementById('rejectedEnrollmentsTableBody')) {
                        this.loadRejectedEnrollments();
                    }
                }
                
                this.loadDashboardData();
            } else {
                this.showToast('Error', response.error || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('❌ Delete error:', error);
            this.showToast('Error', error.message, 'error');
        } finally {
            // Clear state
            this.deleteId = null;
            this.deleteType = null;
            this.deleteAction = null;
        }
    }

    resetStudentForm() {
        document.getElementById('studentForm').reset();
        document.getElementById('studentModalTitle').textContent = 'Add Student';
        document.getElementById('saveStudentBtn').textContent = 'Save';
        
        // Show password field when adding new student
        document.getElementById('passwordField').style.display = 'block';
        document.getElementById('studentPassword').required = true;
        
        // Make all fields editable when adding new student
        document.getElementById('studentEmail').readOnly = false;
        document.getElementById('studentEmail').style.backgroundColor = '';
        document.getElementById('studentEmail').style.cursor = '';
        
        document.getElementById('studentFirstName').readOnly = false;
        document.getElementById('studentFirstName').style.backgroundColor = '';
        document.getElementById('studentFirstName').style.cursor = '';
        
        document.getElementById('studentLastName').readOnly = false;
        document.getElementById('studentLastName').style.backgroundColor = '';
        document.getElementById('studentLastName').style.cursor = '';
        
        document.getElementById('studentCode').readOnly = false;
        document.getElementById('studentCode').style.backgroundColor = '';
        document.getElementById('studentCode').style.cursor = '';
        
        document.getElementById('studentPhone').readOnly = false;
        document.getElementById('studentPhone').style.backgroundColor = '';
        document.getElementById('studentPhone').style.cursor = '';
        
        // Clear note
        document.getElementById('emailNote').textContent = '';
        document.getElementById('studentCode').title = '';
        
        this.resetEditState();
    }

    // ===== DEPARTMENT CRUD =====
    async loadDepartments() {
        console.log('🏢 Loading departments...');
        const response = await API.department.getAll(1, 100);
        const tbody = document.getElementById('departmentsTableBody');

        if (response.success && response.data) {
            let departments = [];
            
            if (response.data.data && Array.isArray(response.data.data)) {
                departments = response.data.data;
            } else if (Array.isArray(response.data)) {
                departments = response.data;
            }

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
    }

    async saveDepartment() {
        const btn = document.getElementById('saveDepartmentBtn');
        const btnText = document.getElementById('departmentBtnText');
        const originalText = btnText.textContent;

        btn.disabled = true;
        btnText.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

        const name = document.getElementById('departmentName').value.trim();
        let building = document.getElementById('departmentBuilding').value;
        const headId = document.getElementById('departmentHead').value;

        // Validation
        if (!name || !building) {
            this.showToast('Validation', 'Name and Building are required', 'warning');
            btn.disabled = false;
            btnText.textContent = originalText;
            return;
        }

        // Name length validation (3-100 characters)
        if (name.length < 3 || name.length > 100) {
            this.showToast('Validation', '❌ Department name must be 3-100 characters', 'warning');
            btn.disabled = false;
            btnText.textContent = originalText;
            return;
        }

        // Name format validation
        if (!/^[a-zA-Z\s\-']+$/.test(name)) {
            this.showToast('Validation', '❌ Name must contain only letters, spaces, hyphens, apostrophes', 'warning');
            btn.disabled = false;
            btnText.textContent = originalText;
            return;
        }

        // Building validation - ensure proper format
        if (!building.startsWith('Building ')) {
            this.showToast('Validation', '❌ Please select a valid building', 'warning');
            btn.disabled = false;
            btnText.textContent = originalText;
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
                    this.logActivity('Department Updated', `Department: ${name} in ${building}`);
                }
            } else {
                response = await API.department.create(departmentData);
                if (response.success) {
                    this.showToast('Success', '✅ Department created successfully!', 'success');
                    this.logActivity('Department Created', `New department: ${name} in ${building}`);
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
            this.showToast('Error', '❌ Failed to save department: ' + error.message, 'error');
        } finally {
            btn.disabled = false;
            btnText.textContent = originalText;
        }
    }

    async permanentDeleteDepartment(id) {
        this.deleteType = 'department';
        this.deleteId = id;
        this.deleteAction = 'permanent';
        
        const modalTitle = document.getElementById('deleteModalTitle');
        const modalBody = document.getElementById('deleteModalBody');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        modalTitle.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Permanent Delete';
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                <h6><i class="bi bi-exclamation-circle"></i> This will PERMANENTLY delete the department.</h6>
                <p class="mb-0"><strong>ALL data will be LOST:</strong></p>
                <ul class="mb-0">
                    <li>Department record</li>
                    <li>All course associations</li>
                    <li>All student/instructor assignments</li>
                    <li>All department history</li>
                </ul>
                <p class="text-danger mt-2 mb-0"><strong>This action CANNOT be undone!</strong></p>
            </div>
        `;
        confirmBtn.textContent = 'Delete Forever';
        confirmBtn.classList.remove('btn-warning');
        confirmBtn.classList.add('btn-danger');
        
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
    }

    async editDepartment(id) {
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
            this.showToast('Error', 'Failed to load department: ' + response.error, 'error');
        }
    }

    async deleteDepartment(id) {
        this.deleteType = 'department';
        this.deleteId = id;
        this.deleteAction = 'archive';
        
        const modalTitle = document.getElementById('deleteModalTitle');
        const modalBody = document.getElementById('deleteModalBody');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        modalTitle.innerHTML = '<i class="bi bi-archive"></i> Archive Department';
        modalBody.innerHTML = `
            <p>This will make the department <strong>INACTIVE</strong> (preserves all data).</p>
            <p>The department will:</p>
            <ul>
                <li>Not appear in active lists</li>
                <li>Cannot accept new students/instructors</li>
                <li>Keep all existing data and relationships</li>
            </ul>
            <p class="text-success"><i class="bi bi-check-circle"></i> Can be restored from Archived Departments page</p>
        `;
        confirmBtn.textContent = 'Archive';
        confirmBtn.classList.remove('btn-danger');
        confirmBtn.classList.add('btn-warning');
        
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
    }

    resetDepartmentForm() {
        document.getElementById('departmentForm').reset();
        document.getElementById('departmentModalTitle').textContent = 'Add Department';
        document.getElementById('saveDepartmentBtn').textContent = 'Save';
        this.resetEditState();
    }

    // ===== COURSE CRUD =====
    async loadCourses() {
        console.log('📖 Loading active courses...');
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
                    <td><small>${course.departmentName || '-'}</small></td>
                    <td><small>${course.instructorName || '-'}</small></td>
                    <td>${course.creditHours || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="adminDashboard.editCourse(${course.id})" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="adminDashboard.deleteCourse(${course.id})" title="Archive">
                            <i class="bi bi-archive"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.permanentDeleteCourse(${course.id})" title="Delete Forever">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load courses</td></tr>';
        }
    }

    async loadDeletedCourses() {
        console.log('📖 Loading deleted courses...');
        const response = await API.course.getAllIncludingDeleted();
        const tbody = document.getElementById('deletedCoursesTableBody');

        if (response.success && response.data) {
            let courses = Array.isArray(response.data.data) ? response.data.data : 
                         Array.isArray(response.data) ? response.data : [];
            
            // Filter only deleted courses
            const deletedCourses = courses.filter(c => c.deletedAt);
            
            console.log(`📊 Deleted Courses: ${deletedCourses.length}`);
            
            if (deletedCourses.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No deleted courses found</td></tr>';
                return;
            }

            tbody.innerHTML = deletedCourses.map(course => `
                <tr class="table-secondary">
                    <td>
                        <strong>${course.courseCode || '-'}</strong>
                        <span class="badge bg-danger ms-2">Deleted</span>
                    </td>
                    <td>${course.name}</td>
                    <td><small>${course.departmentName || '-'}</small></td>
                    <td><small>${course.instructorName || '-'}</small></td>
                    <td>${course.creditHours || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="adminDashboard.restoreCourse(${course.id})" title="Restore">
                            <i class="bi bi-arrow-counterclockwise"></i> Restore
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.confirmPermanentDeleteCourse(${course.id})" title="Permanent Delete">
                            <i class="bi bi-trash-fill"></i> Delete Forever
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load deleted courses</td></tr>';
        }
    }

    async saveCourse() {
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
            this.showToast('Validation', 'Please fill in all required fields', 'warning');
            btn.disabled = false;
            btnText.textContent = originalText;
            return;
        }

        // Name length validation
        if (name.length < 3 || name.length > 80) {
            this.showToast('Validation', '❌ Course name must be 3-80 characters', 'warning');
            btn.disabled = false;
            btnText.textContent = originalText;
            return;
        }

        // Name must contain at least one letter
        if (!/[a-zA-Z]/.test(name)) {
            this.showToast('Validation', '❌ Course name must contain at least one letter', 'warning');
            btn.disabled = false;
            btnText.textContent = originalText;
            return;
        }

        // Name format validation
        if (!/^[a-zA-Z0-9\s\-]+$/.test(name)) {
            this.showToast('Validation', '❌ Course name: letters, numbers, spaces, hyphens only', 'warning');
            btn.disabled = false;
            btnText.textContent = originalText;
            return;
        }

        // Credits validation (1-6)
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
                if (response.success && (response.status === 200 || response.status === 201)) {
                    this.showToast('Success', '✅ Course updated successfully!', 'success');
                    this.logActivity('Course Updated', `Course: ${name} (${creditsNum} credits)`);
                }
            } else {
                response = await API.course.create(courseData);
                if (response.success && (response.status === 200 || response.status === 201)) {
                    this.showToast('Success', '✅ Course created successfully!', 'success');
                    this.logActivity('Course Created', `New course: ${name} (${creditsNum} credits)`);
                }
            }

            if (response.success && (response.status === 200 || response.status === 201)) {
                bootstrap.Modal.getInstance(document.getElementById('courseModal')).hide();
                this.resetCourseFormEnhanced();
                this.loadCourses();
                this.loadDashboardData();
            } else {
                // Extract error message
                let errorMsg = 'Unknown error occurred';
                
                if (response.data) {
                    if (response.data.Error) errorMsg = response.data.Error;
                    else if (response.data.error) errorMsg = response.data.error;
                    else if (response.data.Message) errorMsg = response.data.Message;
                    else if (response.data.message) errorMsg = response.data.message;
                    else if (response.data.errors) {
                        this.showDetailedError('Failed to save course', response.data);
                        return;
                    }
                } else if (response.error) {
                    errorMsg = response.error;
                }
                
                this.showToast('Error', errorMsg, 'error');
            }
        } catch (error) {
            this.showToast('Error', '❌ Failed to save course: ' + error.message, 'error');
        } finally {
            btn.disabled = false;
            btnText.textContent = originalText;
        }
    }

    async editCourse(id) {
        console.log('✏️ Editing course ID:', id);
        const response = await API.course.getById(id);
        console.log('📊 Course API response:', response);
        
        // Extract the course data - API returns { success, data: { success, message, data: course } }
        // So we need response.data.data for the actual course object
        let course = response.data?.data || response.data;
        console.log('📝 Course data object:', course);
        
        if (response.success && course) {
            console.log('📝 Course keys:', Object.keys(course));
            
            // Handle property name casing differences (camelCase vs PascalCase)
            const courseName = course.name || course.Name || '';
            const deptId = course.departmentId || course.DepartmentId || '';
            const instId = course.instructorId || course.InstructorId || '';
            const credits = course.creditHours || course.CreditHours || '';
            
            console.log('📋 Extracted values:', { courseName, deptId, instId, credits });
            
            // Clear form first
            document.getElementById('courseForm').reset();
            
            // Set course name
            console.log('📋 Setting course name to:', courseName);
            document.getElementById('courseName').value = courseName;
            
            // Set credits
            console.log('📊 Setting credits to:', credits);
            document.getElementById('courseCredits').value = credits;
            
            // Set department and then instructor
            console.log('🏢 Setting department to:', deptId);
            document.getElementById('courseDepartment').value = deptId;
            
            // Load instructors for the selected department
            if (deptId) {
                console.log('🔄 Loading instructors for department:', deptId);
                await this.loadInstructorsByDepartment(deptId);
            }
            
            // Set instructor after a brief delay to ensure dropdown is populated
            setTimeout(() => {
                console.log('👨‍🏫 Setting instructor to:', instId);
                document.getElementById('courseInstructor').value = instId;
                console.log('✅ Instructor set, current value:', document.getElementById('courseInstructor').value);
            }, 200);
            
            document.getElementById('courseModalTitle').textContent = 'Edit Course';
            document.getElementById('saveCourseBtn').textContent = 'Update';
            
            this.editingId = id;
            this.editingType = 'course';
            
            console.log('🎯 Opening edit modal for course:', id);
            new bootstrap.Modal(document.getElementById('courseModal')).show();
        } else {
            console.error('❌ Failed to load course:', response);
            const errorMsg = response.error || response.message || 'Unknown error';
            this.showToast('Error', 'Failed to load course details: ' + errorMsg, 'error');
        }
    }

    async deleteCourse(id) {
        this.deleteType = 'course';
        this.deleteId = id;
        this.deleteAction = 'archive';
        
        const modalTitle = document.getElementById('deleteModalTitle');
        const modalBody = document.getElementById('deleteModalBody');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        modalTitle.innerHTML = '<i class="bi bi-archive"></i> Archive Course';
        modalBody.innerHTML = `
            <p>This will make the course <strong>INACTIVE</strong> (preserves all data).</p>
            <p>The course will:</p>
            <ul>
                <li>Not appear in active lists</li>
                <li>Cannot accept new enrollments</li>
                <li>Keep all existing enrollments and grades</li>
            </ul>
            <p class="text-success"><i class="bi bi-check-circle"></i> Can be restored from Archived Courses page</p>
        `;
        confirmBtn.textContent = 'Archive';
        confirmBtn.classList.remove('btn-danger');
        confirmBtn.classList.add('btn-warning');
        
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
    }

    async permanentDeleteCourse(id) {
        this.deleteType = 'course';
        this.deleteId = id;
        this.deleteAction = 'permanent';
        
        const modalTitle = document.getElementById('deleteModalTitle');
        const modalBody = document.getElementById('deleteModalBody');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        modalTitle.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Permanent Delete';
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                <h6><i class="bi bi-exclamation-circle"></i> This will PERMANENTLY delete the course.</h6>
                <p class="mb-0"><strong>ALL data will be LOST:</strong></p>
                <ul class="mb-0">
                    <li>Course record</li>
                    <li>All enrollments</li>
                    <li>All grades and exams</li>
                    <li>All attendance records</li>
                </ul>
                <p class="text-danger mt-2 mb-0"><strong>This action CANNOT be undone!</strong></p>
            </div>
        `;
        confirmBtn.textContent = 'Delete Forever';
        confirmBtn.classList.remove('btn-warning');
        confirmBtn.classList.add('btn-danger');
        
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
    }

    async confirmSoftDeleteCourse() {
        const id = window.deleteConfirmId;
        if (!id) return;

        try {
            const response = await API.course.delete(id);
            
            // Close the choice modal
            const deleteChoiceModal = bootstrap.Modal.getInstance(document.getElementById('deleteChoiceModal'));
            deleteChoiceModal.hide();
            
            if (response.success) {
                this.showToast('Success', 'Course soft deleted successfully! You can restore it from Deleted Courses.', 'success');
                this.loadCourses();
            } else {
                this.showToast('Error', 'Failed to delete course: ' + (response.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('❌ Error soft deleting course:', error);
            this.showToast('Error', 'Failed to delete course', 'error');
        }
    }

    async confirmHardDeleteCourse() {
        const id = window.deleteConfirmId;
        if (!id) return;

        try {
            console.log('🔥 PERMANENT DELETE - Calling API for course ID:', id);
            const response = await API.course.permanentDelete(id);
            console.log('📊 Permanent delete response:', response);
            console.log('📊 Response status:', response.status);
            console.log('📊 Response success:', response.success);
            console.log('📊 Response data:', response.data);
            
            // Close the choice modal
            const deleteChoiceModal = bootstrap.Modal.getInstance(document.getElementById('deleteChoiceModal'));
            deleteChoiceModal.hide();
            
            if (response.success && (response.status === 200 || response.status === 204)) {
                this.showToast('Success', 'Course permanently deleted!', 'success');
                console.log('⏳ Waiting 2 seconds for database commit...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log('🔄 Reloading courses...');
                this.loadCourses();
                console.log('✅ Course should be gone from database');
            } else {
                const errorMsg = response.message || response.Message || response.error || 'Unknown error';
                console.error('❌ Delete failed:', errorMsg);
                this.showToast('Error', 'Failed to delete course: ' + errorMsg, 'error');
            }
        } catch (error) {
            console.error('❌ Error permanently deleting course:', error);
            this.showToast('Error', 'Failed to delete course', 'error');
        }
    }

    async confirmPermanentDeleteCourse(id) {
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        document.getElementById('deleteMessage').textContent = '⚠️ WARNING: This will PERMANENTLY delete this course from the database. This action cannot be undone! Are you sure?';
        
        window.deleteConfirmId = id;
        window.deleteConfirmType = 'course-permanent';
        
        deleteModal.show();
    }

    async restoreCourse(id) {
        try {
            const response = await API.course.restore(id);
            
            if (response.success) {
                this.showToast('Success', 'Course restored successfully!', 'success');
                // Check if we're on deleted courses page
                if (document.getElementById('deletedCoursesTableBody')) {
                    this.loadDeletedCourses();
                } else {
                    this.loadCourses();
                }
            } else {
                this.showToast('Error', 'Failed to restore course: ' + (response.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('❌ Error restoring course:', error);
            this.showToast('Error', 'Failed to restore course', 'error');
        }
    }

    async loadInstructorsByDepartment(departmentId) {
        const select = document.getElementById('courseInstructor');
        select.innerHTML = '<option value="">Loading...</option>';
        
        const response = await API.instructor.getByDepartment(departmentId);
        
        if (response.success && response.data) {
            let instructors = [];
            if (response.data.data && Array.isArray(response.data.data)) {
                instructors = response.data.data;
            } else if (Array.isArray(response.data)) {
                instructors = response.data;
            }
            
            const optionsHtml = instructors.map(inst => 
                `<option value="${inst.instructorId}">${inst.fullName}</option>`
            ).join('');
            
            select.innerHTML = '<option value="">Select Instructor</option>' + optionsHtml;
        } else {
            select.innerHTML = '<option value="">No instructors available</option>';
        }
    }

    setupCourseFormListeners() {
        const departmentSelect = document.getElementById('courseDepartment');
        if (departmentSelect) {
            departmentSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadInstructorsByDepartment(e.target.value);
                }
            });
        }
    }

    resetCourseForm() {
        document.getElementById('courseForm').reset();
        document.getElementById('courseModalTitle').textContent = 'Add Course';
        document.getElementById('saveCourseBtn').textContent = 'Save';
        document.getElementById('courseInstructor').innerHTML = '<option value="">Select Instructor</option>';
        this.resetEditState();
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
                if (userNameElement) {
                    userNameElement.textContent = fullName;
                }
            }
        } catch (error) {
            console.error('❌ Error loading user name:', error);
            // Keep default "Admin" if error occurs
        }
    }

    // ===== ADMIN PROFILE CRUD =====
    async loadAdminProfile() {
        console.log('👤 Loading admin profile...');
        
        try {
            // Call API to get admin profile
            const profileResponse = await API.admin.getMyProfile();
            console.log('📊 Full profile response:', profileResponse);
            console.log('📊 Response.data:', profileResponse.data);
            
            if (profileResponse.success && profileResponse.data) {
                // Handle nested data structure - API might return { data: { Data: {...} } } or { data: {...} }
                const profile = profileResponse.data.Data || profileResponse.data.data || profileResponse.data;
                console.log('👤 Admin Profile:', profile);

                // Helper function to safely set element text
                const safeSetText = (elementId, value) => {
                    const element = document.getElementById(elementId);
                    if (element) {
                        element.textContent = value;
                    }
                };

                const safeSetValue = (elementId, value) => {
                    const element = document.getElementById(elementId);
                    if (element) {
                        element.value = value;
                    }
                };

                // Display view - handle both camelCase and PascalCase
                safeSetText('displayFirstName', profile.firstName || profile.FirstName || '-');
                safeSetText('displayLastName', profile.lastName || profile.LastName || '-');
                safeSetText('displayEmail', profile.email || profile.Email || '-');
                safeSetText('displayContactNumber', profile.contactNumber || profile.ContactNumber || '-');
                const createdDate = profile.createdDate || profile.CreatedDate;
                safeSetText('displayCreatedDate', createdDate ? new Date(createdDate).toLocaleDateString() : '-');

                // Populate summary (if elements exist)
                const firstName = profile.firstName || profile.FirstName || '';
                const lastName = profile.lastName || profile.LastName || '';
                const fullName = `${firstName} ${lastName}`.trim() || 'Administrator';
                safeSetText('summaryName', fullName);
                safeSetText('summaryEmail', profile.email || profile.Email || '-');

                // Edit form - populate with current values
                safeSetValue('profileFirstName', profile.firstName || profile.FirstName || '');
                safeSetValue('profileLastName', profile.lastName || profile.LastName || '');
                safeSetValue('profileEmail', profile.email || profile.Email || '');
                safeSetValue('profileContactNumber', profile.contactNumber || profile.ContactNumber || '');

                // Update navbar user name
                safeSetText('userName', fullName || 'Admin');

                this.showDisplayProfileView();
            } else {
                console.error('❌ Failed to load profile:', profileResponse.error);
                this.showToast('Error', 'Failed to load profile: ' + (profileResponse.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('❌ Error loading profile:', error);
            this.showToast('Error', 'An error occurred while loading profile', 'error');
        }
    }

    showDisplayProfileView() {
        document.getElementById('profileDisplayView').classList.remove('d-none');
        document.getElementById('profileEditView').classList.add('d-none');
    }

    showEditProfileForm() {
        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        
        document.getElementById('profileDisplayView').classList.add('d-none');
        document.getElementById('profileEditView').classList.remove('d-none');
    }

    async saveProfile() {
        const firstName = document.getElementById('profileFirstName').value.trim();
        const lastName = document.getElementById('profileLastName').value.trim();
        const contactNumber = document.getElementById('profileContactNumber').value.trim();
        const currentPassword = document.getElementById('currentPassword').value.trim();
        const newPassword = document.getElementById('newPassword').value.trim();

        // Validation
        if (!firstName || !lastName || !currentPassword) {
            this.showToast('Validation', 'First Name, Last Name, and Current Password are required', 'warning');
            return;
        }

        // Name format validation
        if (!this.validateNameFormat(firstName)) {
            this.showToast('Validation', '❌ First Name must contain only letters, spaces, hyphens, apostrophes', 'warning');
            return;
        }

        if (!this.validateNameFormat(lastName)) {
            this.showToast('Validation', '❌ Last Name must contain only letters, spaces, hyphens, apostrophes', 'warning');
            return;
        }

        // Contact number validation (if provided)
        if (contactNumber) {
            if (!/^\d{11}$/.test(contactNumber)) {
                this.showToast('Validation', '❌ Contact Number must be exactly 11 digits', 'warning');
                return;
            }
        }

        // If new password is provided, validate it
        if (newPassword && !this.validatePassword(newPassword)) {
            this.showToast('Validation', '❌ Password must have: UPPERCASE, lowercase, number, special char (@$!%*?&), min 8 chars', 'warning');
            return;
        }

        try {
            // Build request body matching UpdateAdminProfileDTO property names
            const profileData = {
                firstName: firstName,
                lastName: lastName,
                currentPassword: currentPassword
            };

            // Include contactNumber if provided
            if (contactNumber) {
                profileData.contactNumber = contactNumber;
            }

            // Only include newPassword if provided and not empty
            if (newPassword) {
                profileData.newPassword = newPassword;
            }

            console.log('💾 Saving admin profile...', profileData);
            
            // Call update profile endpoint using API wrapper
            const response = await API.admin.updateMyProfile(profileData);

            console.log('📊 Profile update response:', response);
            console.log('📊 Response status:', response.status);
            console.log('📊 Response.data:', response.data);

            if (response.success) {
                // Update stored user info if response includes new token
                const responseData = response.data?.Data || response.data?.data || response.data;
                if (responseData && responseData.token) {
                    console.log('🔐 New token received, updating localStorage...');
                    localStorage.setItem('authToken', responseData.token);
                    const userInfo = API.decodeToken(responseData.token);
                    if (userInfo) {
                        console.log('👤 Updated user info from token:', userInfo);
                        localStorage.setItem('userInfo', JSON.stringify(userInfo));
                    }
                }

                this.showToast('Success', 'Profile updated successfully!', 'success');
                await this.loadAdminProfile();
                this.showDisplayProfileView();
            } else {
                // Extract error message
                let errorMsg = 'Unknown error';
                if (response.data) {
                    errorMsg = response.data.Message || response.data.message || 
                              response.data.Error || response.data.error || errorMsg;
                    
                    // Check for validation errors
                    if (response.data.Errors && Array.isArray(response.data.Errors)) {
                        errorMsg = response.data.Errors.join(', ');
                    }
                } else if (response.error) {
                    errorMsg = response.error;
                }
                
                console.error('❌ Profile update error:', errorMsg);
                this.showToast('Error', `Failed to update profile: ${errorMsg}`, 'error');
            }
        } catch (error) {
            console.error('❌ Error saving profile:', error);
            this.showToast('Error', `❌ Failed to save profile: ${error.message}`, 'error');
        }
    }

    // ===== HELPER METHODS =====
    // ===== HELPER METHODS =====
    showDetailedError(title, responseData) {
        console.error('❌ Error:', responseData);
        
        let errorMsg = 'Unknown error occurred';
        let details = '';

        // Handle different response formats
        if (typeof responseData === 'object') {
            // Check for Error field (API business rule violations)
            if (responseData.Error) {
                errorMsg = responseData.Error;
            }
            // Check for error field (lowercase)
            else if (responseData.error) {
                errorMsg = responseData.error;
            }
            // Check for Message field
            else if (responseData.Message) {
                errorMsg = responseData.Message;
            }
            // Check for message field (lowercase)
            else if (responseData.message) {
                errorMsg = responseData.message;
            }
            // Handle title field
            else if (responseData.title) {
                errorMsg = responseData.title;
            }
            
            // Handle ModelState errors (validation) - direct format
            if (responseData.errors) {
                const errors = responseData.errors;
                if (typeof errors === 'object' && !Array.isArray(errors)) {
                    // Object format: { fieldName: [error1, error2] }
                    const errorList = [];
                    for (const field in errors) {
                        if (Array.isArray(errors[field])) {
                            errorList.push(`${field}: ${errors[field].join(', ')}`);
                        } else {
                            errorList.push(`${field}: ${errors[field]}`);
                        }
                    }
                    details = errorList.join('\n');
                } else if (Array.isArray(errors)) {
                    details = errors.join('\n');
                }
            }
        } else if (typeof responseData === 'string') {
            errorMsg = responseData;
        }

        // Show main error
        this.showToast('Error', title + ': ' + errorMsg, 'error');

        // Show detailed validation errors if any
        if (details) {
            console.error('📋 Validation Details:\n' + details);
            setTimeout(() => {
                this.showDetailedToast('Validation Errors', details);
            }, 500);
        }
    }

    showDetailedToast(title, message) {
        const alertContainer = document.getElementById('alertContainer');
        const lines = message.split('\n').filter(l => l.trim());
        const itemsList = lines.map(line => `<li>${line}</li>`).join('');
        
        const toastHtml = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>${title}</strong>
                <ul class="mb-0 mt-2">
                    ${itemsList}
                </ul>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        alertContainer.innerHTML = toastHtml;

        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) {
                new bootstrap.Alert(alert).close();
            }
        }, 8000);
    }

    async loadDepartmentSelects() {
        const response = await API.department.getAll(1, 100);
        const selectElements = [
            document.getElementById('courseDepartment'),
            document.getElementById('studentDepartment'),
            document.getElementById('instructorDepartment')
        ];

        if (response.success && response.data) {
            let departments = [];
            if (response.data.data && Array.isArray(response.data.data)) {
                departments = response.data.data;
            } else if (Array.isArray(response.data)) {
                departments = response.data;
            }

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
            let instructors = [];
            if (response.data.data && Array.isArray(response.data.data)) {
                instructors = response.data.data;
            } else if (Array.isArray(response.data)) {
                instructors = response.data;
            }

            const currentValue = selectElement.value;
            const optionsHtml = instructors.map(instr => 
                `<option value="${instr.instructorId || instr.id}">${instr.fullName}</option>`
            ).join('');

            selectElement.innerHTML = '<option value="">Select Instructor as Head</option>' + optionsHtml;
            if (currentValue) selectElement.value = currentValue;
        }
    }

    // Load instructors by department for course assignment
    async loadInstructorsByDepartment(departmentId) {
        const selectElement = document.getElementById('courseInstructor');
        
        if (!selectElement) return;

        try {
            const response = await API.instructor.getAll(1, 100);
            
            if (response.success && response.data) {
                let instructors = [];
                if (response.data.data && Array.isArray(response.data.data)) {
                    instructors = response.data.data;
                } else if (Array.isArray(response.data)) {
                    instructors = response.data;
                }

                // Filter instructors by selected department
                const filtered = instructors.filter(instr => 
                    (instr.departmentId || instr.DepartmentId) == departmentId
                );

                if (filtered.length === 0) {
                    selectElement.innerHTML = '<option value="">No instructors in this department</option>';
                } else {
                    const optionsHtml = filtered.map(instr => 
                        `<option value="${instr.instructorId || instr.id}">${instr.fullName}</option>`
                    ).join('');
                    selectElement.innerHTML = '<option value="">Select Instructor</option>' + optionsHtml;
                }
            }
        } catch (error) {
            console.error('Error loading instructors by department:', error);
            selectElement.innerHTML = '<option value="">Error loading instructors</option>';
        }
    }

    resetEditState() {
        this.editingId = null;
        this.editingType = null;
    }

    // ===== VALIDATION METHODS =====
    validateEmailFormat(email) {
        // Must be: letters/numbers@facultyname(letters).edu.eg
        // Example: ahmed.mohammed@auc.edu.eg, student123@cu.edu.eg
        // NOT allowed: aaa@aa.com.edu.eg, test@123.edu.eg
        const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z]+\.edu\.eg$/i;
        return emailRegex.test(email);
    }

    validateNameFormat(name) {
        // Allow letters, spaces, hyphens, apostrophes
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        return nameRegex.test(name);
    }

    validateStudentCode(code) {
        // Must start with letter, contain only letters and numbers
        const codeRegex = /^[a-zA-Z][a-zA-Z0-9]*$/;
        return codeRegex.test(code);
    }

    validateContactNumber(number) {
        // Must be exactly 11 digits
        const numberRegex = /^\d{11}$/;
        return numberRegex.test(number);
    }

    validatePassword(password) {
        // Must have: uppercase, lowercase, number, special char, min 8 chars
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[@$!%*?&]/.test(password);
        const isMinLength = password.length >= 8;

        return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && isMinLength;
    }

    logActivity(action, details) {
        // Simple activity logger - could be enhanced to persist activities
        const timestamp = new Date().toLocaleString();
        console.log(`[${timestamp}] ${action}: ${details}`);
        
        // Optional: Store in localStorage for activity tracking
        try {
            const activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
            activities.unshift({ timestamp, action, details });
            // Keep only last 50 activities
            if (activities.length > 50) activities.pop();
            localStorage.setItem('adminActivities', JSON.stringify(activities));
        } catch (e) {
            console.error('Failed to log activity:', e);
        }
    }

    showToast(title, message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        const toastHtml = `
            <div class="alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show" role="alert">
                <strong>${title}</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        alertContainer.innerHTML = toastHtml;

        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) {
                new bootstrap.Alert(alert).close();
            }
        }, 5000);
    }

    // ===== ENROLLMENT CRUD =====
    async loadEnrollments() {
        console.log('📋 Loading enrollments...');
        
        // Clear any cached data first
        this.allEnrollments = [];
        
        // Use getAll to get only active enrollments
        const response = await API.enrollment.getAll();
        const tbody = document.getElementById('enrollmentsTableBody');

        console.log('📊 Enrollment response:', response);

        if (response.success && response.data) {
            // Handle multiple possible response structures
            let enrollments = response.data.Data || response.data.data || response.data;
            
            if (!Array.isArray(enrollments)) {
                console.warn('⚠️ Unexpected enrollment data structure:', enrollments);
                tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Unexpected data format</td></tr>';
                return;
            }
            
            console.log(`📦 Active enrollments from API: ${enrollments.length}`);
            if (enrollments.length > 0) {
                console.log('🔍 Sample enrollment:', enrollments[0]);
                console.log('📋 All enrollment IDs:', enrollments.map(e => e.EnrollmentId || e.enrollmentId));
            }
            
            // Store all enrollments for filtering
            this.allEnrollments = enrollments;
            
            // Display all enrollments initially
            this.displayEnrollments(enrollments);
        } else {
            console.error('❌ Failed to load enrollments:', response.error);
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Failed to load enrollments: ${response.error || 'Unknown error'}</td></tr>`;
        }
    }

    async loadRejectedEnrollments() {
        console.log('📖 Loading rejected enrollments...');
        const response = await API.enrollment.getAllIncludingDeleted();
        const tbody = document.getElementById('rejectedEnrollmentsTableBody');

        if (response.success && response.data) {
            let enrollments = response.data.Data || response.data.data || response.data;
            
            if (!Array.isArray(enrollments)) {
                tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Unexpected data format</td></tr>';
                return;
            }
            
            // Filter only rejected or soft-deleted enrollments
            const rejectedEnrollments = enrollments.filter(e => 
                (e.Status === 'Rejected' || e.status === 'Rejected') ||
                (e.IsDeleted || e.isDeleted)
            );
            
            console.log(`📊 Rejected Enrollments: ${rejectedEnrollments.length}`);
            
            if (rejectedEnrollments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No rejected enrollments found</td></tr>';
                return;
            }

            tbody.innerHTML = rejectedEnrollments.map(enroll => {
                const studentName = enroll.StudentName || enroll.studentName || 'N/A';
                const courseName = enroll.CourseName || enroll.courseName || 'N/A';
                const courseCode = enroll.CourseCode || enroll.courseCode || '-';
                const deptName = enroll.DepartmentName || enroll.departmentName || '-';
                const credits = enroll.CreditHours || enroll.creditHours || '-';
                const enrollmentId = enroll.EnrollmentId || enroll.enrollmentId;
                const enrollDate = enroll.EnrollmentDate || enroll.enrollmentDate;
                const isDeleted = enroll.IsDeleted || enroll.isDeleted;
                
                const statusBadge = isDeleted ? 'bg-secondary' : 'bg-danger';
                const statusText = isDeleted ? 'Deleted' : 'Rejected';
                const dateDisplay = enrollDate ? new Date(enrollDate).toLocaleDateString() : '-';
                const rowClass = 'table-secondary';
                
                return `
                <tr class="${rowClass}">
                    <td>
                        <small>${studentName}</small>
                    </td>
                    <td>
                        <small>${courseName}</small>
                        <span class="badge ${statusBadge} ms-2">${statusText}</span>
                    </td>
                    <td><strong>${courseCode}</strong></td>
                    <td><small>${deptName}</small></td>
                    <td>${credits}</td>
                    <td><small>${dateDisplay}</small></td>
                    <td>
                        <button class="btn btn-sm btn-success me-1" onclick="adminDashboard.restoreEnrollment(${enrollmentId})" title="Restore Enrollment">
                            <i class="bi bi-arrow-counterclockwise"></i> Restore
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.confirmPermanentDeleteEnrollment(${enrollmentId})" title="Permanent Delete">
                            <i class="bi bi-trash-fill"></i> Delete Forever
                        </button>
                    </td>
                </tr>
            `}).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Failed to load rejected enrollments</td></tr>';
        }
    }

    displayEnrollments(enrollments) {
        const tbody = document.getElementById('enrollmentsTableBody');
        
        if (enrollments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No enrollments found</td></tr>';
            return;
        }

        tbody.innerHTML = enrollments.map(enroll => {
            // Handle both PascalCase and camelCase properties
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
            
            // Status badge colors
            const statusBadge = status === 'Enrolled' ? 'bg-success' : 
                               status === 'Pending' ? 'bg-warning' :
                               status === 'Rejected' ? 'bg-danger' :
                               status === 'Completed' ? 'bg-info' : 'bg-secondary';
            
            const gradeDisplay = finalGrade ? 
                `${finalGrade.toFixed(1)}% (${gradeLetter || '-'})` : '-';
            const dateDisplay = enrollDate ? new Date(enrollDate).toLocaleDateString() : '-';
            
            // Action buttons depend on status
            let actionButtons = '';
            if (status === 'Pending') {
                actionButtons = `
                    <button class="btn btn-sm btn-success me-1" onclick="adminDashboard.approveEnrollment(${enrollmentId})" title="Approve Enrollment">
                        <i class="bi bi-check-circle"></i> Approve
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="adminDashboard.rejectEnrollment(${enrollmentId})" title="Reject (Soft Delete)">
                        <i class="bi bi-x-circle"></i> Reject
                    </button>
                `;
            } else {
                // All other statuses (Enrolled, Completed, etc.) - Hard Delete
                actionButtons = `
                    <button class="btn btn-sm btn-danger" onclick="adminDashboard.hardDeleteEnrollment(${enrollmentId})" title="Permanently Delete">
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
                <td>
                    ${actionButtons}
                </td>
            </tr>
        `}).join('');
    }

    filterEnrollments() {
        const searchText = document.getElementById('enrollmentSearchInput').value.toLowerCase().trim();
        const statusFilter = document.getElementById('enrollmentStatusFilter').value;

        // Check if data is loaded
        if (!this.allEnrollments || !Array.isArray(this.allEnrollments)) {
            console.warn('⚠️ No enrollment data to filter');
            return;
        }

        let filtered = this.allEnrollments;

        // Filter by status
        if (statusFilter) {
            filtered = filtered.filter(enroll => {
                const status = enroll.Status || enroll.status || '';
                return status === statusFilter;
            });
        }

        // Filter by search text
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
    }

    async deleteEnrollment(id) {
        console.log('🗑️ Deleting enrollment:', id);
        
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        document.getElementById('deleteMessage').textContent = 'Are you sure you want to remove this enrollment?';
        
        window.deleteConfirmId = id;
        window.deleteConfirmType = 'enrollment';
        
        deleteModal.show();
    }

    async hardDeleteEnrollment(enrollmentId) {
        console.log('🔥 Hard Delete Enrollment ID:', enrollmentId);
        console.log('🔍 Current enrollment IDs in table:', this.allEnrollments.map(e => e.EnrollmentId || e.enrollmentId));
        
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        document.getElementById('deleteMessage').textContent = `⚠️ WARNING: This will PERMANENTLY delete enrollment ID ${enrollmentId} from the database. This action cannot be undone! Are you sure?`;
        
        window.deleteConfirmId = enrollmentId;
        window.deleteConfirmType = 'enrollment-hard';
        
        deleteModal.show();
    }

    // ===== ENROLLMENT APPROVAL METHODS =====
    async approveEnrollment(enrollmentId) {
        console.log('✅ Approving enrollment:', enrollmentId);
        
        try {
            const response = await API.enrollment.approve(enrollmentId);
            
            console.log('📊 Approve response:', response);
            
            if (response.success) {
                this.showToast('Success', 'Enrollment approved successfully!', 'success');
                await this.loadEnrollments();
                this.filterEnrollments(); // Reapply filter
                this.loadDashboardData();
            } else {
                let errorMsg = response.error || response.data?.Message || response.data?.message || 'Failed to approve enrollment';
                this.showToast('Error', errorMsg, 'error');
            }
        } catch (error) {
            console.error('❌ Approve error:', error);
            this.showToast('Error', '❌ Failed to approve enrollment: ' + error.message, 'error');
        }
    }

    async rejectEnrollment(enrollmentId) {
        console.log('❌ Rejecting enrollment:', enrollmentId);
        
        try {
            // Use the reject endpoint to change status to "Rejected"
            const response = await API.enrollment.reject(enrollmentId);
            
            console.log('📊 Reject response:', response);
            
            if (response.success) {
                this.showToast('Success', 'Enrollment rejected successfully!', 'success');
                await this.loadEnrollments();
                this.filterEnrollments();
                this.loadDashboardData();
            } else {
                let errorMsg = response.error || response.data?.Message || response.data?.message || 'Failed to reject enrollment';
                this.showToast('Error', errorMsg, 'error');
            }
        } catch (error) {
            console.error('❌ Reject error:', error);
            this.showToast('Error', '❌ Failed to reject enrollment: ' + error.message, 'error');
        }
    }

    async confirmPermanentDeleteEnrollment(enrollmentId) {
        console.log('🗑️ PERMANENT DELETE ENROLLMENT CLICKED:', enrollmentId);
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        document.getElementById('deleteMessage').textContent = '⚠️ WARNING: This will PERMANENTLY delete this enrollment from the database. This action cannot be undone! Are you sure?';
        
        window.deleteConfirmId = enrollmentId;
        window.deleteConfirmType = 'enrollment-permanent';
        
        console.log('📋 Set delete type to:', window.deleteConfirmType, 'with ID:', window.deleteConfirmId);
        deleteModal.show();
    }

    // Bulk delete first N enrollments permanently
    async bulkDeleteFirstEnrollments(count = 3) {
        console.log(`🔥 BULK DELETE: Starting to permanently delete first ${count} enrollments...`);
        
        if (!this.allEnrollments || this.allEnrollments.length === 0) {
            this.showToast('Error', 'No enrollments loaded. Please refresh the page.', 'error');
            return;
        }

        const enrollmentsToDelete = this.allEnrollments.slice(0, count);
        console.log('📋 Enrollments to delete:', enrollmentsToDelete);

        if (confirm(`⚠️ WARNING: This will PERMANENTLY delete the first ${count} enrollments:\n\n${enrollmentsToDelete.map((e, i) => `${i+1}. ${e.StudentName || e.studentName} - ${e.CourseName || e.courseName}`).join('\n')}\n\nThis action CANNOT be undone! Are you absolutely sure?`)) {
            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < enrollmentsToDelete.length; i++) {
                const enrollment = enrollmentsToDelete[i];
                const enrollmentId = enrollment.EnrollmentId || enrollment.enrollmentId;
                
                console.log(`🗑️ [${i+1}/${count}] Deleting enrollment ID ${enrollmentId}...`);
                
                try {
                    const response = await API.enrollment.hardDelete(enrollmentId);
                    
                    if (response.success) {
                        successCount++;
                        console.log(`✅ [${i+1}/${count}] Successfully deleted enrollment ${enrollmentId}`);
                    } else {
                        failCount++;
                        console.error(`❌ [${i+1}/${count}] Failed to delete enrollment ${enrollmentId}:`, response.error);
                    }
                } catch (error) {
                    failCount++;
                    console.error(`❌ [${i+1}/${count}] Error deleting enrollment ${enrollmentId}:`, error);
                }
                
                // Small delay between deletions
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Show results
            if (successCount === count) {
                this.showToast('Success', `✅ Successfully deleted all ${count} enrollments permanently!`, 'success');
            } else if (successCount > 0) {
                this.showToast('Partial Success', `⚠️ Deleted ${successCount} of ${count} enrollments. ${failCount} failed.`, 'warning');
            } else {
                this.showToast('Error', `❌ Failed to delete any enrollments. Please check console for details.`, 'error');
            }

            // Get IDs of successfully deleted enrollments
            const deletedIds = enrollmentsToDelete.slice(0, successCount).map(e => e.EnrollmentId || e.enrollmentId);
            
            // Immediately update UI by filtering out deleted enrollments
            this.allEnrollments = this.allEnrollments.filter(e => {
                const id = e.EnrollmentId || e.enrollmentId;
                return !deletedIds.includes(id);
            });
            this.displayEnrollments(this.allEnrollments);
            console.log(`✅ UI updated: Removed ${successCount} enrollments - Remaining:`, this.allEnrollments.length);
            
            // Refresh dashboard counts
            await this.loadDashboardData();
        }
    }

    async restoreEnrollment(enrollmentId) {
        console.log('↩️ Restoring enrollment:', enrollmentId);
        
        try {
            const response = await API.enrollment.restore(enrollmentId);
            console.log('📊 Restore response:', response);
            console.log('Response data:', response.data);
            
            if (response.success || response.status === 200) {
                this.showToast('Success', 'Enrollment restored successfully!', 'success');
                // Wait for backend to complete
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Check if we're on rejected enrollments page
                if (document.getElementById('rejectedEnrollmentsTableBody')) {
                    this.loadRejectedEnrollments();
                } else {
                    // Clear cache and reload
                    this.allEnrollments = [];
                    await this.loadEnrollments();
                    this.filterEnrollments();
                }
                this.loadDashboardData();
            } else {
                let errorMsg = response.data?.Message || response.data?.message || response.error || 'Failed to restore enrollment';
                console.error('❌ Restore failed:', errorMsg);
                this.showToast('Error', errorMsg, 'error');
            }
        } catch (error) {
            console.error('❌ Restore error:', error);
            this.showToast('Error', '❌ Failed to restore enrollment: ' + error.message, 'error');
        }
    }
}

// Initialize Admin Dashboard
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token || API.isTokenExpired()) {
        window.location.href = '../index.html';
    } else {
        adminDashboard = new AdminDashboard();

        // Switch sections and load data
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                
                // Hide all sections
                document.querySelectorAll('.section').forEach(s => s.classList.add('d-none'));
                // Show selected section
                const selectedSection = document.getElementById(section);
                if (selectedSection) {
                    selectedSection.classList.remove('d-none');
                    
                    // Load data for section
                    if (section === 'instructors') {
                        adminDashboard.loadInstructorSelects();
                        adminDashboard.loadInstructors();
                    }
                    if (section === 'students') adminDashboard.loadStudents();
                    if (section === 'departments') {
                        adminDashboard.loadInstructorSelects();
                        adminDashboard.loadDepartments();
                    }
                    if (section === 'courses') {
                        adminDashboard.loadDepartmentSelects();
                        adminDashboard.loadCourses();
                    }
                    if (section === 'enrollments') {
                        adminDashboard.loadEnrollments();
                    }
                    if (section === 'profile') {
                        adminDashboard.loadAdminProfile();
                    }
                }

                // Update active nav link
                document.querySelectorAll('[data-section]').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Load initial selects for modals
        adminDashboard.loadDepartmentSelects();
        adminDashboard.loadInstructorSelects();
        adminDashboard.setupCourseFormListeners();
    }
});

// =====================================================
// CHART INITIALIZATION AND DATA VISUALIZATION
// =====================================================

AdminDashboard.prototype.initializeCharts = function() {
    console.log('📊 Initializing dashboard charts...');
    
    // Enrollment Trend Chart
    const enrollmentCtx = document.getElementById('enrollmentTrendChart');
    if (enrollmentCtx) {
        this.charts.enrollmentTrend = new Chart(enrollmentCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Enrollments',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#476247',
                    backgroundColor: 'rgba(71, 98, 71, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#476247',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(71, 98, 71, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        borderRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#8b7d6f'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#8b7d6f'
                        }
                    }
                }
            }
        });
    }

    // Department Distribution Chart
    const departmentCtx = document.getElementById('departmentChart');
    if (departmentCtx) {
        this.charts.departmentDist = new Chart(departmentCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#476247',
                        '#8b7d6f',
                        '#c9905e',
                        '#6b8ba8',
                        '#5a8a5a',
                        '#b85c5c'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            },
                            color: '#6d6156'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(71, 98, 71, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        borderRadius: 8
                    }
                }
            }
        });
    }

    // Course Stats Chart
    const courseStatsCtx = document.getElementById('courseStatsChart');
    if (courseStatsCtx) {
        this.charts.courseStats = new Chart(courseStatsCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Students Enrolled',
                    data: [],
                    backgroundColor: [
                        'rgba(71, 98, 71, 0.8)',
                        'rgba(139, 125, 111, 0.8)',
                        'rgba(201, 144, 94, 0.8)',
                        'rgba(107, 139, 168, 0.8)',
                        'rgba(90, 138, 90, 0.8)'
                    ],
                    borderRadius: 8,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(71, 98, 71, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        borderRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#8b7d6f'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#8b7d6f'
                        }
                    }
                }
            }
        });
    }

    // Load chart data
    this.loadChartData();
};

AdminDashboard.prototype.loadChartData = async function() {
    console.log('📈 Loading chart data...');
    
    try {
        // Load enrollment data for trend chart
        const enrollmentsResponse = await API.enrollment.getAll(1, 1000);
        console.log('📊 Raw enrollments response:', enrollmentsResponse);
        
        if (enrollmentsResponse.success && enrollmentsResponse.data) {
            const enrollments = enrollmentsResponse.data.data || enrollmentsResponse.data;
            console.log('📊 Parsed enrollments array:', enrollments);
            console.log('📊 Total enrollments:', enrollments.length);
            if (enrollments.length > 0) {
                console.log('📊 Sample enrollment:', enrollments[0]);
            }
            this.updateEnrollmentTrendChart(enrollments);
        }

        // Load department data
        const departmentsResponse = await API.department.getAll(1, 100);
        if (departmentsResponse.success && departmentsResponse.data) {
            const departments = departmentsResponse.data.data || departmentsResponse.data;
            console.log('🏢 Departments:', departments);
            await this.updateDepartmentChart(departments);
        }

        // Load course enrollment stats
        const coursesResponse = await API.course.getAll(1, 100);
        console.log('📚 Raw courses response:', coursesResponse);
        
        if (coursesResponse.success && coursesResponse.data) {
            const courses = coursesResponse.data.data || coursesResponse.data;
            console.log('📚 Parsed courses array:', courses);
            console.log('📚 Total courses:', courses.length);
            if (courses.length > 0) {
                console.log('📚 Sample course:', courses[0]);
            }
            await this.updateCourseStatsChart(courses);
        }

        // Add activity log
        this.addActivity('Charts loaded successfully', 'sage');
    } catch (error) {
        console.error('❌ Error loading chart data:', error);
        this.addActivity('Failed to load chart data', 'warm');
    }
};

AdminDashboard.prototype.updateEnrollmentTrendChart = function(enrollments) {
    if (!this.charts.enrollmentTrend || !Array.isArray(enrollments)) return;
    
    console.log('📊 Updating enrollment trend chart with', enrollments.length, 'enrollments');
    
    // Count enrollments per month (for current year)
    const monthCounts = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    
    enrollments.forEach(enrollment => {
        const dateField = enrollment.enrollmentDate || enrollment.EnrollmentDate || enrollment.createdAt || enrollment.CreatedAt;
        if (dateField) {
            const date = new Date(dateField);
            if (date.getFullYear() === currentYear) {
                const month = date.getMonth();
                monthCounts[month]++;
            }
        }
    });
    
    console.log('📈 Monthly enrollment counts:', monthCounts);
    this.charts.enrollmentTrend.data.datasets[0].data = monthCounts;
    this.charts.enrollmentTrend.update('active');
};

AdminDashboard.prototype.updateDepartmentChart = async function(departments) {
    if (!this.charts.departmentDist) {
        console.error('❌ Department chart not initialized');
        return;
    }
    
    if (!Array.isArray(departments)) {
        console.error('❌ Departments is not an array:', departments);
        return;
    }
    
    console.log('📊 Updating department chart with', departments.length, 'departments');
    
    const labels = [];
    const data = [];
    
    try {
        // Get all students once
        console.log('📊 Fetching students for department chart...');
        const studentsResponse = await API.student.getAll(1, 1000);
        console.log('📊 Students response:', studentsResponse);
        
        if (studentsResponse.success && studentsResponse.data) {
            const allStudents = studentsResponse.data.data || studentsResponse.data;
            console.log('📊 Total students fetched:', allStudents.length);
            
            if (allStudents.length > 0) {
                console.log('📊 Sample student:', allStudents[0]);
            }
            
            // Get student count per department (top 6)
            for (const dept of departments.slice(0, 6)) {
                labels.push(dept.name || 'Unknown');
                const count = allStudents.filter(s => {
                    const studentDeptId = s.departmentId || s.DepartmentId;
                    return studentDeptId === dept.id;
                }).length;
                console.log(`📊 Department "${dept.name}" (ID: ${dept.id}): ${count} students`);
                data.push(count);
            }
        } else {
            console.error('❌ Failed to fetch students:', studentsResponse);
        }
    } catch (error) {
        console.error('❌ Error updating department chart:', error);
    }
    
    console.log('🎨 Department labels:', labels);
    console.log('🎨 Department data:', data);
    
    this.charts.departmentDist.data.labels = labels;
    this.charts.departmentDist.data.datasets[0].data = data;
    this.charts.departmentDist.update('active');
};

AdminDashboard.prototype.updateCourseStatsChart = async function(courses) {
    if (!this.charts.courseStats || !Array.isArray(courses)) return;
    
    console.log('📊 Updating course stats chart with', courses.length, 'courses');
    
    const labels = [];
    const data = [];
    
    // Get all enrollments
    const enrollmentsResponse = await API.enrollment.getAll(1, 1000);
    console.log('📊 Course chart - enrollments response:', enrollmentsResponse);
    
    if (enrollmentsResponse.success && enrollmentsResponse.data) {
        const enrollments = enrollmentsResponse.data.data || enrollmentsResponse.data;
        console.log('📊 Course chart - total enrollments:', enrollments.length);
        
        if (enrollments.length > 0) {
            console.log('📊 Course chart - sample enrollment:', enrollments[0]);
            console.log('📊 Course chart - enrollment keys:', Object.keys(enrollments[0]));
        }
        
        // Count enrollments per course
        const courseEnrollments = {};
        enrollments.forEach(e => {
            // Try multiple possible field names
            const courseId = e.courseId || e.CourseId || e.course_id || e.COURSEID;
            console.log('📊 Processing enrollment - courseId:', courseId, 'Full object:', e);
            
            if (courseId) {
                courseEnrollments[courseId] = (courseEnrollments[courseId] || 0) + 1;
            }
        });
        
        console.log('📊 Course enrollments map:', courseEnrollments);
        
        // Get top 5 courses
        const topCourses = Object.entries(courseEnrollments)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        console.log('📊 Top 5 courses:', topCourses);
        
        topCourses.forEach(([courseId, count]) => {
            console.log('📊 Looking for course with ID:', courseId, 'Type:', typeof courseId);
            const course = courses.find(c => {
                console.log('📊 Comparing with course ID:', c.id, 'Type:', typeof c.id);
                return c.id == courseId;
            });
            if (course) {
                console.log('📊 Found course:', course.name);
                labels.push(course.name || `Course ${courseId}`);
                data.push(count);
            } else {
                console.warn('📊 Course not found for ID:', courseId);
            }
        });
    }
    
    console.log('📚 Final course labels:', labels);
    console.log('📚 Final course data:', data);
    
    this.charts.courseStats.data.labels = labels;
    this.charts.courseStats.data.datasets[0].data = data;
    this.charts.courseStats.update('active');
};

AdminDashboard.prototype.refreshCharts = function() {
    console.log('🔄 Refreshing charts...');
    this.loadChartData();
    showNotification('Charts refreshed successfully', 'success');
};

AdminDashboard.prototype.addActivity = function(text, type = 'sage') {
    const activityFeed = document.getElementById('activityFeed');
    if (!activityFeed) return;
    
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    const icons = {
        'sage': 'bi-check-circle-fill',
        'warm': 'bi-exclamation-triangle-fill',
        'beige': 'bi-info-circle-fill'
    };
    
    activityItem.innerHTML = `
        <div class="activity-icon ${type}">
            <i class="bi ${icons[type] || icons.sage}"></i>
        </div>
        <div class="activity-content">
            <p class="activity-text">${text}</p>
            <small class="activity-time">Just now</small>
        </div>
    `;
    
    // Add to top of feed
    activityFeed.insertBefore(activityItem, activityFeed.firstChild);
    
    // Keep only last 5 activities
    while (activityFeed.children.length > 5) {
        activityFeed.removeChild(activityFeed.lastChild);
    }
};

// ===== ENHANCED INSTRUCTOR VALIDATION & UX =====
// Real-time validation for instructor form fields
AdminDashboard.prototype.setupInstructorValidation = function() {
    const emailInput = document.getElementById('instructorEmail');
    const firstNameInput = document.getElementById('instructorFirstName');
    const lastNameInput = document.getElementById('instructorLastName');
    const phoneInput = document.getElementById('instructorPhone');
    const passwordInput = document.getElementById('instructorPassword');
    const togglePassword = document.getElementById('toggleInstructorPassword');

    // Real-time email validation
    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            const value = emailInput.value.trim();
            if (value && !this.validateEmailFormat(value)) {
                emailInput.classList.add('is-invalid');
                document.getElementById('instructorEmailError').textContent = 'Email must be university format (e.g., user@example.edu.eg)';
            } else {
                emailInput.classList.remove('is-invalid');
            }
        });
    }

    // Real-time name validation
    if (firstNameInput) {
        firstNameInput.addEventListener('blur', () => {
            const value = firstNameInput.value.trim();
            if (value && !this.validateNameFormat(value)) {
                firstNameInput.classList.add('is-invalid');
                document.getElementById('instructorFirstNameError').textContent = 'Only letters, spaces, hyphens, and apostrophes allowed';
            } else {
                firstNameInput.classList.remove('is-invalid');
            }
        });
    }

    if (lastNameInput) {
        lastNameInput.addEventListener('blur', () => {
            const value = lastNameInput.value.trim();
            if (value && !this.validateNameFormat(value)) {
                lastNameInput.classList.add('is-invalid');
                document.getElementById('instructorLastNameError').textContent = 'Only letters, spaces, hyphens, and apostrophes allowed';
            } else {
                lastNameInput.classList.remove('is-invalid');
            }
        });
    }

    // Real-time phone validation
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            // Allow only digits
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 11);
        });

        phoneInput.addEventListener('blur', () => {
            const value = phoneInput.value.trim();
            if (value && value.length !== 11) {
                phoneInput.classList.add('is-invalid');
                document.getElementById('instructorPhoneError').textContent = 'Must be exactly 11 digits';
            } else {
                phoneInput.classList.remove('is-invalid');
            }
        });
    }

    // Password strength indicator
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });
    }

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            const icon = togglePassword.querySelector('i');
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        });
    }
};

// Password strength checker
AdminDashboard.prototype.updatePasswordStrength = function(password) {
    const progressBar = document.querySelector('#instructorPasswordStrength .progress-bar');
    const strengthText = document.getElementById('strengthText');
    
    if (!progressBar || !strengthText) return;

    if (!password) {
        progressBar.style.width = '0%';
        progressBar.className = 'progress-bar';
        strengthText.textContent = '-';
        return;
    }

    let strength = 0;
    let feedback = [];

    // Check length
    if (password.length >= 8) strength += 20;
    else feedback.push('min 8 chars');

    // Check for lowercase
    if (/[a-z]/.test(password)) strength += 20;
    else feedback.push('lowercase');

    // Check for uppercase
    if (/[A-Z]/.test(password)) strength += 20;
    else feedback.push('uppercase');

    // Check for numbers
    if (/\d/.test(password)) strength += 20;
    else feedback.push('number');

    // Check for special characters
    if (/[@$!%*?&]/.test(password)) strength += 20;
    else feedback.push('special char');

    // Update progress bar
    progressBar.style.width = strength + '%';
    
    // Update color and text based on strength
    if (strength < 40) {
        progressBar.className = 'progress-bar bg-danger';
        strengthText.textContent = 'Weak';
        strengthText.className = 'text-danger';
    } else if (strength < 80) {
        progressBar.className = 'progress-bar bg-warning';
        strengthText.textContent = 'Medium';
        strengthText.className = 'text-warning';
    } else {
        progressBar.className = 'progress-bar bg-success';
        strengthText.textContent = 'Strong';
        strengthText.className = 'text-success';
    }

    // Show missing requirements
    if (feedback.length > 0) {
        strengthText.textContent += ' (need: ' + feedback.join(', ') + ')';
    }
};

// Enhanced instructor form reset with validation setup
AdminDashboard.prototype.resetInstructorFormEnhanced = function() {
    const form = document.getElementById('instructorForm');
    if (form) {
        form.reset();
        form.classList.remove('was-validated');
        
        // Remove all validation classes
        form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
            el.classList.remove('is-invalid', 'is-valid');
        });
    }

    // Reset password strength indicator
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

    // Show business rules, hide edit info
    const businessRules = document.getElementById('instructorBusinessRules');
    const editInfo = document.getElementById('instructorEditInfo');
    if (businessRules) businessRules.classList.remove('d-none');
    if (editInfo) editInfo.classList.add('d-none');

    // Reset modal title and button
    document.getElementById('instructorModalTitle').innerHTML = '<i class="bi bi-person-workspace"></i> Add Instructor';
    document.getElementById('instructorBtnText').textContent = 'Save Instructor';

    // Show password field
    const passwordField = document.getElementById('instructorPasswordField');
    if (passwordField) {
        passwordField.style.display = 'block';
        document.getElementById('instructorPassword').required = true;
    }

    // Re-enable all fields
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

// Call validation setup on page load
if (typeof window.adminDashboard !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (window.adminDashboard) {
            window.adminDashboard.setupInstructorValidation();
            window.adminDashboard.setupStudentValidation();
            window.adminDashboard.setupDepartmentValidation();
            window.adminDashboard.setupCourseValidation();
        }
    });
}

// ===== ENHANCED STUDENT VALIDATION & UX =====
AdminDashboard.prototype.setupStudentValidation = function() {
    const emailInput = document.getElementById('studentEmail');
    const codeInput = document.getElementById('studentCode');
    const firstNameInput = document.getElementById('studentFirstName');
    const lastNameInput = document.getElementById('studentLastName');
    const phoneInput = document.getElementById('studentPhone');
    const passwordInput = document.getElementById('studentPassword');
    const togglePassword = document.getElementById('toggleStudentPassword');

    // Real-time email validation
    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            const value = emailInput.value.trim();
            if (value && !this.validateEmailFormat(value)) {
                emailInput.classList.add('is-invalid');
                document.getElementById('studentEmailError').textContent = 'University format required';
            } else {
                emailInput.classList.remove('is-invalid');
            }
        });
    }

    // Real-time student code validation
    if (codeInput) {
        codeInput.addEventListener('blur', () => {
            const value = codeInput.value.trim();
            if (value && !this.validateStudentCode(value)) {
                codeInput.classList.add('is-invalid');
                document.getElementById('studentCodeError').textContent = 'Must start with letter, letters/numbers only';
            } else {
                codeInput.classList.remove('is-invalid');
            }
        });
    }

    // Real-time name validation
    if (firstNameInput) {
        firstNameInput.addEventListener('blur', () => {
            const value = firstNameInput.value.trim();
            if (value && !this.validateNameFormat(value)) {
                firstNameInput.classList.add('is-invalid');
            } else {
                firstNameInput.classList.remove('is-invalid');
            }
        });
    }

    if (lastNameInput) {
        lastNameInput.addEventListener('blur', () => {
            const value = lastNameInput.value.trim();
            if (value && !this.validateNameFormat(value)) {
                lastNameInput.classList.add('is-invalid');
            } else {
                lastNameInput.classList.remove('is-invalid');
            }
        });
    }

    // Real-time phone validation
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 11);
        });
    }

    // Password strength indicator
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            this.updateStudentPasswordStrength(e.target.value);
        });
    }

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            const icon = togglePassword.querySelector('i');
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        });
    }
};

// Student password strength checker
AdminDashboard.prototype.updateStudentPasswordStrength = function(password) {
    const progressBar = document.querySelector('#studentPasswordStrength .progress-bar');
    const strengthText = document.getElementById('studentStrengthText');
    
    if (!progressBar || !strengthText) return;

    if (!password) {
        progressBar.style.width = '0%';
        progressBar.className = 'progress-bar';
        strengthText.textContent = '-';
        return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[@$!%*?&]/.test(password)) strength += 10;

    progressBar.style.width = strength + '%';
    
    if (strength < 50) {
        progressBar.className = 'progress-bar bg-danger';
        strengthText.textContent = 'Weak';
        strengthText.className = 'text-danger';
    } else if (strength < 85) {
        progressBar.className = 'progress-bar bg-warning';
        strengthText.textContent = 'Medium';
        strengthText.className = 'text-warning';
    } else {
        progressBar.className = 'progress-bar bg-success';
        strengthText.textContent = 'Strong';
        strengthText.className = 'text-success';
    }
};

// Enhanced student form reset
AdminDashboard.prototype.resetStudentFormEnhanced = function() {
    const form = document.getElementById('studentForm');
    if (form) {
        form.reset();
        form.classList.remove('was-validated');
        form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
            el.classList.remove('is-invalid', 'is-valid');
        });
    }

    // Reset password strength
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

    // Show business rules, hide edit info
    const businessRules = document.getElementById('studentBusinessRules');
    const editInfo = document.getElementById('studentEditInfo');
    if (businessRules) businessRules.classList.remove('d-none');
    if (editInfo) editInfo.classList.add('d-none');

    // Reset modal title
    document.getElementById('studentModalTitle').innerHTML = '<i class="bi bi-people"></i> Add Student';
    document.getElementById('studentBtnText').textContent = 'Save Student';

    // Show password field
    const passwordField = document.getElementById('passwordField');
    if (passwordField) {
        passwordField.style.display = 'block';
        document.getElementById('studentPassword').required = true;
    }

    // Re-enable all fields
    ['studentEmail', 'studentFirstName', 'studentLastName', 'studentCode', 'studentPhone'].forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.readOnly = false;
            field.style.backgroundColor = '';
            field.style.cursor = '';
        }
    });

    document.getElementById('emailNote').textContent = 'University format required';
    this.resetEditState();
};

// ===== ENHANCED DEPARTMENT VALIDATION & UX =====
AdminDashboard.prototype.setupDepartmentValidation = function() {
    const nameInput = document.getElementById('departmentName');

    if (nameInput) {
        nameInput.addEventListener('blur', () => {
            const value = nameInput.value.trim();
            if (value && (value.length < 3 || value.length > 100)) {
                nameInput.classList.add('is-invalid');
                document.getElementById('departmentNameError').textContent = 'Must be 3-100 characters';
            } else {
                nameInput.classList.remove('is-invalid');
            }
        });
    }
};

// Enhanced department form reset
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

// ===== ENHANCED COURSE VALIDATION & UX =====
AdminDashboard.prototype.setupCourseValidation = function() {
    const nameInput = document.getElementById('courseName');
    const creditsInput = document.getElementById('courseCredits');
    const deptSelect = document.getElementById('courseDepartment');
    const instSelect = document.getElementById('courseInstructor');

    // Course name validation
    if (nameInput) {
        nameInput.addEventListener('blur', () => {
            const value = nameInput.value.trim();
            if (value) {
                if (value.length < 3 || value.length > 80) {
                    nameInput.classList.add('is-invalid');
                    document.getElementById('courseNameError').textContent = '3-80 characters required';
                } else if (!/[a-zA-Z]/.test(value)) {
                    nameInput.classList.add('is-invalid');
                    document.getElementById('courseNameError').textContent = 'Must contain at least one letter';
                } else {
                    nameInput.classList.remove('is-invalid');
                }
            }
        });
    }

    // Department change handler - load instructors
    if (deptSelect) {
        deptSelect.addEventListener('change', async (e) => {
            const deptId = e.target.value;
            if (deptId) {
                await this.loadInstructorsByDepartment(deptId);
            } else {
                if (instSelect) {
                    instSelect.innerHTML = '<option value="">Select Department First</option>';
                }
            }
        });
    }

    // Instructor change handler - show workload info
    if (instSelect) {
        instSelect.addEventListener('change', async (e) => {
            const instId = e.target.value;
            if (instId) {
                await this.checkInstructorWorkload(instId);
            }
        });
    }
};

// Check instructor workload and show warning
AdminDashboard.prototype.checkInstructorWorkload = async function(instructorId) {
    const warning = document.getElementById('instructorWorkloadWarning');
    const message = document.getElementById('workloadMessage');
    const info = document.getElementById('instructorWorkloadInfo');
    
    if (!instructorId) {
        if (warning) warning.classList.add('d-none');
        return;
    }

    try {
        // Get all courses
        const response = await API.course.getAll(1, 1000);
        if (response.success && response.data) {
            const courses = response.data.data || response.data;
            const instructorCourses = courses.filter(c => c.instructorId == instructorId || c.InstructorId == instructorId);
            
            const courseCount = instructorCourses.length;
            const totalCredits = instructorCourses.reduce((sum, c) => sum + (c.creditHours || c.CreditHours || 0), 0);
            
            // Show info
            if (info) {
                info.innerHTML = `Current: ${courseCount}/2 courses, ${totalCredits}/12 credits`;
                info.className = courseCount >= 2 || totalCredits >= 12 ? 'text-danger' : 'text-success';
            }
            
            // Show warning if limits reached
            if (courseCount >= 2) {
                if (message) message.textContent = 'Instructor already teaching 2 courses (maximum limit)';
                if (warning) warning.classList.remove('d-none');
            } else if (totalCredits >= 12) {
                if (message) message.textContent = 'Instructor at 12 credit hours limit';
                if (warning) warning.classList.remove('d-none');
            } else {
                if (warning) warning.classList.add('d-none');
            }
        }
    } catch (error) {
        console.error('Error checking instructor workload:', error);
    }
};

// Enhanced course form reset
AdminDashboard.prototype.resetCourseFormEnhanced = function() {
    const form = document.getElementById('courseForm');
    if (form) {
        form.reset();
        form.classList.remove('was-validated');
        form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
            el.classList.remove('is-invalid', 'is-valid');
        });
    }

    // Hide workload warning
    const warning = document.getElementById('instructorWorkloadWarning');
    if (warning) warning.classList.add('d-none');
    
    // Reset info
    const info = document.getElementById('instructorWorkloadInfo');
    if (info) {
        info.textContent = 'Instructor workload info will appear here';
        info.className = 'text-muted';
    }

    document.getElementById('courseModalTitle').innerHTML = '<i class="bi bi-book"></i> Add Course';
    document.getElementById('courseBtnText').textContent = 'Save Course';
    document.getElementById('courseInstructor').innerHTML = '<option value="">Select Department First</option>';
    this.resetEditState();
};

