// =====================================================
// Instructor Dashboard Module
// Integrated with Smart Campus University API
// =====================================================

class InstructorDashboard {
    constructor() {
        this.editingId = null;
        this.editingType = null;
        this.currentInstructorId = null;
        this.initializeEventListeners();
        this.loadDashboardData();
    }

    // ===== INITIALIZATION =====
    initializeEventListeners() {
        console.log('🔧 Initializing instructor dashboard event listeners...');

        // Section navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => this.handleSectionNavigation(e));
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    // ===== SECTION NAVIGATION =====
    handleSectionNavigation(e) {
        e.preventDefault();
        const sectionName = e.target.closest('[data-section]')?.getAttribute('data-section');
        
        if (!sectionName) return;

        console.log('📍 Navigating to section:', sectionName);

        // Update active nav link
        document.querySelectorAll('[data-section]').forEach(link => {
            link.classList.remove('active');
        });
        e.target.closest('[data-section]').classList.add('active');

        // Show/hide sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('d-none');
        });
        document.getElementById(sectionName)?.classList.remove('d-none');

        // Load data for specific sections
        switch (sectionName) {
            case 'courses':
                this.loadCourses();
                break;
            case 'students':
                this.loadStudents();
                break;
            case 'exams':
                this.loadExams();
                break;
            case 'attendance':
                this.loadAttendance();
                break;
            case 'enrollments':
                this.loadCourseFilterForEnrollments();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    }

    // ===== DASHBOARD DATA LOADING =====
    async loadDashboardData() {
        console.log('📊 Loading dashboard data...');

        try {
            // Get current instructor info from JWT first
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            console.log('🔐 User Info from JWT:', userInfo);

            // Update navbar with user name
            const userName = userInfo.FirstName || userInfo.firstName || 'Instructor';
            document.getElementById('userName').textContent = userName;

            // Now fetch instructor profile to get the actual instructor ID
            console.log('🔗 Fetching current instructor profile...');
            const profileResponse = await API.instructor.getMyProfile();
            
            console.log('📦 Profile API response:', profileResponse);
            
            let profile = null;
            
            // Handle different response formats
            if (profileResponse.success && profileResponse.data?.data) {
                // Wrapped format: { success: true, data: { data: {...} } }
                profile = profileResponse.data.data;
            } else if (profileResponse.success && profileResponse.data) {
                // Wrapped format: { success: true, data: {...} }
                profile = profileResponse.data;
            } else if (profileResponse.data) {
                // Direct format (no success wrapper): { data: {...} }
                profile = profileResponse.data;
            } else if (profileResponse.instructorId || profileResponse.InstructorId) {
                // Direct instructor object without any wrapper
                profile = profileResponse;
            }
            
            if (profile) {
                // InstructorDTO has InstructorId property which becomes instructorId in JSON
                this.currentInstructorId = profile.instructorId || profile.InstructorId || profile.id || profile.Id;
                console.log('✅ Instructor ID extracted:', this.currentInstructorId);
                console.log('👤 Full profile:', profile);
            } else {
                console.error('❌ Failed to fetch instructor profile:', profileResponse);
                this.showToast('Error', 'Instructor ID is not available. Please refresh and login again.', 'error');
                return;
            }

            if (!this.currentInstructorId) {
                console.error('❌ Could not extract instructor ID from profile');
                this.showToast('Error', 'Could not extract instructor ID', 'error');
                return;
            }

            // Load initial dashboard statistics
            await this.loadDashboardStats();
        } catch (error) {
            console.error('❌ Error loading dashboard:', error);
            this.showToast('Error', 'Failed to load dashboard: ' + error.message, 'error');
        }
    }

