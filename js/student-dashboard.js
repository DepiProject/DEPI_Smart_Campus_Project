// =====================================================
// Student Dashboard Handler - API Integrated Version
// =====================================================

class StudentDashboard {
    constructor() {
        this.studentId = null; // Will be loaded from profile
        this.studentInfo = null;
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
                case 'exams':
                    this.loadExams();
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

    // ===== EXAMS =====
    async loadExams() {
        console.log('📚 Loading exams for student...', this.studentId);
        const tbody = document.getElementById('examsTableBody');

        // Loading state
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Loading exams...</td></tr>';

        try {
            if (!this.studentId) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-warning">Student ID not found</td></tr>';
                return;
            }

            // Get enrollments to know student's courses
            const enrollResp = await API.enrollment.getByStudentId(this.studentId);
            if (!enrollResp.success || !enrollResp.data) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No enrollments found</td></tr>';
                return;
            }

            let enrollments = enrollResp.data.Data || enrollResp.data.data || enrollResp.data || [];
            if (!Array.isArray(enrollments) || enrollments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No enrolled courses found</td></tr>';
                return;
            }

            const examsList = [];

            // For each enrolled course, fetch exams
            for (const e of enrollments) {
                const courseId = e.CourseId || e.courseId || e.CourseId || e.courseId;
                if (!courseId) continue;
                try {
                    const resp = await API.exam.getByCourse(courseId);
                    if (resp.success && resp.data) {
                        const data = resp.data.Data || resp.data.data || resp.data;
                        if (Array.isArray(data)) {
                            data.forEach(x => {
                                // keep course info with exam
                                x.CourseId = courseId;
                                x.CourseName = x.CourseName || e.CourseName || e.courseName || x.CourseName;
                                examsList.push(x);
                            });
                        }
                    }
                } catch (err) {
                    console.error('❌ Error fetching exams for course', courseId, err);
                }
            }

            if (examsList.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No exams scheduled for your courses</td></tr>';
                return;
            }

            // Render exams
            tbody.innerHTML = examsList.map(exam => {
                const courseName = exam.CourseName || exam.courseName || '-';
                const title = exam.Title || exam.title || '-';
                const examDateRaw = exam.ExamDate || exam.examDate;
                const examDate = examDateRaw ? new Date(examDateRaw).toLocaleString() : '-';
                const duration = exam.Duration || exam.duration || '-';
                const examId = exam.ExamId || exam.examId || exam.id;
                const courseId = exam.CourseId || exam.courseId || '';

                return `
                    <tr>
                        <td><strong>${courseName}</strong></td>
                        <td>${title}</td>
                        <td>${examDate}</td>
                        <td>${duration} mins</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="studentDashboard.startExam(${examId}, ${courseId})">Start</button>
                        </td>
                    </tr>
                `;
            }).join('');

        } catch (error) {
            console.error('❌ Error loading exams:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading exams</td></tr>';
        }
    }

