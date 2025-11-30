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
                        // Get course ID by course code since the instructor endpoint doesn't return IDs
                        const courseCode = course.courseCode || course.CourseCode;
                        
                        if (!courseCode) {
                            console.warn('⚠️ Course code is undefined, skipping:', course);
                            continue;
                        }
                        
                        // Fetch full course details to get the ID
                        const courseDetailsResponse = await API.request(`/Course/code/${courseCode}`, {
                            method: 'GET'
                        });
                        
                        if (!courseDetailsResponse.success || !courseDetailsResponse.data?.data) {
                            console.warn('⚠️ Could not fetch course details for:', courseCode);
                            continue;
                        }
                        
                        const courseId = courseDetailsResponse.data.data.id || courseDetailsResponse.data.data.Id;
                        console.log('📚 Checking enrollments for course:', courseCode, 'ID:', courseId);
                        
                        const enrollmentsResponse = await API.request(`/Enrollment/course/${courseId}`, {
                            method: 'GET'
                        });
                        
                        if (enrollmentsResponse.success && enrollmentsResponse.data) {
                            let enrollments = enrollmentsResponse.data.data || enrollmentsResponse.data;
                            
                            if (!Array.isArray(enrollments)) {
                                enrollments = [enrollments];
                            }
                            
                            enrollments = enrollments.filter(e => e);
                            
                            // Only count unique students
                            const uniqueStudents = new Set();
                            enrollments.forEach(e => {
                                const studentId = e.studentId || e.StudentId;
                                if (studentId) uniqueStudents.add(studentId);
                            });
                            
                            totalStudents += uniqueStudents.size;
                            
                            console.log(`  ✅ ${uniqueStudents.size} unique students in ${courseCode}`);
                            console.log(`  📊 Enrollment data:`, enrollments);
                            
                            // Collect grades for average calculation
                            enrollments.forEach(enrollment => {
                                console.log(`    📝 Student: ${enrollment.studentName || enrollment.StudentName}`);
                                console.log(`       FinalGrade: ${enrollment.finalGrade}`);
                                console.log(`       grade: ${enrollment.grade}`);
                                console.log(`       Grade: ${enrollment.Grade}`);
                                console.log(`       Status: ${enrollment.status || enrollment.Status}`);
                                
                                const grade = enrollment.finalGrade || enrollment.grade || enrollment.Grade || enrollment.FinalGrade;
                                
                                if (grade !== null && grade !== undefined && grade > 0) {
                                    allGrades.push(grade);
                                    console.log(`      ✓ Grade counted: ${grade}`);
                                } else {
                                    // Count as pending if student is actively enrolled (approved, enrolled, or pending)
                                    const status = (enrollment.status || enrollment.Status || '').toLowerCase();
                                    if (status === 'enrolled' || status === 'pending' || status === 'approved') {
                                        pendingCount++;
                                        console.log(`      ⚠️ No grade and status is "${status}" - counted as pending`);
                                    } else {
                                        console.log(`      ℹ️ No grade but status is "${status}" - not counted as pending`);
                                    }
                                }
                            });
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not load enrollments for course:', course);
                    }
                }
                
                // Update total students
                document.querySelector('[data-stat="students"]').textContent = totalStudents;
                console.log('👥 Total unique students across all courses:', totalStudents);
                
                // Calculate and display average grade
                console.log('📊 All grades collected:', allGrades);
                if (allGrades.length > 0) {
                    const avgGrade = (allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length).toFixed(1);
                    document.querySelector('[data-stat="avgGrade"]').textContent = avgGrade + '%';
                    console.log('📈 Average grade:', avgGrade + '%');
                } else {
                    document.querySelector('[data-stat="avgGrade"]').textContent = '30%';
                    console.log('⚠️ No grades to calculate average, showing default 30%');
                }
                
                // Update pending reviews
                document.querySelector('[data-stat="pending"]').textContent = pendingCount;
                console.log('⏳ Total pending reviews (students without grades):', pendingCount);
                
                // Create charts with real data
                await this.createDashboardCharts(myCourses);
                
            } else {
                console.error('❌ Failed to load courses:', coursesResponse.error);
            }
        } catch (error) {
            console.error('❌ Error loading stats:', error);
        }
    }

    async createDashboardCharts(courses) {
        console.log('📊 Creating dashboard charts...');
        
        try {
            // Prepare data for charts
            const courseNames = [];
            const studentCounts = [];
            let totalPresent = 0;
            let totalAbsent = 0;
            let totalLate = 0;
            let totalExcused = 0;
            const gradeRanges = { 'A (90-100)': 0, 'B (80-89)': 0, 'C (70-79)': 0, 'D (60-69)': 0, 'F (<60)': 0 };

            for (const course of courses) {
                const courseCode = course.courseCode || course.CourseCode;
                const courseName = course.courseName || course.name;

                if (!courseCode) continue;

                // Get course ID by course code
                try {
                    const courseDetailsResponse = await API.request(`/Course/code/${courseCode}`, {
                        method: 'GET'
                    });
                    
                    if (!courseDetailsResponse.success || !courseDetailsResponse.data?.data) {
                        continue;
                    }
                    
                    const courseId = courseDetailsResponse.data.data.id || courseDetailsResponse.data.data.Id;

                    // Get enrollments
                    const enrollmentResponse = await API.request(`/Enrollment/course/${courseId}`, {
                        method: 'GET'
                    });

                    if (enrollmentResponse.success && enrollmentResponse.data) {
                        let enrollments = enrollmentResponse.data.data || enrollmentResponse.data;
                        
                        if (!Array.isArray(enrollments)) {
                            enrollments = [enrollments];
                        }
                        
                        enrollments = enrollments.filter(e => e);
                        
                        if (enrollments.length > 0) {
                            courseNames.push(courseCode);
                            studentCounts.push(enrollments.length);

                            // Collect grades
                            enrollments.forEach(enrollment => {
                                const grade = enrollment.finalGrade || enrollment.grade || enrollment.Grade || enrollment.FinalGrade;
                                if (grade !== null && grade !== undefined && grade > 0) {
                                    if (grade >= 90) gradeRanges['A (90-100)']++;
                                    else if (grade >= 80) gradeRanges['B (80-89)']++;
                                    else if (grade >= 70) gradeRanges['C (70-79)']++;
                                    else if (grade >= 60) gradeRanges['D (60-69)']++;
                                    else gradeRanges['F (<60)']++;
                                }
                            });
                        }
                    }

                    // Get attendance data for this course
                    try {
                        const attendanceResponse = await API.request(`/Attendance/filter?courseId=${courseId}`, {
                            method: 'GET'
                        });

                        if (attendanceResponse.success && attendanceResponse.data) {
                            let attendanceRecords = attendanceResponse.data.data || attendanceResponse.data || [];
                            
                            if (!Array.isArray(attendanceRecords)) {
                                attendanceRecords = [attendanceRecords];
                            }
                            
                            attendanceRecords = attendanceRecords.filter(r => r);
                            
                            attendanceRecords.forEach(record => {
                                const status = (record.status || record.Status || '').toLowerCase();
                                if (status === 'present') totalPresent++;
                                else if (status === 'absent') totalAbsent++;
                                else if (status === 'late') totalLate++;
                                else if (status === 'excused') totalExcused++;
                            });
                        }
                    } catch (error) {
                        console.warn('Could not load attendance for course:', courseId);
                    }
                } catch (error) {
                    console.warn('Error processing course:', courseCode, error);
                }
            }

            // Chart 1: Students Per Course (Bar Chart)
            const ctx1 = document.getElementById('courseEnrollmentChart');
            if (ctx1 && courseNames.length > 0) {
                new Chart(ctx1, {
                    type: 'bar',
                    data: {
                        labels: courseNames,
                        datasets: [{
                            label: 'Number of Students',
                            data: studentCounts,
                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            title: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1 }
                            }
                        }
                    }
                });
            }

            // Chart 2: Attendance Overview (Doughnut Chart)
            const ctx2 = document.getElementById('attendanceChart');
            const totalAttendance = totalPresent + totalAbsent + totalLate + totalExcused;
            
            if (ctx2 && totalAttendance > 0) {
                new Chart(ctx2, {
                    type: 'doughnut',
                    data: {
                        labels: ['Present', 'Absent', 'Late', 'Excused'],
                        datasets: [{
                            data: [totalPresent, totalAbsent, totalLate, totalExcused],
                            backgroundColor: [
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(255, 99, 132, 0.8)',
                                'rgba(255, 206, 86, 0.8)',
                                'rgba(153, 102, 255, 0.8)'
                            ],
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            } else if (ctx2) {
                // Show empty state
                ctx2.parentElement.innerHTML = '<div class="text-center text-muted p-4"><i class="bi bi-calendar-x" style="font-size: 3rem;"></i><p class="mt-2">No attendance records yet</p></div>';
            }

            // Chart 3: Grade Distribution (Horizontal Bar Chart)
            const ctx3 = document.getElementById('gradeDistributionChart');
            const gradeLabels = Object.keys(gradeRanges);
            const gradeData = Object.values(gradeRanges);
            const totalGrades = gradeData.reduce((sum, val) => sum + val, 0);
            
            if (ctx3) {
                new Chart(ctx3, {
                    type: 'bar',
                    data: {
                        labels: gradeLabels,
                        datasets: [{
                            label: 'Number of Students',
                            data: gradeData,
                            backgroundColor: [
                                'rgba(79, 70, 229, 0.9)',    // Indigo
                                'rgba(14, 165, 233, 0.9)',   // Cyan
                                'rgba(16, 185, 129, 0.9)',   // Emerald
                                'rgba(245, 158, 11, 0.9)',   // Amber
                                'rgba(239, 68, 68, 0.9)'     // Rose
                            ],
                            borderWidth: 2,
                            borderColor: '#ffffff',
                            borderRadius: 8,
                            barPercentage: 0.75
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { 
                                display: true,
                                labels: {
                                    color: '#1e293b',
                                    font: { size: 12, weight: '600' },
                                    padding: 15
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    title: function(context) {
                                        return context[0].label + ' Grade Range';
                                    },
                                    label: function(context) {
                                        const count = context.parsed.x;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                                        return ` ${count} students (${percentage}%)`;
                                    }
                                },
                                backgroundColor: 'rgba(31, 41, 55, 0.96)',
                                titleColor: '#fff',
                                bodyColor: '#e5e7eb',
                                borderColor: '#4f46e5',
                                borderWidth: 2,
                                padding: 14,
                                displayColors: true,
                                titleFont: { size: 13, weight: 'bold' },
                                bodyFont: { size: 12 }
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                ticks: { 
                                    stepSize: 1,
                                    color: '#475569',
                                    font: { size: 11, weight: '500' }
                                },
                                grid: {
                                    color: 'rgba(148, 163, 184, 0.12)'
                                }
                            },
                            y: {
                                ticks: {
                                    color: '#334155',
                                    font: { size: 12, weight: '600' }
                                },
                                grid: {
                                    display: false
                                }
                            }
                        }
                    }
                });
            }

            console.log('✅ Charts created successfully');
            
        } catch (error) {
            console.error('❌ Error creating charts:', error);
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

                // Store courses for filtering
                this.allCoursesData = courses;
                
                coursesList.innerHTML = courses.map((course, index) => {
                    const courseCode = course.courseCode || course.CourseCode;
                    const courseName = course.courseName || course.name;
                    const credits = course.creditHours || course.credits || course.Credits || 3;
                    const department = course.departmentName || course.DepartmentName || 'N/A';
                    
                    return `
                    <div class="col-md-6 course-card" data-course-code="${courseCode}" data-course-name="${courseName}">
                        <div class="card border-0 h-100" style="box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 16px; overflow: hidden; transition: all 0.3s ease;"
                             onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 12px 28px rgba(0,0,0,0.15)'"
                             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'">
                            <div class="card-body" style="padding: 2rem;">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div class="flex-grow-1">
                                        <div class="d-flex align-items-center mb-2">
                                            <div class="rounded-circle d-flex align-items-center justify-content-center" 
                                                 style="width: 48px; height: 48px; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); margin-right: 1rem;">
                                                <i class="bi bi-book text-white" style="font-size: 1.5rem;"></i>
                                            </div>
                                            <div>
                                                <h5 class="card-title mb-0" style="font-weight: 700; font-size: 1.25rem; color: #1f2937;">${courseName}</h5>
                                                <span class="badge" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); font-size: 0.7rem; margin-top: 0.25rem;">ACTIVE</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex align-items-center mb-2">
                                        <i class="bi bi-code-square text-primary me-2" style="font-size: 1.1rem;"></i>
                                        <span style="font-weight: 600; color: #4f46e5; font-size: 1rem;">${courseCode}</span>
                                    </div>
                                    <div class="d-flex align-items-center mb-2">
                                        <i class="bi bi-award text-warning me-2" style="font-size: 1.1rem;"></i>
                                        <span class="text-muted" style="font-size: 0.95rem;">${credits} Credit Hours</span>
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <i class="bi bi-building text-info me-2" style="font-size: 1.1rem;"></i>
                                        <span class="text-muted" style="font-size: 0.95rem;">${department}</span>
                                    </div>
                                </div>
                                <hr style="margin: 1.5rem 0; border-color: #e5e7eb;">
                                <button class="btn w-100" 
                                    onclick="instructorDashboard.viewCourseDetailsPage('${courseCode}')"
                                    style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: white; border: none; padding: 0.75rem; border-radius: 10px; font-weight: 600; transition: all 0.3s ease;"
                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(79, 70, 229, 0.4)'"
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                    <i class="bi bi-arrow-right-circle me-2"></i> View Details
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

    viewCourseDetailsPage(courseCode) {
        console.log('🔗 Navigating to course details page:', courseCode);
        window.location.href = `course-details.html?code=${courseCode}`;
    }

    filterCourses() {
        const searchInput = document.getElementById('courseSearchBox');
        const searchTerm = searchInput.value.toLowerCase().trim();
        const courseCards = document.querySelectorAll('.course-card');
        
        let visibleCount = 0;
        
        courseCards.forEach(card => {
            const courseCode = card.dataset.courseCode.toLowerCase();
            const courseName = card.dataset.courseName.toLowerCase();
            
            if (courseCode.includes(searchTerm) || courseName.includes(searchTerm)) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Show message if no results
        const coursesList = document.getElementById('coursesList');
        let noResultsMsg = document.getElementById('noCoursesFound');
        
        if (visibleCount === 0) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.id = 'noCoursesFound';
                noResultsMsg.className = 'col-12';
                noResultsMsg.innerHTML = '<div class="alert alert-warning">No courses found matching your search.</div>';
                coursesList.appendChild(noResultsMsg);
            }
        } else {
            if (noResultsMsg) {
                noResultsMsg.remove();
            }
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

            // Store instructor ID for attendance methods - ensure it's set
            this.instructorId = this.currentInstructorId;
            console.log('✅ Set instructorId to:', this.instructorId);

            // Load attendance stats, records, and recent activity
            await this.loadAttendanceStats();
            await this.loadAttendanceRecords();
            await this.loadRecentActivity();

            console.log('✅ Attendance section loaded successfully');
            return;

            // OLD CODE BELOW - keeping for reference but not executing
            // Verify DOM elements exist
            const courseSelect = document.getElementById('attendanceCourse');
            const studentSelect = document.getElementById('attendanceStudent');
            
            if (!courseSelect || !studentSelect) {
                console.error('❌ Course or student select elements not found in DOM!');
                console.log('Course select:', courseSelect);
                console.log('Student select:', studentSelect);
                return;
            }

            // Get courses for this instructor
            console.log('🔍 Fetching courses for instructor:', this.currentInstructorId);
            const coursesResponse = await API.request(`/Course/instructor/${this.currentInstructorId}`, {
                method: 'GET'
            });
            
            console.log('📥 Courses Response:', coursesResponse);

            if (coursesResponse.success && coursesResponse.data?.data) {
                let courses = coursesResponse.data.data;
                
                console.log('📋 Raw courses data:', courses);
                console.log('📋 Is array?', Array.isArray(courses));
                
                if (!Array.isArray(courses)) {
                    courses = [courses];
                }

                console.log('📋 Courses array:', courses);
                console.log('📋 Number of courses:', courses.length);
                console.log('📋 First course object:', courses[0]);

                // Populate course dropdown - use course code as value since we'll look up ID when needed
                const courseOptions = courses.map(course => {
                    const courseCode = course.courseCode || course.CourseCode || 'N/A';
                    const courseName = course.courseName || course.name || course.Name || 'Unknown';
                    
                    console.log('📝 Adding course:', { courseCode, courseName, fullCourse: course });
                    
                    // Use courseCode as value, we'll fetch the ID when needed
                    return `<option value="${courseCode}">${courseCode} - ${courseName}</option>`;
                }).join('');
                
                console.log('📋 Generated HTML options:', courseOptions);
                
                courseSelect.innerHTML = '<option value="">Select Course...</option>' + courseOptions;
                
                console.log('✅ Course dropdown HTML set. Current innerHTML:', courseSelect.innerHTML);
                console.log('✅ Loaded', courses.length, 'courses into dropdown');

                // Don't load students initially - they'll be loaded when a course is selected
                // Store courses for later use
                this.instructorCourses = courses;
                console.log('🔍 Loading students for', courses.length, 'courses...');
                
                for (const course of courses) {
                    try {
                        // The API returns course code, we need to fetch full course details to get the ID
                        const courseCode = course.courseCode || course.CourseCode;
                        console.log('📚 Getting course ID for code:', courseCode);
                        
                        // Fetch course by code to get the ID
                        const courseDetailsResponse = await API.request(`/Course/code/${courseCode}`, {
                            method: 'GET'
                        });

                        if (!courseDetailsResponse.success || !courseDetailsResponse.data?.data) {
                            console.warn('⚠️ Could not get course details for code:', courseCode);
                            continue;
                        }

                        const courseDetails = courseDetailsResponse.data.data;
                        const courseId = courseDetails.id || courseDetails.Id || courseDetails.courseId || courseDetails.CourseId;
                        
                        console.log('✅ Got course ID:', courseId, 'for code:', courseCode);
                        
                        if (!courseId) {
                            console.warn('⚠️ Course ID is undefined for code:', courseCode);
                            continue;
                        }
                        
                        const enrollmentResponse = await API.request(`/Enrollment/course/${courseId}`, {
                            method: 'GET'
                        });

                        console.log('📥 Enrollment response for course', courseId, ':', enrollmentResponse);

                        if (enrollmentResponse.success && enrollmentResponse.data?.data) {
                            let enrollments = enrollmentResponse.data.data;
                            if (!Array.isArray(enrollments)) {
                                enrollments = [enrollments];
                            }
                            
                            console.log('✅ Found', enrollments.length, 'enrollments for course', courseId);
                            
                            enrollments.forEach(enrollment => {
                                const studentId = enrollment.studentId || enrollment.StudentId || enrollment.id || enrollment.Id;
                                const exists = allStudents.find(s => {
                                    const sId = s.studentId || s.StudentId || s.id || s.Id;
                                    return sId === studentId;
                                });
                                
                                if (!exists && studentId) {
                                    console.log('➕ Adding student:', enrollment.studentName || enrollment.StudentName);
                                    allStudents.push(enrollment);
                                }
                            });
                        } else {
                            console.warn('⚠️ No enrollments found for course', courseId);
                        }
                    } catch (error) {
                        console.error('❌ Failed to load enrollments for course:', error);
                    }
                }

                // Store courses for later use
                this.instructorCourses = courses;
                
                console.log('✅ Course dropdown populated. Students will be loaded when a course is selected.');

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

    async loadStudentsForSelectedCourse() {
        console.log('📚 Loading students for selected course...');
        
        const courseSelect = document.getElementById('attendanceCourse');
        const studentSelect = document.getElementById('attendanceStudent');
        const selectedCourseCode = courseSelect.value;
        
        if (!selectedCourseCode) {
            studentSelect.innerHTML = '<option value="">First select a course...</option>';
            studentSelect.disabled = true;
            return;
        }
        
        studentSelect.disabled = false;
        studentSelect.innerHTML = '<option value="">Loading students...</option>';
        
        try {
            // First get course ID from course code
            const courseDetailsResponse = await API.request(`/Course/code/${selectedCourseCode}`, {
                method: 'GET'
            });

            if (!courseDetailsResponse.success || !courseDetailsResponse.data?.data) {
                console.error('❌ Failed to get course details');
                studentSelect.innerHTML = '<option value="">Error loading students</option>';
                this.showToast('Error', 'Could not fetch course details', 'error');
                return;
            }

            const courseId = courseDetailsResponse.data.data.id || courseDetailsResponse.data.data.Id;
            console.log('✅ Got course ID:', courseId, 'for code:', selectedCourseCode);
            
            // Get enrollments for this specific course
            const enrollmentResponse = await API.request(`/Enrollment/course/${courseId}`, {
                method: 'GET'
            });

            if (enrollmentResponse.success && enrollmentResponse.data) {
                let courseStudents = enrollmentResponse.data.data || enrollmentResponse.data;
                
                if (!Array.isArray(courseStudents)) {
                    courseStudents = [courseStudents];
                }
                
                // Filter to only show students with Approved or Enrolled status
                courseStudents = courseStudents.filter(s => {
                    if (!s) return false;
                    const status = (s.status || s.Status || '').toString().trim().toLowerCase();
                    console.log('Student:', s.studentName || s.StudentName, 'Status:', status);
                    return status === 'approved' || status === 'enrolled';
                });
                
                console.log(`✅ Found ${courseStudents.length} approved students enrolled in ${selectedCourseCode}`);

                if (courseStudents.length === 0) {
                    studentSelect.innerHTML = '<option value="">No students enrolled in this course</option>';
                    this.showToast('Info', 'No students enrolled in this course', 'info');
                    return;
                }

                // Populate student dropdown with only students from selected course
                const studentOptions = courseStudents.map(student => {
                    const studentId = student.studentId || student.StudentId || student.id || student.Id;
                    const studentName = student.studentName || student.StudentName || student.fullName || student.FullName || student.name || student.Name || 'Unknown';
                    const studentCode = student.studentCode || student.StudentCode || student.code || student.Code || 'N/A';
                    return `<option value="${studentId}">${studentName} (${studentCode})</option>`;
                }).join('');

                studentSelect.innerHTML = '<option value="">Select Student...</option>' + studentOptions;
                console.log('✅ Loaded', courseStudents.length, 'students for course:', selectedCourseCode);
                
            } else {
                console.error('❌ Failed to load enrollments');
                studentSelect.innerHTML = '<option value="">No students found</option>';
                this.showToast('Warning', 'No students found for this course', 'warning');
            }
            
        } catch (error) {
            console.error('❌ Error loading students:', error);
            studentSelect.innerHTML = '<option value="">Error loading students</option>';
            this.showToast('Error', 'Failed to load students for course', 'error');
        }
    }

    async loadAttendanceRecords() {
        console.log('📋 Loading attendance records...');

        try {
            // Load courses for template dropdown
            await this.loadCoursesForTemplate();
            
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
                console.log('🔍 Fetching instructor courses...');
                const coursesResponse = await API.request(`/Course/instructor/${this.currentInstructorId}`, {
                    method: 'GET'
                });
                
                if (coursesResponse.success && coursesResponse.data?.data) {
                    let courses = coursesResponse.data.data;
                    if (!Array.isArray(courses)) {
                        courses = [courses];
                    }
                    
                    console.log('📚 Found', courses.length, 'courses, fetching full details...');
                    
                    // Fetch full course details for each course by code
                    for (const course of courses) {
                        const courseCode = course.courseCode || course.CourseCode;
                        if (courseCode) {
                            try {
                                const detailsResponse = await API.request(`/Course/code/${courseCode}`, {
                                    method: 'GET'
                                });
                                
                                if (detailsResponse.success && detailsResponse.data?.data) {
                                    coursesToCheck.push(detailsResponse.data.data);
                                }
                            } catch (err) {
                                console.warn('⚠️ Failed to fetch details for course:', courseCode);
                            }
                        }
                    }
                }
            } else {
                // If specific course selected, use that ID
                coursesToCheck = [{ id: courseId }];
            }

            console.log('📌 Courses to check (with IDs):', coursesToCheck.length);

            if (coursesToCheck.length === 0) {
                console.log('⚠️ No courses found for instructor');
                attendanceTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No courses found</td></tr>';
                this.updateAttendanceStats([]);
                return;
            }

            // Fetch attendance for each course using the filter endpoint
            let allRecords = [];
            for (const course of coursesToCheck) {
                try {
                    const cId = course.id || course.Id;
                    
                    if (!cId) {
                        console.warn('⚠️ Course ID is undefined, skipping...');
                        continue;
                    }
                    
                    console.log('🔍 Fetching attendance for course ID:', cId);
                    
                    // Use the filter endpoint which works better
                    const params = new URLSearchParams();
                    params.append('courseId', cId);
                    if (fromDate) params.append('from', fromDate);
                    if (toDate) params.append('to', toDate);
                    
                    const url = `/Attendance/filter?${params.toString()}`;
                    console.log('🔗 Fetching from:', url);
                    
                    const response = await API.request(url, { method: 'GET' });
                    
                    console.log('📥 Raw response for course', cId, ':', response);

                    if (response.success && response.data) {
                        // Handle different response structures
                        let records = null;
                        
                        // Try different possible structures
                        if (Array.isArray(response.data)) {
                            // Response is directly an array
                            records = response.data;
                        } else if (response.data.data) {
                            // Response has data.data structure
                            records = response.data.data;
                        } else if (response.data.Data) {
                            // Response has data.Data structure (PascalCase)
                            records = response.data.Data;
                        }
                        
                        if (records) {
                            if (!Array.isArray(records)) {
                                records = [records];
                            }
                            console.log('✅ Fetched', records.length, 'records for course', cId, ':', records);
                            allRecords = allRecords.concat(records);
                        } else {
                            console.warn('⚠️ No records structure found in response');
                        }
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
                }[record.status || record.Status] || 'secondary';

                // Handle different date property names
                const dateValue = record.date || record.Date || record.attendanceDate || record.AttendanceDate;
                const displayDate = dateValue ? new Date(dateValue).toLocaleDateString() : 'N/A';
                
                // Handle different ID property names
                const recordId = record.attendanceId || record.AttendanceId || record.id || record.Id;
                const studentName = record.studentName || record.StudentName || 'Unknown';
                const courseName = record.courseName || record.CourseName || 'N/A';
                const status = record.status || record.Status || 'Unmarked';

                return `
                    <tr>
                        <td><strong>${studentName}</strong></td>
                        <td>${courseName}</td>
                        <td>${displayDate}</td>
                        <td>
                            <span class="badge bg-${statusColor}">
                                ${status}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-warning" title="Edit" 
                                onclick="instructorDashboard.openEditAttendance(${recordId}, '${status}', '${studentName}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" title="Delete" 
                                onclick="instructorDashboard.deleteAttendance(${recordId})">
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
        const present = records.filter(r => (r.status || r.Status) === 'Present').length;
        const absent = records.filter(r => (r.status || r.Status) === 'Absent').length;
        const late = records.filter(r => (r.status || r.Status) === 'Late').length;

        const totalEl = document.getElementById('totalAttendanceRecords');
        const presentEl = document.getElementById('totalPresent');
        const absentEl = document.getElementById('totalAbsent');
        const lateEl = document.getElementById('totalLate');
        
        if (totalEl) totalEl.textContent = total;
        if (presentEl) presentEl.textContent = present;
        if (absentEl) absentEl.textContent = absent;
        if (lateEl) lateEl.textContent = late;
        
        console.log('📊 Stats updated:', { total, present, absent, late });
    }

    async markAttendance(e) {
        e.preventDefault();
        console.log('✏️ Marking attendance...');

        try {
            const studentId = document.getElementById('attendanceStudent').value;
            const courseCode = document.getElementById('attendanceCourse').value;
            const date = document.getElementById('attendanceDate').value;
            const status = document.getElementById('attendanceStatus').value;

            if (!studentId || !courseCode || !date || !status) {
                this.showToast('Warning', 'Please fill in all fields', 'warning');
                return;
            }

            // NEW: Fetch course details by code to get courseId
            console.log('🔍 Fetching course details for code:', courseCode);
            const courseDetailsResponse = await API.request(`/Course/code/${courseCode}`, {
                method: 'GET'
            });

            if (!courseDetailsResponse.success || !courseDetailsResponse.data || !courseDetailsResponse.data.data) {
                this.showToast('Error', 'Failed to fetch course details', 'error');
                return;
            }

            const courseId = courseDetailsResponse.data.data.id || courseDetailsResponse.data.data.Id;
            console.log('✅ Course ID retrieved:', courseId);

            // Prepare attendance data matching MarkAttendanceDto
            const attendanceData = {
                studentId: parseInt(studentId),
                courseId: parseInt(courseId),
                date: date, // Already in YYYY-MM-DD format from input
                status: status
            };
            
            console.log('📤 Sending attendance data:', attendanceData);

            // API: POST /api/Attendance/mark using the api.js method
            const response = await API.attendance.markAttendance(attendanceData);

            console.log('📥 Mark attendance response:', response);

            if (response.success) {
                this.showToast('Success', `Attendance marked as ${status}`, 'success');
                document.getElementById('markAttendanceForm').reset();
                document.getElementById('attendanceDate').valueAsDate = new Date();
                await this.loadAttendanceRecords();
                this.addRecentActivity(`Marked ${status} for selected student`);
            } else {
                // Extract detailed error message from response
                let errorMessage = 'Failed to mark attendance';
                
                if (response.data && typeof response.data === 'object') {
                    // Check for error in data.error or data.message
                    if (response.data.error) {
                        errorMessage = response.data.error;
                    } else if (response.data.message) {
                        errorMessage = response.data.message;
                    } else if (response.data.Message) {
                        errorMessage = response.data.Message;
                    }
                } else if (response.error) {
                    errorMessage = response.error;
                } else if (response.message || response.Message) {
                    errorMessage = response.message || response.Message;
                }
                
                this.showToast('Error', errorMessage, 'error');
            }
        } catch (error) {
            console.error('❌ Error marking attendance:', error);
            
            // Extract error message from caught exception
            let errorMessage = 'Failed to mark attendance';
            if (error.message) {
                errorMessage = error.message;
            }
            
            this.showToast('Error', errorMessage, 'error');
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

            if (!status) {
                this.showToast('Warning', 'Please select a status', 'warning');
                return;
            }

            console.log('📤 Updating attendance ID:', this.editingAttendanceId, 'to status:', status);

            // API: PUT /api/Attendance/{id} - Use the attendance API method
            const response = await API.attendance.updateStatus(this.editingAttendanceId, status);

            console.log('📥 Update response:', response);

            if (response.success) {
                this.showToast('Success', 'Attendance updated successfully', 'success');
                bootstrap.Modal.getInstance(document.getElementById('editAttendanceModal')).hide();
                await this.loadAttendanceRecords();
                this.addRecentActivity(`Updated attendance status to ${status}`);
            } else {
                // Extract detailed error message
                let errorMessage = 'Failed to update';
                if (response.data && typeof response.data === 'object') {
                    if (response.data.error) errorMessage = response.data.error;
                    else if (response.data.message) errorMessage = response.data.message;
                    else if (response.data.Message) errorMessage = response.data.Message;
                } else if (response.error) {
                    errorMessage = response.error;
                } else if (response.message || response.Message) {
                    errorMessage = response.message || response.Message;
                }
                this.showToast('Error', errorMessage, 'error');
            }
        } catch (error) {
            console.error('❌ Error updating attendance:', error);
            this.showToast('Error', error.message || 'Failed to update attendance', 'error');
        }
    }

    async deleteAttendance(attendanceId) {
        console.log('🗑️ Deleting attendance record:', attendanceId);

        // Create custom styled modal with red danger theme
        const modalHtml = `
            <div class="modal fade" id="deleteAttendanceModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-danger">
                        <div class="modal-header bg-danger text-white border-0">
                            <h5 class="modal-title">
                                <i class="bi bi-exclamation-triangle-fill me-2"></i>Delete Attendance Record
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-danger mb-3">
                                <i class="bi bi-exclamation-circle-fill me-2"></i>
                                <strong>Are you sure you want to delete this attendance record?</strong>
                            </div>
                            <p class="text-danger mb-2">
                                <i class="bi bi-info-circle me-2"></i>This action will:
                            </p>
                            <ul class="text-danger">
                                <li>Remove the attendance record permanently</li>
                                <li>Update attendance statistics</li>
                                <li>Cannot be undone</li>
                            </ul>
                        </div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger" id="confirmDeleteAttendance">
                                <i class="bi bi-trash-fill me-1"></i>Delete Record
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        document.getElementById('deleteAttendanceModal')?.remove();
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('deleteAttendanceModal'));
        modal.show();
        
        // Handle confirm button
        document.getElementById('confirmDeleteAttendance').onclick = async () => {
            modal.hide();
            
            try {
                console.log('📤 Deleting attendance ID:', attendanceId);
                
                // API: DELETE /api/Attendance/{id}
                const response = await API.attendance.delete(attendanceId);
                
                console.log('📥 Delete response:', response);

                if (response.success) {
                    this.showToast('Success', 'Attendance record deleted', 'success');
                    await this.loadAttendanceRecords();
                    this.addRecentActivity('Deleted attendance record');
                } else {
                    // Extract detailed error message
                    let errorMessage = 'Failed to delete';
                    if (response.data && typeof response.data === 'object') {
                        if (response.data.error) errorMessage = response.data.error;
                        else if (response.data.message) errorMessage = response.data.message;
                        else if (response.data.Message) errorMessage = response.data.Message;
                    } else if (response.error) {
                        errorMessage = response.error;
                    } else if (response.message || response.Message) {
                        errorMessage = response.message || response.Message;
                    }
                    this.showToast('Error', errorMessage, 'error');
                }
            } catch (error) {
                console.error('❌ Error deleting attendance:', error);
                this.showToast('Error', error.message || 'Failed to delete record', 'error');
            }
            
            // Remove modal from DOM after hiding
            setTimeout(() => document.getElementById('deleteAttendanceModal')?.remove(), 300);
        };
        
        // Cleanup on modal hide
        document.getElementById('deleteAttendanceModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('deleteAttendanceModal')?.remove();
        });
    }

    refreshAttendance() {
        console.log('🔄 Refreshing attendance data...');
        this.loadAttendanceRecords();
    }

    async handleExcelUpload(event) {
        console.log('📤 Uploading Excel file for attendance...');
        
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        // Validate file type
        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
            this.showToast('Error', 'Please upload a valid Excel file (.xlsx or .xls)', 'error');
            event.target.value = ''; // Reset file input
            return;
        }

        try {
            // Read the Excel file
            const data = await this.readExcelFile(file);
            
            if (!data || data.length === 0) {
                this.showToast('Error', 'Excel file is empty', 'error');
                event.target.value = '';
                return;
            }

            console.log('📊 Excel data parsed:', data);

            // Validate and process the data
            await this.processAttendanceData(data);
            
            // Reset file input
            event.target.value = '';

        } catch (error) {
            console.error('❌ Error processing Excel file:', error);
            this.showToast('Error', error.message || 'Failed to process Excel file', 'error');
            event.target.value = '';
        }
    }

    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get first sheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Failed to parse Excel file: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    async processAttendanceData(data) {
        console.log('🔄 Processing attendance data...');
        
        // Expected columns: Student Code, Student Name, Course Code, Date, Status, Remarks (optional)
        const requiredColumns = ['Student Code', 'Course Code', 'Date', 'Status'];
        
        // Validate columns
        const firstRow = data[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}\n\nRequired columns: Student Code, Course Code, Date, Status`);
        }

        // Validate status values
        const validStatuses = ['Present', 'Absent', 'Late', 'Excused'];
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Show progress
        this.showToast('Info', `Processing ${data.length} attendance records...`, 'info');

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2; // Excel row number (1-indexed + header)

            try {
                // Validate required fields
                if (!row['Student Code']) {
                    throw new Error(`Row ${rowNum}: Student Code is required`);
                }
                if (!row['Course Code']) {
                    throw new Error(`Row ${rowNum}: Course Code is required`);
                }
                if (!row['Date']) {
                    throw new Error(`Row ${rowNum}: Date is required`);
                }
                if (!row['Status']) {
                    throw new Error(`Row ${rowNum}: Status is required`);
                }

                // Validate status
                const status = row['Status'].trim();
                if (!validStatuses.includes(status)) {
                    throw new Error(`Row ${rowNum}: Invalid status '${status}'. Must be: Present, Absent, Late, or Excused`);
                }

                // Parse date
                let attendanceDate;
                try {
                    attendanceDate = this.parseExcelDate(row['Date']);
                } catch (dateError) {
                    throw new Error(`Row ${rowNum}: Invalid date format. Use MM/DD/YYYY or YYYY-MM-DD`);
                }

                // Get course by code
                const courseResponse = await API.request(`/Course/code/${row['Course Code']}`, {
                    method: 'GET'
                });

                if (!courseResponse.success || !courseResponse.data?.data) {
                    throw new Error(`Row ${rowNum}: Course '${row['Course Code']}' not found`);
                }

                const course = courseResponse.data.data;
                const courseId = course.id || course.Id;

                // Get enrollments for the course to find student
                const enrollmentResponse = await API.request(`/Enrollment/course/${courseId}`, {
                    method: 'GET'
                });

                if (!enrollmentResponse.success || !enrollmentResponse.data?.data) {
                    throw new Error(`Row ${rowNum}: No enrollments found for course '${row['Course Code']}'`);
                }

                let enrollments = enrollmentResponse.data.data;
                if (!Array.isArray(enrollments)) {
                    enrollments = [enrollments];
                }

                // Find student by code
                const enrollment = enrollments.find(e => 
                    (e.studentCode || '').toString().trim().toLowerCase() === row['Student Code'].toString().trim().toLowerCase()
                );

                if (!enrollment) {
                    throw new Error(`Row ${rowNum}: Student '${row['Student Code']}' not enrolled in course '${row['Course Code']}'`);
                }

                const studentId = enrollment.studentId || enrollment.id;

                // Mark attendance
                const attendanceData = {
                    studentId: studentId,
                    courseId: courseId,
                    attendanceDate: attendanceDate,
                    status: status,
                    remarks: row['Remarks'] || ''
                };

                const response = await API.attendance.markAttendance(attendanceData);

                if (response.success) {
                    successCount++;
                    console.log(`✅ Row ${rowNum}: Attendance marked successfully`);
                } else {
                    throw new Error(response.error || 'Failed to mark attendance');
                }

            } catch (error) {
                errorCount++;
                errors.push(`Row ${rowNum}: ${error.message}`);
                console.error(`❌ Row ${rowNum}:`, error);
            }
        }

        // Show results
        console.log(`📊 Processing complete: ${successCount} success, ${errorCount} errors`);

        if (successCount > 0) {
            this.showToast('Success', `Successfully marked ${successCount} attendance record(s)`, 'success');
            await this.loadAttendanceRecords();
            this.addRecentActivity(`Imported ${successCount} attendance records from Excel`);
        }

        if (errorCount > 0) {
            const errorMessage = `Failed to process ${errorCount} record(s):\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}`;
            console.error('Errors:', errors);
            this.showToast('Warning', errorMessage, 'warning');
        }

        if (successCount === 0 && errorCount > 0) {
            throw new Error('No records were processed successfully');
        }
    }

    parseExcelDate(dateValue) {
        // Handle Excel serial date numbers
        if (typeof dateValue === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
            return date.toISOString();
        }

        // Handle string dates
        if (typeof dateValue === 'string') {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date');
            }
            return date.toISOString();
        }

        // Handle Date objects
        if (dateValue instanceof Date) {
            return dateValue.toISOString();
        }

        throw new Error('Invalid date format');
    }

    async loadCoursesForTemplate() {
        console.log('📚 Loading courses for template dropdown...');
        
        try {
            if (!this.currentInstructorId) {
                console.warn('⚠️ Instructor ID not available');
                return;
            }

            const coursesResponse = await API.request(`/Course/instructor/${this.currentInstructorId}`, {
                method: 'GET'
            });
            
            if (!coursesResponse.success || !coursesResponse.data?.data) {
                console.warn('⚠️ Failed to load courses');
                return;
            }

            let courses = coursesResponse.data.data;
            if (!Array.isArray(courses)) {
                courses = [courses];
            }

            // Store courses for filtering
            this.allCourses = courses;
            
            // Populate dropdown
            const select = document.getElementById('templateCourseSelect');
            select.innerHTML = '<option value="">-- Select a course --</option>';
            
            courses.forEach(course => {
                const courseCode = course.courseCode || course.CourseCode;
                const courseName = course.courseName || course.name || course.CourseName || course.Name;
                const option = document.createElement('option');
                option.value = courseCode;
                option.textContent = `${courseCode} - ${courseName}`;
                option.dataset.courseName = courseName;
                select.appendChild(option);
            });
            
            console.log(`✅ Loaded ${courses.length} courses`);
            
        } catch (error) {
            console.error('❌ Error loading courses:', error);
        }
    }

    filterCourseDropdown() {
        const searchInput = document.getElementById('courseSearchInput');
        const select = document.getElementById('templateCourseSelect');
        const searchTerm = searchInput.value.toLowerCase();
        
        const options = select.querySelectorAll('option');
        options.forEach((option, index) => {
            if (index === 0) return; // Skip first "Select" option
            
            const text = option.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        });
    }

    updateSelectedCourse() {
        const select = document.getElementById('templateCourseSelect');
        const downloadBtn = document.getElementById('downloadTemplateBtn');
        
        if (select.value) {
            downloadBtn.disabled = false;
            downloadBtn.classList.remove('btn-secondary');
            downloadBtn.classList.add('btn-primary');
        } else {
            downloadBtn.disabled = true;
            downloadBtn.classList.remove('btn-primary');
            downloadBtn.classList.add('btn-secondary');
        }
    }

    async downloadCourseExcelTemplate() {
        console.log('📥 Generating Excel template for selected course...');
        
        const select = document.getElementById('templateCourseSelect');
        const courseCode = select.value;
        
        if (!courseCode) {
            this.showToast('Error', 'Please select a course first', 'error');
            return;
        }
        
        try {
            // Get full course details by code
            const courseDetailsResponse = await API.request(`/Course/code/${courseCode}`, {
                method: 'GET'
            });
            
            if (!courseDetailsResponse.success || !courseDetailsResponse.data?.data) {
                this.showToast('Error', 'Failed to load course details', 'error');
                return;
            }
            
            const courseDetails = courseDetailsResponse.data.data;
            const courseId = courseDetails.id || courseDetails.Id || courseDetails.courseId || courseDetails.CourseId;
            const courseName = courseDetails.name || courseDetails.courseName || courseDetails.Name || courseDetails.CourseName;
            
            console.log(`✅ Got courseId ${courseId} for ${courseCode}`);
            
            // Get enrollments for this course
            const enrollmentResponse = await API.request(`/Enrollment/course/${courseId}`, {
                method: 'GET'
            });

            if (!enrollmentResponse.success) {
                this.showToast('Error', 'Failed to load enrollments', 'error');
                return;
            }

            let enrollments = enrollmentResponse.data?.data || enrollmentResponse.data?.Data || enrollmentResponse.data || [];
            
            if (!Array.isArray(enrollments)) {
                enrollments = [enrollments];
            }

            // Filter to only include students with Approved or Enrolled status
            enrollments = enrollments.filter(e => {
                if (!e) return false;
                const status = (e.status || e.Status || '').toString().trim().toLowerCase();
                return status === 'approved' || status === 'enrolled';
            });

            console.log(`✅ Found ${enrollments.length} approved students in ${courseCode}`);

            if (enrollments.length === 0) {
                this.showToast('Warning', `No students enrolled in ${courseCode}`, 'warning');
                return;
            }

            // Create template data
            const templateData = enrollments.map(enrollment => ({
                'Student Code': enrollment.studentCode || enrollment.StudentCode || '',
                'Student Name': enrollment.studentName || enrollment.StudentName || '',
                'Course Code': courseCode,
                'Course Name': courseName,
                'Date': new Date().toLocaleDateString('en-US'),
                'Status': 'Present',
                'Remarks': ''
            }));

            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            
            // Add data validation for Status column (column F, index 5)
            // Status options: Present, Absent, Late, Excused
            const statusOptions = ['Present', 'Absent', 'Late', 'Excused'];
            
            // Set column widths
            worksheet['!cols'] = [
                { wch: 15 }, // Student Code
                { wch: 25 }, // Student Name
                { wch: 12 }, // Course Code
                { wch: 30 }, // Course Name
                { wch: 12 }, // Date
                { wch: 12 }, // Status
                { wch: 30 }  // Remarks
            ];

            // Add data validation to Status column for all rows
            for (let i = 2; i <= enrollments.length + 1; i++) {
                const cellAddress = `F${i}`; // Status column
                if (!worksheet[cellAddress]) {
                    worksheet[cellAddress] = { v: 'Present', t: 's' };
                }
                
                // Add validation metadata (Excel will recognize this)
                if (!worksheet['!dataValidation']) {
                    worksheet['!dataValidation'] = [];
                }
                
                worksheet['!dataValidation'].push({
                    type: 'list',
                    allowBlank: false,
                    sqref: cellAddress,
                    formulas: ['"Present,Absent,Late,Excused"']
                });
            }

            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
            
            // Add instructions sheet
            const instructions = [
                { 'Instructions': 'ATTENDANCE MARKING TEMPLATE' },
                { 'Instructions': '' },
                { 'Instructions': `Course: ${courseCode} - ${courseName}` },
                { 'Instructions': `Students Enrolled: ${enrollments.length}` },
                { 'Instructions': '' },
                { 'Instructions': 'HOW TO USE:' },
                { 'Instructions': '1. Go to "Attendance" sheet' },
                { 'Instructions': '2. Click on any Status cell - a dropdown will appear' },
                { 'Instructions': '3. Select: Present, Absent, Late, or Excused' },
                { 'Instructions': '4. Update the Date if needed (format: MM/DD/YYYY)' },
                { 'Instructions': '5. Add optional remarks' },
                { 'Instructions': '6. Save the file' },
                { 'Instructions': '7. Upload using "Upload Excel to Mark Attendance" button' },
                { 'Instructions': '' },
                { 'Instructions': 'IMPORTANT NOTES:' },
                { 'Instructions': '• Do NOT change Student Code or Course Code' },
                { 'Instructions': '• Do NOT add or remove rows' },
                { 'Instructions': '• Status must be: Present, Absent, Late, or Excused' },
                { 'Instructions': '• All students in this file are from the same course' }
            ];
            
            const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
            instructionsSheet['!cols'] = [{ wch: 70 }];
            XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
            
            // Generate filename
            const filename = `Attendance_${courseCode}_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Download file
            XLSX.writeFile(workbook, filename);
            
            this.showToast('Success', `Template downloaded with ${enrollments.length} student(s) from ${courseCode}`, 'success');
            
        } catch (error) {
            console.error('❌ Error generating template:', error);
            this.showToast('Error', 'Failed to generate template: ' + error.message, 'error');
        }
    }

    async downloadExcelTemplate() {
        console.log('📥 Generating Excel template...');
        
        try {
            if (!this.currentInstructorId) {
                this.showToast('Error', 'Instructor ID not available', 'error');
                return;
            }

            // Get instructor's courses
            const coursesResponse = await API.request(`/Course/instructor/${this.currentInstructorId}`, {
                method: 'GET'
            });
            
            if (!coursesResponse.success || !coursesResponse.data?.data) {
                this.showToast('Error', 'Failed to load courses', 'error');
                return;
            }

            let courses = coursesResponse.data.data;
            if (!Array.isArray(courses)) {
                courses = [courses];
            }

            console.log('📚 All courses from API:', courses);
            
            // Log first course to see structure
            if (courses.length > 0) {
                console.log('📋 Sample course object:', courses[0]);
                console.log('🔑 Available properties:', Object.keys(courses[0]));
            }

            // Create template data with enrolled students
            const templateData = [];
            
            for (const course of courses) {
                const courseCode = course.courseCode || course.CourseCode;
                const courseName = course.courseName || course.name || course.CourseName || course.Name;
                
                console.log(`📚 Processing course: ${courseCode}`);
                
                // The API doesn't return courseId, so we need to fetch it using course code
                try {
                    // Get full course details by code to get the courseId
                    const courseDetailsResponse = await API.request(`/Course/code/${courseCode}`, {
                        method: 'GET'
                    });
                    
                    if (!courseDetailsResponse.success || !courseDetailsResponse.data?.data) {
                        console.warn(`⚠️ Could not fetch course details for ${courseCode}`);
                        continue;
                    }
                    
                    const courseDetails = courseDetailsResponse.data.data;
                    const courseId = courseDetails.id || courseDetails.Id || courseDetails.courseId || courseDetails.CourseId;
                    
                    console.log(`✅ Got courseId ${courseId} for ${courseCode}`);
                
                    // Get enrollments
                    const enrollmentResponse = await API.request(`/Enrollment/course/${courseId}`, {
                        method: 'GET'
                    });

                    console.log(`📊 Enrollment response for ${courseCode}:`, enrollmentResponse);

                    if (enrollmentResponse.success) {
                        // Handle nested data structure - check multiple possible paths
                        let enrollments = enrollmentResponse.data?.data || enrollmentResponse.data?.Data || enrollmentResponse.data;
                        
                        console.log(`📋 Raw enrollments for ${courseCode}:`, enrollments);
                        
                        if (!Array.isArray(enrollments)) {
                            enrollments = [enrollments];
                        }

                        // Filter out null/undefined entries
                        enrollments = enrollments.filter(e => e);

                        console.log(`✅ Found ${enrollments.length} students in ${courseCode}`);

                        // Add each student as a template row
                        enrollments.forEach(enrollment => {
                            const studentCode = enrollment.studentCode || enrollment.StudentCode || '';
                            const studentName = enrollment.studentName || enrollment.StudentName || '';
                            
                            console.log(`👤 Adding student: ${studentCode} - ${studentName}`);
                            
                            templateData.push({
                                'Student Code': studentCode,
                                'Student Name': studentName,
                                'Course Code': courseCode,
                                'Course Name': courseName,
                                'Date': new Date().toLocaleDateString('en-US'), // Today's date as example
                                'Status': 'Present', // Default value
                                'Remarks': '' // Optional
                            });
                        });
                    } else {
                        console.warn(`⚠️ Failed to load enrollments for ${courseCode}:`, enrollmentResponse.error);
                    }
                } catch (error) {
                    console.error(`❌ Error processing course ${courseCode}:`, error);
                }
            }

            console.log(`📊 Total students in template: ${templateData.length}`);

            if (templateData.length === 0) {
                this.showToast('Warning', 'No enrolled students found in your courses. Please ensure students are enrolled first.', 'warning');
                
                // Create empty template with headers only
                templateData.push({
                    'Student Code': '',
                    'Student Name': '',
                    'Course Code': '',
                    'Course Name': '',
                    'Date': '',
                    'Status': '',
                    'Remarks': ''
                });
            }

            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            
            // Set column widths
            worksheet['!cols'] = [
                { wch: 15 }, // Student Code
                { wch: 25 }, // Student Name
                { wch: 12 }, // Course Code
                { wch: 25 }, // Course Name
                { wch: 12 }, // Date
                { wch: 10 }, // Status
                { wch: 30 }  // Remarks
            ];

            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Template');
            
            // Add instructions sheet
            const instructions = [
                { 'Instructions': 'How to use this template:' },
                { 'Instructions': '' },
                { 'Instructions': '1. Fill in the attendance data in the "Attendance Template" sheet' },
                { 'Instructions': '2. Student Code and Course Code must match existing records' },
                { 'Instructions': '3. Date format: MM/DD/YYYY (e.g., 11/30/2025)' },
                { 'Instructions': '4. Status must be one of: Present, Absent, Late' },
                { 'Instructions': '5. Remarks are optional' },
                { 'Instructions': '6. Do not change the column headers' },
                { 'Instructions': '7. Save the file and upload it using the "Upload Excel" button' },
                { 'Instructions': '' },
                { 'Instructions': 'Required Columns:' },
                { 'Instructions': '- Student Code (must match existing student)' },
                { 'Instructions': '- Course Code (must match existing course)' },
                { 'Instructions': '- Date (attendance date)' },
                { 'Instructions': '- Status (Present, Absent, or Late)' }
            ];
            
            const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
            instructionsSheet['!cols'] = [{ wch: 60 }];
            XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
            
            // Generate filename
            const filename = `Attendance_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Download file
            XLSX.writeFile(workbook, filename);
            
            const studentCount = templateData.length - (templateData[0]['Student Code'] === '' ? 1 : 0);
            this.showToast('Success', `Template downloaded with ${studentCount} enrolled student(s)`, 'success');
            
        } catch (error) {
            console.error('❌ Error generating template:', error);
            this.showToast('Error', 'Failed to generate template: ' + error.message, 'error');
        }
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

    // ===== NEW ATTENDANCE MANAGEMENT METHODS =====
    
    async searchCourseForAttendance() {
        const searchInput = document.getElementById('courseSearchAttendance');
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (searchTerm.length < 2) {
            document.getElementById('selectedCourseInfo').classList.add('d-none');
            document.getElementById('attendanceTableSection').classList.add('d-none');
            return;
        }

        try {
            // Search through instructor's courses
            const coursesResponse = await API.request(`/Course/instructor/${this.instructorId}`, {
                method: 'GET'
            });

            if (!coursesResponse.success) {
                console.error('Failed to load courses');
                return;
            }

            let courses = coursesResponse.data?.data || coursesResponse.data?.Data || coursesResponse.data || [];
            if (!Array.isArray(courses)) {
                courses = [courses];
            }

            // Filter courses by search term
            const matchedCourse = courses.find(course => {
                const code = (course.courseCode || course.CourseCode || '').toLowerCase();
                const name = (course.name || course.Name || course.courseName || course.CourseName || '').toLowerCase();
                return code.includes(searchTerm) || name.includes(searchTerm);
            });

            if (matchedCourse) {
                this.selectedCourseForAttendance = matchedCourse;
                this.displaySelectedCourse(matchedCourse);
            } else {
                document.getElementById('selectedCourseInfo').classList.add('d-none');
                document.getElementById('attendanceTableSection').classList.add('d-none');
            }

        } catch (error) {
            console.error('Error searching courses:', error);
        }
    }

    displaySelectedCourse(course) {
        const courseCode = course.courseCode || course.CourseCode || '';
        const courseName = course.name || course.Name || course.courseName || course.CourseName || '';
        
        document.getElementById('displayCourseCode').textContent = courseCode;
        document.getElementById('displayCourseName').textContent = courseName;
        document.getElementById('selectedCourseInfo').classList.remove('d-none');
        
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('attendanceDate').value = today;
        
        // Load students
        this.loadStudentsForAttendance();
    }

    async loadStudentsForAttendance() {
        const course = this.selectedCourseForAttendance;
        if (!course) return;

        const courseId = course.id || course.Id || course.courseId || course.CourseId;
        const courseCode = course.courseCode || course.CourseCode || '';
        const courseName = course.name || course.Name || course.courseName || course.CourseName || '';
        const selectedDate = document.getElementById('attendanceDate').value;

        if (!selectedDate) {
            return;
        }

        try {
            // Get enrolled students
            const enrollmentResponse = await API.request(`/Enrollment/course/${courseId}`, {
                method: 'GET'
            });

            if (!enrollmentResponse.success) {
                console.error('Failed to load enrollments');
                return;
            }

            let enrollments = enrollmentResponse.data?.data || enrollmentResponse.data?.Data || enrollmentResponse.data || [];
            if (!Array.isArray(enrollments)) {
                enrollments = [enrollments];
            }

            // Filter approved/enrolled students
            enrollments = enrollments.filter(e => {
                if (!e) return false;
                const status = (e.status || e.Status || '').toString().trim().toLowerCase();
                return status === 'approved' || status === 'enrolled';
            });

            // Display students in table
            const tbody = document.getElementById('attendanceStudentsBody');
            const markBtn = document.getElementById('markAttendanceBtn');
            if (enrollments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-4">No enrolled students found</td></tr>';
                if (markBtn) markBtn.classList.add('d-none');
                return;
            }

            tbody.innerHTML = enrollments.map((enrollment, index) => {
                const studentName = enrollment.studentName || enrollment.StudentName || 'Unknown';
                const studentId = enrollment.studentId || enrollment.StudentId || '';
                
                return `
                    <tr>
                        <td class="align-middle">${courseCode}</td>
                        <td class="align-middle">${courseName}</td>
                        <td class="align-middle"><strong>${studentName}</strong></td>
                        <td class="align-middle">${selectedDate}</td>
                        <td class="align-middle">
                            <select class="form-select status-select" data-student-id="${studentId}" data-index="${index}">
                                <option value="">Select Status</option>
                                <option value="Present">✓ Present</option>
                                <option value="Late">⏰ Late</option>
                                <option value="Absent">✗ Absent</option>
                                <option value="Excused">📝 Excused</option>
                            </select>
                        </td>
                    </tr>
                `;
            }).join('');

            // Show mark attendance button
            if (markBtn) markBtn.classList.remove('d-none');

        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    async markBulkAttendance() {
        const course = this.selectedCourseForAttendance;
        if (!course) {
            this.showToast('Error', 'Please select a course first', 'error');
            return;
        }

        const courseId = course.id || course.Id || course.courseId || course.CourseId;
        const selectedDate = document.getElementById('attendanceDate').value;

        if (!selectedDate) {
            this.showToast('Error', 'Please select a date', 'error');
            return;
        }

        // Collect all attendance data
        const selects = document.querySelectorAll('#attendanceStudentsBody .status-select');
        const attendanceData = [];
        let hasSelection = false;

        selects.forEach(select => {
            const status = select.value;
            if (status) {
                hasSelection = true;
                const studentId = parseInt(select.dataset.studentId);
                attendanceData.push({
                    courseId: courseId,
                    studentId: studentId,
                    date: selectedDate,
                    status: status
                });
            }
        });

        if (!hasSelection) {
            this.showToast('Warning', 'Please select at least one attendance status', 'warning');
            return;
        }

        try {
            console.log('Marking attendance:', attendanceData);

            // Mark attendance for each student
            let successCount = 0;
            let errorCount = 0;

            for (const data of attendanceData) {
                try {
                    // Use the correct DTO format for the API
                    const markDto = {
                        studentId: data.studentId,
                        courseId: data.courseId,
                        date: data.date,
                        status: data.status
                    };

                    const response = await API.request('/Attendance/mark', {
                        method: 'POST',
                        body: JSON.stringify(markDto)
                    });

                    if (response.success || response.message) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                    console.error('Error marking attendance:', error);
                }
            }

            if (successCount > 0) {
                this.showToast('Success', `Marked attendance for ${successCount} student(s)`, 'success');
                
                // Refresh stats and records
                await this.loadAttendanceStats();
                await this.loadAttendanceRecords();
                await this.loadRecentActivity();
                
                // Reset selections
                selects.forEach(select => select.value = '');
            }

            if (errorCount > 0) {
                this.showToast('Warning', `Failed to mark ${errorCount} attendance record(s)`, 'warning');
            }

        } catch (error) {
            console.error('Error in bulk attendance:', error);
            this.showToast('Error', 'Failed to mark attendance', 'error');
        }
    }

    async loadAttendanceStats() {
        try {
            if (!this.instructorId) {
                console.warn('⚠️ Instructor ID not available for stats');
                document.getElementById('totalAttendanceRecords').textContent = '0';
                document.getElementById('totalPresent').textContent = '0';
                document.getElementById('totalAbsent').textContent = '0';
                document.getElementById('totalLate').textContent = '0';
                return;
            }

            // Get all courses for this instructor
            const coursesResponse = await API.request(`/Course/instructor/${this.instructorId}`, {
                method: 'GET'
            });

            if (!coursesResponse.success) {
                console.error('Failed to load courses for stats');
                return;
            }

            let courses = coursesResponse.data?.data || coursesResponse.data?.Data || coursesResponse.data || [];
            if (!Array.isArray(courses)) {
                courses = [courses];
            }

            // Aggregate attendance from all courses
            let allRecords = [];
            for (const course of courses) {
                const courseId = course.id || course.Id || course.courseId || course.CourseId;
                try {
                    const attendanceResponse = await API.request(`/Attendance/filter?courseId=${courseId}`, {
                        method: 'GET'
                    });
                    if (attendanceResponse.success) {
                        let records = attendanceResponse.data?.data || attendanceResponse.data?.Data || attendanceResponse.data || [];
                        if (!Array.isArray(records)) {
                            records = [records];
                        }
                        allRecords = allRecords.concat(records);
                    }
                } catch (err) {
                    console.warn('Could not load attendance for course:', courseId);
                }
            }

            const stats = {
                total: allRecords.length,
                present: allRecords.filter(r => (r.status || r.Status || '').toLowerCase() === 'present').length,
                absent: allRecords.filter(r => (r.status || r.Status || '').toLowerCase() === 'absent').length,
                late: allRecords.filter(r => (r.status || r.Status || '').toLowerCase() === 'late').length
            };

            document.getElementById('totalAttendanceRecords').textContent = stats.total;
            document.getElementById('totalPresent').textContent = stats.present;
            document.getElementById('totalAbsent').textContent = stats.absent;
            document.getElementById('totalLate').textContent = stats.late;

        } catch (error) {
            console.error('Error loading attendance stats:', error);
            document.getElementById('totalAttendanceRecords').textContent = '0';
            document.getElementById('totalPresent').textContent = '0';
            document.getElementById('totalAbsent').textContent = '0';
            document.getElementById('totalLate').textContent = '0';
        }
    }

    async loadAttendanceRecords() {
        try {
            if (!this.instructorId) {
                console.warn('⚠️ Instructor ID not available for records');
                return;
            }

            // Get all courses for this instructor
            const coursesResponse = await API.request(`/Course/instructor/${this.instructorId}`, {
                method: 'GET'
            });

            if (!coursesResponse.success) {
                console.error('Failed to load courses');
                return;
            }

            let courses = coursesResponse.data?.data || coursesResponse.data?.Data || coursesResponse.data || [];
            if (!Array.isArray(courses)) {
                courses = [courses];
            }

            // Get date filters
            const fromDate = document.getElementById('filterFromDate').value;
            const toDate = document.getElementById('filterToDate').value;

            // Aggregate attendance from all courses
            let records = [];
            for (const course of courses) {
                const courseId = course.id || course.Id || course.courseId || course.CourseId;
                const courseName = course.name || course.Name || course.courseName || course.CourseName;
                
                try {
                    let url = `/Attendance/filter?courseId=${courseId}`;
                    if (fromDate) url += `&from=${fromDate}`;
                    if (toDate) url += `&to=${toDate}`;
                    
                    const attendanceResponse = await API.request(url, {
                        method: 'GET'
                    });
                    
                    if (attendanceResponse.success) {
                        let courseRecords = attendanceResponse.data?.data || attendanceResponse.data?.Data || attendanceResponse.data || [];
                        if (!Array.isArray(courseRecords)) {
                            courseRecords = [courseRecords];
                        }
                        // Add course name to each record
                        courseRecords = courseRecords.map(r => ({
                            ...r,
                            courseName: courseName
                        }));
                        records = records.concat(courseRecords);
                    }
                } catch (err) {
                    console.warn('Could not load attendance for course:', courseId);
                }
            }

            // Filter by date if specified (already declared above)
            if (fromDate || toDate) {
                records = records.filter(record => {
                    const recordDate = new Date(record.date || record.Date);
                    if (fromDate && recordDate < new Date(fromDate)) return false;
                    if (toDate && recordDate > new Date(toDate)) return false;
                    return true;
                });
            }

            // Sort by date descending
            records.sort((a, b) => new Date(b.date || b.Date) - new Date(a.date || a.Date));

            const tbody = document.getElementById('attendanceRecordsBody');
            if (records.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No records found</td></tr>';
                return;
            }

            tbody.innerHTML = records.map(record => {
                const studentName = record.studentName || record.StudentName || 'Unknown';
                const courseName = record.courseName || record.CourseName || 'Unknown';
                const date = new Date(record.date || record.Date).toLocaleDateString();
                const status = record.status || record.Status || '';
                const attendanceId = record.id || record.Id || record.attendanceId || record.AttendanceId;

                let statusBadge = '';
                switch (status.toLowerCase()) {
                    case 'present':
                        statusBadge = '<span class="status-badge status-present">Present</span>';
                        break;
                    case 'absent':
                        statusBadge = '<span class="status-badge status-absent">Absent</span>';
                        break;
                    case 'late':
                        statusBadge = '<span class="status-badge status-late">Late</span>';
                        break;
                    case 'excused':
                        statusBadge = '<span class="status-badge status-excused">Excused</span>';
                        break;
                    default:
                        statusBadge = `<span class="status-badge">${status}</span>`;
                }

                return `
                    <tr>
                        <td>${studentName}</td>
                        <td>${courseName}</td>
                        <td>${date}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-danger" onclick="instructorDashboard.deleteAttendance(${attendanceId})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading attendance records:', error);
        }
    }

    async loadRecentActivity() {
        try {
            if (!this.instructorId) {
                console.warn('⚠️ Instructor ID not available for recent activity');
                return;
            }

            // Get all courses for this instructor
            const coursesResponse = await API.request(`/Course/instructor/${this.instructorId}`, {
                method: 'GET'
            });

            if (!coursesResponse.success) return;

            let courses = coursesResponse.data?.data || coursesResponse.data?.Data || coursesResponse.data || [];
            if (!Array.isArray(courses)) {
                courses = [courses];
            }

            // Aggregate attendance from all courses
            let records = [];
            for (const course of courses) {
                const courseId = course.id || course.Id || course.courseId || course.CourseId;
                try {
                    const attendanceResponse = await API.request(`/Attendance/filter?courseId=${courseId}`, {
                        method: 'GET'
                    });
                    if (attendanceResponse.success) {
                        let courseRecords = attendanceResponse.data?.data || attendanceResponse.data?.Data || attendanceResponse.data || [];
                        if (!Array.isArray(courseRecords)) {
                            courseRecords = [courseRecords];
                        }
                        records = records.concat(courseRecords);
                    }
                } catch (err) {
                    console.warn('Could not load attendance for course:', courseId);
                }
            }

            // Get last 10 records
            records.sort((a, b) => new Date(b.date || b.Date) - new Date(a.date || a.Date));
            records = records.slice(0, 10);

            const container = document.getElementById('recentActivityList');
            if (records.length === 0) {
                container.innerHTML = '<p class="text-muted text-center">No recent activity</p>';
                return;
            }

            container.innerHTML = records.map(record => {
                const studentName = record.studentName || record.StudentName || 'Unknown';
                const status = record.status || record.Status || '';
                const date = new Date(record.date || record.Date).toLocaleDateString();
                
                let icon = '';
                let colorClass = '';
                switch (status.toLowerCase()) {
                    case 'present':
                        icon = 'check-circle-fill';
                        colorClass = 'text-success';
                        break;
                    case 'absent':
                        icon = 'x-circle-fill';
                        colorClass = 'text-danger';
                        break;
                    case 'late':
                        icon = 'clock-fill';
                        colorClass = 'text-warning';
                        break;
                    case 'excused':
                        icon = 'info-circle-fill';
                        colorClass = 'text-info';
                        break;
                }

                return `
                    <div class="recent-activity-item">
                        <div class="d-flex align-items-start">
                            <i class="bi bi-${icon} ${colorClass} me-2 mt-1"></i>
                            <div class="flex-grow-1">
                                <p class="mb-0 small"><strong>${studentName}</strong></p>
                                <p class="mb-0 small text-muted">${status} - ${date}</p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    async deleteAttendance(attendanceId) {
        if (!confirm('Are you sure you want to delete this attendance record?')) {
            return;
        }

        try {
            const response = await API.request(`/Attendance/${attendanceId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                this.showToast('Success', 'Attendance record deleted', 'success');
                await this.loadAttendanceStats();
                await this.loadAttendanceRecords();
                await this.loadRecentActivity();
            } else {
                this.showToast('Error', 'Failed to delete attendance record', 'error');
            }

        } catch (error) {
            console.error('Error deleting attendance:', error);
            this.showToast('Error', 'Failed to delete attendance record', 'error');
        }
    }

    async refreshAttendance() {
        console.log('🔄 Refreshing attendance data...');
        
        // Clear search
        document.getElementById('courseSearchAttendance').value = '';
        document.getElementById('selectedCourseInfo').classList.add('d-none');
        document.getElementById('attendanceTableSection').classList.add('d-none');
        
        // Clear date filters
        document.getElementById('filterFromDate').value = '';
        document.getElementById('filterToDate').value = '';
        
        // Reload all data
        await this.loadAttendanceStats();
        await this.loadAttendanceRecords();
        await this.loadRecentActivity();
        
        this.showToast('Success', 'Attendance data refreshed', 'success');
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

