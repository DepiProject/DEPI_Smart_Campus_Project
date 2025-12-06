// =====================================================
// Validation Methods & Chart Functions
// =====================================================

// ===== VALIDATION METHODS =====
AdminDashboard.prototype.validateEmailFormat = function(email) {
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z]+\.edu\.eg$/i;
    return emailRegex.test(email);
};

AdminDashboard.prototype.validateNameFormat = function(name) {
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    return nameRegex.test(name);
};

AdminDashboard.prototype.validateContactNumber = function(number) {
    if (!/^\d{11}$/.test(number)) {
        return { valid: false, message: 'Must be exactly 11 digits' };
    }
    
    const prefix = number.substring(0, 3);
    if (!['010', '011', '012', '015'].includes(prefix)) {
        return { valid: false, message: 'Must start with 010, 011, 012, or 015' };
    }
    
    const last8 = number.substring(3);
    if (new Set(last8).size === 1) {
        return { valid: false, message: 'Invalid number - last 8 digits cannot be all the same' };
    }
    
    return { valid: true, message: '' };
};

AdminDashboard.prototype.validatePassword = function(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    const isMinLength = password.length >= 8;

    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && isMinLength;
};

// ===== INSTRUCTOR VALIDATION =====
AdminDashboard.prototype.setupInstructorValidation = function() {
    const emailInput = document.getElementById('instructorEmail');
    const firstNameInput = document.getElementById('instructorFirstName');
    const lastNameInput = document.getElementById('instructorLastName');
    const phoneInput = document.getElementById('instructorPhone');
    const passwordInput = document.getElementById('instructorPassword');
    const togglePassword = document.getElementById('toggleInstructorPassword');

    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            const value = emailInput.value.trim();
            if (value && !this.validateEmailFormat(value)) {
                emailInput.classList.add('is-invalid');
                document.getElementById('instructorEmailError').textContent = 'Email must be university format';
            } else {
                emailInput.classList.remove('is-invalid');
            }
        });
    }

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

    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 11);
        });

        phoneInput.addEventListener('blur', async () => {
            const value = phoneInput.value.trim();
            const errorElement = document.getElementById('instructorPhoneError');
            
            if (value) {
                const validation = this.validateContactNumber(value);
                if (!validation.valid) {
                    phoneInput.classList.add('is-invalid');
                    errorElement.textContent = validation.message;
                } else {
                    phoneInput.classList.remove('is-invalid');
                    errorElement.textContent = '';
                }
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });
    }

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

    if (password.length >= 8) strength += 20;
    else feedback.push('min 8 chars');

    if (/[a-z]/.test(password)) strength += 20;
    else feedback.push('lowercase');

    if (/[A-Z]/.test(password)) strength += 20;
    else feedback.push('uppercase');

    if (/\d/.test(password)) strength += 20;
    else feedback.push('number');

    if (/[@$!%*?&]/.test(password)) strength += 20;
    else feedback.push('special char');

    progressBar.style.width = strength + '%';
    
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

    if (feedback.length > 0) {
        strengthText.textContent += ' (need: ' + feedback.join(', ') + ')';
    }
};

// ===== STUDENT VALIDATION =====
AdminDashboard.prototype.setupStudentFormValidation = function() {
    const emailField = document.getElementById('studentEmail');
    const firstNameField = document.getElementById('studentFirstName');
    const lastNameField = document.getElementById('studentLastName');
    const phoneField = document.getElementById('studentPhone');
    const passwordField = document.getElementById('studentPassword');
    const togglePassword = document.getElementById('toggleStudentPassword');

    if (emailField) {
        emailField.addEventListener('blur', () => {
            const value = emailField.value.trim();
            if (value && !this.validateEmailFormat(value)) {
                this.showStudentFieldError('studentEmail', 'Must be university format');
            } else if (value) {
                this.clearStudentFieldError('studentEmail');
            }
        });
    }

    if (firstNameField) {
        firstNameField.addEventListener('blur', () => {
            const value = firstNameField.value.trim();
            if (value && !this.validateNameFormat(value)) {
                this.showStudentFieldError('studentFirstName', 'Only letters, spaces, hyphens, apostrophes');
            } else if (value) {
                this.clearStudentFieldError('studentFirstName');
            }
        });
    }

    if (lastNameField) {
        lastNameField.addEventListener('blur', () => {
            const value = lastNameField.value.trim();
            if (value && !this.validateNameFormat(value)) {
                this.showStudentFieldError('studentLastName', 'Only letters, spaces, hyphens, apostrophes');
            } else if (value) {
                this.clearStudentFieldError('studentLastName');
            }
        });
    }

    if (phoneField) {
        phoneField.addEventListener('blur', () => {
            const value = phoneField.value.trim();
            if (value) {
                const validation = this.validateContactNumber(value);
                if (!validation.valid) {
                    this.showStudentFieldError('studentPhone', validation.message);
                } else {
                    this.clearStudentFieldError('studentPhone');
                }
            }
        });
    }

    if (passwordField) {
        passwordField.addEventListener('input', () => {
            const value = passwordField.value;
            if (value && !this.validatePassword(value)) {
                this.showStudentFieldError('studentPassword', 'Min 8 chars, must include: UPPERCASE, lowercase, number, special char');
            } else if (value) {
                this.clearStudentFieldError('studentPassword');
            }
        });
    }

    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordField.type === 'password' ? 'text' : 'password';
            passwordField.type = type;
            const icon = togglePassword.querySelector('i');
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        });
    }
};

