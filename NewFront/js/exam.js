// =====================================================
// Exam Manager - Handles exam taking functionality
// =====================================================

class ExamManager {
    constructor() {
        this.examId = null;
        this.studentId = null;
        this.submissionId = null;
        this.examData = null;
        this.questions = [];
        this.answers = {};
        this.timerInterval = null;
        this.timeRemaining = 0; // in seconds
        this.examStarted = false;
        
        this.init();
    }

    // Initialize exam from URL parameter
    async init() {
        console.log('🎓 Initializing Exam Manager...');
        
        // Check authentication
        const token = localStorage.getItem('authToken');
        if (!token || API.isTokenExpired()) {
            window.location.href = '../index.html';
            return;
        }

        // Get exam ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.examId = urlParams.get('examId');

        if (!this.examId) {
            this.showToast('Error', 'No exam ID provided', 'error');
            setTimeout(() => window.location.href = 'student-dashboard.html', 2000);
            return;
        }

        // Get student ID from profile
        await this.loadStudentId();
        
        // Load exam information
        await this.loadExamInfo();
    }

    // Load student ID from profile
    async loadStudentId() {
        try {
            const response = await API.student.getMyProfile();
            if (response.success && response.data) {
                const profile = response.data.Data || response.data.data || response.data;
                this.studentId = profile.StudentId || profile.studentId;
                console.log('✅ Student ID loaded:', this.studentId);
            } else {
                throw new Error('Failed to load student profile');
            }
        } catch (error) {
            console.error('❌ Error loading student ID:', error);
            this.showToast('Error', 'Failed to load student information', 'error');
            setTimeout(() => window.location.href = 'student-dashboard.html', 2000);
        }
    }

    // Load exam information and display pre-exam screen
    async loadExamInfo() {
        try {
            console.log('📝 Loading exam info for ID:', this.examId);
            
            // First, get enrolled courses to find the course ID
            const enrollmentsResponse = await API.enrollment.getByStudentId(this.studentId);
            const enrollments = enrollmentsResponse.success && enrollmentsResponse.data ? 
                (enrollmentsResponse.data.Data || enrollmentsResponse.data.data || enrollmentsResponse.data || []) : [];
            
            // Get all exams and find the one with matching exam ID
            const examsResponse = await API.exam.getAll(1, 100);
            if (!examsResponse.success || !examsResponse.data) {
                throw new Error('Failed to load exams');
            }
            
            const allExams = examsResponse.data.Data || examsResponse.data.data || examsResponse.data || [];
            const exam = allExams.find(e => 
                (e.ExamId || e.examId || e.Id || e.id) == this.examId
            );
            
            if (!exam) {
                throw new Error('Exam not found');
            }
            
            const courseId = exam.CourseId || exam.courseId;
            
            // Now load full exam details with questions
            const response = await API.request(`/Exam/${this.examId}/course/${courseId}/with-questions`, {
                method: 'GET'
            });

            if (response.success && response.data) {
                this.examData = response.data.Data || response.data.data || response.data;
                this.questions = this.examData.Questions || this.examData.questions || [];
                
                console.log('✅ Exam data loaded:', this.examData);
                console.log('📋 Questions:', this.questions);
                
                this.displayPreExamInfo();
            } else {
                throw new Error(response.error || 'Failed to load exam');
            }
        } catch (error) {
            console.error('❌ Error loading exam info:', error);
            this.showToast('Error', error.message || 'Failed to load exam information', 'error');
            setTimeout(() => window.location.href = 'student-dashboard.html', 2000);
        }
    }

    // Display pre-exam information
    displayPreExamInfo() {
        document.getElementById('loadingSpinner').classList.add('d-none');
        document.getElementById('preExamInfo').classList.remove('d-none');

        const title = this.examData.Title || this.examData.title || 'Exam';
        const description = this.examData.Description || this.examData.description || '';
        const duration = this.examData.Duration || this.examData.duration || 0;
        const totalMarks = this.examData.TotalMarks || this.examData.totalMarks || 0;
        const passingScore = this.examData.PassingScore || this.examData.passingScore || 0;

        document.getElementById('examTitle').textContent = title;
        document.getElementById('examDescription').textContent = description;
        document.getElementById('examDuration').textContent = duration + ' minutes';
        document.getElementById('examQuestionCount').textContent = this.questions.length;
        document.getElementById('examTotalMarks').textContent = totalMarks;
        document.getElementById('examPassingScore').textContent = passingScore + '%';
    }