    async loadDashboardStats() {
        console.log('📈 Loading dashboard statistics...');
        console.log('📌 Current Instructor ID:', this.currentInstructorId);

        try {
            if (!this.currentInstructorId) {
                console.warn('⚠️ Instructor ID not available yet, skipping stats');
                return;
            }

            // Get instructor's courses directly (API: GET /api/Course/instructor/{instructorId})
            const coursesResponse = await API.request(`/Course/instructor/${this.currentInstructorId}`, {
                method: 'GET'
            });
            
            if (coursesResponse.success && coursesResponse.data?.data) {
                const myCourses = coursesResponse.data.data;
                const courseCount = myCourses.length;
                document.querySelector('[data-stat="courses"]').textContent = courseCount;
                
                console.log('📚 Found', courseCount, 'courses for instructor', this.currentInstructorId);
                
                // Log first course to see all available properties
                if (myCourses.length > 0) {
                    console.log('📋 Sample course object:', myCourses[0]);
                    console.log('🔑 Available course properties:', Object.keys(myCourses[0]));
                }
                
                // Get total students and calculate average grades
                let totalStudents = 0;
                let allGrades = [];
                let pendingCount = 0;
                
                for (const course of myCourses) {
                    try {
                        // API: GET /api/Enrollment/course/{courseId}
                        const courseId = course.courseId || course.CourseId;
                        
                        if (!courseId) {
                            console.warn('⚠️ Course ID is undefined, skipping:', course);
                            continue;
                        }
                        
                        console.log('📚 Checking enrollments for courseId:', courseId);
                        
                        const enrollmentsResponse = await API.request(`/Enrollment/course/${courseId}`, {
                            method: 'GET'
                        });
                        
                        if (enrollmentsResponse.success && enrollmentsResponse.data) {
                            const enrollments = enrollmentsResponse.data.data || enrollmentsResponse.data;
                            
                            if (Array.isArray(enrollments)) {
                                totalStudents += enrollments.length;
                                
                                // Collect grades for average calculation
                                enrollments.forEach(enrollment => {
                                    const grade = enrollment.grade || enrollment.Grade;
                                    if (grade !== null && grade !== undefined && grade > 0) {
                                        allGrades.push(grade);
                                    } else {
                                        // Count students without grades as pending
                                        pendingCount++;
                                    }
                                });
                            }
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not load enrollments for course:', course);
                    }
                }
                
                // Update total students
                document.querySelector('[data-stat="students"]').textContent = totalStudents;
                console.log('👥 Total students:', totalStudents);
                
                // Calculate and display average grade
                if (allGrades.length > 0) {
                    const avgGrade = (allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length).toFixed(1);
                    document.querySelector('[data-stat="avgGrade"]').textContent = avgGrade + '%';
                } else {
                    document.querySelector('[data-stat="avgGrade"]').textContent = 'N/A';
                }
                
                // Update pending reviews
                document.querySelector('[data-stat="pending"]').textContent = pendingCount;
                
            } else {
                console.error('❌ Failed to load courses:', coursesResponse.error);
            }
        } catch (error) {
            console.error('❌ Error loading stats:', error);
        }
    }

    // ===== MY COURSES SECTION =====
    async loadCourses() {
        console.log('📚 Loading instructor courses...');
        console.log('📌 Current Instructor ID:', this.currentInstructorId);

        try {
            if (!this.currentInstructorId) {
                console.error('❌ Instructor ID is not set!');
                this.showToast('Error', 'Instructor ID is not available. Please refresh and login again.', 'error');
                return;
            }

            // API: GET /api/Course/instructor/{instructorId}
            const endpoint = `/Course/instructor/${this.currentInstructorId}`;
            console.log('🔗 Fetching from endpoint:', endpoint);
            
            const response = await API.request(endpoint, {
                method: 'GET'
            });
            
            const coursesList = document.getElementById('coursesList');

            if (!coursesList) {
                console.warn('⚠️ coursesList element not found');
                return;
            }

            console.log('📥 Courses Response:', response);

            if (response.success && response.data?.data) {
                const courses = response.data.data;
                console.log('✅ Found', courses.length, 'courses');

                if (courses.length === 0) {
                    coursesList.innerHTML = '<div class="col-12"><div class="alert alert-info">No courses assigned yet</div></div>';
                    return;
                }

                coursesList.innerHTML = courses.map(course => {
                    const courseCode = course.courseCode || course.CourseCode;
                    
                    return `
                    <div class="col-md-6 mb-3">
                        <div class="card border-0 shadow-sm h-100">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h5 class="card-title">${course.courseName || course.name}</h5>
                                        <p class="card-text text-muted">
                                            <strong>${courseCode}</strong> • ${course.creditHours} credits
                                        </p>
                                        <p class="card-text text-muted small">
                                            Department: ${course.departmentName || 'N/A'}
                                        </p>
                                    </div>
                                    <span class="badge bg-primary">Active</span>
                                </div>
                                <button class="btn btn-sm btn-outline-primary mt-3" 
                                    onclick="instructorDashboard.viewCourseDetails('${courseCode}')">
                                    <i class="bi bi-arrow-right"></i> View Details
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                }).join('');
            } else {
                console.error('❌ API Response Error:', response.error);
                coursesList.innerHTML = '<div class="col-12"><div class="alert alert-danger">Failed to load courses: ' + (response.error || 'Unknown error') + '</div></div>';
                this.showToast('Error', 'Failed to load courses: ' + (response.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('❌ Error loading courses:', error);
            const coursesList = document.getElementById('coursesList');
            if (coursesList) {
                coursesList.innerHTML = '<div class="col-12"><div class="alert alert-danger">Error: ' + error.message + '</div></div>';
            }
            this.showToast('Error', 'Failed to load courses: ' + error.message, 'error');
        }
    }

    async viewCourseDetails(courseCode) {
        console.log('👁️ Viewing course details for code:', courseCode);
        
        try {
            // API: GET /api/Course/code/{courseCode}
            const response = await API.request(`/Course/code/${courseCode}`, {
                method: 'GET'
            });
            let course = response.data?.data || response.data;

            if (response.success && course) {
                const courseName = course.name || course.courseName || 'Unknown Course';
                // CourseDTO has 'Id' property (capital I), not 'courseId'
                const courseId = course.id || course.Id || course.courseId || course.CourseId;
                
                console.log('📦 Course data:', course);
                console.log('🔑 Extracted courseId:', courseId);
                
                this.showToast('Info', `Course: ${courseName}`, 'info');
                
                // Load students enrolled in this course
                if (courseId) {
                    await this.loadCourseStudents(courseId);
                } else {
                    console.error('❌ Course ID is undefined!');
                    this.showToast('Error', 'Course ID not found', 'error');
                }
            }
        } catch (error) {
            console.error('❌ Error viewing course:', error);
            this.showToast('Error', 'Failed to load course details', 'error');
        }
    }

    async loadCourseStudents(courseId) {
        console.log('👥 Loading students for course:', courseId);

        try {
            // API: GET /api/Enrollment/course/{courseId}
            const response = await API.request(`/Enrollment/course/${courseId}`, {
                method: 'GET'
            });

            if (response.success && response.data?.data) {
                const enrollments = response.data.data;
                console.log('📊 Found', enrollments.length, 'enrollments');

                if (enrollments.length === 0) {
                    this.showToast('Info', 'No students enrolled in this course yet', 'info');
                    return;
                }

                let studentInfo = `<strong>Enrolled Students (${enrollments.length}):</strong>\n`;
                enrollments.forEach((enrollment, index) => {
                    studentInfo += `\n${index + 1}. ${enrollment.studentName || 'Unknown'} - ${enrollment.status || 'Enrolled'}`;
                });
                
                this.showToast('Students', studentInfo, 'info');
            }
        } catch (error) {
            console.error('❌ Error loading course students:', error);
        }
    }

    // ===== STUDENTS SECTION =====
    async loadStudents() {
        console.log('👥 Loading students enrolled in instructor courses...');

        try {
            const studentsTableBody = document.getElementById('studentsTableBody');

            if (!studentsTableBody) {
                console.warn('⚠️ studentsTableBody element not found');
                return;
            }

            if (!this.currentInstructorId) {
                console.error('❌ Instructor ID is not available');
                studentsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Instructor ID not available</td></tr>';
                return;
            }

            // Get instructor's courses first
            const coursesResponse = await API.request(`/Course/instructor/${this.currentInstructorId}`, {
                method: 'GET'
            });

            if (!coursesResponse.success || !coursesResponse.data?.data) {
                console.error('❌ Failed to load courses:', coursesResponse.error);
                studentsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load courses</td></tr>';
                return;
            }

            let courses = coursesResponse.data.data;
            if (!Array.isArray(courses)) {
                courses = [courses];
            }

            console.log('✅ Found', courses.length, 'courses');

            // Get all students enrolled in these courses
            let allStudents = [];
            for (const course of courses) {
                try {
                    const courseId = course.courseId || course.id;
                    console.log('📚 Fetching enrollments for course:', courseId);
                    
                    // API: GET /api/Enrollment/course/{courseId}
                    const enrollmentResponse = await API.request(`/Enrollment/course/${courseId}`, {
                        method: 'GET'
                    });

                    if (enrollmentResponse.success && enrollmentResponse.data?.data) {
                        let enrollments = enrollmentResponse.data.data;
                        if (!Array.isArray(enrollments)) {
                            enrollments = [enrollments];
                        }
                        
                        // Add student info from enrollments
                        enrollments.forEach(enrollment => {
                            // Check if student already in list
                            const exists = allStudents.find(s => (s.studentId || s.id) === (enrollment.studentId || enrollment.id));
                            if (!exists && enrollment.studentId) {
                                allStudents.push(enrollment);
                            }
                        });
                    }
                } catch (error) {
                    console.warn('⚠️ Failed to load enrollments for course:', error);
                }
            }

            console.log('✅ Loaded', allStudents.length, 'unique students from enrollments');

            if (allStudents.length === 0) {
                studentsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No students enrolled in your courses</td></tr>';
                return;
            }

            studentsTableBody.innerHTML = allStudents.map(student => `
                <tr>
                    <td><strong>${student.studentCode || student.code || '-'}</strong></td>
                    <td>${student.studentName || student.fullName || student.name || student.firstName || '-'}</td>
                    <td><small>${student.email || '-'}</small></td>
                    <td>${student.departmentName || student.department || '-'}</td>
                    <td><span class="badge bg-info">Level ${student.level || '1'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-info" title="View" 
                            onclick="instructorDashboard.viewStudentDetails(${student.studentId || student.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('❌ Error loading students:', error);
            const studentsTableBody = document.getElementById('studentsTableBody');
            if (studentsTableBody) {
                studentsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error: ' + error.message + '</td></tr>';
            }
            this.showToast('Error', 'Failed to load students: ' + error.message, 'error');
        }
    }

    async viewStudentDetails(studentId) {
        console.log('👁️ Viewing student details:', studentId);
        
        try {
            // API: GET /api/Student/{id}
            const response = await API.request(`/Student/${studentId}`, {
                method: 'GET'
            });

            let student = response.data?.data || response.data;

            if (response.success && student) {
                const studentName = student.fullName || student.name || 'Unknown';
                const studentCode = student.studentCode || student.code || 'N/A';
                const email = student.email || 'N/A';
                
                let details = `Student: ${studentName}\nCode: ${studentCode}\nEmail: ${email}`;
                this.showToast('Student Profile', details, 'info');
            }
        } catch (error) {
            console.error('❌ Error viewing student:', error);
            this.showToast('Error', 'Failed to load student details', 'error');
        }
    }

    // ===== GRADES SECTION =====
    async loadGrades() {
        console.log('📊 Loading grades...');

        try {
            // Get courses first to show grade breakdown
            const coursesResponse = await API.request(`/Course/instructor/${this.currentInstructorId}`, {
                method: 'GET'
            });

            if (coursesResponse.success && coursesResponse.data?.data) {
                const courses = coursesResponse.data.data;
                
                let gradeInfo = '<strong>Grades by Course:</strong>\n';
                
                for (const course of courses) {
                    gradeInfo += `\n• ${course.courseName || course.name}: `;
                    
                    try {
                        // Get enrollments for this course to see grades
                        const enrollResponse = await API.request(`/Enrollment/course/${course.courseId || course.id}`, {
                            method: 'GET'
                        });
                        
                        if (enrollResponse.success && enrollResponse.data?.data) {
                            const enrollments = enrollResponse.data.data;
                            const graded = enrollments.filter(e => e.finalGrade !== null && e.finalGrade !== undefined);
                            gradeInfo += `${graded.length} graded, ${enrollments.length} total enrolled`;
                        }
                    } catch (error) {
                        gradeInfo += 'Grade info unavailable';
                    }
                }

                this.showToast('Grade Summary', gradeInfo, 'info');
            }
        } catch (error) {
            console.error('❌ Error loading grades:', error);
            this.showToast('Error', 'Failed to load grades', 'error');
        }
    }

    // ===== EXAMS SECTION =====
    async loadExams() {
        console.log('📝 Loading exams...');

        try {
            // Get courses for this instructor
            const coursesResponse = await API.request(`/Course/instructor/${this.currentInstructorId}`, {
                method: 'GET'
            });

            if (coursesResponse.success && coursesResponse.data?.data) {
                const courses = coursesResponse.data.data;
                const examsTableBody = document.getElementById('examsTableBody');

                if (!examsTableBody) {
                    console.warn('⚠️ examsTableBody element not found');
                    return;
                }

                let allExams = [];

                // Get exams for each course
                for (const course of courses) {
                    try {
                        // API: GET /api/Exam/course/{courseId}
                        const examsResponse = await API.request(`/Exam/course/${course.courseId || course.id}`, {
                            method: 'GET'
                        });

                        if (examsResponse.success && examsResponse.data?.data) {
                            const exams = examsResponse.data.data;
                            exams.forEach(exam => {
                                exam.courseName = course.courseName || course.name;
                            });
                            allExams = allExams.concat(exams);
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not load exams for course:', course.id);
                    }
                }

                if (allExams.length === 0) {
                    examsTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No exams created yet</td></tr>';
                    return;
                }

                // Get submissions to calculate averages
                examsTableBody.innerHTML = await Promise.all(allExams.map(async (exam) => {
                    try {
                        // Try to get submissions for this exam
                        const submissionsResponse = await API.request(`/Submission/exam/${exam.examId || exam.id}`, {
                            method: 'GET'
                        });

                        let submissions = 0;
                        let avgScore = '-';

                        if (submissionsResponse.success && submissionsResponse.data?.data) {
                            const submissionsList = submissionsResponse.data.data;
                            submissions = submissionsList.length;
                            
                            // Calculate average score from submissions
                            if (submissions > 0) {
                                const scores = submissionsList
                                    .filter(s => s.score !== null && s.score !== undefined)
                                    .map(s => parseFloat(s.score));
                                
                                if (scores.length > 0) {
                                    const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
                                    avgScore = `${avg}%`;
                                }
                            }
                        }

                        return `
                            <tr>
                                <td><strong>${exam.courseName}</strong></td>
                                <td>${exam.examTitle || exam.title || 'Exam'}</td>
                                <td>${submissions}</td>
                                <td>${avgScore}</td>
                                <td>
                                    <button class="btn btn-sm btn-info" title="View Details">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    } catch (error) {
                        console.warn('⚠️ Error processing exam:', exam);
                        return '';
                    }
                })).then(rows => rows.filter(r => r).join(''));

                if (examsTableBody.innerHTML.trim() === '') {
                    examsTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No exams data available</td></tr>';
                }
            }
        } catch (error) {
            console.error('❌ Error loading exams:', error);
            this.showToast('Error', 'Failed to load exams', 'error');
        }
    }

    // ===== ATTENDANCE SECTION =====
    async loadAttendance() {
        console.log('📋 Loading attendance management...');
        console.log('📌 Current Instructor ID:', this.currentInstructorId);

        try {
            if (!this.currentInstructorId) {
                console.error('❌ Instructor ID is not available!');
                this.showToast('Error', 'Instructor ID not available. Please refresh.', 'error');
                return;
            }

            // Get courses for this instructor
            const coursesResponse = await API.request(`/Course/instructor/${this.currentInstructorId}`, {
                method: 'GET'
            });
            
            console.log('📥 Courses Response:', coursesResponse);

            if (coursesResponse.success && coursesResponse.data?.data) {
                let courses = coursesResponse.data.data;
                
                if (!Array.isArray(courses)) {
                    courses = [courses];
                }

                const courseSelect = document.getElementById('attendanceCourse');
                const studentSelect = document.getElementById('attendanceStudent');

                if (!courseSelect || !studentSelect) {
                    console.error('❌ Course or student select elements not found');
                    return;
                }

                // Populate course dropdown
                courseSelect.innerHTML = '<option value="">Select Course...</option>' + 
                    courses.map(course => `
                        <option value="${course.courseId || course.id}">
                            ${course.courseCode} - ${course.courseName || course.name}
                        </option>
                    `).join('');

                console.log('✅ Loaded', courses.length, 'courses');

                // Get all students enrolled in instructor's courses
                let allStudents = [];
                for (const course of courses) {
                    try {
                        const courseId = course.courseId || course.id;
                        const enrollmentResponse = await API.request(`/Enrollment/course/${courseId}`, {
                            method: 'GET'
                        });

                        if (enrollmentResponse.success && enrollmentResponse.data?.data) {
                            let enrollments = enrollmentResponse.data.data;
                            if (!Array.isArray(enrollments)) {
                                enrollments = [enrollments];
                            }
                            
                            enrollments.forEach(enrollment => {
                                const exists = allStudents.find(s => (s.studentId || s.id) === (enrollment.studentId || enrollment.id));
                                if (!exists && enrollment.studentId) {
                                    allStudents.push(enrollment);
                                }
                            });
                        }
                    } catch (error) {
                        console.warn('⚠️ Failed to load enrollments:', error);
                    }
                }

                // Populate student dropdown
                studentSelect.innerHTML = '<option value="">Select Student...</option>' + 
                    allStudents.map(student => `
                        <option value="${student.studentId || student.id}">
                            ${student.studentName || student.fullName || student.name} (${student.studentCode || student.code})
                        </option>
                    `).join('');
                
                console.log('✅ Loaded', allStudents.length, 'students from enrollments');

                // Set today's date as default
                document.getElementById('attendanceDate').valueAsDate = new Date();

                // Load all attendance records
                await this.loadAttendanceRecords();

                // Setup form submission
                const form = document.getElementById('markAttendanceForm');
                if (form && !form.hasAttribute('data-listener-set')) {
                    form.setAttribute('data-listener-set', 'true');
                    form.addEventListener('submit', (e) => this.markAttendance(e));
                }

            } else {
                console.error('❌ Failed to load courses:', coursesResponse.error);
                this.showToast('Error', 'Failed to load courses: ' + (coursesResponse.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('❌ Error loading attendance:', error);
            this.showToast('Error', 'Failed to load attendance data: ' + error.message, 'error');
        }
    }

    async loadAttendanceRecords() {
        console.log('📋 Loading attendance records...');

        try {
            const attendanceTableBody = document.getElementById('attendanceTableBody');
            
            if (!attendanceTableBody) {
                console.warn('⚠️ attendanceTableBody element not found');
                return;
            }

            if (!this.currentInstructorId) {
                console.error('❌ Instructor ID not available');
                attendanceTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Instructor ID not available</td></tr>';
                return;
            }

            // Build query parameters from filters
            const fromDate = document.getElementById('filterFromDate')?.value;
            const toDate = document.getElementById('filterToDate')?.value;
            const courseId = document.getElementById('attendanceCourse')?.value;

            // Get instructor's courses if no specific course is selected
            let coursesToCheck = [];
            if (!courseId) {
                const coursesResponse = await API.request(`/Course/instructor/${this.currentInstructorId}`, {
                    method: 'GET'
                });
                
                if (coursesResponse.success && coursesResponse.data?.data) {
                    let courses = coursesResponse.data.data;
                    if (!Array.isArray(courses)) {
                        courses = [courses];
                    }
                    coursesToCheck = courses;
                }
            } else {
                coursesToCheck = [{ id: courseId }];
            }

            console.log('📌 Courses to check:', coursesToCheck.length);

            if (coursesToCheck.length === 0) {
                console.log('⚠️ No courses found for instructor');
                attendanceTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No courses found</td></tr>';
                this.updateAttendanceStats([]);
                return;
            }

            // Fetch attendance for each course
            let allRecords = [];
            for (const course of coursesToCheck) {
                try {
                    const cId = course.courseId || course.id;
                    
                    if (!cId) {
                        console.warn('⚠️ Course ID is undefined, skipping...');
                        continue;
                    }
                    
                    let url = `/Attendance?courseId=${cId}`;

                    if (fromDate) url += `&fromDate=${fromDate}`;
                    if (toDate) url += `&toDate=${toDate}`;

                    console.log('🔗 Fetching from:', url);
                    const response = await API.request(url, { method: 'GET' });

                    if (response.success && response.data?.data) {
                        let records = response.data.data;
                        if (!Array.isArray(records)) {
                            records = [records];
                        }
                        allRecords = allRecords.concat(records);
                        console.log('✅ Fetched', records.length, 'records for course', cId);
                    }
                } catch (error) {
                    console.warn('⚠️ Failed to load attendance for course:', error);
                }
            }

            this.attendanceRecords = allRecords;
            console.log('✅ Total records loaded:', allRecords.length);

            // Update stats
            this.updateAttendanceStats(allRecords);

            if (allRecords.length === 0) {
                attendanceTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No attendance records found</td></tr>';
                return;
            }

            attendanceTableBody.innerHTML = allRecords.map(record => {
                const statusColor = {
                    'Present': 'success',
                    'Absent': 'danger',
                    'Late': 'warning',
                    'Excused': 'info'
                }[record.status] || 'secondary';

                return `
                    <tr>
                        <td><strong>${record.studentName || 'Unknown'}</strong></td>
                        <td>${record.courseName || 'N/A'}</td>
                        <td>${new Date(record.attendanceDate).toLocaleDateString()}</td>
                        <td>
                            <span class="badge bg-${statusColor}">
                                ${record.status || 'Unmarked'}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-warning" title="Edit" 
                                onclick="instructorDashboard.openEditAttendance(${record.attendanceId || record.id}, '${record.status}', '${record.studentName}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" title="Delete" 
                                onclick="instructorDashboard.deleteAttendance(${record.attendanceId || record.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('❌ Error loading records:', error);
            const attendanceTableBody = document.getElementById('attendanceTableBody');
            if (attendanceTableBody) {
                attendanceTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error: ' + error.message + '</td></tr>';
            }
            this.showToast('Error', 'Failed to load attendance records: ' + error.message, 'error');
        }
    }

    updateAttendanceStats(records) {
        const total = records.length;
        const present = records.filter(r => r.status === 'Present').length;
        const absent = records.filter(r => r.status === 'Absent').length;
        const late = records.filter(r => r.status === 'Late').length;

        document.getElementById('totalAttendanceRecords').textContent = total;
        document.getElementById('totalPresent').textContent = present;
        document.getElementById('totalAbsent').textContent = absent;
        document.getElementById('totalLate').textContent = late;
    }

    async markAttendance(e) {
        e.preventDefault();
        console.log('✏️ Marking attendance...');

        try {
            const studentId = document.getElementById('attendanceStudent').value;
            const courseId = document.getElementById('attendanceCourse').value;
            const date = document.getElementById('attendanceDate').value;
            const status = document.getElementById('attendanceStatus').value;

            if (!studentId || !courseId || !date || !status) {
                this.showToast('Warning', 'Please fill in all fields', 'warning');
                return;
            }

            // API: POST /api/Attendance
            const response = await API.request('/Attendance', {
                method: 'POST',
                body: JSON.stringify({
                    studentId: parseInt(studentId),
                    courseId: parseInt(courseId),
                    attendanceDate: date,
                    status: status
                })
            });

            if (response.success) {
                this.showToast('Success', `Attendance marked as ${status}`, 'success');
                document.getElementById('markAttendanceForm').reset();
                document.getElementById('attendanceDate').valueAsDate = new Date();
                await this.loadAttendanceRecords();
                this.addRecentActivity(`Marked ${status} for selected student`);
            } else {
                this.showToast('Error', response.message || 'Failed to mark attendance', 'error');
            }
        } catch (error) {
            console.error('❌ Error marking attendance:', error);
            this.showToast('Error', 'Failed to mark attendance', 'error');
        }
    }

    openEditAttendance(attendanceId, currentStatus, studentName) {
        console.log('📝 Opening edit modal for attendance:', attendanceId);
        
        this.editingAttendanceId = attendanceId;
        document.getElementById('editAttendanceInfo').textContent = `Student: ${studentName} | Current Status: ${currentStatus}`;
        document.getElementById('editAttendanceStatus').value = currentStatus;
        
        const modal = new bootstrap.Modal(document.getElementById('editAttendanceModal'));
        modal.show();
    }

    async saveEditAttendance() {
        console.log('💾 Saving attendance changes:', this.editingAttendanceId);

        try {
            const status = document.getElementById('editAttendanceStatus').value;

            // API: PUT /api/Attendance/{id}
            const response = await API.request(`/Attendance/${this.editingAttendanceId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: status })
            });

            if (response.success) {
                this.showToast('Success', 'Attendance updated successfully', 'success');
                bootstrap.Modal.getInstance(document.getElementById('editAttendanceModal')).hide();
                await this.loadAttendanceRecords();
                this.addRecentActivity(`Updated attendance status to ${status}`);
            } else {
                this.showToast('Error', response.message || 'Failed to update', 'error');
            }
        } catch (error) {
            console.error('❌ Error updating attendance:', error);
            this.showToast('Error', 'Failed to update attendance', 'error');
        }
    }

    async deleteAttendance(attendanceId) {
        console.log('🗑️ Deleting attendance record:', attendanceId);

        if (!confirm('Are you sure you want to delete this attendance record?')) {
            return;
        }

        try {
            // API: DELETE /api/Attendance/{id}
            const response = await API.request(`/Attendance/${attendanceId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                this.showToast('Success', 'Attendance record deleted', 'success');
                await this.loadAttendanceRecords();
                this.addRecentActivity('Deleted attendance record');
            } else {
                this.showToast('Error', response.message || 'Failed to delete', 'error');
            }
        } catch (error) {
            console.error('❌ Error deleting attendance:', error);
            this.showToast('Error', 'Failed to delete record', 'error');
        }
    }

    refreshAttendance() {
        console.log('🔄 Refreshing attendance data...');
        this.loadAttendanceRecords();
    }

    addRecentActivity(activity) {
        const container = document.getElementById('recentActivityList');
        const now = new Date().toLocaleTimeString();
        
        const activityHtml = `
            <div class="border-bottom pb-2 mb-2">
                <p class="mb-1 small"><strong>${activity}</strong></p>
                <p class="mb-0 text-muted" style="font-size: 0.75rem;">${now}</p>
            </div>
        `;

        if (container.innerHTML.includes('No recent activity')) {
            container.innerHTML = activityHtml;
        } else {
            container.insertAdjacentHTML('afterbegin', activityHtml);
        }

        // Keep only last 10 activities
        const activities = container.querySelectorAll('.border-bottom');
        if (activities.length > 10) {
            activities[activities.length - 1].remove();
        }
    }

    // ===== PROFILE SECTION =====
    async loadProfile() {
        console.log('👤 Loading instructor profile...');

        try {
            // API: GET /api/Instructor/me
            const response = await API.instructor.getMyProfile();
            console.log('📊 Full profile response:', response);
            console.log('📊 Response.data:', response.data);

            if (response.success && response.data) {
                // Handle nested data structure - API might return { data: { Data: {...} } } or { data: {...} }
                const profile = response.data.Data || response.data.data || response.data;
                console.log('✅ Profile loaded:', profile);

                // Store profile for editing
                this.currentProfile = profile;

                // Display profile information - handle both camelCase and PascalCase
                document.getElementById('displayFirstName').textContent = profile.firstName || profile.FirstName || '-';
                document.getElementById('displayLastName').textContent = profile.lastName || profile.LastName || '-';
                document.getElementById('displayEmail').textContent = profile.email || profile.Email || '-';
                document.getElementById('displayContactNumber').textContent = profile.contactNumber || profile.ContactNumber || '-';
                document.getElementById('displayDepartment').textContent = profile.departmentName || profile.DepartmentName || '-';

                // Setup edit form with current values
                document.getElementById('editFirstName').value = profile.firstName || profile.FirstName || '';
                document.getElementById('editLastName').value = profile.lastName || profile.LastName || '';
                document.getElementById('editEmail').value = profile.email || profile.Email || '';
                document.getElementById('editContactNumber').value = profile.contactNumber || profile.ContactNumber || '';

                // Update navbar user name
                const firstName = profile.firstName || profile.FirstName || '';
                const lastName = profile.lastName || profile.LastName || '';
                const fullName = `${firstName} ${lastName}`.trim() || 'Instructor';
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = fullName;
                }

                // Setup form submission if not already done
                const form = document.getElementById('editProfileForm');
                if (form && !form.hasAttribute('data-listener-set')) {
                    form.setAttribute('data-listener-set', 'true');
                    form.addEventListener('submit', (e) => this.saveProfile(e));
                }

                this.showDisplayProfileView();
            } else {
                console.error('❌ Failed to load profile:', response.error);
                this.showToast('Error', 'Failed to load profile: ' + (response.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('❌ Error loading profile:', error);
            this.showToast('Error', 'Failed to load profile: ' + error.message, 'error');
        }
    }

    showDisplayProfileView() {
        console.log('👁️ Showing profile display view');
        document.getElementById('profileDisplayView').classList.remove('d-none');
        document.getElementById('profileEditView').classList.add('d-none');
    }

    showEditProfileForm() {
        console.log('✏️ Showing profile edit form');
        document.getElementById('profileDisplayView').classList.add('d-none');
        document.getElementById('profileEditView').classList.remove('d-none');
    }

    async saveProfile(e) {
        e.preventDefault();
        console.log('💾 Saving profile changes...');

        try {
            // Clear previous errors
            document.getElementById('contactNumberError').textContent = '';

            // Get form value - only contact number is editable
            const contactNumber = document.getElementById('editContactNumber').value.trim();

            // Validate contact number if provided (must be exactly 11 digits)
            if (contactNumber && !/^\d{11}$/.test(contactNumber)) {
                document.getElementById('contactNumberError').textContent = 'Contact number must be exactly 11 digits';
                return;
            }

            // Prepare update data - only contact number
            const updateData = {
                contactNumber: contactNumber || null
            };

            console.log('📤 Sending update:', updateData);

            // Call API to update profile
            const response = await API.instructor.updateMyProfile(updateData);
            console.log('📊 Profile update response:', response);

            if (response.success) {
                this.showToast('Success', 'Contact number updated successfully!', 'success');
                
                // Reload profile to reflect changes
                await this.loadProfile();
                this.showDisplayProfileView();
            } else {
                // Extract error message
                let errorMsg = 'Unknown error';
                if (response.data) {
                    errorMsg = response.data.Message || response.data.message || 
                              response.data.Error || response.data.error || errorMsg;
                } else if (response.error) {
                    errorMsg = response.error;
                }
                
                console.error('❌ Profile update failed:', errorMsg);
                this.showToast('Error', 'Failed to update profile: ' + errorMsg, 'error');
            }
        } catch (error) {
            console.error('❌ Exception saving profile:', error);
            this.showToast('Error', 'An error occurred: ' + error.message, 'error');
        }
    }

    // ===== ENROLLMENTS - VIEW STUDENTS ENROLLED IN COURSES =====
    async loadCourseFilterForEnrollments() {
        console.log('📋 Loading instructor courses for enrollment filter...');
        const select = document.getElementById('courseFilter');

        if (!this.currentInstructorId) {
            console.warn('⚠️ Instructor ID not available');
            select.innerHTML = '<option value="">Instructor ID not found</option>';
            return;
        }

        try {
            // Get all courses taught by this instructor
            const coursesResponse = await API.course.getAll(1, 100);
            
            if (coursesResponse.success && coursesResponse.data) {
                const allCourses = coursesResponse.data.Data || coursesResponse.data.data || coursesResponse.data;
                
                // Filter for courses taught by this instructor
                const instructorCourses = Array.isArray(allCourses)
                    ? allCourses.filter(c => c.instructorId == this.currentInstructorId)
                    : [];

                if (instructorCourses.length === 0) {
                    select.innerHTML = '<option value="">No courses assigned to you</option>';
                    return;
                }

                const options = instructorCourses.map(course => 
                    `<option value="${course.id}" data-name="${course.name}">${course.name} (${course.courseCode})</option>`
                ).join('');
                
                select.innerHTML = '<option value="">Select a course to view enrollments</option>' + options;
            } else {
                select.innerHTML = '<option value="">Failed to load courses</option>';
            }
        } catch (error) {
            console.error('❌ Error loading courses:', error);
            select.innerHTML = '<option value="">Error loading courses</option>';
        }
    }

    async filterEnrollments() {
        const courseSelect = document.getElementById('courseFilter');
        const courseId = courseSelect.value;
        const courseName = courseSelect.options[courseSelect.selectedIndex]?.getAttribute('data-name') || 'Course';

        if (!courseId) {
            this.showToast('Validation', 'Please select a course first', 'warning');
            return;
        }

        console.log(`📊 Loading enrollments for course ${courseId}...`);
        const tbody = document.getElementById('enrollmentsTableBody');
        const container = document.getElementById('enrollmentsTableContainer');
        const courseNameSpan = document.getElementById('selectedCourseName');
        const countBadge = document.getElementById('enrollmentCount');

        try {
            const response = await API.enrollment.getByCourseId(courseId);

            if (response.success && response.data) {
                let enrollments = response.data.Data || response.data.data || response.data;

                if (!Array.isArray(enrollments)) {
                    enrollments = [];
                }

                // Show container
                container.classList.remove('d-none');
                courseNameSpan.textContent = courseName;
                countBadge.textContent = `${enrollments.length} students`;

                if (enrollments.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No students enrolled in this course</td></tr>';
                    return;
                }

                tbody.innerHTML = enrollments.map(enroll => {
                    // Handle both PascalCase and camelCase
                    const studentCode = enroll.StudentCode || enroll.studentCode || '-';
                    const studentName = enroll.StudentName || enroll.studentName || 'N/A';
                    const studentEmail = enroll.StudentEmail || enroll.studentEmail || '-';
                    const credits = enroll.CreditHours || enroll.creditHours || '-';
                    const status = enroll.Status || enroll.status || 'Enrolled';
                    const finalGrade = enroll.FinalGrade || enroll.finalGrade;
                    const gradeLetter = enroll.GradeLetter || enroll.gradeLetter;
                    const enrollDate = enroll.EnrollmentDate || enroll.enrollmentDate;
                    
                    const statusBadge = status === 'Enrolled' ? 'bg-primary' : 
                                       status === 'Completed' ? 'bg-success' : 'bg-secondary';
                    const gradeDisplay = finalGrade ? 
                        `${finalGrade.toFixed(1)}% (${gradeLetter || '-'})` : '-';
                    const dateDisplay = enrollDate ? new Date(enrollDate).toLocaleDateString() : '-';
                    
                    return `
                    <tr>
                        <td><strong>${studentCode}</strong></td>
                        <td>${studentName}</td>
                        <td><small>${studentEmail}</small></td>
                        <td>${credits}</td>
                        <td><span class="badge ${statusBadge}">${status}</span></td>
                        <td><small>${gradeDisplay}</small></td>
                        <td><small>${dateDisplay}</small></td>
                    </tr>
                `}).join('');
            } else {
                container.classList.remove('d-none');
                courseNameSpan.textContent = courseName;
                countBadge.textContent = '0 students';
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load enrollments</td></tr>';
            }
        } catch (error) {
            console.error('❌ Error loading enrollments:', error);
            container.classList.remove('d-none');
            courseNameSpan.textContent = courseName;
            countBadge.textContent = '0 students';
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading enrollments</td></tr>';
        }
    }

    // ===== HELPER METHODS =====
    showComingSoon(feature) {
        this.showToast('Coming Soon', `${feature} management features coming soon...`, 'info');
    }

    showToast(title, message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;

        // Handle multi-line messages
        const messageHTML = message.replace(/\n/g, '<br>');

        const toastHtml = `
            <div class="alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show" role="alert">
                <strong>${title}</strong><br>${messageHTML}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        alertContainer.innerHTML = toastHtml;

        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }

    logout() {
        console.log('🔐 Logging out...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        window.location.href = '../index.html';
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Instructor Dashboard...');
    window.instructorDashboard = new InstructorDashboard();
});

