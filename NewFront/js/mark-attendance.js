// =====================================================
// Mark Attendance Page - Standalone Page
// Integrated with Smart Campus University API
// =====================================================

class MarkAttendancePage {
    constructor() {
        this.instructorId = null;
        this.selectedCourseForAttendance = null;
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Mark Attendance Page...');
        
        // Get instructor info from JWT
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        console.log('🔐 User Info:', userInfo);
        
        // Update navbar
        const userName = userInfo.FirstName || userInfo.firstName || 'Instructor';
        document.getElementById('userName').textContent = userName;
        
        // Fetch instructor profile to get ID
        try {
            const profileResponse = await API.instructor.getMyProfile();
            console.log('📦 Profile response:', profileResponse);
            
            let profile = null;
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
                this.instructorId = profile.instructorId || profile.InstructorId || profile.id || profile.Id;
                console.log('✅ Instructor ID:', this.instructorId);
            } else {
                console.error('❌ Failed to get instructor profile');
                this.showToast('Error', 'Failed to load instructor information', 'error');
            }
        } catch (error) {
            console.error('❌ Error loading instructor profile:', error);
            this.showToast('Error', 'Failed to initialize: ' + error.message, 'error');
        }
        
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('attendanceDate').value = today;
        
        // Load recent activity
        this.loadRecentActivity();
        
