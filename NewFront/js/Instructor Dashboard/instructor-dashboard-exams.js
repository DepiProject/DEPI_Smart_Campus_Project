// =====================================================
// Instructor Dashboard - Exams Module
// Exam creation and management for instructors
// =====================================================

// ===== EXAM MANAGEMENT =====
InstructorDashboard.prototype.loadExams = async function() {
    console.log('📝 Loading exams for instructor...');
    
    const examsTableBody = document.getElementById('examsTableBody');
    const examsSearchInput = document.getElementById('examsSearchInput');
    
    try {
        // Load all exams
        const response = await API.exam.getAll(1, 100);
        
        if (response.success && response.data) {
            const allExams = response.data.Data || response.data.data || response.data || [];
            console.log('✅ All exams loaded:', allExams);
            
            // Filter exams for courses taught by this instructor
            const instructorExams = allExams.filter(exam => {
                const courseMatch = this.instructorCourses.find(c => 
                    c.CourseId === exam.CourseId || c.courseId === exam.courseId
                );
                return courseMatch !== undefined;
            });
            
            console.log('✅ Instructor exams filtered:', instructorExams);
            
            // Store for search functionality
            this.allExams = instructorExams;
            
            // Render exams
            this.renderExams(instructorExams);
            
            // Update stats
            this.updateExamStats(instructorExams);
            
            // Setup search
            if (examsSearchInput) {
                examsSearchInput.addEventListener('keyup', () => {
                    this.searchExams(examsSearchInput.value);
                });
            }
            
            // Load courses for the create exam modal
            this.loadCoursesForExamModal();
        } else {
            console.error('❌ Failed to load exams:', response);
            examsTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Failed to load exams</td></tr>';
        }
    } catch (error) {
        console.error('❌ Error loading exams:', error);
        examsTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading exams</td></tr>';
    }
};

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
    
    if (!examCourseSelect || !this.instructorCourses) return;
    
    examCourseSelect.innerHTML = '<option value="">Choose a course...</option>' + 
        this.instructorCourses.map(course => {
            const courseId = course.CourseId || course.courseId;
            const courseName = course.CourseName || course.courseName || course.Name || course.name;
            const courseCode = course.CourseCode || course.courseCode || '';
            
            return `<option value="${courseId}">${courseCode} - ${courseName}</option>`;
        }).join('');
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