    async startExam(examId, courseId) {
        if (!examId || !this.studentId) {
            this.showToast('Error', 'Invalid exam or student ID', 'error');
            return;
        }

        try {
            // Ask backend to create/mark a submission (if API supports it)
            const resp = await API.submission.startExam(examId, this.studentId);
            console.log('📊 startExam response:', resp);

            if (resp.success) {
                // Redirect to exam page with query params
                window.location.href = `../pages/exam.html?examId=${examId}&courseId=${courseId}`;
            } else {
                const errMsg = resp.data?.Message || resp.data?.message || resp.error || 'Cannot start exam';
                this.showToast('Cannot Start', errMsg, 'error');
            }
        } catch (error) {
            console.error('❌ Error starting exam:', error);
            this.showToast('Error', 'Failed to start exam', 'error');
        }
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
                        const count = Array.isArray(studentEnrollments) ? studentEnrollments.length : 0;
                        
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

            // Load GPA from enrollments
            if (this.studentId) {
                try {
                    console.log('📊 Calculating GPA for student:', this.studentId);
                    const enrollmentsResponse = await API.enrollment.getByStudentId(this.studentId);
                    
                    if (enrollmentsResponse.success && enrollmentsResponse.data) {
                        const studentEnrollments = enrollmentsResponse.data.Data || 
                                                  enrollmentsResponse.data.data || 
                                                  enrollmentsResponse.data;
                        
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
                            const gpa = (totalGrade / gradesEnrollments.length / 25).toFixed(2); // Convert to 4.0 scale
                            
                            const gpaEl = document.getElementById('studentGPA');
                            if (gpaEl) {
                                gpaEl.textContent = gpa;
                            }
                            console.log('✅ GPA:', gpa);
                        } else {
                            const gpaEl = document.getElementById('studentGPA');
                            if (gpaEl) {
                                gpaEl.textContent = 'No grades';
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ Error loading GPA:', error);
                    const gpaEl = document.getElementById('studentGPA');
                    if (gpaEl) {
                        gpaEl.textContent = 'No grades';
                    }
                }
            }
            
            console.log('✅ Dashboard data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading dashboard:', error);
            this.showToast('Error', 'Failed to load some dashboard data', 'error');
        }
    }

    // ===== COURSES - ENROLLMENT =====
    async loadEnrolledCourses() {
        console.log('📚 Loading enrolled courses...');
        console.log('🔑 Using studentId:', this.studentId);
        
        const tbody = document.getElementById('coursesTableBody');
        
        // Show loading state
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Loading courses...</td></tr>';

        try {
            if (!this.studentId) {
                console.error('❌ Student ID is null or undefined!');
                console.log('👤 Current user info:', API.getUserInfo());
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-warning">⚠️ Student ID not found. Please log in again.</td></tr>';
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
                    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">📚 No enrolled courses. <a href="#" onclick="studentDashboard.switchSection(\'courses\'); return false;" class="btn btn-sm btn-primary ms-2">Enroll now!</a></td></tr>';
                    return;
                }

                tbody.innerHTML = enrollments.map(enrollment => {
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
                            <td>
                                ${status === 'Enrolled' ? `
                                    <button class="btn btn-sm btn-danger" onclick="studentDashboard.dropCourse(${enrollmentId})" title="Drop this course">
                                        <i class="bi bi-trash"></i> Drop
                                    </button>
                                ` : `
                                    <span class="text-muted small">-</span>
                                `}
                            </td>
                        </tr>
                    `;
                }).join('');
                
                console.log('✅ Enrolled courses loaded successfully:', enrollments.length, 'courses');
            } else {
                console.error('❌ Failed to load courses:', response.error);
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">⚠️ Failed to load courses: ${response.error || 'Unknown error'}</td></tr>`;
            }
        } catch (error) {
            console.error('❌ Error loading courses:', error);
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">⚠️ Error: ${error.message}</td></tr>`;
        }
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
                    
                    const enrolledCourseIds = allEnrollments.map(e => {
                        return e.CourseId || e.courseId;
                    });

                    // Separate available and enrolled courses
                    const availableCourses = deptCourses.filter(c => {
                        const courseId = c.id || c.Id || c.CourseId || c.courseId;
                        return !enrolledCourseIds.includes(courseId);
                    });

                    if (availableCourses.length === 0) {
                        container.innerHTML = '<div class="col-12 text-muted">You are enrolled in all available courses!</div>';
                        return;
                    }

                    // Display available courses as cards
                    const courseCards = availableCourses.map(course => `
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

        // Show confirmation dialog
        this.showConfirmToast(
            'Confirm Drop Course',
            'Are you sure you want to drop this course? This action cannot be undone.',
            async () => {
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
            }
        );
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
                    
                    // Determine if grade is available
                    const hasGrade = finalGrade !== null && finalGrade !== undefined && finalGrade > 0;
                    const gradeDisplay = hasGrade ? finalGrade.toFixed(2) : '-';
                    const letterDisplay = gradeLetter || (hasGrade ? this.getLetterGrade(finalGrade) : '-');
                    const gradeColor = hasGrade ? this.getGradeColor(finalGrade) : 'secondary';
                    
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
                                <br><small class="text-muted">${courseCode}</small>
                            </td>
                            <td><span class="badge bg-light text-dark">${credits} credits</span></td>
                            <td><span class="badge bg-${statusBadgeClass}">${status}</span></td>
                            <td><strong>${gradeDisplay}</strong></td>
                            <td>
                                ${hasGrade 
                                    ? `<span class="badge bg-${gradeColor}">${letterDisplay}</span>` 
                                    : '<span class="text-muted">Not graded</span>'}
                            </td>
                        </tr>
                    `;
                }).join('');
                
                console.log('✅ Grades loaded successfully');
            } else {
                console.error('❌ Failed to load grades:', response.error);
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load grades</td></tr>';
            }
        } catch (error) {
            console.error('❌ Error loading grades:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading grades</td></tr>';
        }
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
        document.getElementById('profileContactNumber').readOnly = false;
        document.getElementById('profileContactNumber').style.backgroundColor = '';
        document.getElementById('profileContactNumber').style.cursor = '';
        
        document.getElementById('profileDisplayView').classList.add('d-none');
        document.getElementById('profileEditView').classList.remove('d-none');
    }

    async saveProfile() {
        const contactNumber = document.getElementById('profileContactNumber').value;

        // ========== STUDENT UPDATE: Only Contact Number ==========
        // Contact number validation (exactly 11 digits if provided)
        if (contactNumber && !this.validateContactNumber(contactNumber)) {
            this.showToast('Validation', '❌ Contact number must be EXACTLY 11 digits (e.g., 01234567890)', 'warning');
            return;
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
                // Extract error message from various possible locations
                let errorMsg = 'Unknown error';
                if (response.data) {
                    errorMsg = response.data.Message || response.data.message || 
                              response.data.Error || response.data.error || errorMsg;
                } else if (response.error) {
                    errorMsg = response.error;
                } else if (response.Message) {
                    errorMsg = response.Message;
                }
                console.error('❌ Update failed:', errorMsg);
                this.showToast('Error', `Failed to update contact number: ${errorMsg}`, 'error');
            }
        } catch (error) {
            console.error('❌ Error saving profile:', error);
            this.showToast('Error', `❌ Failed to save profile: ${error.message}`, 'error');
        }
    }

    // ===== VALIDATION METHODS =====
    validateNameFormat(name) {
        // Allow letters, spaces, hyphens, apostrophes
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        return nameRegex.test(name);
    }

    validateContactNumber(number) {
        // Must be exactly 11 digits
        const numberRegex = /^\d{11}$/;
        return numberRegex.test(number);
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

