// =====================================================
// Instructor Dashboard Pagination Integration
// Applies pagination to exams table (10 records per page)
// =====================================================

// Initialize pagination manager for exams table
const instructorPaginationManagers = {
    exams: null
};

// Initialize pagination for exams table
function initExamsPagination() {
    instructorPaginationManagers.exams = createPagination({
        itemsPerPage: 10,
        onPageChange: (currentPage, totalPages) => {
            console.log(`📄 Exams page ${currentPage} of ${totalPages}`);
        },
        onDataChange: (pageData) => {
            renderExamsTable(pageData);
        }
    });
}

// ===== RENDER EXAMS TABLE =====
function renderExamsTable(exams) {
    const tbody = document.getElementById('examsTableBody');
    if (!tbody) return;

    if (!exams || exams.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="empty-state">
                        <i class="bi bi-inbox"></i>
                        <p>No exams created yet. Click "Create New Exam" to get started!</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Use instructorDashboard instance to access courses
    const instructorCourses = instructorDashboard?.instructorCourses || [];
    
    tbody.innerHTML = exams.map(exam => {
        const courseId = exam.CourseId || exam.courseId;
        const course = instructorCourses.find(c => {
            const cid = c.CourseId || c.courseId || c.id || c.Id;
            return cid && parseInt(cid, 10) === parseInt(courseId, 10);
        });
        
        const courseName = course 
            ? (course.CourseName || course.courseName || course.Name || course.name || 'Unknown')
            : (exam.CourseName || exam.courseName || 'Unknown Course');
        
        const courseCode = course 
            ? (course.CourseCode || course.courseCode || course.Code || course.code || '')
            : '';
        
        const displayCourseName = courseCode ? `${courseCode} - ${courseName}` : courseName;
        
        const title = exam.Title || exam.title || 'Untitled Exam';
        const duration = exam.Duration || exam.duration || 0;
        const totalPoints = exam.TotalPoints || exam.totalPoints || 0;
        const examId = exam.ExamId || exam.examId || exam.Id || exam.id;
        
        // Get questions from the exam object
        const questions = exam.Questions || exam.questions || exam.ExamQuestions || exam.examQuestions || [];
        const questionCount = questions.length || exam.QuestionCount || exam.questionCount || 0;
        
        // Get exam status - check IsDeleted property
        const isDeleted = exam.IsDeleted || exam.isDeleted || false;
        const statusBadge = isDeleted 
            ? '<span class="badge bg-danger"><i class="bi bi-lock-fill"></i> Closed</span>'
            : '<span class="badge bg-success"><i class="bi bi-check-circle-fill"></i> Active</span>';
        
        return `
            <tr>
                <td>
                    <div style="font-weight: 600; color: #4f46e5;">${displayCourseName}</div>
                </td>
                <td>
                    <div style="font-weight: 600; color: #1f2937;">${title}</div>
                    <small class="text-muted" style="font-size: 0.75rem;">ID: ${examId}</small>
                </td>
                <td>
                    <span class="exam-badge badge-duration">
                        <i class="bi bi-clock-fill"></i> ${duration} min
                    </span>
                </td>
                <td>
                    <span class="exam-badge badge-questions">
                        <i class="bi bi-question-circle-fill"></i> ${questionCount}
                    </span>
                </td>
                <td>
                    <strong class="text-primary" style="font-size: 1.1rem;">${totalPoints} pts</strong>
                </td>
                <td>
                    ${statusBadge}
                </td>
                <td>
                    <div class="action-btn-group">
                        <button class="action-btn btn-questions" 
                                onclick="instructorDashboard.manageQuestions(${examId}, ${courseId})" 
                                title="Manage Questions (Add/Delete)">
                            <i class="bi bi-question-circle-fill"></i>
                        </button>
                        <button class="action-btn btn-view" 
                                onclick="instructorDashboard.viewExamDetails(${examId}, ${courseId})" 
                                title="View Exam (Read-Only)">
                            <i class="bi bi-file-text-fill"></i>
                        </button>
                        <button class="action-btn btn-edit" 
                                onclick="instructorDashboard.editExam(${examId})" 
                                title="Edit Exam Details">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="action-btn btn-delete" 
                                onclick="instructorDashboard.closeExam(${examId})" 
                                title="Close Exam">
                            <i class="bi bi-lock-fill"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Helper function to create pagination instance
function createPagination(options) {
    return new PaginationManager(options);
}

// Initialize all paginations when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🎯 Initializing instructor pagination managers...');
        initExamsPagination();
    });
} else {
    console.log('🎯 Initializing instructor pagination managers...');
    initExamsPagination();
}