    // Start the exam
    async startExam() {
        try {
            console.log('▶️ Starting exam...');
            
            // Create submission
            const response = await API.submission.startExam(this.examId, this.studentId);
            
            if (response.success && response.data) {
                const submissionData = response.data.Data || response.data.data || response.data;
                this.submissionId = submissionData.SubmissionId || submissionData.submissionId || submissionData.Id || submissionData.id;
                
                console.log('✅ Submission created:', this.submissionId);
                
                // Hide pre-exam info, show exam content
                document.getElementById('preExamInfo').classList.add('d-none');
                document.getElementById('examContent').classList.remove('d-none');
                
                // Set exam title in header
                const title = this.examData.Title || this.examData.title || 'Exam';
                document.getElementById('examTitleHeader').textContent = title;
                
                // Render questions
                this.renderQuestions();
                
                // Start timer
                const duration = this.examData.Duration || this.examData.duration || 60;
                this.timeRemaining = duration * 60; // Convert to seconds
                this.startTimer();
                
                this.examStarted = true;
            } else {
                throw new Error(response.error || 'Failed to start exam');
            }
        } catch (error) {
            console.error('❌ Error starting exam:', error);
            this.showToast('Error', error.message || 'Failed to start exam', 'error');
        }
    }

    // Render questions
    renderQuestions() {
        const container = document.getElementById('questionsContainer');
        document.getElementById('totalQuestions').textContent = this.questions.length;
        
        container.innerHTML = this.questions.map((question, index) => {
            const questionId = question.QuestionId || question.questionId || question.Id || question.id;
            const questionText = question.QuestionText || question.questionText || question.Text || question.text;
            const marks = question.Marks || question.marks || 1;
            const options = question.Options || question.options || [];
            
            return `
                <div class="question-card" data-question-id="${questionId}">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5>Question ${index + 1}</h5>
                        <span class="badge bg-primary">${marks} mark${marks > 1 ? 's' : ''}</span>
                    </div>
                    <p class="lead mb-4">${questionText}</p>
                    
                    <div class="options">
                        ${options.map(option => {
                            const optionId = option.OptionId || option.optionId || option.Id || option.id;
                            const optionText = option.OptionText || option.optionText || option.Text || option.text;
                            
                            return `
                                <label class="option-label">
                                    <input type="radio" 
                                           name="question_${questionId}" 
                                           value="${optionId}"
                                           onchange="examManager.handleAnswerChange(${questionId}, ${optionId})">
                                    <span class="option-text ms-2">${optionText}</span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Handle answer change
    handleAnswerChange(questionId, optionId) {
        this.answers[questionId] = optionId;
        console.log('📝 Answer selected:', { questionId, optionId });
        
        this.updateProgress();
    }

    // Update progress
    updateProgress() {
        const answeredCount = Object.keys(this.answers).length;
        const totalQuestions = this.questions.length;
        const percentage = (answeredCount / totalQuestions * 100).toFixed(0);
        
        document.getElementById('answeredCount').textContent = answeredCount;
        document.getElementById('progressBar').style.width = percentage + '%';
        document.getElementById('progressBar').textContent = percentage + '%';
        document.getElementById('progressBar').setAttribute('aria-valuenow', percentage);
        
        // Enable submit button if all questions answered
        const submitBtn = document.getElementById('submitExamBtn');
        if (answeredCount === totalQuestions) {
            submitBtn.disabled = false;
            submitBtn.classList.add('pulse');
        } else {
            submitBtn.disabled = true;
            submitBtn.classList.remove('pulse');
        }
    }

    // Start countdown timer
    startTimer() {
        const updateTimer = () => {
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            
            const display = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
            document.getElementById('timer').textContent = display;
            
            // Warning when less than 2 minutes
            const timerBox = document.getElementById('timerBox');
            if (this.timeRemaining < 120) {
                timerBox.classList.add('timer-warning');
            }
            
            this.timeRemaining--;
            
            // Auto-submit when time expires
            if (this.timeRemaining < 0) {
                clearInterval(this.timerInterval);
                this.showToast('Time Up', 'Exam time has expired. Submitting automatically...', 'warning');
                setTimeout(() => this.submitExam(), 2000);
            }
        };
        
        updateTimer(); // Initial call
        this.timerInterval = setInterval(updateTimer, 1000);
    }

    // Submit exam
    async submitExam() {
        if (Object.keys(this.answers).length === 0) {
            this.showToast('Warning', 'Please answer at least one question before submitting', 'warning');
            return;
        }
        
        if (!confirm('Are you sure you want to submit the exam? This action cannot be undone.')) {
            return;
        }
        
        try {
            console.log('📤 Submitting exam...');
            
            // Stop timer
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            
            // Prepare submission data
            const submissionData = {
                SubmissionId: this.submissionId,
                Answers: Object.keys(this.answers).map(questionId => ({
                    QuestionId: parseInt(questionId),
                    OptionId: this.answers[questionId]
                }))
            };
            
            console.log('📦 Submission data:', submissionData);
            
            const response = await API.submission.submitExam(submissionData);
            
            if (response.success) {
                console.log('✅ Exam submitted successfully');
                this.showToast('Success', 'Exam submitted successfully!', 'success');
                
                // Get result
                await this.getResult();
            } else {
                throw new Error(response.error || 'Failed to submit exam');
            }
        } catch (error) {
            console.error('❌ Error submitting exam:', error);
            this.showToast('Error', error.message || 'Failed to submit exam', 'error');
        }
    }

    // Get and display result
    async getResult() {
        try {
            console.log('📊 Getting exam result...');
            
            const response = await API.submission.getResult(this.examId, this.studentId);
            
            if (response.success && response.data) {
                const result = response.data.Data || response.data.data || response.data;
                console.log('✅ Result:', result);
                
                this.displayResult(result);
            } else {
                // If result endpoint fails, show generic success message
                this.displayGenericResult();
            }
        } catch (error) {
            console.error('❌ Error getting result:', error);
            this.displayGenericResult();
        }
    }

    // Display result
    displayResult(result) {
        document.getElementById('examContent').classList.add('d-none');
        document.getElementById('resultDisplay').classList.remove('d-none');
        
        const score = result.Score || result.score || 0;
        const totalMarks = result.TotalMarks || result.totalMarks || this.examData.TotalMarks || 100;
        const percentage = (score / totalMarks * 100).toFixed(1);
        const passingScore = this.examData.PassingScore || this.examData.passingScore || 50;
        const passed = percentage >= passingScore;
        const correctAnswers = result.CorrectAnswers || result.correctAnswers || 0;
        
        // Update display
        document.getElementById('resultScore').textContent = percentage + '%';
        document.getElementById('correctAnswers').textContent = correctAnswers;
        document.getElementById('totalQuestionsResult').textContent = this.questions.length;
        
        if (passed) {
            document.getElementById('resultIcon').innerHTML = '<i class="bi bi-check-circle-fill text-success"></i>';
            document.getElementById('resultTitle').textContent = 'Congratulations! You Passed!';
            document.getElementById('resultTitle').className = 'text-success';
            document.getElementById('resultMessage').textContent = 'Great job! You have successfully passed this exam.';
        } else {
            document.getElementById('resultIcon').innerHTML = '<i class="bi bi-x-circle-fill text-danger"></i>';
            document.getElementById('resultTitle').textContent = 'Exam Not Passed';
            document.getElementById('resultTitle').className = 'text-danger';
            document.getElementById('resultMessage').textContent = 'Keep studying and try again next time.';
        }
    }

    // Display generic result (when detailed result is not available)
    displayGenericResult() {
        document.getElementById('examContent').classList.add('d-none');
        document.getElementById('resultDisplay').classList.remove('d-none');
        
        document.getElementById('resultIcon').innerHTML = '<i class="bi bi-check-circle-fill text-success"></i>';
        document.getElementById('resultTitle').textContent = 'Exam Submitted Successfully!';
        document.getElementById('resultScore').textContent = 'Submitted';
        document.getElementById('resultMessage').textContent = 'Your exam has been submitted. Results will be available soon.';
        document.getElementById('correctAnswers').textContent = '-';
        document.getElementById('totalQuestionsResult').textContent = this.questions.length;
    }

    // Leave exam with confirmation
    leaveExam() {
        if (confirm('Are you sure you want to leave the exam? Your progress will not be saved.')) {
            window.location.href = 'student-dashboard.html';
        }
    }

    // Show toast notification
    showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('alertContainer');
        
        const typeConfig = {
            success: { bg: 'bg-success', icon: 'bi-check-circle-fill', text: 'text-white' },
            error: { bg: 'bg-danger', icon: 'bi-exclamation-triangle-fill', text: 'text-white' },
            warning: { bg: 'bg-warning', icon: 'bi-exclamation-circle-fill', text: 'text-dark' },
            info: { bg: 'bg-info', icon: 'bi-info-circle-fill', text: 'text-white' }
        };
        
        const config = typeConfig[type] || typeConfig.info;
        const toastId = 'toast-' + Date.now();
        
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center ${config.bg} ${config.text} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi ${config.icon} me-2"></i>
                        <strong>${title}:</strong> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

// Initialize on page load
let examManager;
document.addEventListener('DOMContentLoaded', () => {
    examManager = new ExamManager();
});