AdminDashboard.prototype.clearStudentFieldError = function(fieldId) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.getElementById(fieldId + 'Error');
    if (field) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
    }
    if (errorDiv) errorDiv.textContent = '';
};

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

// ===== DEPARTMENT & COURSE VALIDATION =====
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

AdminDashboard.prototype.setupCourseValidation = function() {
    const nameInput = document.getElementById('courseName');
    const deptSelect = document.getElementById('courseDepartment');

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

    if (deptSelect) {
        deptSelect.addEventListener('change', async (e) => {
            const deptId = e.target.value;
            if (deptId) {
                await this.loadInstructorsByDepartment(deptId);
            }
        });
    }
};

// ===== CHART INITIALIZATION =====
AdminDashboard.prototype.initializeCharts = function() {
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
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    const departmentCtx = document.getElementById('departmentChart');
    if (departmentCtx) {
        this.charts.departmentDist = new Chart(departmentCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#476247', '#8b7d6f', '#c9905e', '#6b8ba8', '#5a8a5a', '#b85c5c'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

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
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    this.loadChartData();
};

AdminDashboard.prototype.loadChartData = async function() {
    console.log('📊 Starting to load chart data...');
    try {
        // Load enrollments for trend chart
        const enrollmentsResponse = await API.enrollment.getAll(1, 1000);
        console.log('📊 Enrollments Response:', enrollmentsResponse);
        if (enrollmentsResponse.success && enrollmentsResponse.data) {
            const enrollments = enrollmentsResponse.data.Data || enrollmentsResponse.data.data || enrollmentsResponse.data;
            console.log('📊 Enrollments for trend chart:', enrollments);
            this.updateEnrollmentTrendChart(enrollments);
        }

        // Load departments for pie chart
        const departmentsResponse = await API.department.getAll(1, 100);
        console.log('📊 Departments Response:', departmentsResponse);
        if (departmentsResponse.success && departmentsResponse.data) {
            const departments = departmentsResponse.data.data || departmentsResponse.data;
            await this.updateDepartmentChart(departments);
        }

        // Load courses for bar chart - MUST load courses first before calling the chart update
        const coursesResponse = await API.course.getAll(1, 100);
        console.log('📊 Courses Response (full):', coursesResponse);
        
        if (coursesResponse.success && coursesResponse.data) {
            let courses = coursesResponse.data.data || coursesResponse.data;
            
            // Ensure courses is an array
            if (!Array.isArray(courses)) {
                console.warn('⚠️ Courses data is not an array, attempting to convert:', courses);
                courses = [];
            }
            
            console.log('📊 Calling updateCourseStatsChart with courses array:', courses);
            console.log('📊 Number of courses:', courses.length);
            
            // Log first course for structure inspection
            if (courses.length > 0) {
                console.log('📊 Sample course structure:', courses[0]);
            }
            
            await this.updateCourseStatsChart(courses);
        } else {
            console.error('❌ Failed to load courses - response not successful');
        }

        this.addActivity('Charts loaded successfully', 'sage');
    } catch (error) {
        console.error('❌ Error loading chart data:', error);
        this.addActivity('Failed to load chart data', 'warm');
    }
};

AdminDashboard.prototype.updateEnrollmentTrendChart = function(enrollments) {
    if (!this.charts.enrollmentTrend || !Array.isArray(enrollments)) return;
    
    const monthCounts = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    
    enrollments.forEach(enrollment => {
        const dateField = enrollment.enrollmentDate || enrollment.EnrollmentDate || 
                         enrollment.createdAt || enrollment.CreatedAt;
        if (dateField) {
            const date = new Date(dateField);
            if (date.getFullYear() === currentYear) {
                monthCounts[date.getMonth()]++;
            }
        }
    });
    
    this.charts.enrollmentTrend.data.datasets[0].data = monthCounts;
    this.charts.enrollmentTrend.update('active');
};

AdminDashboard.prototype.updateDepartmentChart = async function(departments) {
    if (!this.charts.departmentDist || !Array.isArray(departments)) return;
    
    const labels = [];
    const data = [];
    
    try {
        const studentsResponse = await API.student.getAll(1, 1000);
        
        if (studentsResponse.success && studentsResponse.data) {
            const allStudents = studentsResponse.data.data || studentsResponse.data;
            
            for (const dept of departments.slice(0, 6)) {
                labels.push(dept.name || 'Unknown');
                const count = allStudents.filter(s => {
                    const studentDeptId = s.departmentId || s.DepartmentId;
                    return studentDeptId === dept.id;
                }).length;
                data.push(count);
            }
        }
    } catch (error) {
        console.error('❌ Error updating department chart:', error);
    }
    
    this.charts.departmentDist.data.labels = labels;
    this.charts.departmentDist.data.datasets[0].data = data;
    this.charts.departmentDist.update('active');
};

AdminDashboard.prototype.updateCourseStatsChart = async function(courses) {
    if (!this.charts.courseStats) {
        console.log('📊 Course Stats - Chart not initialized');
        return;
    }
    
    if (!Array.isArray(courses)) {
        console.log('📊 Course Stats - Invalid courses (not an array)');
        // Set empty data
        this.charts.courseStats.data.labels = ['No Data'];
        this.charts.courseStats.data.datasets[0].data = [0];
        this.charts.courseStats.update('active');
        return;
    }
    
    const labels = [];
    const data = [];
    
    try {
        const enrollmentsResponse = await API.enrollment.getAll(1, 1000);
        console.log('📊 Course Stats - Enrollments Response:', enrollmentsResponse);
        
        if (enrollmentsResponse.success && enrollmentsResponse.data) {
            let enrollments = enrollmentsResponse.data.Data || enrollmentsResponse.data.data || enrollmentsResponse.data;
            
            if (!Array.isArray(enrollments)) {
                console.warn('⚠️ Enrollments is not an array:', enrollments);
                enrollments = [];
            }
            
            // Filter only enrolled/active enrollments
            enrollments = enrollments.filter(e => {
                const status = e.status || e.Status;
                return status === 'Enrolled' || status === 'Pending';
            });
            
            console.log('📊 Course Stats - Active Enrollments:', enrollments);
            console.log('📊 Course Stats - Available Courses:', courses);
            
            // Log first enrollment to see structure
            if (enrollments.length > 0) {
                console.log('📊 Sample Enrollment Object:', enrollments[0]);
                console.log('📊 Enrollment Keys:', Object.keys(enrollments[0]));
            }
            
            // Count enrollments by course name (since courseId is not in the DTO)
            const courseEnrollments = {};
            enrollments.forEach((e, index) => {
                // Get course name from the enrollment
                const courseName = e.courseName || e.CourseName || e.course_name || e.Course_Name;
                
                console.log(`📊 Enrollment ${index + 1} - CourseName found:`, courseName);
                
                if (courseName) {
                    courseEnrollments[courseName] = (courseEnrollments[courseName] || 0) + 1;
                } else {
                    console.warn('⚠️ No courseName found in enrollment:', e);
                }
            });
            
            console.log('📊 Course Stats - Course Enrollments Map (by name):', courseEnrollments);
            
            // Get all courses sorted by enrollment count (show all, not just top 5)
            const topCourses = Object.entries(courseEnrollments)
                .sort((a, b) => b[1] - a[1]);
            
            console.log('📊 Course Stats - All Courses with Enrollments:', topCourses);
            
            // Add to chart data
            topCourses.forEach(([courseName, count]) => {
                labels.push(courseName);
                data.push(count);
                console.log(`📊 Added to chart: ${courseName} - ${count} students`);
            });
            
            console.log('📊 Course Stats - Final Chart Data:', { labels, data });
        }
    } catch (error) {
        console.error('❌ Error updating course stats chart:', error);
    }
    
    // If no data, show a placeholder
    if (labels.length === 0 || data.length === 0) {
        console.log('⚠️ No enrollment data available for chart');
        this.charts.courseStats.data.labels = ['No Data'];
        this.charts.courseStats.data.datasets[0].data = [0];
    } else {
        this.charts.courseStats.data.labels = labels;
        this.charts.courseStats.data.datasets[0].data = data;
    }
    
    this.charts.courseStats.update('active');
    console.log('📊 Course Stats Chart Updated - Labels:', this.charts.courseStats.data.labels, 'Data:', this.charts.courseStats.data.datasets[0].data);
};

AdminDashboard.prototype.refreshCharts = function() {
    this.loadChartData();
    this.showToast('Charts Refreshed', 'Dashboard charts updated', 'success');
};