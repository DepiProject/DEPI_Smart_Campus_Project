// =====================================================
// Instructor Dashboard - Courses & Students Module
// Handles course management, students, exams, and enrollments
// =====================================================

// Ensure InstructorDashboard is defined before adding methods
if (typeof InstructorDashboard === 'undefined') {
    console.error('❌ InstructorDashboard class not found! Make sure instructor-dashboard-main.js is loaded first.');
}

// ===== COURSES SECTION =====
InstructorDashboard.prototype.loadCourses = async function() {
    console.log('📚 Loading instructor courses...');
    console.log('📌 Current Instructor ID:', this.currentInstructorId);

    try {
        if (!this.currentInstructorId) {
            console.error('❌ Instructor ID is not set!');
            this.showToast('Error', 'Instructor ID is not available. Please refresh and login again.', 'error');
            return;
        }

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

        if (response.success && response.data) {
            // Handle both Data and data properties
            const courses = response.data.Data || response.data.data || response.data;
            
            if (!Array.isArray(courses)) {
                console.error('❌ Expected array but got:', typeof courses);
                coursesList.innerHTML = '<div class="col-12"><div class="alert alert-danger">Invalid response format</div></div>';
                return;
            }
            
            console.log('✅ Found', courses.length, 'courses');

            if (courses.length === 0) {
                coursesList.innerHTML = '<div class="col-12"><div class="alert alert-info">No courses assigned yet</div></div>';
                return;
            }

            this.allCoursesData = courses;
            
            coursesList.innerHTML = courses.map((course, index) => {
                const courseCode = course.courseCode || course.CourseCode;
                const courseName = course.courseName || course.name;
                const credits = course.creditHours || course.credits || course.Credits || 3;
                const department = course.departmentName || course.DepartmentName || 'N/A';
                
                // Get first letters of course name (up to 2 characters)
                const courseInitials = courseName
                    .split(' ')
                    .slice(0, 2)
                    .map(word => word[0])
                    .join('')
                    .toUpperCase();
                
                // Color palette matching dashboard theme
                const colors = [
                    { bg: 'linear-gradient(135deg, #476247 0%, #3a4f3a 100%)', hex: '#476247' }, // Sage
                    { bg: 'linear-gradient(135deg, #8b7d6f 0%, #6d6156 100%)', hex: '#8b7d6f' }, // Warm
                    { bg: 'linear-gradient(135deg, #c9905e 0%, #a87c51 100%)', hex: '#c9905e' }, // Beige
                    { bg: 'linear-gradient(135deg, #6b8ba8 0%, #567291 100%)', hex: '#6b8ba8' }  // Cream
                ];
                
                const colorIndex = index % colors.length;
                const colorPalette = colors[colorIndex];
                
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
                                             style="width: 48px; height: 48px; background: ${colorPalette.bg}; margin-right: 1rem; font-weight: 700; font-size: 1.2rem; color: white;">
                                            ${courseInitials}
                                        </div>
                                        <div>
                                            <h5 class="card-title mb-0" style="font-weight: 700; font-size: 1.25rem; color: #1f2937;">${courseName}</h5>
                                            <span class="badge" style="background: ${colorPalette.hex}; font-size: 0.7rem; margin-top: 0.25rem; color: white;">ACTIVE</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex align-items-center mb-2">
                                    <i class="bi bi-code-square me-2" style="font-size: 1.1rem; color: ${colorPalette.hex};"></i>
                                    <span style="font-weight: 600; color: ${colorPalette.hex}; font-size: 1rem;">${courseCode}</span>
                                </div>
                                <div class="d-flex align-items-center mb-2">
                                    <i class="bi bi-award me-2" style="font-size: 1.1rem; color: #c9905e;"></i>
                                    <span class="text-muted" style="font-size: 0.95rem;">${credits} Credit Hours</span>
                                </div>
                                <div class="d-flex align-items-center">
                                    <i class="bi bi-building me-2" style="font-size: 1.1rem; color: #6b8ba8;"></i>
                                    <span class="text-muted" style="font-size: 0.95rem;">${department}</span>
                                </div>
                            </div>
                            <hr style="margin: 1.5rem 0; border-color: #e5e7eb;">
                            <button class="btn w-100" 
                                onclick="instructorDashboard.viewCourseDetailsPage('${courseCode}')"
                                style="background: ${colorPalette.bg}; color: white; border: none; padding: 0.75rem; border-radius: 10px; font-weight: 600; transition: all 0.3s ease;"
                                onmouseover="this.style.opacity='0.9'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.2)'"
                                onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
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
};

InstructorDashboard.prototype.viewCourseDetailsPage = function(courseCode) {
    console.log('🔗 Navigating to course details page:', courseCode);
    window.location.href = `course-details.html?code=${courseCode}`;
};

InstructorDashboard.prototype.filterCourses = function() {
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
};

// ===== STUDENTS SECTION =====
InstructorDashboard.prototype.loadStudents = async function() {
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

        let allStudents = [];
        for (const course of courses) {
            try {
                const courseId = course.courseId || course.id;
                console.log('📚 Fetching enrollments for course:', courseId);
                
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
};

InstructorDashboard.prototype.viewStudentDetails = async function(studentId) {
    console.log('👁️ Viewing student details:', studentId);
    
    try {
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
};

// ===== EXAMS SECTION =====
InstructorDashboard.prototype.loadExams = async function() {
    console.log('📝 Loading exams...');

    try {
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

            for (const course of courses) {
                try {
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

            examsTableBody.innerHTML = await Promise.all(allExams.map(async (exam) => {
                try {
                    const submissionsResponse = await API.request(`/Submission/exam/${exam.examId || exam.id}`, {
                        method: 'GET'
                    });

                    let submissions = 0;
                    let avgScore = '-';

                    if (submissionsResponse.success && submissionsResponse.data?.data) {
                        const submissionsList = submissionsResponse.data.data;
                        submissions = submissionsList.length;
                        
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
};

// ===== ENROLLMENTS SECTION =====
InstructorDashboard.prototype.loadCourseFilterForEnrollments = async function() {
    console.log('📋 Loading instructor courses for enrollment filter...');
    const select = document.getElementById('courseFilter');

    if (!this.currentInstructorId) {
        console.warn('⚠️ Instructor ID not available');
        select.innerHTML = '<option value="">Instructor ID not found</option>';
        return;
    }

    try {
        const coursesResponse = await API.course.getAll(1, 100);
        
        if (coursesResponse.success && coursesResponse.data) {
            const allCourses = coursesResponse.data.Data || coursesResponse.data.data || coursesResponse.data;
            
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
};

InstructorDashboard.prototype.filterEnrollments = async function() {
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

            container.classList.remove('d-none');
            courseNameSpan.textContent = courseName;
            countBadge.textContent = `${enrollments.length} students`;

            if (enrollments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No students enrolled in this course</td></tr>';
                return;
            }

            // Log first enrollment to debug
            if (enrollments.length > 0) {
                console.log('📋 First enrollment data:', enrollments[0]);
            }

            tbody.innerHTML = enrollments.map((enroll, index) => {
                // Log every enrollment to check email property
                if (index === 0) {
                    console.log('🔍 Enrollment properties:', Object.keys(enroll));
                    console.log('📧 StudentEmail:', enroll.StudentEmail);
                    console.log('📧 studentEmail:', enroll.studentEmail);
                }

                const studentCode = enroll.studentCode || enroll.StudentCode || 'N/A';
                const studentName = enroll.studentName || enroll.StudentName || 'N/A';
                const studentEmail = enroll.studentEmail || enroll.StudentEmail || 'No email';
                const credits = enroll.creditHours || enroll.CreditHours || 'N/A';
                const status = enroll.status || enroll.Status || 'Enrolled';
                const finalGrade = enroll.finalGrade || enroll.FinalGrade;
                const gradeLetter = enroll.gradeLetter || enroll.GradeLetter;
                const enrollDate = enroll.enrollmentDate || enroll.EnrollmentDate;
                
                const statusBadge = status === 'Enrolled' || status === 'Approved' ? 'bg-success' : 
                                   status === 'Completed' ? 'bg-primary' : 
                                   status === 'Pending' ? 'bg-warning' : 'bg-secondary';
                const gradeDisplay = finalGrade && finalGrade > 0 ? 
                    `${finalGrade.toFixed(1)}% ${gradeLetter ? '(' + gradeLetter + ')' : ''}` : 'Not graded yet';
                const dateDisplay = enrollDate ? new Date(enrollDate).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                }) : 'No date';
                
                return `
                <tr style="transition: background-color 0.2s ease;">
                    <td><strong>${studentCode}</strong></td>
                    <td>${studentName}</td>
                    <td>${studentEmail}</td>
                    <td>${credits}</td>
                    <td><span class="badge ${statusBadge}">${status}</span></td>
                    <td>${gradeDisplay}</td>
                    <td>${dateDisplay}</td>
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
};