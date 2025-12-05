// =====================================================
// Instructor Dashboard - Main Module
// Core initialization and navigation
// =====================================================

class InstructorDashboard {
    constructor() {
        this.editingId = null;
        this.editingType = null;
        this.currentInstructorId = null;
        this.editingAttendanceId = null;
        this.attendanceRecords = [];
        this.allCoursesData = [];
        this.instructorCourses = [];
        this.currentProfile = null;
        this.allCourses = [];
        this.instructorId = null;
        this.attendancePagination = null;
        
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
                profile = profileResponse.data.data;
            } else if (profileResponse.success && profileResponse.data) {
                profile = profileResponse.data;
            } else if (profileResponse.data) {
                profile = profileResponse.data;
            } else if (profileResponse.instructorId || profileResponse.InstructorId) {
                profile = profileResponse;
            }
            
            if (profile) {
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

            console.log('✅ Instructor ID is now set:', this.currentInstructorId);
            
            // Pre-load exam courses so they're ready when modal opens
            if (this.loadExamCourses) {
                console.log('📚 Pre-loading exam courses...');
                await this.loadExamCourses();
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

            // Get instructor's courses directly
            const coursesResponse = await API.request(`/Course/instructor/${this.currentInstructorId}`, {
                method: 'GET'
            });
            
            console.log('📦 Courses Response:', coursesResponse);
            
            if (coursesResponse.success && coursesResponse.data) {
                // Handle both Data and data properties
                const myCourses = coursesResponse.data.Data || coursesResponse.data.data || coursesResponse.data;
                
                if (!Array.isArray(myCourses)) {
                    console.error('❌ Expected array of courses but got:', typeof myCourses, myCourses);
                    return;
                }
                
                const courseCount = myCourses.length;
                document.querySelector('[data-stat="courses"]').textContent = courseCount;
                
                console.log('📚 Found', courseCount, 'courses for instructor', this.currentInstructorId);
                
                if (myCourses.length > 0) {
                    console.log('📋 Sample course object:', myCourses[0]);
                    console.log('🔑 Available course properties:', Object.keys(myCourses[0]));
                }
                
                // Get total students and calculate average grades

                // Cache courses for other modules (exams, attendance, etc.)
                try {
                    this.instructorCourses = Array.isArray(myCourses) ? myCourses : [];
                    console.log(`📥 Cached ${this.instructorCourses.length} instructor courses`);
                } catch (e) {
                    console.warn('⚠️ Could not cache instructor courses', e);
                    this.instructorCourses = [];
                }

                let totalStudents = 0;
                let allGrades = [];
                let pendingCount = 0;
                
                for (const course of myCourses) {
                    try {
                        // Get course ID directly from the response
                        const courseId = course.id || course.Id || course.courseId || course.CourseId;
                        const courseCode = course.courseCode || course.CourseCode;
                        
                        if (!courseId) {
                            console.warn('⚠️ Course ID is undefined, skipping:', course);
                            continue;
                        }
                        
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
                            
                            const uniqueStudents = new Set();
                            enrollments.forEach(e => {
                                const studentId = e.studentId || e.StudentId;
                                if (studentId) uniqueStudents.add(studentId);
                            });
                            
                            totalStudents += uniqueStudents.size;
                            
                            console.log(`  ✅ ${uniqueStudents.size} unique students in ${courseCode}`);
                            
                            enrollments.forEach(enrollment => {
                                const grade = enrollment.finalGrade || enrollment.grade || enrollment.Grade || enrollment.FinalGrade;
                                const status = (enrollment.status || enrollment.Status || '').toLowerCase();
                                
                                if (grade !== null && grade !== undefined && grade > 0) {
                                    allGrades.push(grade);
                                } else if (status === 'pending') {
                                    pendingCount++;
                                }
                            });
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not load enrollments for course:', course);
                    }
                }
                
                document.querySelector('[data-stat="students"]').textContent = totalStudents;
                console.log('👥 Total unique students across all courses:', totalStudents);
                
                if (allGrades.length > 0) {
                    const avgGrade = (allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length).toFixed(1);
                    document.querySelector('[data-stat="avgGrade"]').textContent = avgGrade + '%';
                    console.log('📈 Average grade:', avgGrade + '%');
                } else {
                    document.querySelector('[data-stat="avgGrade"]').textContent = '0%';
                    console.log('⚠️ No grades to calculate average, showing default 0%');
                }
                
                document.querySelector('[data-stat="pending"]').textContent = pendingCount;
                console.log('⏳ Total pending reviews:', pendingCount);
                
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

                try {
                    const courseDetailsResponse = await API.request(`/Course/code/${courseCode}`, {
                        method: 'GET'
                    });
                    
                    if (!courseDetailsResponse.success || !courseDetailsResponse.data?.data) {
                        continue;
                    }
                    
                    const courseId = courseDetailsResponse.data.data.id || courseDetailsResponse.data.data.Id;

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

            // Chart 1: Students Per Course
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

            // Chart 2: Attendance Overview
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
                ctx2.parentElement.innerHTML = '<div class="text-center text-muted p-4"><i class="bi bi-calendar-x" style="font-size: 3rem;"></i><p class="mt-2">No attendance records yet</p></div>';
            }

            // Chart 3: Grade Distribution
            const ctx3 = document.getElementById('gradeDistributionChart');
            const gradeLabels = Object.keys(gradeRanges);
            const gradeData = Object.values(gradeRanges);
            
            if (ctx3) {
                new Chart(ctx3, {
                    type: 'bar',
                    data: {
                        labels: gradeLabels,
                        datasets: [{
                            label: 'Number of Students',
                            data: gradeData,
                            backgroundColor: [
                                'rgba(79, 70, 229, 0.9)',
                                'rgba(14, 165, 233, 0.9)',
                                'rgba(16, 185, 129, 0.9)',
                                'rgba(245, 158, 11, 0.9)',
                                'rgba(239, 68, 68, 0.9)'
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

    // ===== HELPER METHODS =====
    showToast(title, message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;

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
// =====================================================
// ADDITIONAL FIX: Ensure courses are loaded when modal opens
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Instructor Dashboard...');
    window.instructorDashboard = new InstructorDashboard();
    
    // Add modal event listener
    const examModal = document.getElementById('examModal');
    if (examModal) {
        examModal.addEventListener('show.bs.modal', async () => {
            console.log('📝 Exam modal opening - loading courses...');
            
            // Reset form
            if (window.instructorDashboard?.resetExamForm) {
                window.instructorDashboard.resetExamForm();
            }
            
            // IMPORTANT: Always reload courses when modal opens
            if (window.instructorDashboard?.loadExamCourses) {
                await window.instructorDashboard.loadExamCourses();
            }
        });
    }
});