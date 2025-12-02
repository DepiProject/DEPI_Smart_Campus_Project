// =====================================================
// Student Dashboard Handler - API Integrated Version
// =====================================================

class StudentDashboard {
    constructor() {
        this.studentId = null; // Will be loaded from profile
        this.studentInfo = null;
        // Pagination managers for each table
        this.coursesPagination = null;
        this.attendancePagination = null;
        this.gradesPagination = null;
        this.initializeEventListeners();
        this.setupNavigation();
        this.initializeStudent();
    }

    // Initialize student by loading profile first to get actual student ID
    async initializeStudent() {
        try {
            console.log('🔄 Initializing student dashboard...');
            
            // Load student profile first to get the actual student ID
            const profileResponse = await API.student.getMyProfile();
            
            if (profileResponse.success && profileResponse.data) {
                const profile = profileResponse.data.Data || 
                               profileResponse.data.data || 
                               profileResponse.data;
                
                // Get the actual student ID from the profile (StudentId field from StudentDTO)
                this.studentId = profile.StudentId || profile.studentId;
                this.studentInfo = profile;
                
                console.log('✅ Student ID loaded from profile:', this.studentId);
                console.log('👤 Student Info:', this.studentInfo);
                
                if (!this.studentId) {
                    console.error('❌ Student ID not found in profile:', profile);
                    this.showToast('Error', 'Student ID not found. Please contact administrator.', 'error');
                    return;
                }
                
                // Now load dashboard data with the correct student ID
                await this.loadUserName();
                await this.loadDashboardData();
            } else {
                console.error('❌ Failed to load student profile:', profileResponse);
                this.showToast('Error', 'Failed to load student profile. Please log in again.', 'error');
            }
        } catch (error) {
            console.error('❌ Error initializing student:', error);
            this.showToast('Error', 'Failed to initialize student dashboard', 'error');
        }
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Enroll button
        document.getElementById('enrollBtn').addEventListener('click', () => this.enrollCourse());
        
        // Profile form submit listener
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        
        // Modal reset
        const enrollModal = document.getElementById('enrollModal');
        if (enrollModal) {
            enrollModal.addEventListener('hidden.bs.modal', () => {
                document.getElementById('enrollForm').reset();
            });
        }
    }