        // Setup logout
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }

    async searchCourseForAttendance() {
        const searchInput = document.getElementById('courseSearchAttendance');
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (searchTerm.length < 2) {
            document.getElementById('attendanceStudentsBody').innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted p-4">
                        <i class="bi bi-search" style="font-size: 2rem; opacity: 0.3;"></i>
                        <p class="mt-2">Search for a course to display enrolled students</p>
                    </td>
                </tr>
            `;
            document.getElementById('courseInfo').textContent = 'Search for a course to begin';
            document.getElementById('markAttendanceBtn').classList.add('d-none');
            return;
        }

        try {
            if (!this.instructorId) {
                this.showToast('Error', 'Instructor ID not available', 'error');
                return;
            }

            // Search through instructor's courses
            const coursesResponse = await API.request(`/Course/instructor/${this.instructorId}`, {
                method: 'GET'
            });

            if (!coursesResponse.success) {
                console.error('Failed to load courses');
                this.showToast('Error', 'Failed to load courses', 'error');
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
                await this.loadStudentsForAttendance();
            } else {
                document.getElementById('attendanceStudentsBody').innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted p-4">
                            <i class="bi bi-search" style="font-size: 2rem; opacity: 0.3;"></i>
                            <p class="mt-2">No courses found matching "${searchTerm}"</p>
                        </td>
                    </tr>
                `;
                document.getElementById('courseInfo').textContent = 'No courses found';
                document.getElementById('markAttendanceBtn').classList.add('d-none');
            }

        } catch (error) {
            console.error('Error searching courses:', error);
            this.showToast('Error', 'Failed to search courses', 'error');
        }
    }

    async loadStudentsForAttendance() {
        const course = this.selectedCourseForAttendance;
        if (!course) return;

        const courseCode = course.courseCode || course.CourseCode || '';
        const courseName = course.name || course.Name || course.courseName || course.CourseName || '';
        const selectedDate = document.getElementById('attendanceDate').value;

        if (!selectedDate) {
            this.showToast('Warning', 'Please select a date', 'warning');
            return;
        }

        // Update course info
        document.getElementById('courseInfo').textContent = `${courseCode} - ${courseName}`;

        try {
            // First get course details by code to get the course ID
            const courseDetailsResponse = await API.request(`/Course/code/${courseCode}`, {
                method: 'GET'
            });

            if (!courseDetailsResponse.success || !courseDetailsResponse.data?.data) {
                this.showToast('Error', 'Failed to load course details', 'error');
                return;
            }

            const courseId = courseDetailsResponse.data.data.id || courseDetailsResponse.data.data.Id;
            console.log('✅ Course ID:', courseId);

            // Get enrolled students
            const enrollmentResponse = await API.request(`/Enrollment/course/${courseId}`, {
                method: 'GET'
            });

            if (!enrollmentResponse.success) {
                console.error('Failed to load enrollments');
                this.showToast('Error', 'Failed to load students', 'error');
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

            console.log(`✅ Found ${enrollments.length} enrolled students`);

            // Display students in table
            const tbody = document.getElementById('attendanceStudentsBody');
            const markBtn = document.getElementById('markAttendanceBtn');
            
            if (enrollments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-4">No enrolled students found in this course</td></tr>';
                if (markBtn) markBtn.classList.add('d-none');
                return;
            }

            tbody.innerHTML = enrollments.map((enrollment, index) => {
                const studentName = enrollment.studentName || enrollment.StudentName || 'Unknown';
                const studentId = enrollment.studentId || enrollment.StudentId || '';
                
                return `
                    <tr>
                        <td class="align-middle"><strong>${courseCode}</strong></td>
                        <td class="align-middle">${courseName}</td>
                        <td class="align-middle"><strong>${studentName}</strong></td>
                        <td class="align-middle">${selectedDate}</td>
                        <td class="align-middle">
                            <select class="form-select status-select" data-student-id="${studentId}" data-course-id="${courseId}" data-index="${index}">
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
            this.showToast('Error', 'Failed to load students', 'error');
        }
    }

    async markBulkAttendance() {
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
                const courseId = parseInt(select.dataset.courseId);
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
            console.log('📤 Marking attendance:', attendanceData);

            // Mark attendance for each student
            let successCount = 0;
            let errorCount = 0;

            for (const data of attendanceData) {
                try {
                    // Use the correct DTO format for the API - PascalCase property names
                    const markDto = {
                        StudentId: data.studentId,
                        CourseId: data.courseId,
                        Date: data.date + 'T00:00:00', // Convert to DateTime format
                        Status: data.status
                    };

                    console.log('📤 Sending DTO:', markDto);

                    // Don't use JSON.stringify here - API.request does it automatically
                    const response = await API.request('/Attendance/mark', {
                        method: 'POST',
                        body: markDto
                    });

                    if (response.success || response.message) {
                        successCount++;
                    } else {
                        errorCount++;
                        console.error('Failed to mark attendance:', response);
                    }
                } catch (error) {
                    errorCount++;
                    console.error('Error marking attendance:', error);
                }
            }

            if (successCount > 0 && errorCount === 0) {
                this.showToast('Success', `Successfully marked attendance for ${successCount} student(s)! Redirecting to dashboard...`, 'success');
                
                // Wait 2 seconds then redirect to dashboard with refresh
                setTimeout(() => {
                    window.location.href = 'instructor-dashboard.html?refresh=true#attendance';
                }, 2000);
            } else if (successCount > 0 && errorCount > 0) {
                this.showToast('Warning', `Marked ${successCount} attendance record(s). ${errorCount} already exist for this date.`, 'warning');
                
                // Still redirect after 3 seconds
                setTimeout(() => {
                    window.location.href = 'instructor-dashboard.html?refresh=true#attendance';
                }, 3000);
            } else if (errorCount > 0) {
                this.showToast('Error', `All ${errorCount} student(s) already have attendance marked for this date. Please choose a different date or check existing records.`, 'error');
            }

        } catch (error) {
            console.error('Error in bulk attendance:', error);
            this.showToast('Error', 'Failed to mark attendance: ' + error.message, 'error');
        }
    }

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

    async loadRecentActivity() {
        try {
            const instructorId = this.instructorId;
            
            if (!instructorId) {
                console.warn('⚠️ Instructor ID not available for recent activity');
                document.getElementById('recentActivityList').innerHTML = '<p class="text-muted text-center">Instructor ID not available</p>';
                return;
            }
            
            console.log('📱 Loading recent activity for instructor ID:', instructorId);

            // Get all courses for this instructor
            const coursesResponse = await API.request(`/Course/instructor/${instructorId}`, {
                method: 'GET'
            });

            if (!coursesResponse.success) {
                document.getElementById('recentActivityList').innerHTML = '<p class="text-muted text-center">No recent activity</p>';
                return;
            }

            let courses = coursesResponse.data?.data || coursesResponse.data?.Data || coursesResponse.data || [];
            if (!Array.isArray(courses)) {
                courses = [courses];
            }

            // Aggregate attendance from all courses
            let records = [];
            for (const course of courses) {
                const courseId = course.id || course.Id || course.courseId || course.CourseId;
                
                if (!courseId) {
                    // Try to get courseId by code
                    const courseCode = course.courseCode || course.CourseCode;
                    if (courseCode) {
                        try {
                            const detailsResponse = await API.request(`/Course/code/${courseCode}`, {
                                method: 'GET'
                            });
                            if (detailsResponse.success && detailsResponse.data?.data) {
                                const fullCourseId = detailsResponse.data.data.id || detailsResponse.data.data.Id;
                                if (fullCourseId) {
                                    const attendanceResponse = await API.request(`/Attendance/filter?courseId=${fullCourseId}`, {
                                        method: 'GET'
                                    });
                                    if (attendanceResponse.success) {
                                        let courseRecords = attendanceResponse.data?.data || attendanceResponse.data?.Data || attendanceResponse.data || [];
                                        if (!Array.isArray(courseRecords)) {
                                            courseRecords = [courseRecords];
                                        }
                                        records = records.concat(courseRecords);
                                    }
                                }
                            }
                        } catch (err) {
                            console.warn('Could not load attendance for course code:', courseCode);
                        }
                    }
                    continue;
                }
                
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
                const courseName = record.courseName || record.CourseName || 'Unknown Course';
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
                                <p class="mb-0 small text-muted">${courseName} - ${status} - ${date}</p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading recent activity:', error);
            document.getElementById('recentActivityList').innerHTML = '<p class="text-muted text-center">Error loading activity</p>';
        }
    }

    logout() {
        console.log('🔐 Logging out...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        window.location.href = '../index.html';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Mark Attendance Page...');
    window.markAttendancePage = new MarkAttendancePage();
});
