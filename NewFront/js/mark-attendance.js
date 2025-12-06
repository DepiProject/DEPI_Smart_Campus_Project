// =====================================================
// Mark Attendance Page - Standalone Page
// Integrated with Smart Campus University API
// =====================================================

class MarkAttendancePage {
    constructor() {
        this.instructorId = null;
        this.selectedCourseForAttendance = null;
        this.instructorCourses = [];
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Mark Attendance Page...');
        
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        console.log('🔐 User Info:', userInfo);
        
        const userName = userInfo.FirstName || userInfo.firstName || 'Instructor';
        document.getElementById('userName').textContent = userName;
        
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
                
                await this.loadInstructorCourses();
            } else {
                console.error('❌ Failed to get instructor profile');
                this.showToast('Error', 'Failed to load instructor information', 'error');
            }
        } catch (error) {
            console.error('❌ Error loading instructor profile:', error);
            this.showToast('Error', 'Failed to initialize: ' + error.message, 'error');
        }
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('attendanceDate').value = today;
        
        this.loadRecentActivity();
        
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }
    
    async loadInstructorCourses() {
        console.log('📚 Loading instructor courses for caching...');
        
        try {
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

            this.instructorCourses = courses;
            console.log(`✅ Cached ${this.instructorCourses.length} courses`);
            
        } catch (error) {
            console.error('❌ Error loading courses:', error);
        }
    }

    async searchCourseForAttendance() {
        const searchInput = document.getElementById('courseSearchAttendance');
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (searchTerm.length < 2) {
            document.getElementById('attendanceStudentsBody').innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted p-4">
                        <i class="bi bi-search" style="font-size: 2rem; opacity: 0.3;"></i>
                        <p class="mt-2">Type at least 2 characters to search for a course</p>
                    </td>
                </tr>
            `;
            const markBtn = document.getElementById('markAttendanceBtn');
            if (markBtn) markBtn.classList.add('d-none');
            return;
        }

        try {
            console.log(`🔍 Searching courses with term: "${searchTerm}"`);
            
            if (this.instructorCourses.length === 0) {
                await this.loadInstructorCourses();
            }

            const matchedCourse = this.instructorCourses.find(course => {
                const code = (course.courseCode || course.CourseCode || '').toLowerCase();
                const name = (course.name || course.Name || course.courseName || course.CourseName || '').toLowerCase();
                return code.includes(searchTerm) || name.includes(searchTerm);
            });

            if (matchedCourse) {
                console.log('✅ Found matching course:', matchedCourse);
                this.selectedCourseForAttendance = matchedCourse;
                await this.loadStudentsForAttendance();
            } else {
                console.log('❌ No course found matching search term');
                document.getElementById('attendanceStudentsBody').innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted p-4">
                            <i class="bi bi-search" style="font-size: 2rem; opacity: 0.3;"></i>
                            <p class="mt-2">No courses found matching "${searchTerm}"</p>
                            <small class="text-muted">Try searching by course code or name</small>
                        </td>
                    </tr>
                `;
                const markBtn = document.getElementById('markAttendanceBtn');
                if (markBtn) markBtn.classList.add('d-none');
            }

        } catch (error) {
            console.error('❌ Error searching courses:', error);
            this.showToast('Error', 'Failed to search courses: ' + error.message, 'error');
        }
    }

    async loadStudentsForAttendance() {
        const course = this.selectedCourseForAttendance;
        if (!course) {
            console.error('❌ No course selected');
            return;
        }

        const courseCode = course.courseCode || course.CourseCode || '';
        const courseName = course.name || course.Name || course.courseName || course.CourseName || '';
        const selectedDate = document.getElementById('attendanceDate').value;

        if (!selectedDate) {
            this.showToast('Date Required', 'Please select a date to view students', 'warning');
            return;
        }
        
        // Validate date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        
        if (selected < today) {
            this.showToast(
                'Past Date Selected',
                'Warning: You have selected a past date. Attendance can only be marked for today or future dates.',
                'warning'
            );
        }

        console.log(`📋 Loading students for course: ${courseCode}`);

        try {
            console.log(`🔍 Fetching course details for code: ${courseCode}`);
            const courseDetailsResponse = await API.request(`/Course/code/${courseCode}`, {
                method: 'GET'
            });

            if (!courseDetailsResponse.success || !courseDetailsResponse.data?.data) {
                console.error('❌ Failed to load course details');
                this.showToast('Error', 'Failed to load course details', 'error');
                return;
            }

            const courseId = courseDetailsResponse.data.data.id || courseDetailsResponse.data.data.Id;
            console.log(`✅ Course ID resolved: ${courseId}`);

            console.log(`📚 Fetching enrollments for course ID: ${courseId}`);
            const enrollmentResponse = await API.request(`/Enrollment/course/${courseId}`, {
                method: 'GET'
            });

            if (!enrollmentResponse.success) {
                console.error('❌ Failed to load enrollments');
                this.showToast('Error', 'Failed to load students', 'error');
                return;
            }

            let enrollments = enrollmentResponse.data?.data || enrollmentResponse.data?.Data || enrollmentResponse.data || [];
            if (!Array.isArray(enrollments)) {
                enrollments = [enrollments];
            }

            enrollments = enrollments.filter(e => {
                if (!e) return false;
                const status = (e.status || e.Status || '').toString().trim().toLowerCase();
                return status === 'approved' || status === 'enrolled';
            });

            console.log(`✅ Found ${enrollments.length} enrolled students`);

            const tbody = document.getElementById('attendanceStudentsBody');
            const markBtn = document.getElementById('markAttendanceBtn');
            
            if (enrollments.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted p-4">
                            <i class="bi bi-inbox" style="font-size: 2rem; opacity: 0.3;"></i>
                            <p class="mt-2 mb-0">No enrolled students found in this course</p>
                            <small class="text-muted">Students must be approved/enrolled to appear here</small>
                        </td>
                    </tr>
                `;
                if (markBtn) markBtn.classList.add('d-none');
                return;
            }

            tbody.innerHTML = enrollments.map((enrollment, index) => {
                const studentName = enrollment.studentName || enrollment.StudentName || 'Unknown';
                const studentId = enrollment.studentId || enrollment.StudentId || '';
                
                return `
                    <tr data-student-id="${studentId}" data-student-name="${studentName}">
                        <td class="align-middle">
                            <i class="bi bi-person-fill text-primary me-1"></i>
                            <strong>${courseCode}</strong>
                        </td>
                        <td class="align-middle">${courseName}</td>
                        <td class="align-middle">
                            <i class="bi bi-person-fill text-info me-1"></i>
                            <strong>${studentName}</strong>
                        </td>
                        <td class="align-middle">
                            <i class="bi bi-calendar-event text-muted me-1"></i>
                            ${new Date(selectedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
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

            if (markBtn) markBtn.classList.remove('d-none');
            console.log('✅ Student table rendered successfully');

        } catch (error) {
            console.error('❌ Error loading students:', error);
            this.showToast('Error', 'Failed to load students: ' + error.message, 'error');
        }
    }

    async markBulkAttendance() {
        const selectedDate = document.getElementById('attendanceDate').value;

        if (!selectedDate) {
            this.showToast('Date Required', 'Please select a date to mark attendance', 'warning');
            return;
        }
        
        // Validate date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        
        if (selected < today) {
            this.showToast(
                'Past Date Not Allowed',
                'You cannot mark attendance for past dates. Please select today\'s date or a future date.',
                'warning'
            );
            return;
        }
        
        if (!this.selectedCourseForAttendance) {
            this.showToast('Course Required', 'Please search and select a course first', 'warning');
            return;
        }

        const selects = document.querySelectorAll('#attendanceStudentsBody .status-select');
        const attendanceData = [];
        let hasSelection = false;

        selects.forEach(select => {
            const status = select.value;
            if (status) {
                hasSelection = true;
                const studentId = parseInt(select.dataset.studentId);
                const courseId = parseInt(select.dataset.courseId);
                const row = select.closest('tr');
                const studentName = row?.dataset?.studentName || 'Unknown';
                
                attendanceData.push({
                    courseId: courseId,
                    studentId: studentId,
                    date: selectedDate,
                    status: status,
                    studentName: studentName
                });
            }
        });

        if (!hasSelection) {
            this.showToast('Warning', 'Please select at least one attendance status', 'warning');
            return;
        }

        const markBtn = document.getElementById('markAttendanceBtn');
        const originalBtnText = markBtn.innerHTML;
        
        try {
            markBtn.disabled = true;
            markBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Marking Attendance...';
            
            console.log(`📤 Marking attendance for ${attendanceData.length} student(s)`);

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const data of attendanceData) {
                try {
                    const markDto = {
                        StudentId: data.studentId,
                        CourseId: data.courseId,
                        Date: data.date + 'T00:00:00',
                        Status: data.status
                    };

                    console.log(`📤 Marking: ${data.studentName} - ${data.status}`);

                    const response = await API.request('/Attendance/mark', {
                        method: 'POST',
                        body: markDto
                    });

                    if (response.success || response.message) {
                        successCount++;
                        console.log(`✅ Success: ${data.studentName}`);
                    } else {
                        errorCount++;
                        let errorMsg = response.error || response.message || 'Unknown error';
                        
                        // Make error messages more user-friendly
                        if (errorMsg.includes('already marked') || errorMsg.includes('Attendance already marked')) {
                            errorMsg = 'Already marked for this date';
                        } else if (errorMsg.includes('future date')) {
                            errorMsg = 'Cannot mark for future dates';
                        } else if (errorMsg.includes('not enrolled') || errorMsg.includes('enrollment')) {
                            errorMsg = 'Not enrolled in this course';
                        }
                        
                        errors.push(`${data.studentName}: ${errorMsg}`);
                        console.error(`❌ Failed: ${data.studentName} - ${errorMsg}`);
                    }
                } catch (error) {
                    errorCount++;
                    let errorMsg = error.message;
                    
                    // Simplify technical errors
                    if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
                        errorMsg = 'Network connection error';
                    }
                    
                    errors.push(`${data.studentName}: ${errorMsg}`);
                    console.error(`❌ Exception: ${data.studentName}`, error);
                }
            }

            markBtn.disabled = false;
            markBtn.innerHTML = originalBtnText;

            if (successCount > 0 && errorCount === 0) {
                this.showToast(
                    '✓ Attendance Marked Successfully', 
                    `Attendance successfully recorded for ${successCount} student${successCount > 1 ? 's' : ''}. Returning to dashboard...`, 
                    'success'
                );
                await this.loadRecentActivity();
                setTimeout(() => {
                    window.location.href = 'instructor-dashboard.html?refresh=true#attendance';
                }, 2000);
            } else if (successCount > 0 && errorCount > 0) {
                const errorDetails = errors.slice(0, 3).join('<br>• ');
                const moreErrors = errors.length > 3 ? `<br>• ... and ${errors.length - 3} more error${errors.length - 3 > 1 ? 's' : ''}` : '';
                this.showToast(
                    'Partially Completed', 
                    `✓ ${successCount} student${successCount > 1 ? 's' : ''} marked successfully<br>✗ ${errorCount} student${errorCount > 1 ? 's' : ''} failed:<br><br>• ${errorDetails}${moreErrors}`, 
                    'warning'
                );
                await this.loadRecentActivity();
                setTimeout(() => {
                    window.location.href = 'instructor-dashboard.html?refresh=true#attendance';
                }, 4000);
            } else if (errorCount > 0) {
                const errorDetails = errors.slice(0, 5).join('<br>• ');
                const moreErrors = errors.length > 5 ? `<br>• ... and ${errors.length - 5} more` : '';
                
                let troubleshootingTips = '';
                const errorText = errors.join(' ').toLowerCase();
                
                if (errorText.includes('already marked')) {
                    troubleshootingTips = '<br><br>💡 <strong>Tip:</strong> Attendance has already been recorded for this date. To update, delete the existing record from the dashboard first.';
                } else if (errorText.includes('future date')) {
                    troubleshootingTips = '<br><br>💡 <strong>Tip:</strong> Select today\'s date or a past date to mark attendance.';
                } else if (errorText.includes('not enrolled')) {
                    troubleshootingTips = '<br><br>💡 <strong>Tip:</strong> Make sure students are enrolled in this course before marking attendance.';
                } else {
                    troubleshootingTips = '<br><br>💡 <strong>Tips:</strong><br>• Verify the date is correct<br>• Check student enrollment status<br>• Ensure attendance hasn\'t been marked already';
                }
                
                this.showToast(
                    'Attendance Marking Failed', 
                    `Unable to mark attendance for ${errorCount} student${errorCount > 1 ? 's' : ''}:<br><br>• ${errorDetails}${moreErrors}${troubleshootingTips}`, 
                    'error'
                );
            }

        } catch (error) {
            markBtn.disabled = false;
            markBtn.innerHTML = originalBtnText;
            console.error('❌ Error in bulk attendance:', error);
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
            
            const container = document.getElementById('recentActivityList');
            container.innerHTML = '<p class="text-muted text-center"><i class="bi bi-hourglass-split"></i> Loading...</p>';

            let courses = this.instructorCourses;
            if (courses.length === 0) {
                console.log('📚 Courses not cached, fetching...');
                const coursesResponse = await API.request(`/Course/instructor/${instructorId}`, {
                    method: 'GET'
                });

                if (!coursesResponse.success) {
                    container.innerHTML = '<p class="text-muted text-center">No recent activity</p>';
                    return;
                }

                courses = coursesResponse.data?.data || coursesResponse.data?.Data || coursesResponse.data || [];
                if (!Array.isArray(courses)) {
                    courses = [courses];
                }
            }

            console.log(`📚 Processing ${courses.length} courses for activity`);
            let records = [];
            
            for (const course of courses) {
                let courseId = course.id || course.Id || course.courseId || course.CourseId;
                const courseCode = course.courseCode || course.CourseCode;
                const courseName = course.name || course.Name || course.courseName || course.CourseName;
                
                if (!courseId && courseCode) {
                    try {
                        const detailsResponse = await API.request(`/Course/code/${courseCode}`);
                        if (detailsResponse.success && detailsResponse.data?.data) {
                            courseId = detailsResponse.data.data.id || detailsResponse.data.data.Id;
                            console.log(`✅ Resolved course ID ${courseId} for ${courseCode}`);
                        }
                    } catch (err) {
                        console.warn('Could not load course details for:', courseCode);
                    }
                }
                
                if (!courseId) {
                    console.warn(`⚠️ Skipping course - no ID: ${courseCode}`);
                    continue;
                }
                
                try {
                    const attendanceResponse = await API.request(`/Attendance/filter?courseId=${courseId}`);
                    if (attendanceResponse.success) {
                        let courseRecords = attendanceResponse.data?.data || attendanceResponse.data?.Data || attendanceResponse.data || [];
                        if (!Array.isArray(courseRecords)) {
                            courseRecords = [courseRecords];
                        }
                        courseRecords = courseRecords.filter(r => r && Object.keys(r).length > 0);
                        courseRecords = courseRecords.map(r => ({
                            ...r,
                            courseName: courseName,
                            courseCode: courseCode
                        }));
                        records = records.concat(courseRecords);
                        console.log(`✅ Added ${courseRecords.length} records from ${courseCode}`);
                    }
                } catch (err) {
                    console.warn('Could not load attendance for course:', courseId);
                }
            }

            records.sort((a, b) => new Date(b.date || b.Date) - new Date(a.date || a.Date));
            records = records.slice(0, 10);
            
            console.log(`📊 Displaying ${records.length} most recent records`);

            if (records.length === 0) {
                container.innerHTML = `
                    <p class="text-center text-muted p-3">
                        <i class="bi bi-inbox" style="font-size: 2rem; opacity: 0.3;"></i>
                        <br>No recent activity
                    </p>
                `;
                return;
            }

            container.innerHTML = records.map(record => {
                const studentName = record.studentName || record.StudentName || 'Unknown';
                const courseName = record.courseName || record.CourseName || 'Unknown Course';
                const courseCode = record.courseCode || record.CourseCode || '';
                const status = record.status || record.Status || '';
                const date = new Date(record.date || record.Date);
                const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                
                let icon = '';
                let badgeClass = '';
                let borderColor = '';
                switch (status.toLowerCase()) {
                    case 'present':
                        icon = 'check-circle-fill';
                        badgeClass = 'status-badge-present';
                        borderColor = '#476247';
                        break;
                    case 'absent':
                        icon = 'x-circle-fill';
                        badgeClass = 'status-badge-absent';
                        borderColor = '#e74c3c';
                        break;
                    case 'late':
                        icon = 'clock-fill';
                        badgeClass = 'status-badge-late';
                        borderColor = '#c9905e';
                        break;
                    case 'excused':
                        icon = 'info-circle-fill';
                        badgeClass = 'status-badge-present';
                        borderColor = '#6b8ba8';
                        break;
                }

                return `
                    <div class="recent-activity-item" style="border-left-color: ${borderColor};">
                        <div class="d-flex align-items-start gap-2">
                            <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: linear-gradient(135deg, ${borderColor}20 0%, ${borderColor}10 100%); flex-shrink: 0;">
                                <i class="bi bi-${icon}" style="color: ${borderColor}; font-size: 1.25rem;"></i>
                            </div>
                            <div class="flex-grow-1" style="min-width: 0;">
                                <p class="mb-2" style="font-weight: 600; color: #476247; margin: 0;"><strong>${studentName}</strong></p>
                                <p class="mb-1 small" style="color: #8b7d6f; margin: 0;">
                                    <i class="bi bi-book me-1"></i>${courseCode ? courseCode + ' - ' : ''}${courseName}
                                </p>
                                <div class="d-flex align-items-center gap-2 flex-wrap">
                                    <small style="color: #999;">
                                        <i class="bi bi-calendar3 me-1"></i>${formattedDate} ${formattedTime}
                                    </small>
                                    <span class="badge ${badgeClass} text-white" style="font-size: 0.75rem; padding: 0.35rem 0.6rem;">${status}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('❌ Error loading recent activity:', error);
            document.getElementById('recentActivityList').innerHTML = `
                <p class="text-center text-danger p-3">
                    <i class="bi bi-exclamation-triangle"></i>
                    <br>Error loading activity
                </p>
            `;
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