    // Setup section navigation
    setupNavigation() {
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.switchSection(section);
            });
        });
    }

    // Switch between sections
    switchSection(section) {
        console.log(`🔄 Switching to section: ${section}`);
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(s => s.classList.add('d-none'));
        
        // Show selected section
        const selectedSection = document.getElementById(section);
        if (selectedSection) {
            selectedSection.classList.remove('d-none');
            
            // Load data for section based on what's visible
            switch(section) {
                case 'courses':
                    this.loadEnrolledCourses();
                    this.loadAvailableCoursesDisplay();
                    break;
                case 'attendance':
                    this.loadAttendance();
                    break;
                case 'grades':
                    this.loadGrades();
                    break;
                case 'profile':
                    this.loadStudentProfile();
                    break;
                case 'dashboard':
                    this.loadDashboardData();
                    break;
            }
        }
        
        // Update active nav link
        document.querySelectorAll('[data-section]').forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`[data-section="${section}"]`);
        if (activeLink) activeLink.classList.add('active');
    }

    // ===== LOAD USER NAME FOR NAVBAR =====
    async loadUserName() {
        try {
            const profileResponse = await API.student.getMyProfile();
            console.log('📊 Profile response for username:', profileResponse);
            
            if (profileResponse.success && profileResponse.data) {
                // Handle nested response structure
                const profile = profileResponse.data.Data || 
                               profileResponse.data.data || 
                               profileResponse.data;
                
                // Extract full name with multiple fallbacks
                const fullName = profile.fullName || 
                               profile.FullName || 
                               `${profile.firstName || profile.FirstName || ''} ${profile.lastName || profile.LastName || ''}`.trim() || 
                               'Student';
                
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = fullName;
                }
                
                console.log('✅ User name set to:', fullName);
            } else {
                console.warn('⚠️ Failed to load profile for username:', profileResponse.error);
            }
        } catch (error) {
            console.error('❌ Error loading user name:', error);
        }
    }

    // ===== LOAD DASHBOARD DATA =====
    async loadDashboardData() {
        console.log('📊 Loading student dashboard...');
        console.log('🔑 Current Student ID:', this.studentId);
        
        try {
            // Load student profile first to get department info
            const profileResponse = await API.student.getMyProfile();
            console.log('👤 Student Profile Response:', profileResponse);
            
            if (profileResponse.success && profileResponse.data) {
                // Handle nested response structure carefully
                this.studentInfo = profileResponse.data.Data || 
                                  profileResponse.data.data || 
                                  profileResponse.data;
                
                console.log('✅ Student Info loaded:', this.studentInfo);
                
                // Display student name
                const studentName = this.studentInfo.fullName || 
                                  this.studentInfo.FullName ||
                                  `${this.studentInfo.firstName || this.studentInfo.FirstName || ''} ${this.studentInfo.lastName || this.studentInfo.LastName || ''}`.trim() ||
                                  'Student';
                
                const userNameEl = document.getElementById('userName');
                if (userNameEl) {
                    userNameEl.textContent = studentName;
                }
            } else {
                console.warn('⚠️ Profile load warning:', profileResponse.error);
                const userNameEl = document.getElementById('userName');
                if (userNameEl) {
                    userNameEl.textContent = 'Student';
                }
            }

            // Load enrolled courses count
            if (this.studentId) {
                try {
                    console.log('📚 Loading enrollments for student:', this.studentId);
                    const enrollmentsResponse = await API.enrollment.getByStudentId(this.studentId);
                    console.log('📊 Enrollments Response:', enrollmentsResponse);
                    
                    if (enrollmentsResponse.success && enrollmentsResponse.data) {
                        const studentEnrollments = enrollmentsResponse.data.Data || 
                                                  enrollmentsResponse.data.data || 
                                                  enrollmentsResponse.data;
                        // Count only enrolled courses (not pending or rejected)
                        const enrolledOnly = Array.isArray(studentEnrollments) 
                            ? studentEnrollments.filter(e => (e.Status || e.status || '').toLowerCase() === 'enrolled')
                            : [];
                        const count = enrolledOnly.length;
                        
                        const enrolledCoursesEl = document.getElementById('totalEnrolledCourses');
                        if (enrolledCoursesEl) {
                            enrolledCoursesEl.textContent = count;
                        }
                        console.log('✅ Enrolled courses count:', count);
                    }
                } catch (error) {
                    console.error('❌ Error loading enrollments:', error);
                    const enrolledCoursesEl = document.getElementById('totalEnrolledCourses');
                    if (enrolledCoursesEl) {
                        enrolledCoursesEl.textContent = '0';
                    }
                }
            }

            // Load available courses (for student's department)
            if (this.studentInfo && (this.studentInfo.departmentId || this.studentInfo.DepartmentId)) {
                try {
                    const deptId = this.studentInfo.departmentId || this.studentInfo.DepartmentId;
                    console.log('🏢 Loading courses for department:', deptId);
                    
                    const coursesResponse = await API.course.getAll(1, 100);
                    console.log('📚 All Courses Response:', coursesResponse);
                    
                    if (coursesResponse.success && coursesResponse.data) {
                        const allCourses = coursesResponse.data.Data || 
                                         coursesResponse.data.data || 
                                         coursesResponse.data;
                        
                        const availableCourses = Array.isArray(allCourses)
                            ? allCourses.filter(c => {
                                const courseDeptId = c.departmentId || c.DepartmentId;
                                return courseDeptId == deptId;
                              })
                            : [];
                        
                        const availableCoursesEl = document.getElementById('totalAvailableCourses');
                        if (availableCoursesEl) {
                            availableCoursesEl.textContent = availableCourses.length;
                        }
                        console.log('✅ Available courses in department:', availableCourses.length);
                    }
                } catch (error) {
                    console.error('❌ Error loading available courses:', error);
                    const availableCoursesEl = document.getElementById('totalAvailableCourses');
                    if (availableCoursesEl) {
                        availableCoursesEl.textContent = '0';
                    }
                }
            }

            // Load attendance summary
            if (this.studentId) {
                try {
                    console.log('📋 Loading attendance for student:', this.studentId);
                    const attendanceResponse = await API.attendance.getSummary(this.studentId);
                    
                    if (attendanceResponse.success && attendanceResponse.data) {
                        const summary = attendanceResponse.data.Data || 
                                       attendanceResponse.data.data || 
                                       attendanceResponse.data;
                        
                        console.log('📊 Attendance summary:', summary);
                        
                        // Backend returns: { AttendancePercentage, PresentCount, TotalClasses, etc. }
                        if (summary && (summary.AttendancePercentage !== undefined || summary.attendancePercentage !== undefined)) {
                            const percentage = (summary.AttendancePercentage || summary.attendancePercentage || 0).toFixed(1);
                            const attendanceEl = document.getElementById('studentAttendance');
                            if (attendanceEl) {
                                attendanceEl.textContent = percentage + '%';
                            }
                            console.log('✅ Attendance:', percentage + '%');
                        } else {
                            const attendanceEl = document.getElementById('studentAttendance');
                            if (attendanceEl) {
                                attendanceEl.textContent = 'No data';
                            }
                        }
                    } else {
                        // Handle 404 or other errors (student might not have attendance records)
                        console.log('⚠️ No attendance data available');
                        const attendanceEl = document.getElementById('studentAttendance');
                        if (attendanceEl) {
                            attendanceEl.textContent = 'No data';
                        }
                    }
                } catch (error) {
                    console.error('❌ Error loading attendance:', error);
                    const attendanceEl = document.getElementById('studentAttendance');
                    if (attendanceEl) {
                        attendanceEl.textContent = 'No data';
                    }
                }
            }

            // Load GPA and Credits from enrollments
            if (this.studentId) {
                try {
                    console.log('📊 Calculating GPA and Credits for student:', this.studentId);
                    const enrollmentsResponse = await API.enrollment.getByStudentId(this.studentId);
                    
                    if (enrollmentsResponse.success && enrollmentsResponse.data) {
                        const studentEnrollments = enrollmentsResponse.data.Data || 
                                                  enrollmentsResponse.data.data || 
                                                  enrollmentsResponse.data;
                        
                        // Calculate total credits from enrolled courses only
                        if (Array.isArray(studentEnrollments)) {
                            const enrolledOnly = studentEnrollments.filter(e => 
                                (e.Status || e.status || '').toLowerCase() === 'enrolled'
                            );
                            const totalCredits = enrolledOnly.reduce((sum, e) => {
                                const credits = e.creditHours || e.CreditHours || 0;
                                return sum + credits;
                            }, 0);
                            
                            const creditsEl = document.getElementById('studentCredits');
                            if (creditsEl) {
                                creditsEl.textContent = totalCredits;
                            }
                            console.log('✅ Total Credits:', totalCredits);
                        }
                        
                        // Calculate GPA
                        const gradesEnrollments = Array.isArray(studentEnrollments)
                            ? studentEnrollments.filter(e => {
                                const finalGrade = e.finalGrade || e.FinalGrade;
                                return finalGrade && finalGrade > 0;
                              })
                            : [];
                        
                        if (gradesEnrollments.length > 0) {
                            const totalGrade = gradesEnrollments.reduce((sum, e) => {
                                const grade = e.finalGrade || e.FinalGrade || 0;
                                return sum + grade;
                            }, 0);
                            const gpa = (totalGrade / gradesEnrollments.length / 25).toFixed(2);
                            
                            const gpaEl = document.getElementById('studentGPA');
                            if (gpaEl) {
                                gpaEl.textContent = gpa;
                            }
                            console.log('✅ GPA:', gpa);
                        } else {
                            const gpaEl = document.getElementById('studentGPA');
                            if (gpaEl) {
                                gpaEl.textContent = '0.0';
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ Error loading GPA/Credits:', error);
                    const gpaEl = document.getElementById('studentGPA');
                    if (gpaEl) {
                        gpaEl.textContent = '0.0';
                    }
                    const creditsEl = document.getElementById('studentCredits');
                    if (creditsEl) {
                        creditsEl.textContent = '0';
                    }
                }
            }
            
            // Initialize visual charts
            await this.initializeCharts();
            
            console.log('✅ Dashboard data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading dashboard:', error);
            this.showToast('Error', 'Failed to load some dashboard data', 'error');
        }
    }

    async initializeCharts() {
        try {
            // Get enrollment data for charts
            const enrollmentsResponse = await API.enrollment.getByStudentId(this.studentId);
            
            if (enrollmentsResponse.success && enrollmentsResponse.data) {
                const studentEnrollments = enrollmentsResponse.data.Data || 
                                          enrollmentsResponse.data.data || 
                                          enrollmentsResponse.data;
                
                if (Array.isArray(studentEnrollments) && studentEnrollments.length > 0) {
                    // Performance Chart (Pie/Doughnut)
                    const attendanceResponse = await API.attendance.getSummary(this.studentId);
                    let attendancePercentage = 0;
                    
                    if (attendanceResponse.success && attendanceResponse.data) {
                        const summary = attendanceResponse.data.Data || attendanceResponse.data.data || attendanceResponse.data;
                        attendancePercentage = summary.AttendancePercentage || summary.attendancePercentage || 0;
                    }
                    
                    // Calculate GPA percentage
                    const gradesEnrollments = studentEnrollments.filter(e => {
                        const finalGrade = e.finalGrade || e.FinalGrade;
                        return finalGrade && finalGrade > 0;
                    });
                    
                    let gpaPercentage = 0;
                    if (gradesEnrollments.length > 0) {
                        const totalGrade = gradesEnrollments.reduce((sum, e) => {
                            const grade = e.finalGrade || e.FinalGrade || 0;
                            return sum + grade;
                        }, 0);
                        gpaPercentage = (totalGrade / gradesEnrollments.length);
                    }
                    
                    const enrollmentCount = studentEnrollments.length;
                    
                    this.createPerformanceChart(attendancePercentage, gpaPercentage, enrollmentCount);
                    this.createCreditsChart(studentEnrollments);
                }
            }
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    createPerformanceChart(attendance, gpa, enrollments) {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.performanceChart) {
            this.performanceChart.destroy();
        }
        
        this.performanceChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Attendance', 'Academic Performance', 'Course Load'],
                datasets: [{
                    data: [attendance, gpa, enrollments * 10],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(249, 115, 22, 0.8)'
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(249, 115, 22, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: false
                    }
                }
            }
        });
    }

    createCreditsChart(enrollments) {
        const ctx = document.getElementById('creditsChart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.creditsChart) {
            this.creditsChart.destroy();
        }
        
        // Prepare data for bar chart
        const courseNames = enrollments.map(e => {
            const name = e.CourseName || e.courseName || 'Course';
            return name.length > 15 ? name.substring(0, 15) + '...' : name;
        });
        
        const credits = enrollments.map(e => e.creditHours || e.CreditHours || 0);
        
        this.creditsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: courseNames,
                datasets: [{
                    label: 'Credit Hours',
                    data: credits,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    }
                }
            }
        });
    }

    // ===== COURSES - ENROLLMENT =====
    async loadEnrolledCourses() {
        console.log('📚 Loading enrolled courses...');
        console.log('🔑 Using studentId:', this.studentId);
        
        const tbody = document.getElementById('coursesTableBody');
        
        // Show loading state
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Loading courses...</td></tr>';

        try {
            if (!this.studentId) {
                console.error('❌ Student ID is null or undefined!');
                console.log('👤 Current user info:', API.getUserInfo());
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-warning">⚠️ Student ID not found. Please log in again.</td></tr>';
                return;
            }

            console.log('📤 Calling API.enrollment.getByStudentId with studentId:', this.studentId);
            const response = await API.enrollment.getByStudentId(this.studentId);
            console.log('📊 Student enrollments response:', response);
            
            if (response.success && response.data) {
                // Handle nested response structure
                let enrollments = response.data.Data || 
                                 response.data.data || 
                                 response.data;
                
                console.log('📦 Extracted enrollments:', enrollments);
                
                if (!Array.isArray(enrollments)) {
                    console.warn('⚠️ Enrollments is not an array:', enrollments);
                    enrollments = [];
                }

                if (enrollments.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">📚 No enrolled courses. <a href="#" onclick="studentDashboard.switchSection(\'courses\'); return false;" class="btn btn-sm btn-primary ms-2">Enroll now!</a></td></tr>';
                    return;
                }

                // Initialize pagination for courses table
                this.coursesPagination = window.createPagination({
                    itemsPerPage: 10,
                    onDataChange: (pageData) => {
                        tbody.innerHTML = pageData.map(enrollment => {
                            // Handle both PascalCase and camelCase properties
                            const courseName = enrollment.CourseName || enrollment.courseName || 'Course';
                            const courseCode = enrollment.CourseCode || enrollment.courseCode || '';
                            const deptName = enrollment.DepartmentName || enrollment.departmentName || '-';
                            const instructorName = enrollment.InstructorName || enrollment.instructorName || '-';
                            const credits = enrollment.CreditHours || enrollment.creditHours || '-';
                            const status = enrollment.Status || enrollment.status || 'Enrolled';
                            const enrollmentId = enrollment.EnrollmentId || enrollment.enrollmentId;
                            
                            // Status badge styling
                            const statusBadgeClass = status === 'Enrolled' ? 'success' : 
                                                    status === 'Pending' ? 'warning' :
                                                    status === 'Rejected' ? 'danger' :
                                                    status === 'Completed' ? 'info' : 
                                                    status === 'Dropped' ? 'secondary' :
                                                    'warning';
                            
                            return `
                                <tr>
                                    <td>
                                        <strong>${courseName}</strong>
                                        <br><small class="text-muted">${courseCode}</small>
                                    </td>
                                    <td><small>${deptName}</small></td>
                                    <td><small>${instructorName}</small></td>
                                    <td><span class="badge bg-light text-dark">${credits} credits</span></td>
                                    <td><span class="badge bg-${statusBadgeClass}">${status}</span></td>
                                </tr>
                            `;
                        }).join('');
                    }
                });
                
                // Set data and render pagination controls
                this.coursesPagination.setData(enrollments);
                this.coursesPagination.renderControls('coursesPaginationControls');
                
                console.log('✅ Enrolled courses loaded successfully:', enrollments.length, 'courses');
                
                // Initialize courses search functionality
                this.initializeCoursesSearch();
            } else {
                console.error('❌ Failed to load courses:', response.error);
                tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">⚠️ Failed to load courses: ${response.error || 'Unknown error'}</td></tr>`;
            }
        } catch (error) {
            console.error('❌ Error loading courses:', error);
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">⚠️ Error: ${error.message}</td></tr>`;
        }
    }

    initializeCoursesSearch() {
        const searchInput = document.getElementById('coursesSearchInput');
        if (!searchInput || !this.coursesPagination) return;

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (!searchTerm) {
                // Clear search filter
                this.coursesPagination.removeFilter('search');
            } else {
                // Apply search filter
                this.coursesPagination.addFilter('search', (enrollment) => {
                    const courseName = (enrollment.CourseName || enrollment.courseName || '').toLowerCase();
                    const courseCode = (enrollment.CourseCode || enrollment.courseCode || '').toLowerCase();
                    return courseName.includes(searchTerm) || courseCode.includes(searchTerm);
                });
            }
            
            // Re-render pagination controls
            this.coursesPagination.renderControls('coursesPaginationControls');
        });
    }

    async loadAvailableCoursesForEnrollment() {
        console.log('📖 Loading available courses for enrollment...');
        const select = document.getElementById('courseSelect');

        try {
            // Get student's department first
            if (!this.studentInfo) {
                console.warn('⚠️ Student info not loaded, loading profile first...');
                const profileResponse = await API.student.getMyProfile();
                if (profileResponse.success && profileResponse.data) {
                    this.studentInfo = profileResponse.data;
                } else {
                    select.innerHTML = '<option value="">Failed to load student info</option>';
                    return;
                }
            }

            if (!this.studentInfo || !this.studentInfo.departmentId) {
                select.innerHTML = '<option value="">Student has no department assigned</option>';
                return;
            }

            // Get all courses for student's department
            const response = await API.course.getAll(1, 100);
            
            if (response.success && response.data) {
                // Handle different response structures
                let allCourses = response.data.Data || response.data.data || response.data;
                
                if (!Array.isArray(allCourses)) {
                    allCourses = [];
                }
                
                // Filter courses for student's department (handle both camelCase and PascalCase)
                const deptCourses = allCourses.filter(c => {
                    const courseDeptId = c.departmentId || c.DepartmentId;
                    return courseDeptId == this.studentInfo.departmentId;
                });

                if (deptCourses.length === 0) {
                    select.innerHTML = '<option value="">No courses available in your department</option>';
                    return;
                }

                // Get already enrolled courses
                try {
                    const enrollmentsResponse = await API.enrollment.getByStudentId(this.studentId);
                    let allEnrollments = enrollmentsResponse.data?.Data || enrollmentsResponse.data?.data || enrollmentsResponse.data || [];
                    
                    if (!Array.isArray(allEnrollments)) {
                        allEnrollments = [];
                    }
                    
                    const enrolledCourseIds = allEnrollments.map(e => {
                        return e.CourseId || e.courseId;
                    });

                    // Filter out already enrolled courses
                    const availableCourses = deptCourses.filter(c => {
                        const courseId = c.id || c.Id || c.CourseId || c.courseId;
                        return !enrolledCourseIds.includes(courseId);
                    });

                    if (availableCourses.length === 0) {
                        select.innerHTML = '<option value="">All courses enrolled or unavailable</option>';
                        return;
                    }

                    const options = availableCourses.map(course => {
                        const courseId = course.id || course.Id || course.CourseId || course.courseId;
                        const courseName = course.name || course.Name;
                        const credits = course.creditHours || course.CreditHours;
                        return `<option value="${courseId}">${courseName} (${credits} credits)</option>`;
                    }).join('');
                    
                    select.innerHTML = '<option value="">Select a course</option>' + options;
                } catch (enrollError) {
                    console.error('❌ Error checking enrolled courses:', enrollError);
                    // Still show all dept courses if enrollment check fails
                    const options = deptCourses.map(course => {
                        const courseId = course.id || course.Id || course.CourseId || course.courseId;
                        const courseName = course.name || course.Name;
                        const credits = course.creditHours || course.CreditHours;
                        return `<option value="${courseId}">${courseName} (${credits} credits)</option>`;
                    }).join('');
                    select.innerHTML = '<option value="">Select a course</option>' + options;
                }
            } else {
                select.innerHTML = '<option value="">Failed to load courses</option>';
            }
        } catch (error) {
            console.error('❌ Error loading available courses:', error);
            select.innerHTML = '<option value="">Error loading courses</option>';
        }
    }

    async loadAvailableCoursesDisplay() {
        console.log('📚 Loading available courses for display...');
        const container = document.getElementById('availableCoursesContainer');

        try {
            // Get student's department first
            if (!this.studentInfo) {
                console.warn('⚠️ Student info not loaded, loading profile first...');
                const profileResponse = await API.student.getMyProfile();
                if (profileResponse.success && profileResponse.data) {
                    this.studentInfo = profileResponse.data;
                } else {
                    container.innerHTML = '<div class="col-12 text-danger">Failed to load student info</div>';
                    return;
                }
            }

            if (!this.studentInfo || !this.studentInfo.departmentId) {
                container.innerHTML = '<div class="col-12 text-warning">You have no department assigned</div>';
                return;
            }

            // Get all courses for student's department
            const response = await API.course.getAll(1, 100);
            
            if (response.success && response.data) {
                const allCourses = response.data.data || response.data;
                
                // Filter courses for student's department
                const deptCourses = Array.isArray(allCourses)
                    ? allCourses.filter(c => c.departmentId == this.studentInfo.departmentId)
                    : [];

                if (deptCourses.length === 0) {
                    container.innerHTML = '<div class="col-12 text-muted">No courses available in your department</div>';
                    return;
                }

                // Get already enrolled courses
                try {
                    const enrollmentsResponse = await API.enrollment.getByStudentId(this.studentId);
                    let allEnrollments = enrollmentsResponse.data?.Data || enrollmentsResponse.data?.data || enrollmentsResponse.data || [];
                    
                    if (!Array.isArray(allEnrollments)) {
                        allEnrollments = [];
                    }
                    
                    // Create a map of course enrollments with their status
                    const enrollmentMap = new Map();
                    allEnrollments.forEach(e => {
                        const courseId = e.CourseId || e.courseId;
                        const status = (e.Status || e.status || '').toLowerCase();
                        enrollmentMap.set(courseId, status);
                    });

                    // Show all department courses
                    const availableCourses = deptCourses;

                    if (availableCourses.length === 0) {
                        container.innerHTML = '<div class="col-12 text-muted">No courses available in your department.</div>';
                        return;
                    }

                    // Display all courses as cards (show enrollment status)
                    const courseCards = availableCourses.map(course => {
                        const courseId = course.id || course.Id || course.CourseId || course.courseId;
                        const enrollmentStatus = enrollmentMap.get(courseId);
                        
                        let statusBadge = '';
                        let buttonHtml = '';
                        let cardBorder = '';
                        
                        if (enrollmentStatus === 'enrolled') {
                            statusBadge = '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Enrolled</span>';
                            buttonHtml = '<button class="btn btn-sm btn-secondary w-100" disabled><i class="bi bi-check"></i> Already Enrolled</button>';
                            cardBorder = 'border-success';
                        } else if (enrollmentStatus === 'pending') {
                            statusBadge = '<span class="badge bg-warning text-dark"><i class="bi bi-clock"></i> Pending</span>';
                            buttonHtml = '<button class="btn btn-sm btn-warning w-100" disabled><i class="bi bi-clock"></i> Pending Approval</button>';
                            cardBorder = 'border-warning';
                        } else if (enrollmentStatus === 'rejected') {
                            statusBadge = '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Rejected</span>';
                            buttonHtml = '<button class="btn btn-sm btn-danger w-100" disabled><i class="bi bi-x-circle"></i> Enrollment Rejected</button>';
                            cardBorder = 'border-danger';
                        } else {
                            buttonHtml = `<button class="btn btn-sm btn-primary w-100" 
                                                onclick="studentDashboard.quickEnrollCourse(${course.id}, '${course.name.replace(/'/g, "\\'")}')"
                                                title="Enroll in this course">
                                            <i class="bi bi-plus-lg"></i> Enroll
                                        </button>`;
                        }
                        
                        return `
                        <div class="col-md-6 col-lg-4 mb-3">
                            <div class="card h-100 border-0 shadow-sm ${cardBorder}">
                                <div class="card-body">
                                    <h6 class="card-title">${course.name}</h6>
                                    <small class="text-muted d-block mb-2">
                                        <i class="bi bi-code"></i> ${course.courseCode}
                                    </small>
                                    <p class="card-text small">
                                        <i class="bi bi-person"></i> ${course.instructorName || 'Unknown'}<br>
                                        <i class="bi bi-book"></i> ${course.creditHours} Credits
                                    </p>
                                    ${statusBadge}
                                </div>
                                <div class="card-footer bg-white border-top-0">
                                    ${buttonHtml}
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('');
                    
                    container.innerHTML = courseCards;
                } catch (enrollError) {
                    console.error('❌ Error checking enrolled courses:', enrollError);
                    // Still show all dept courses if enrollment check fails
                    const courseCards = deptCourses.map(course => `
                        <div class="col-md-6 col-lg-4 mb-3">
                            <div class="card h-100 border-0 shadow-sm">
                                <div class="card-body">
                                    <h6 class="card-title">${course.name}</h6>
                                    <small class="text-muted d-block mb-2">
                                        <i class="bi bi-code"></i> ${course.courseCode}
                                    </small>
                                    <p class="card-text small">
                                        <i class="bi bi-person"></i> ${course.instructorName || 'Unknown'}<br>
                                        <i class="bi bi-book"></i> ${course.creditHours} Credits
                                    </p>
                                </div>
                                <div class="card-footer bg-white border-top-0">
                                    <button class="btn btn-sm btn-primary w-100" 
                                            onclick="studentDashboard.quickEnrollCourse(${course.id}, '${course.name.replace(/'/g, "\\'")}')"
                                            title="Enroll in this course">
                                        <i class="bi bi-plus-lg"></i> Enroll
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('');
                    container.innerHTML = courseCards;
                }
            } else {
                container.innerHTML = '<div class="col-12 text-danger">Failed to load courses</div>';
            }
        } catch (error) {
            console.error('❌ Error loading available courses:', error);
            container.innerHTML = '<div class="col-12 text-danger">Error loading courses</div>';
        }
    }

    async quickEnrollCourse(courseId, courseName) {
        if (!this.studentId) {
            this.showToast('Error', 'Student ID not found. Please log in again.', 'error');
            return;
        }

        if (!courseId) {
            this.showToast('Error', 'Invalid course selection', 'error');
            return;
        }

        // Show confirmation dialog
        this.showConfirmToast(
            'Confirm Enrollment', 
            `Do you want to enroll in "${courseName}"?`,
            async () => {
                // Create enrollment data
                const enrollmentData = {
                    studentId: parseInt(this.studentId),
                    courseId: parseInt(courseId)
                };

                console.log('📝 Enrolling student in course:', enrollmentData);
                console.log('🔑 Auth token exists:', !!localStorage.getItem('authToken'));

                try {
                    // Call API to enroll
                    const response = await API.enrollment.create(enrollmentData);
                    console.log('📊 Enrollment API response:', response);
                    
                    if (response.success) {
                        this.showToast('Success', `✅ Successfully enrolled in "${courseName}"!`, 'success');
                        
                        // Reload all relevant data
                        console.log('🔄 Reloading dashboard data after enrollment...');
                        await Promise.all([
                            this.loadEnrolledCourses(),
                            this.loadAvailableCoursesDisplay(),
                            this.loadDashboardData()
                        ]);
                    } else {
                        // Extract and display specific error message from backend
                        let errorMsg = 'Failed to enroll in course';
                        
                        console.log('🔍 Error response structure:', response);
                        
                        // Try multiple paths to get the error message
                        if (response.data) {
                            if (typeof response.data === 'string') {
                                errorMsg = response.data;
                            } else if (typeof response.data === 'object') {
                                // Try different message properties
                                errorMsg = response.data.Message || 
                                          response.data.message || 
                                          response.data.Error || 
                                          response.data.error || 
                                          response.data.title || 
                                          errorMsg;
                                
                                // Check for validation errors array
                                if (response.data.Errors && Array.isArray(response.data.Errors) && response.data.Errors.length > 0) {
                                    errorMsg = response.data.Errors.join('. ');
                                }
                                
                                // Check for ASP.NET Core validation errors
                                if (response.data.errors && typeof response.data.errors === 'object') {
                                    const errorMessages = [];
                                    Object.keys(response.data.errors).forEach(key => {
                                        const fieldErrors = response.data.errors[key];
                                        if (Array.isArray(fieldErrors)) {
                                            errorMessages.push(...fieldErrors);
                                        }
                                    });
                                    if (errorMessages.length > 0) {
                                        errorMsg = errorMessages.join('. ');
                                    }
                                }
                            }
                        } else if (response.error) {
                            errorMsg = response.error;
                        } else if (response.Message) {
                            errorMsg = response.Message;
                        }
                        
                        console.error('❌ Enrollment failed:', errorMsg);
                        
                        // Display user-friendly error message
                        this.showToast('Enrollment Failed', errorMsg, 'error');
                    }
                } catch (error) {
                    console.error('❌ Exception during enrollment:', error);
                    this.showToast('Error', `Network error: ${error.message || 'Cannot connect to server'}`, 'error');
                }
            }
        );
    }

    async enrollCourse() {
        const courseId = document.getElementById('courseSelect').value;
        
        if (!courseId) {
            this.showToast('Validation', 'Please select a course', 'warning');
            return;
        }

        if (!this.studentId) {
            this.showToast('Error', 'Student ID not found. Please log in again.', 'error');
            return;
        }

        const enrollmentData = {
            studentId: parseInt(this.studentId),
            courseId: parseInt(courseId)
        };

        console.log('📝 Enrolling via modal with data:', enrollmentData);

        try {
            const response = await API.enrollment.create(enrollmentData);
            console.log('📊 Enrollment response:', response);
            
            if (response.success) {
                this.showToast('Success', '✅ Enrolled in course successfully!', 'success');
                
                // Hide modal
                const modal = document.getElementById('enrollModal');
                if (modal) {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                }
                
                // Reload data
                await Promise.all([
                    this.loadEnrolledCourses(),
                    this.loadAvailableCoursesDisplay(),
                    this.loadDashboardData()
                ]);
            } else {
                // Extract detailed error message from backend
                let errorMsg = 'Failed to enroll';
                
                if (response.data) {
                    if (typeof response.data === 'string') {
                        errorMsg = response.data;
                    } else if (typeof response.data === 'object') {
                        errorMsg = response.data.Message || 
                                  response.data.message || 
                                  response.data.Error || 
                                  response.data.error || 
                                  errorMsg;
                        
                        // Check for validation errors
                        if (response.data.Errors && Array.isArray(response.data.Errors) && response.data.Errors.length > 0) {
                            errorMsg = response.data.Errors.join('. ');
                        }
                    }
                } else if (response.error) {
                    errorMsg = response.error;
                } else if (response.Message) {
                    errorMsg = response.Message;
                }
                
                console.error('❌ Enrollment failed:', errorMsg);
                this.showToast('Enrollment Failed', errorMsg, 'error');
            }
        } catch (error) {
            console.error('❌ Error enrolling:', error);
            this.showToast('Error', `An error occurred: ${error.message || 'Unknown error'}`, 'error');
        }
    }

    async dropCourse(enrollmentId) {
        if (!enrollmentId) {
            this.showToast('Error', 'Invalid enrollment ID', 'error');
            return;
        }

        // Create custom styled modal with danger theme
        const modalHtml = `
            <div class="modal fade" id="dropCourseModal" tabindex="-1" data-bs-backdrop="static" aria-labelledby="dropCourseModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-danger">
                        <div class="modal-header bg-danger text-white border-0">
                            <h5 class="modal-title" id="dropCourseModalLabel">
                                <i class="bi bi-exclamation-triangle-fill me-2"></i>Confirm Drop Course
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-danger mb-3">
                                <h6 class="alert-heading">
                                    <i class="bi bi-exclamation-circle-fill"></i> Are you sure you want to drop this course?
                                </h6>
                            </div>
                            <p class="text-danger fw-bold mb-2">
                                <i class="bi bi-x-circle"></i> This action CANNOT be undone!
                            </p>
                            <div class="bg-light p-3 rounded">
                                <p class="mb-2"><strong>What will happen:</strong></p>
                                <ul class="text-muted mb-0">
                                    <li>You will be unenrolled from this course</li>
                                    <li>Your attendance records will be archived</li>
                                    <li>You will need to re-enroll if you change your mind</li>
                                </ul>
                            </div>
                        </div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-1"></i>Cancel
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmDropCourse">
                                <i class="bi bi-trash-fill me-1"></i>Drop Course
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        document.getElementById('dropCourseModal')?.remove();
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('dropCourseModal'));
        modal.show();
        
        // Handle confirm button
        document.getElementById('confirmDropCourse').onclick = async () => {
            modal.hide();
            
            try {
                console.log('🗑️ Dropping course, enrollmentId:', enrollmentId);
                const response = await API.enrollment.delete(enrollmentId);
                console.log('📊 Drop course response:', response);
                
                if (response.success) {
                    this.showToast('Success', '✅ Course dropped successfully!', 'success');
                    
                    // Reload data
                    await Promise.all([
                        this.loadEnrolledCourses(),
                        this.loadAvailableCoursesDisplay(),
                        this.loadDashboardData()
                    ]);
                } else {
                    const errorMsg = response.data?.Message || 
                                   response.data?.message || 
                                   response.error || 
                                   'Failed to drop course';
                    this.showToast('Error', errorMsg, 'error');
                }
            } catch (error) {
                console.error('❌ Error dropping course:', error);
                this.showToast('Error', `An error occurred: ${error.message || 'Unknown error'}`, 'error');
            }
            
            // Remove modal from DOM after hiding
            setTimeout(() => document.getElementById('dropCourseModal')?.remove(), 300);
        };
        
        // Cleanup on modal hide
        document.getElementById('dropCourseModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('dropCourseModal')?.remove();
        });
    }

    // ===== ATTENDANCE =====
    async loadAttendance() {
        console.log('📋 Loading attendance...');
        const tbody = document.getElementById('attendanceTableBody');

        try {
            if (!this.studentId) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-warning">Student ID not found</td></tr>';
                return;
            }

            // Try to use summary endpoint first (students have access)
            const response = await API.attendance.getSummary(this.studentId);
            
            if (response.success && response.data) {
                const summary = response.data.Data || response.data.data || response.data;
                
                console.log('📊 Attendance summary:', summary);

                // Check if we have any attendance data
                const totalClasses = summary.TotalClasses || summary.totalClasses || 0;
                
                if (totalClasses === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">📚 No attendance records yet. Attend classes to see your attendance here.</td></tr>';
                    return;
                }

                // Display summary as a single row (since we don't have per-course details)
                const presentCount = summary.PresentCount || summary.presentCount || 0;
                const lateCount = summary.LateCount || summary.lateCount || 0;
                const absentCount = summary.AbsentCount || summary.absentCount || 0;
                const excusedCount = summary.ExcusedCount || summary.excusedCount || 0;
                const percentage = summary.AttendancePercentage || summary.attendancePercentage || 0;

                tbody.innerHTML = `
                    <tr>
                        <td><strong>Overall Attendance</strong></td>
                        <td>
                            <span class="badge bg-success">${presentCount}</span> Present<br>
                            <span class="badge bg-warning">${lateCount}</span> Late<br>
                            <span class="badge bg-info">${excusedCount}</span> Excused
                        </td>
                        <td>
                            <span class="badge bg-danger">${absentCount}</span> Absent
                        </td>
                        <td>
                            <strong>${percentage.toFixed(1)}%</strong>
                            <div class="progress" style="height: 5px;">
                                <div class="progress-bar bg-${percentage >= 75 ? 'success' : percentage >= 60 ? 'warning' : 'danger'}" 
                                     style="width: ${percentage}%"></div>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                // No attendance data or error
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">📚 No attendance records yet. Attend classes to see your attendance here.</td></tr>';
            }
        } catch (error) {
            console.error('❌ Error loading attendance:', error);
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">📚 No attendance records available.</td></tr>';
        }
    }

    // ===== GRADES =====
    async loadGrades() {
        console.log('📊 Loading grades...');
        const tbody = document.getElementById('gradesTableBody');
        
        // Show loading state
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Loading grades...</td></tr>';

        try {
            if (!this.studentId) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-warning">Student ID not found</td></tr>';
                return;
            }

            console.log('📤 Loading enrollments for student:', this.studentId);
            const response = await API.enrollment.getByStudentId(this.studentId);
            console.log('📊 Grades response:', response);
            
            if (response.success && response.data) {
                // Handle nested response structure
                const allEnrollments = response.data.Data || 
                                      response.data.data || 
                                      response.data;
                
                console.log('📦 Extracted enrollments:', allEnrollments);
                
                // Filter enrollments - show all, mark those without grades
                const enrollments = Array.isArray(allEnrollments) ? allEnrollments : [];

                if (enrollments.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No course enrollments yet</td></tr>';
                    return;
                }

                tbody.innerHTML = enrollments.map(enrollment => {
                    // Handle both PascalCase and camelCase
                    const courseName = enrollment.CourseName || enrollment.courseName || 'Course';
                    const courseCode = enrollment.CourseCode || enrollment.courseCode || '';
                    const credits = enrollment.CreditHours || enrollment.creditHours || 0;
                    const status = enrollment.Status || enrollment.status || 'Enrolled';
                    const finalGrade = enrollment.FinalGrade || enrollment.finalGrade;
                    const gradeLetter = enrollment.GradeLetter || enrollment.gradeLetter;
                    
                    // Determine grade display based on status
                    let gradeDisplay, letterDisplay, gradeColor;
                    
                    if (status === 'Rejected') {
                        // Rejected students: show 0 and "Not graded"
                        gradeDisplay = '0.00';
                        letterDisplay = 'Not graded';
                        gradeColor = 'secondary';
                    } else {
                        // Enrolled/other students: show actual grade or default 30 with F
                        const hasGrade = finalGrade !== null && finalGrade !== undefined && finalGrade > 0;
                        gradeDisplay = hasGrade ? finalGrade.toFixed(2) : '30.00';
                        letterDisplay = gradeLetter || (hasGrade ? this.getLetterGrade(finalGrade) : 'F');
                        gradeColor = hasGrade ? this.getGradeColor(finalGrade) : 'danger';
                    }
                // Initialize pagination for grades table
                this.gradesPagination = window.createPagination({
                    itemsPerPage: 10,
                    onDataChange: (pageData) => {
                        tbody.innerHTML = pageData.map(enrollment => {
                            // Handle both PascalCase and camelCase
                            const courseName = enrollment.CourseName || enrollment.courseName || 'Course';
                            const courseCode = enrollment.CourseCode || enrollment.courseCode || '';
                            const credits = enrollment.CreditHours || enrollment.creditHours || 0;
                            const status = enrollment.Status || enrollment.status || 'Enrolled';
                            const finalGrade = enrollment.FinalGrade || enrollment.finalGrade;
                            const gradeLetter = enrollment.GradeLetter || enrollment.gradeLetter;
                            
                            // Determine grade display based on status
                            let gradeDisplay, letterDisplay, gradeColor;
                            
                            if (status === 'Rejected') {
                                // Rejected students: show 0 and "Not graded"
                                gradeDisplay = '0.00';
                                letterDisplay = 'Not graded';
                                gradeColor = 'secondary';
                            } else {
                                // Enrolled/other students: show actual grade or default 30 with F
                                const hasGrade = finalGrade !== null && finalGrade !== undefined && finalGrade > 0;
                                gradeDisplay = hasGrade ? finalGrade.toFixed(2) : '30.00';
                                letterDisplay = gradeLetter || (hasGrade ? this.getLetterGrade(finalGrade) : 'F');
                                gradeColor = hasGrade ? this.getGradeColor(finalGrade) : 'danger';
                            }
                            
                            // Status badge
                            const statusBadgeClass = status === 'Completed' ? 'success' : 
                                                    status === 'Enrolled' ? 'primary' :
                                                    status === 'Pending' ? 'warning' :
                                                    status === 'Rejected' ? 'danger' :
                                                    status === 'Dropped' ? 'secondary' : 
                                                    'warning';
                            
                            return `
                                <tr>
                                    <td>
                                        <strong>${courseName}</strong>
    initializeGradesSearch() {
        const searchInput = document.getElementById('gradesSearchInput');
        if (!searchInput || !this.gradesPagination) return;

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (!searchTerm) {
                // Clear search filter
                this.gradesPagination.removeFilter('search');
            } else {
                // Apply search filter
                this.gradesPagination.addFilter('search', (enrollment) => {
                    const courseName = (enrollment.CourseName || enrollment.courseName || '').toLowerCase();
                    const courseCode = (enrollment.CourseCode || enrollment.courseCode || '').toLowerCase();
                    return courseName.includes(searchTerm) || courseCode.includes(searchTerm);
                });
            }
            
            // Re-render pagination controls
            this.gradesPagination.renderControls('gradesPaginationControls');
        });
    }               tbody.innerHTML += '<tr id="noResultsRow"><td colspan="5" class="text-center text-muted"><i class="bi bi-search"></i> No courses found matching your search.</td></tr>';
                }
            } else {
                // Remove "no results" message if it exists
                const noResultsRow = document.getElementById('noResultsRow');
                if (noResultsRow) {
                    noResultsRow.remove();
                }
            }
        });
    }

    getLetterGrade(marks) {
        if (marks >= 90) return 'A';
        if (marks >= 80) return 'B';
        if (marks >= 70) return 'C';
        if (marks >= 60) return 'D';
        return 'F';
    }

    getGradeColor(marks) {
        if (marks >= 90) return 'success';
        if (marks >= 80) return 'info';
        if (marks >= 70) return 'warning';
        if (marks >= 60) return 'secondary';
        return 'danger';
    }

    // ===== PROFILE =====
    async loadStudentProfile() {
        console.log('👤 Loading student profile...');
        
        try {
            // Get student profile
            const profileResponse = await API.student.getMyProfile();
            console.log('📊 Full profile response:', profileResponse);
            console.log('📊 Response.data:', profileResponse.data);
            
            if (profileResponse.success && profileResponse.data) {
                // Handle nested data structure - API might return { data: { Data: {...} } } or { data: {...} }
                const profile = profileResponse.data.Data || profileResponse.data.data || profileResponse.data;
                console.log('👤 Student Profile:', profile);

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
                safeSetText('displayStudentCode', profile.studentCode || profile.StudentCode || '-');
                safeSetText('displayLevel', profile.level || profile.Level || '-');
                safeSetText('displayFirstName', profile.firstName || profile.FirstName || '-');
                safeSetText('displayLastName', profile.lastName || profile.LastName || '-');
                safeSetText('displayEmail', profile.email || profile.Email || '-');
                safeSetText('displayContactNumber', profile.contactNumber || profile.ContactNumber || '-');
                safeSetText('displayDepartment', profile.departmentName || profile.DepartmentName || '-');

                // Summary view (if exists)
                const firstName = profile.firstName || profile.FirstName || '';
                const lastName = profile.lastName || profile.LastName || '';
                const fullName = `${firstName} ${lastName}`.trim() || 'Student';
                safeSetText('summaryName', fullName);
                safeSetText('summaryCode', `Code: ${profile.studentCode || profile.StudentCode || '-'}`);
                safeSetText('summaryDept', `Dept: ${profile.departmentName || profile.DepartmentName || 'No department assigned'}`);

                // Edit form - populate with current values
                safeSetValue('profileFirstName', profile.firstName || profile.FirstName || '');
                safeSetValue('profileLastName', profile.lastName || profile.LastName || '');
                safeSetValue('profileStudentCode', profile.studentCode || profile.StudentCode || '');
                safeSetValue('profileLevel', profile.level || profile.Level || '');
                safeSetValue('profileEmail', profile.email || profile.Email || '');
                safeSetValue('profileContactNumber', profile.contactNumber || profile.ContactNumber || '');
                safeSetValue('profileDepartment', profile.departmentName || profile.DepartmentName || '');

                // Update navbar user name
                safeSetText('userName', fullName || 'Student');

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
        // Make only contact number editable
        document.getElementById('profileFirstName').readOnly = true;
        document.getElementById('profileFirstName').style.backgroundColor = '#e9ecef';
        document.getElementById('profileFirstName').style.cursor = 'not-allowed';
        
        document.getElementById('profileLastName').readOnly = true;
        document.getElementById('profileLastName').style.backgroundColor = '#e9ecef';
        document.getElementById('profileLastName').style.cursor = 'not-allowed';
        
        document.getElementById('profileStudentCode').readOnly = true;
        document.getElementById('profileStudentCode').style.backgroundColor = '#e9ecef';
        document.getElementById('profileStudentCode').style.cursor = 'not-allowed';
        
        // Contact number is the only editable field
        const contactNumberInput = document.getElementById('profileContactNumber');
        contactNumberInput.readOnly = false;
        contactNumberInput.style.backgroundColor = '';
        contactNumberInput.style.cursor = '';
        
        // Add real-time validation for phone number
        let validationTimeout;
        const currentPhone = this.currentProfile?.contactNumber || '';
        
        contactNumberInput.addEventListener('input', async (e) => {
            const phone = e.target.value.trim();
            const errorEl = document.getElementById('contactNumberError');
            
            // Clear previous errors
            errorEl.style.display = 'none';
            errorEl.textContent = '';
            
            if (!phone) return;
            
            // Format validation (11 digits)
            if (!/^\d{11}$/.test(phone)) {
                errorEl.textContent = 'Contact number must be exactly 11 digits';
                errorEl.style.display = 'block';
                errorEl.classList.add('text-danger');
                errorEl.classList.remove('text-success');
                return;
            }
            
            // Skip check if same as current
            if (phone === currentPhone) {
                return;
            }
            
            // Debounced duplicate check (800ms delay)
            clearTimeout(validationTimeout);
            validationTimeout = setTimeout(async () => {
                try {
                    const response = await API.student.updateMyProfile({ contactNumber: phone });
                    if (!response.success) {
                        errorEl.textContent = 'This phone number is already existed';
                        errorEl.style.display = 'block';
                        errorEl.classList.add('text-danger');
                        errorEl.classList.remove('text-success');
                    }
                } catch (error) {
                    // Silently handle - will validate on submit
                    console.log('Phone validation check failed:', error);
                }
            }, 800);
        });
        
        document.getElementById('profileDisplayView').classList.add('d-none');
        document.getElementById('profileEditView').classList.remove('d-none');
    }

    async saveProfile() {
        const contactNumber = document.getElementById('profileContactNumber').value;

        // ========== STUDENT UPDATE: Only Contact Number ==========
        // Contact number validation (Egyptian phone format)
        if (contactNumber && !this.validateContactNumber(contactNumber)) {
            const errorEl = document.getElementById('contactNumberError');
            if (errorEl) {
                errorEl.textContent = 'Contact number must start with 010, 011, 012, or 015 and last 8 digits cannot be all the same';
            }
            this.showToast('Validation', '❌ Invalid contact number format. Must start with 010, 011, 012, or 015 and be exactly 11 digits', 'warning');
            return;
        }
        
        // Clear error if valid
        const errorEl = document.getElementById('contactNumberError');
        if (errorEl) {
            errorEl.textContent = '';
        }

        const updateData = {
            contactNumber: contactNumber || null
        };

        try {
            const response = await API.student.updateMyProfile(updateData);
            console.log('📊 Profile update response:', response);
            console.log('📊 Response status:', response.status);
            console.log('📊 Response.data:', response.data);

            if (response.success) {
                this.showToast('Success', 'Contact number updated successfully!', 'success');
                // Reload profile to show updated values
                await this.loadStudentProfile();
                this.showDisplayProfileView();
            } else {
                const errorMsg = response.error || 'Failed to update profile';
                const errorEl = document.getElementById('contactNumberError');
                if (errorEl) {
                    errorEl.textContent = errorMsg;
                    errorEl.classList.add('text-danger');
                    errorEl.style.display = 'block';
                }
                this.showToast('Error', errorMsg, 'error');
            }
        } catch (error) {
            console.error('❌ Error saving profile:', error);
            console.error('❌ Error details:', error.response);
            
            // Check if error response contains validation message
            let errorMsg = 'Failed to update profile';
            
            if (error.response && error.response.data) {
                // Check for errors array (ASP.NET validation errors format)
                if (error.response.data.errors) {
                    if (typeof error.response.data.errors === 'object' && !Array.isArray(error.response.data.errors)) {
                        const allErrors = [];
                        for (const key in error.response.data.errors) {
                            const errors = error.response.data.errors[key];
                            if (Array.isArray(errors)) {
                                allErrors.push(...errors);
                            }
                        }
                        if (allErrors.length > 0) {
                            errorMsg = allErrors.join(', ');
                        }
                    } else if (Array.isArray(error.response.data.errors)) {
                        errorMsg = error.response.data.errors.map(e => e.message || e).join(', ');
                    }
                } else if (error.response.data.message) {
                    errorMsg = error.response.data.message;
                } else if (error.response.data.Message) {
                    errorMsg = error.response.data.Message;
                }
            } else if (error.message) {
                errorMsg = error.message;
            }
            
            const errorEl = document.getElementById('contactNumberError');
            if (errorEl) {
                errorEl.textContent = errorMsg;
                errorEl.classList.add('text-danger');
                errorEl.style.display = 'block';
            }
            
            this.showToast('Error', `${errorMsg}`, 'error');
        }
    }

    // ===== VALIDATION METHODS =====
    validateNameFormat(name) {
        // Allow letters, spaces, hyphens, apostrophes
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        return nameRegex.test(name);
    }

    validateContactNumber(number) {
        // Must be exactly 11 digits and start with Egyptian prefix
        if (!number || number.trim() === '') return true; // Optional field
        
        const trimmedNumber = number.trim();
        
        // Check if exactly 11 digits
        if (trimmedNumber.length !== 11 || !/^\d{11}$/.test(trimmedNumber)) {
            return false;
        }
        
        // Check if starts with valid Egyptian prefixes
        const prefix = trimmedNumber.substring(0, 3);
        if (prefix !== '010' && prefix !== '011' && prefix !== '012' && prefix !== '015') {
            return false;
        }
        
        // Check if last 8 digits are not all the same
        const last8Digits = trimmedNumber.substring(3);
        const allSame = last8Digits.split('').every(digit => digit === last8Digits[0]);
        if (allSame) {
            return false;
        }
        
        return true;
    }

    // ===== LOGOUT =====
    logout() {
        API.auth.logout();
        window.location.href = '../index.html';
    }

    // ===== HELPER METHODS =====
    showConfirmToast(title, message, onConfirm) {
        const toastContainer = document.getElementById('alertContainer');
        const toastId = `confirm-toast-${Date.now()}`;
        
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center bg-primary text-white border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="false">
                <div class="toast-body">
                    <div class="mb-3">
                        <i class="bi bi-question-circle-fill me-2"></i>
                        <strong>${title}</strong>
                        <p class="mb-0 mt-2">${message}</p>
                    </div>
                    <div class="d-flex gap-2 justify-content-end">
                        <button type="button" class="btn btn-sm btn-light" id="${toastId}-cancel">Cancel</button>
                        <button type="button" class="btn btn-sm btn-success" id="${toastId}-confirm">Confirm</button>
                    </div>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: false
        });
        
        toast.show();
        
        // Handle confirm
        document.getElementById(`${toastId}-confirm`).addEventListener('click', () => {
            toast.hide();
            if (onConfirm) onConfirm();
        });
        
        // Handle cancel
        document.getElementById(`${toastId}-cancel`).addEventListener('click', () => {
            toast.hide();
        });
        
        // Remove from DOM after hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('alertContainer');
        
        // Map type to Bootstrap classes and icons
        const typeConfig = {
            success: { bg: 'bg-success', icon: 'bi-check-circle-fill', text: 'text-white' },
            error: { bg: 'bg-danger', icon: 'bi-exclamation-triangle-fill', text: 'text-white' },
            danger: { bg: 'bg-danger', icon: 'bi-exclamation-triangle-fill', text: 'text-white' },
            warning: { bg: 'bg-warning', icon: 'bi-exclamation-circle-fill', text: 'text-dark' },
            info: { bg: 'bg-info', icon: 'bi-info-circle-fill', text: 'text-white' }
        };
        
        const config = typeConfig[type] || typeConfig.info;
        const toastId = `toast-${Date.now()}`;
        
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center ${config.bg} ${config.text} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi ${config.icon} me-2"></i>
                        <strong>${title}:</strong> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });
        
        toast.show();
        
        // Remove from DOM after hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

// Initialize Student Dashboard
let studentDashboard;
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token || API.isTokenExpired()) {
        window.location.href = '../index.html';
    } else {
        studentDashboard = new StudentDashboard();

        // Load courses modal event
        const enrollModal = document.getElementById('enrollModal');
        if (enrollModal) {
            enrollModal.addEventListener('show.bs.modal', () => {
                studentDashboard.loadAvailableCoursesForEnrollment();
            });
        }
    }
});
