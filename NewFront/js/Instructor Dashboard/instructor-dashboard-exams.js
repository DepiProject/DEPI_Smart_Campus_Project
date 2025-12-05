// =====================================================
// Instructor Dashboard - Exams Module
// Exam creation and management for instructors
// =====================================================

// ===== EXAM MANAGEMENT =====
// InstructorDashboard.prototype.loadExams = async function() {
//     console.log('📝 Loading exams for instructor...');
    
//     const examsTableBody = document.getElementById('examsTableBody');
//     const examsSearchInput = document.getElementById('examsSearchInput');
    
//     try {
//         // Load all exams
//         const response = await API.exam.getAll(1, 100);
        
//         if (response.success && response.data) {
//             const allExams = response.data.Data || response.data.data || response.data || [];
//             console.log('✅ All exams loaded:', allExams);
            
//             // Filter exams for courses taught by this instructor
//             const instructorExams = allExams.filter(exam => {
//                 const courseMatch = this.instructorCourses.find(c => 
//                     c.CourseId === exam.CourseId || c.courseId === exam.courseId
//                 );
//                 return courseMatch !== undefined;
//             });
            
//             console.log('✅ Instructor exams filtered:', instructorExams);
            
//             // Store for search functionality
//             this.allExams = instructorExams;
            
//             // Render exams
//             this.renderExams(instructorExams);
            
//             // Update stats
//             this.updateExamStats(instructorExams);
            
//             // Setup search
//             if (examsSearchInput) {
//                 examsSearchInput.addEventListener('keyup', () => {
//                     this.searchExams(examsSearchInput.value);
//                 });
//             }
            
//             // Load courses for the create exam modal
//             console.log("Before calling loadCoursesForExamModal===================================================="); 
//             this.loadCoursesForExamModal();
//         } else {
//             console.error('❌ Failed to load exams:', response);
//             examsTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Failed to load exams</td></tr>';
//         }
//     } catch (error) {
//         console.error('❌ Error loading exams:', error);
//         examsTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading exams</td></tr>';
//     }
// };

InstructorDashboard.prototype.renderExams = function(exams) {
    const examsTableBody = document.getElementById('examsTableBody');
    
    if (!exams || exams.length === 0) {
        examsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p class="mt-2">No exams created yet. Click "Create New Exam" to get started!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    examsTableBody.innerHTML = exams.map(exam => {
        const courseId = exam.CourseId || exam.courseId;
        const course = this.instructorCourses.find(c => 
            c.CourseId === courseId || c.courseId === courseId
        );
        const courseName = course ? (course.CourseName || course.courseName || course.Name || course.name) : 'Unknown Course';
        const title = exam.Title || exam.title || 'Untitled Exam';
        const duration = exam.Duration || exam.duration || 0;
        const questionCount = exam.QuestionCount || exam.questionCount || 0;
        const submissionCount = exam.SubmissionCount || exam.submissionCount || 0;
        const avgScore = exam.AverageScore || exam.averageScore || 0;
        const examId = exam.ExamId || exam.examId || exam.Id || exam.id;
        
        return `
            <tr>
                <td>
                    <strong class="text-primary">${courseName}</strong>
                </td>
                <td>
                    <strong>${title}</strong>
                    <br>
                    <small class="text-muted">ID: ${examId}</small>
                </td>
                <td>
                    <span class="badge bg-info">
                        <i class="bi bi-clock"></i> ${duration} min
                    </span>
                </td>
                <td>
                    <span class="badge bg-secondary">
                        <i class="bi bi-question-circle"></i> ${questionCount}
                    </span>
                </td>
                <td>
                    <span class="badge ${submissionCount > 0 ? 'bg-success' : 'bg-secondary'}">
                        <i class="bi bi-people"></i> ${submissionCount}
                    </span>
                </td>
                <td>
                    <strong class="${avgScore >= 50 ? 'text-success' : 'text-danger'}">
                        ${avgScore.toFixed(1)}%
                    </strong>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="instructorDashboard.viewExamDetails(${examId}, ${courseId})" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="instructorDashboard.editExam(${examId})" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="instructorDashboard.deleteExam(${examId})" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

InstructorDashboard.prototype.updateExamStats = function(exams) {
    const totalExamsCount = document.getElementById('totalExamsCount');
    const totalSubmissionsCount = document.getElementById('totalSubmissionsCount');
    const averageExamScore = document.getElementById('averageExamScore');
    
    if (totalExamsCount) {
        totalExamsCount.textContent = exams.length;
    }
    
    if (exams.length > 0) {
        const totalSubmissions = exams.reduce((sum, exam) => 
            sum + (exam.SubmissionCount || exam.submissionCount || 0), 0
        );
        
        const avgScore = exams.reduce((sum, exam) => 
            sum + (exam.AverageScore || exam.averageScore || 0), 0
        ) / exams.length;
        
        if (totalSubmissionsCount) {
            totalSubmissionsCount.textContent = totalSubmissions;
        }
        
        if (averageExamScore) {
            averageExamScore.textContent = avgScore.toFixed(1) + '%';
        }
    } else {
        if (totalSubmissionsCount) totalSubmissionsCount.textContent = '0';
        if (averageExamScore) averageExamScore.textContent = '0%';
    }
};

InstructorDashboard.prototype.searchExams = function(searchTerm) {
    if (!this.allExams) return;
    
    const filtered = this.allExams.filter(exam => {
        const title = (exam.Title || exam.title || '').toLowerCase();
        const courseId = exam.CourseId || exam.courseId;
        const course = this.instructorCourses.find(c => 
            c.CourseId === courseId || c.courseId === courseId
        );
        const courseName = (course ? (course.CourseName || course.courseName || '') : '').toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return title.includes(search) || courseName.includes(search);
    });
    
    this.renderExams(filtered);
};


InstructorDashboard.prototype.loadCoursesForExamModal = function() {
    const examCourseSelect = document.getElementById('examCourseSelect');

    // Debug
    console.log("📚 Courses:============================================================================", this.instructorCourses);

    if (!examCourseSelect || !this.instructorCourses || this.instructorCourses.length === 0) {
        console.warn("⚠️ No courses found for instructor.");
        examCourseSelect.innerHTML = '<option value="">No courses found</option>';
        return;
    }

    examCourseSelect.innerHTML = `
        <option value="">Choose a course...</option>
        ${this.instructorCourses.map(course => {
            const courseId =
                course.id || course.CourseId || course.courseId;

            const courseName =
                course.name || course.CourseName || course.courseName || 'Unnamed';

            const courseCode =
                course.code || course.CourseCode || course.courseCode || '';

            return `<option value="${courseId}">${courseCode} - ${courseName}</option>`;
        }).join('')}
    `;
};


InstructorDashboard.prototype.createExam = async function() {
    const courseId = document.getElementById('examCourseSelect').value;
    const title = document.getElementById('examTitle').value;
    const duration = document.getElementById('examDuration').value;
    const description = document.getElementById('examDescription').value;
    const passingScore = document.getElementById('examPassingScore').value;
    const totalMarks = document.getElementById('examTotalMarks').value;
    
    // Validation
    if (!courseId || !title || !duration || !passingScore || !totalMarks) {
        this.showToast('Error', 'Please fill in all required fields', 'error');
        return;
    }
    
    if (parseInt(passingScore) < 0 || parseInt(passingScore) > 100) {
        this.showToast('Error', 'Passing score must be between 0 and 100', 'error');
        return;
    }
    
    try {
        console.log('📝 Creating exam...');
        
        const examData = {
            CourseId: parseInt(courseId),
            Title: title,
            Description: description || '',
            Duration: parseInt(duration),
            PassingScore: parseInt(passingScore),
            TotalMarks: parseInt(totalMarks)
        };
        
        const response = await API.exam.create(examData);
        
        if (response.success) {
            this.showToast('Success', 'Exam created successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('createExamModal'));
            if (modal) modal.hide();
            
            // Reset form
            document.getElementById('createExamForm').reset();
            
            // Reload exams
            await this.loadExams();
        } else {
            this.showToast('Error', response.error || response.message || 'Failed to create exam', 'error');
        }
    } catch (error) {
        console.error('❌ Error creating exam:', error);
        this.showToast('Error', 'Failed to create exam', 'error');
    }
};

InstructorDashboard.prototype.viewExamDetails = async function(examId, courseId) {
    try {
        console.log('👁 Viewing exam details:', examId, courseId);
        
        const response = await API.request(`/Exam/${examId}/course/${courseId}/with-questions`, {
            method: 'GET'
        });
        
        if (response.success && response.data) {
            const exam = response.data.Data || response.data.data || response.data;
            
            // Show exam details in a modal or alert
            const detailsHtml = `
                <h5>${exam.Title || exam.title}</h5>
                <p><strong>Course:</strong> ${exam.CourseName || 'N/A'}</p>
                <p><strong>Duration:</strong> ${exam.Duration || exam.duration} minutes</p>
                <p><strong>Total Marks:</strong> ${exam.TotalMarks || exam.totalMarks}</p>
                <p><strong>Passing Score:</strong> ${exam.PassingScore || exam.passingScore}%</p>
                <p><strong>Questions:</strong> ${(exam.Questions || exam.questions || []).length}</p>
                <p><strong>Description:</strong> ${exam.Description || exam.description || 'No description'}</p>
            `;
            
            // You can create a proper modal for this, for now using alert
            this.showToast('Exam Details', `Exam loaded successfully with ${(exam.Questions || exam.questions || []).length} questions`, 'info');
        } else {
            this.showToast('Error', 'Failed to load exam details', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading exam details:', error);
        this.showToast('Error', 'Failed to load exam details', 'error');
    }
};

InstructorDashboard.prototype.editExam = function(examId) {
    // TODO: Implement edit exam functionality
    this.showToast('Info', 'Edit exam feature coming soon!', 'info');
};

InstructorDashboard.prototype.deleteExam = async function(examId) {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
        return;
    }
    
    try {
        console.log('🗑 Deleting exam:', examId);
        
        const response = await API.exam.delete(examId);
        
        if (response.success) {
            this.showToast('Success', 'Exam deleted successfully!', 'success');
            
            // Reload exams
            await this.loadExams();
        } else {
            this.showToast('Error', response.error || response.message || 'Failed to delete exam', 'error');
        }
    } catch (error) {
        console.error('❌ Error deleting exam:', error);
        this.showToast('Error', 'Failed to delete exam', 'error');
    }
};






// ===== LOAD COURSES FOR EXAM CREATION - إضافة جديدة =====
InstructorDashboard.prototype.loadExamCoursesForModal = async function() {
    console.log('📚 Loading courses for exam creation modal...');
    
    const courseSelect = document.getElementById('examCourse') || document.getElementById('examCourseSelect');
    
    if (!courseSelect) {
        console.error('❌ Course dropdown not found in modal');
        return;
    }

    // Show loading state
    courseSelect.innerHTML = '<option value="">Loading your courses...</option>';
    courseSelect.disabled = true;

    try {
        // Get instructor ID
        let instructorId = this.currentInstructorId;
        
        // If not available, get from profile
        if (!instructorId) {
            const profileResponse = await API.instructor.getMyProfile();
            
            if (profileResponse.success && profileResponse.data) {
                const profile = profileResponse.data.data || profileResponse.data.Data || profileResponse.data;
                instructorId = profile.instructorId || profile.InstructorId || profile.id || profile.Id;
                this.currentInstructorId = instructorId;
            }
        }

        if (!instructorId) {
            console.error('❌ Could not get instructor ID');
            courseSelect.innerHTML = '<option value="">Error: Please login again</option>';
            courseSelect.disabled = true;
            return;
        }

        console.log('👨‍🏫 Fetching courses for instructor:', instructorId);

        // Fetch instructor courses from API
        const response = await API.request(`/Course/instructor/${instructorId}`, {
            method: 'GET'
        });

        console.log('📥 Courses API Response:', response);

        if (!response.success) {
            console.error('❌ Failed to load courses:', response.error);
            courseSelect.innerHTML = '<option value="">No courses assigned to you</option>';
            courseSelect.disabled = true;
            
            this.showToast('Error', 'Failed to load courses. Please try again.', 'error');
            return;
        }

        // Extract courses from response
        let courses = [];
        
        if (Array.isArray(response.data)) {
            courses = response.data;
        } else if (response.data) {
            courses = response.data.Data || 
                     response.data.data || 
                     response.data.items ||
                     [];
        }

        // Validate courses
        const validCourses = courses.filter(course => {
            const id = course.CourseId || course.courseId || course.id || course.Id;
            const name = course.CourseName || course.courseName || course.Name || course.name;
            return id && name;
        });

        console.log('✅ Valid courses found:', validCourses.length);

        if (validCourses.length === 0) {
            courseSelect.innerHTML = '<option value="">No courses assigned to you yet</option>';
            courseSelect.disabled = true;
            
            this.showToast('Info', 'No courses assigned. Contact admin to assign courses.', 'info');
            return;
        }

        // Cache courses for later use
        this.instructorCourses = validCourses;

        // Populate dropdown
        courseSelect.innerHTML = '<option value="">-- Select a Course --</option>';
        
        validCourses.forEach(course => {
            const courseId = course.CourseId || course.courseId || course.id || course.Id;
            const courseName = course.CourseName || course.courseName || course.Name || course.name;
            const courseCode = course.CourseCode || course.courseCode || course.Code || course.code || '';
            
            const displayText = courseCode 
                ? `${courseCode} - ${courseName}` 
                : courseName;
            
            const option = document.createElement('option');
            option.value = parseInt(courseId, 10);
            option.textContent = displayText;
            option.setAttribute('data-course-id', courseId);
            option.setAttribute('data-course-name', courseName);
            option.setAttribute('data-course-code', courseCode);
            
            courseSelect.appendChild(option);
            
            console.log(`✅ Added course: ${displayText} (ID: ${courseId})`);
        });

        courseSelect.disabled = false;
        
        console.log('✅ Courses dropdown populated successfully');
        this.showToast('Success', `Loaded ${validCourses.length} course(s)`, 'success');

    } catch (error) {
        console.error('❌ Error loading courses:', error);
        
        courseSelect.innerHTML = '<option value="">Error loading courses</option>';
        courseSelect.disabled = true;
        
        this.showToast('Error', 'Failed to load courses: ' + error.message, 'error');
    }
};


// ===== تحديث دالة LOAD EXAMS لتحميل الكورسات عند فتح المودال =====
// استبدل الدالة الموجودة بهذه النسخة المحدثة
// InstructorDashboard.prototype.loadExams = async function() {
//     console.log('📝 Loading exams for instructor...');
//     console.log('📌 Current Instructor ID:', this.currentInstructorId);
    
//     const examsTableBody = document.getElementById('examsTableBody');
//     const examsSearchInput = document.getElementById('examsSearchInput');
    
//     // ✨ NEW: Setup event listener for modal to load courses
//     const examModal = document.getElementById('examModal');
//     if (examModal && !examModal.hasAttribute('data-courses-listener')) {
//         examModal.setAttribute('data-courses-listener', 'true');
        
//         examModal.addEventListener('show.bs.modal', () => {
//             console.log('🔔 Modal opening - loading courses...');
//             this.loadExamCoursesForModal();
//         });
        
//         examModal.addEventListener('hidden.bs.modal', () => {
//             this.resetExamForm();
//         });
//     }
    
//     try {
//         if (!this.currentInstructorId) {
//             console.error('❌ Instructor ID is not available!');
//             if (examsTableBody) {
//                 examsTableBody.innerHTML = `
//                     <tr>
//                         <td colspan="7" class="text-center text-muted py-4">
//                             <i class="bi bi-hourglass-split" style="font-size: 3rem; opacity: 0.3;"></i>
//                             <p class="mt-2">Loading instructor information...</p>
//                         </td>
//                     </tr>
//                 `;
//             }
//             // Wait for instructor ID to be loaded
//             setTimeout(() => {
//                 if (this.currentInstructorId) {
//                     this.loadExams();
//                 }
//             }, 2000);
//             return;
//         }

//         // Get instructor's courses first
//         const coursesResponse = await API.request(`/Course/instructor/${this.currentInstructorId}`, {
//             method: 'GET'
//         });

//         if (!coursesResponse.success || !coursesResponse.data?.data) {
//             console.error('❌ Failed to load courses:', coursesResponse.error);
//             if (examsTableBody) {
//                 examsTableBody.innerHTML = `
//                     <tr>
//                         <td colspan="7" class="text-center text-muted py-4">
//                             <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
//                             <p class="mt-2">No courses assigned yet. Contact admin to assign courses.</p>
//                         </td>
//                     </tr>
//                 `;
//             }
//             return;
//         }

//         let courses = coursesResponse.data.data;
//         if (!Array.isArray(courses)) {
//             courses = [courses];
//         }

//         console.log('✅ Found', courses.length, 'courses for instructor');
        
//         // Store courses for later use
//         this.instructorCourses = courses;

//         // Get all exams
//         const response = await API.exam.getAll(1, 100);
        
//         if (response.success && response.data) {
//             const allExams = response.data.Data || response.data.data || response.data || [];
//             console.log('✅ All exams loaded:', allExams);
            
//             // Filter for instructor's courses
//             const instructorExams = allExams.filter(exam => {
//                 const examCourseId = exam.CourseId || exam.courseId;
//                 const courseMatch = courses.find(c => {
//                     const cid = c.CourseId || c.courseId || c.id || c.Id;
//                     return cid && parseInt(cid, 10) === parseInt(examCourseId, 10);
//                 });
//                 return courseMatch !== undefined;
//             });
            
//             console.log('✅ Instructor exams filtered:', instructorExams.length, 'exams');
            
//             this.allExams = instructorExams;
//             this.renderExams(instructorExams);
//             this.updateExamStats(instructorExams);
            
//             if (examsSearchInput) {
//                 examsSearchInput.addEventListener('keyup', () => {
//                     this.searchExams(examsSearchInput.value);
//                 });
//             }
//         } else {
//             console.error('❌ Failed to load exams:', response);
//             if (examsTableBody) {
//                 examsTableBody.innerHTML = `
//                     <tr>
//                         <td colspan="7" class="text-center text-muted py-4">
//                             <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
//                             <p class="mt-2">No exams found. Click "Create New Exam" to get started!</p>
//                         </td>
//                     </tr>
//                 `;
//             }
//         }
//     } catch (error) {
//         console.error('❌ Error loading exams:', error);
//         if (examsTableBody) {
//             examsTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading exams: ' + error.message + '</td></tr>';
//         }
//     }
// };



InstructorDashboard.prototype.loadExamCourses = async function() {
    console.log('🔵 [loadExamCourses] START');
    console.log('🔵 Current instructorCourses cache length:', (this.instructorCourses || []).length);

    // Try common selectors — if select is inside modal, try querying inside modal
    let courseSelect = document.getElementById('examCourse') || document.getElementById('examCourseSelect');

    if (!courseSelect) {
        // extra attempt: find the select inside the modal (if id isn't unique or element was moved)
        const modalEl = document.getElementById('examModal');
        if (modalEl) {
            courseSelect = modalEl.querySelector('#examCourse, #examCourseSelect');
        }
    }

    if (!courseSelect) {
        console.error('❌ No course select element found (tried #examCourse and #examCourseSelect).');
        return;
    }

    // UI: show loading and disable while populating
    courseSelect.innerHTML = '<option value="0">Loading courses...</option>';
    courseSelect.disabled = true;

    try {
        // Get instructor ID (robust)
        let instructorId = this.currentInstructorId || null;
        console.log('🔵 instructorId (initial):', instructorId);

        if (!instructorId) {
            const userInfoRaw = localStorage.getItem('userInfo');
            try {
                const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : {};
                instructorId = userInfo.InstructorId || userInfo.instructorId || userInfo.id || userInfo.Id || null;
                console.log('🔵 instructorId from localStorage:', instructorId);
            } catch (e) {
                console.warn('⚠️ Failed to parse userInfo from localStorage', e);
            }
        }

        if (!instructorId) {
            console.log('🔵 Fetching profile to get instructor ID...');
            const profileResponse = await API.instructor.getMyProfile();
            if (profileResponse && profileResponse.success && profileResponse.data) {
                const profile = profileResponse.data.data || profileResponse.data.Data || profileResponse.data;
                instructorId = profile?.instructorId || profile?.InstructorId || profile?.id || profile?.Id || null;
                this.currentInstructorId = instructorId;
                console.log('🔵 instructorId from profile:', instructorId);
            }
        }

        if (!instructorId) {
            console.error('❌ No instructor ID available');
            courseSelect.innerHTML = '<option value="0">Unable to load courses. Please login again.</option>';
            courseSelect.disabled = true;
            return;
        }

        // If we have cached courses use them (but ensure they are valid objects)
        if (Array.isArray(this.instructorCourses) && this.instructorCourses.length > 0) {
            console.log('✅ Using cached courses:', this.instructorCourses.length);
            populateFromArray(this.instructorCourses, courseSelect);
            courseSelect.disabled = false;
            console.log('✅ [loadExamCourses] SUCCESS (from cache) - Dropdown has', courseSelect.options.length, 'options');
            return;
        }

        // Fetch from API
        console.log('🔵 Fetching courses from API for instructor:', instructorId);
        const response = await API.request(`/Course/instructor/${instructorId}`, { method: 'GET' });
        console.log('🔵 API response:', response);

        if (!response || !response.success) {
            console.warn('⚠️ API did not succeed or returned no data:', response);
            courseSelect.innerHTML = '<option value="0">No courses assigned to you</option>';
            courseSelect.disabled = true;
            return;
        }

        // Extract possible array from many shapes
        let courses = [];
        if (Array.isArray(response.data)) {
            courses = response.data;
        } else if (response.data) {
            courses = response.data.data || response.data.Data || response.data.items || response.data.Items || [];
            if (!Array.isArray(courses) && typeof response.data === 'object') {
                // Single item wrapped
                courses = [response.data];
            }
        }

        console.log('🔵 Extracted courses (raw):', courses);

        // Validate and normalize
        const validCourses = courses.filter(c => {
            if (!c || typeof c !== 'object') return false;
            const id = c.CourseId || c.courseId || c.id || c.Id;
            const name = c.CourseName || c.courseName || c.Name || c.name;
            return id != null && name;
        }).map(c => {
            // normalize keys to avoid shape pain later
            return {
                raw: c,
                CourseId: c.CourseId || c.courseId || c.id || c.Id,
                CourseName: c.CourseName || c.courseName || c.Name || c.name,
                CourseCode: c.CourseCode || c.courseCode || c.Code || c.code || ''
            };
        });

        console.log('🔵 Valid courses count:', validCourses.length);

        this.instructorCourses = validCourses;

        if (validCourses.length === 0) {
            courseSelect.innerHTML = '<option value="0">No courses assigned to you</option>';
            courseSelect.disabled = true;
            console.warn('⚠️ No valid courses found after validation');
            return;
        }

        populateFromArray(validCourses, courseSelect);
        courseSelect.disabled = false;
        console.log('✅ [loadExamCourses] SUCCESS - Dropdown has', courseSelect.options.length, 'options');

    } catch (err) {
        console.error('❌ [loadExamCourses] Error:', err);
        courseSelect.innerHTML = '<option value="0">No courses found. Please contact admin.</option>';
        courseSelect.disabled = true;
        if (this.showToast) this.showToast('Error', 'Failed to load courses. Please try again.', 'error');
    }

    // helper to populate a select from array of normalized course objects
    function populateFromArray(arr, selectEl) {
        selectEl.innerHTML = '<option value="0">Select a Course</option>';
        arr.forEach((course, idx) => {
            const raw = course.raw || course;
            const courseId = (course.CourseId != null) ? course.CourseId : (raw.CourseId || raw.courseId || raw.id || raw.Id);
            const name = course.CourseName || raw.CourseName || raw.courseName || raw.Name || raw.name || 'Unnamed Course';
            const code = course.CourseCode || raw.CourseCode || raw.courseCode || raw.Code || raw.code || '';
            const label = code ? `${code} - ${name}` : name;

            // Ensure value is numeric string when possible, fallback to original string
            let idString = '0';
            const parsed = parseInt(String(courseId || '').trim(), 10);
            if (!isNaN(parsed) && parsed > 0) idString = String(parsed);
            else if (courseId != null) idString = String(courseId);

            const option = document.createElement('option');
            option.value = idString;
            option.setAttribute('data-course-id', idString);
            option.textContent = label;
            selectEl.appendChild(option);

            console.log(`✅ Added course option [${idx}]:`, { courseId, idString, label });
        });
    }
};




//gather data function 
InstructorDashboard.prototype.gatherExamData = function() {
    const title = document.getElementById('examTitle')?.value.trim() || '';
    const courseSelect = document.getElementById('examCourse') || document.getElementById('examCourseSelect');

    let courseId = 0;
    if (courseSelect) {
        const rawValue = (courseSelect.value || '').toString().trim();
        console.log('🔍 Raw courseSelect.value:', rawValue);
        // Treat '0' or '' as no selection
        if (rawValue && rawValue !== '0') {
            const parsed = parseInt(rawValue, 10);
            if (!isNaN(parsed) && parsed > 0) {
                courseId = parsed;
            } else {
                // fallback to selected option's data attribute or dataset
                const selectedOption = courseSelect.options[courseSelect.selectedIndex] || null;
                const dataCourseId = selectedOption?.getAttribute('data-course-id') || selectedOption?.dataset?.courseId || '';
                const dataParsed = parseInt(String(dataCourseId || '').trim(), 10);
                if (!isNaN(dataParsed) && dataParsed > 0) courseId = dataParsed;
                else {
                    // try parsing any numeric substring inside value
                    const numericMatch = (rawValue.match(/-?\d+/) || [null])[0];
                    if (numericMatch) {
                        const nm = parseInt(numericMatch, 10);
                        if (!isNaN(nm) && nm > 0) courseId = nm;
                    }
                }
            }
        } else if (courseSelect.selectedIndex > 0) {
            // final fallback: selected option attribute
            const selectedOption = courseSelect.options[courseSelect.selectedIndex];
            const dataCourseId = selectedOption?.getAttribute('data-course-id') || selectedOption?.dataset?.courseId || selectedOption?.value;
            const parsed = parseInt(String(dataCourseId || '').trim(), 10);
            if (!isNaN(parsed) && parsed > 0) courseId = parsed;
        }
    }

    console.log('🔍 Course Select Debug:', {
        elementPresent: !!courseSelect,
        rawValue: courseSelect?.value,
        selectedIndex: courseSelect?.selectedIndex,
        computedCourseId: courseId
    });

    const duration = parseInt(document.getElementById('examDuration')?.value || 0, 10);
    const totalMarks = parseInt(document.getElementById('examTotalMarks')?.value || 0, 10);
    const passingScore = parseInt(document.getElementById('examPassingScore')?.value || 0, 10);
    const description = document.getElementById('examDescription')?.value.trim() || '';

    // questions gathering unchanged except logging
    const questions = [];
    const container = document.getElementById('questionsContainer');
    if (container) {
        const qcards = container.querySelectorAll('.question-card');
        qcards.forEach(card => {
            const qid = card.getAttribute('data-qid');
            const qtext = (card.querySelector('.question-text')?.value || '').trim();
            const options = [];
            const optionItems = card.querySelectorAll('.option-item');
            optionItems.forEach(opt => {
                const optText = (opt.querySelector('.option-text')?.value || '').trim();
                const radio = opt.querySelector(`input[type="radio"][name="correct_${qid}"]`);
                const isCorrect = !!(radio && radio.checked);
                if (optText.length > 0) options.push({ text: optText, isCorrect });
            });
            if (qtext && options.length > 0) questions.push({ text: qtext, options });
        });
    }

    const data = {
        title,
        courseId,
        durationMinutes: duration,
        totalMarks,
        passingScore,
        description,
        questions
    };

    console.log('✅ Final gathered exam data:', data);
    return data;
};

