// =====================================================
// Exam Taking Handler - Modern Version
// Integrated with Smart Campus University API
// =====================================================

class ExamManager {
    constructor() {
        this.examId = null;
        this.submissionId = null;
        this.examData = null;
        this.remainingSeconds = 0;
        this.timerInterval = null;
        this.studentId = null;
        this.answered = 0;
        
        this.init();
    }

    init() {
        console.log('🎓 Initializing Exam Manager...');
        
        // Get examId from URL
        this.examId = this.getQueryParam('examId');
        
        if (!this.examId) {
            this.showError('No exam ID provided in URL');
            return;
        }

        // Get elements
        this.elements = {
            startBtn: document.getElementById('start-btn'),
            timer: document.getElementById('timer'),
            timerCard: document.getElementById('timer-card'),
            questionsForm: document.getElementById('questions-form'),
            questionsContainer: document.getElementById('questions-container'),
            submitBtn: document.getElementById('submit-btn'),
            tempSubmitBtn: document.getElementById('temp-submit-btn'),
            cancelBtn: document.getElementById('cancel-btn'),
            examTitle: document.getElementById('exam-title'),
            examSubtitle: document.getElementById('exam-subtitle'),
            resultContainer: document.getElementById('result-container'),
            scoreEl: document.getElementById('score'),
            metaEl: document.getElementById('meta'),
            resultIcon: document.getElementById('result-icon'),
            resultJson: document.getElementById('result-json'),
            infoBanner: document.getElementById('exam-info-banner'),
            durationInfo: document.getElementById('exam-duration-info'),
            questionsCount: document.getElementById('exam-questions-count'),
            passingScore: document.getElementById('exam-passing-score'),
            progressIndicator: document.getElementById('progress-indicator'),
            answeredCount: document.getElementById('answered-count'),
            totalQuestions: document.getElementById('total-questions'),
            progressPercentage: document.getElementById('progress-percentage'),
            loadingState: document.getElementById('loading-state')
        };

        this.initializeEventListeners();
        this.loadExamInfo();
    }

    initializeEventListeners() {
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => this.startExam());
        }

        if (this.elements.submitBtn) {
            this.elements.submitBtn.addEventListener('click', (e) => {
                console.log('🔘 Submit button clicked!', e);
                this.submitExam();
            });
        }

        // Add temp submit button for testing
        if (this.elements.tempSubmitBtn) {
            this.elements.tempSubmitBtn.addEventListener('click', (e) => {
                console.log('🔘 Temp Submit button clicked!', e);
                this.submitExam();
            });
        }

        if (this.elements.cancelBtn) {
            this.elements.cancelBtn.addEventListener('click', () => this.cancelExam());
        }

        // Track answers for progress
        if (this.elements.questionsForm) {
            this.elements.questionsForm.addEventListener('change', () => this.updateProgress());
        }
    }

    getQueryParam(key) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(key);
    }

    async getCurrentStudent() {
        try {
            // Get student profile to get actual student ID
            const profileResponse = await API.student.getMyProfile();
            
            if (profileResponse.success && profileResponse.data) {
                const profile = profileResponse.data.Data || 
                               profileResponse.data.data || 
                               profileResponse.data;
                
                this.studentId = profile.StudentId || profile.studentId;
                console.log('✅ Student ID loaded:', this.studentId);
                return this.studentId;
            }
        } catch (error) {
            console.error('❌ Error getting student ID:', error);
        }
        return null;
    }

    async loadExamInfo() {
        console.log('📚 Loading exam information...');
        
        try {
            // Get student enrollments to find course ID for this exam
            await this.getCurrentStudent();
            
            if (!this.studentId) {
                this.showError('Unable to identify student. Please log in again.');
                return;
            }

            // First, get the exam basic info to find its course
            const examResponse = await API.exam.getAll(1, 100);
            
            if (!examResponse.success || !examResponse.data) {
                throw new Error('Failed to fetch exam data');
            }

            const allExams = examResponse.data.Data || examResponse.data.data || examResponse.data || [];
            const exam = allExams.find(e => (e.ExamId || e.examId || e.Id || e.id) == this.examId);
            
            if (!exam) {
                this.showError('Exam not found');
                return;
            }

            const courseId = exam.CourseId || exam.courseId;
            console.log('✅ Found exam:', exam, 'CourseId:', courseId);
            
            // Check if there's an existing submission (in case of page refresh after submission)
            console.log('🔍 Checking for existing submission...');
            const statusResponse = await API.submission.getStatus(this.examId, this.studentId);
            
            if (statusResponse.success && statusResponse.data) {
                const status = statusResponse.data.Data || statusResponse.data.data || statusResponse.data;
                
                // If submission already exists and is completed, show the result directly
                if (status.isCompleted || status.IsCompleted) {
                    console.log('✅ Found completed submission. Showing result...');
                    
                    // Update UI with exam info first
                    if (this.elements.examTitle) {
                        this.elements.examTitle.textContent = exam.Title || exam.title || 'Exam';
                    }
                    
                    // Hide loading
                    if (this.elements.loadingState) {
                        this.elements.loadingState.style.display = 'none';
                    }
                    
                    // Fetch and show the result
                    await this.showResult();
                    return;
                }
            }
            
            // Verify student is enrolled in this course
            const enrollmentResponse = await API.enrollment.getByStudentId(this.studentId);
            const enrollments = enrollmentResponse.success && enrollmentResponse.data ?
                (enrollmentResponse.data.Data || enrollmentResponse.data.data || enrollmentResponse.data || []) : [];
            
            const isEnrolled = enrollments.some(e => (e.CourseId || e.courseId) === courseId);
            
            if (!isEnrolled) {
                this.showError('You are not enrolled in this course');
                return;
            }

            // Get exam with questions
            const examWithQuestionsResponse = await API.exam.getQuestions(this.examId, courseId);
            
            if (examWithQuestionsResponse.success && examWithQuestionsResponse.data) {
                const examData = examWithQuestionsResponse.data.Data || examWithQuestionsResponse.data.data || examWithQuestionsResponse.data;
                
                console.log('✅ Exam with questions loaded:', examData);
                
                // Update UI with exam info
                if (this.elements.examTitle) {
                    this.elements.examTitle.textContent = examData.Title || examData.title || exam.Title || exam.title || 'Exam';
                }
                
                if (this.elements.examSubtitle) {
                    this.elements.examSubtitle.textContent = examData.Description || examData.description || exam.Description || exam.description || 'Prepare to demonstrate your knowledge';
                }
                
                if (this.elements.durationInfo) {
                    const duration = examData.Duration || examData.duration || exam.Duration || exam.duration || 0;
                    this.elements.durationInfo.textContent = `${duration} minutes`;
                }
                
                if (this.elements.questionsCount) {
                    const questions = examData.Questions || examData.questions || [];
                    this.elements.questionsCount.textContent = questions.length;
                }
                
                if (this.elements.passingScore) {
                    const passing = examData.PassingScore || examData.passingScore || exam.PassingScore || exam.passingScore || 60;
                    this.elements.passingScore.textContent = `${passing}%`;
                }
                
                // Hide loading, automatically start exam
                if (this.elements.loadingState) {
                    this.elements.loadingState.style.display = 'none';
                }
                
                // Automatically start the exam
                console.log('🚀 Auto-starting exam...');
                await this.startExam();
            } else {
                throw new Error('Failed to load exam questions');
            }
        } catch (error) {
            console.error('❌ Error loading exam info:', error);
            this.showError('Failed to load exam information: ' + error.message);
        }
    }

    async startExam() {
        console.log('🚀 Starting exam...');
        
        if (!this.examId) {
            notifications.error('Error', 'No exam ID provided');
            return;
        }

        // Get student ID first
        await this.getCurrentStudent();
        
        if (!this.studentId) {
            notifications.error('Error', 'Could not identify student. Please log in again.');
            return;
        }

        // Disable start button and show loading
        if (this.elements.startBtn) {
            this.elements.startBtn.disabled = true;
            this.elements.startBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Starting...';
        }

        try {
            // Get exam details first to find course ID
            const examResponse = await API.exam.getAll(1, 100);
            const allExams = examResponse.data.Data || examResponse.data.data || examResponse.data || [];
            const examBasic = allExams.find(e => (e.ExamId || e.examId || e.Id || e.id) == this.examId);
            
            if (!examBasic) {
                throw new Error('Exam not found');
            }

            const courseId = examBasic.CourseId || examBasic.courseId;
            
            // Get exam with questions from database
            const examWithQuestionsResponse = await API.exam.getQuestions(this.examId, courseId);
            
            if (!examWithQuestionsResponse.success || !examWithQuestionsResponse.data) {
                throw new Error('Failed to load exam questions');
            }

            const examData = examWithQuestionsResponse.data.Data || examWithQuestionsResponse.data.data || examWithQuestionsResponse.data;
            this.examData = examData;
            // Store exam ID properly for later use
            this.examData.id = this.examData.id || this.examData.Id || this.examId;
            
            console.log('✅ Exam data loaded from database:', this.examData);
            
            // Start submission tracking
            const payload = {
                examId: parseInt(this.examId, 10),
                studentId: parseInt(this.studentId, 10)
            };
            
            console.log('📤 Starting exam submission with payload:', payload);
            
            const response = await API.submission.startExam(this.examId, this.studentId);
            console.log('📊 Start exam response:', response);
            
            if (response.success && response.data) {
                const data = response.data.Data || response.data.data || response.data;
                
                this.submissionId = data.submissionId || data.SubmissionId || data.id || data.Id;
                
                console.log('✅ Submission started with ID:', this.submissionId);
                
                // Hide info banner, show exam
                if (this.elements.infoBanner) {
                    this.elements.infoBanner.style.display = 'none';
                }
                
                // Update title
                if (this.elements.examTitle) {
                    this.elements.examTitle.textContent = this.examData.Title || this.examData.title || 'Exam';
                }
                
                // Render questions from database
                this.renderQuestions();
                
                // Start timer
                const durationMinutes = this.examData.Duration || this.examData.duration || examBasic.Duration || examBasic.duration || 60;
                this.startTimer(durationMinutes * 60);
                
                // Show exam form and timer
                if (this.elements.questionsForm) {
                    this.elements.questionsForm.style.display = 'block';
                }
                if (this.elements.tempSubmitBtn) {
                    this.elements.tempSubmitBtn.style.display = 'block';
                }
                if (this.elements.timerCard) {
                    this.elements.timerCard.style.display = 'block';
                }
                if (this.elements.progressIndicator) {
                    this.elements.progressIndicator.style.display = 'flex';
                }
                
                notifications.success('Exam Started', 'Good luck!');
            } else {
                throw new Error(response.error || 'Failed to start exam');
            }
        } catch (error) {
            console.error('❌ Error starting exam:', error);
            notifications.error('Error', 'Failed to start exam: ' + error.message);
            
            // Re-enable start button
            if (this.elements.startBtn) {
                this.elements.startBtn.disabled = false;
                this.elements.startBtn.innerHTML = '<i class="bi bi-play-fill me-2"></i>Start Exam';
            }
        }
    }

    renderQuestions() {
        if (!this.examData) {
            console.error('❌ No exam data to render');
            return;
        }

        const questions = this.examData.Questions || this.examData.questions || [];
        
        if (!questions || questions.length === 0) {
            console.error('❌ No questions found in exam data');
            this.showError('This exam has no questions');
            return;
        }
        
        console.log('📝 Rendering', questions.length, 'questions from database');
        
        if (this.elements.totalQuestions) {
            this.elements.totalQuestions.textContent = questions.length;
        }

        this.elements.questionsContainer.innerHTML = questions.map((question, index) => {
            // Handle backend DTO structure: QuestionId, QuestionText, MCQOptions
            const questionId = question.QuestionId || question.questionId || question.id || question.Id;
            const questionText = question.QuestionText || question.questionText || question.text || question.Text;
            const options = question.MCQOptions || question.mcqOptions || question.options || question.Options || [];
            
            return `
                <div class="question-card animate-fadeInUp" style="animation-delay: ${index * 0.1}s">
                    <div class="d-flex align-items-start gap-3">
                        <div class="question-number">${index + 1}</div>
                        <div class="flex-grow-1">
                            <p class="question-text mb-0">${questionText}</p>
                            <div class="option-wrapper">
                                ${options.map(option => {
                                    // Handle backend DTO structure: OptionId, OptionText
                                    const optionId = option.OptionId || option.optionId || option.id || option.Id;
                                    const optionText = option.OptionText || option.optionText || option.text || option.Text;
                                    const inputId = `q_${questionId}_opt_${optionId}`;
                                    
                                    return `
                                        <label class="option-label" for="${inputId}">
                                            <input type="radio" 
                                                   name="q_${questionId}" 
                                                   value="${optionId}" 
                                                   id="${inputId}">
                                            <span class="option-text">${optionText}</span>
                                        </label>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.updateProgress();
    }

    updateProgress() {
        if (!this.examData) return;

        const questions = this.examData.Questions || this.examData.questions || [];
        
        if (!questions || questions.length === 0) return;
        
        let answered = 0;

        questions.forEach(question => {
            const questionId = question.QuestionId || question.questionId || question.Id || question.id;
            const selected = document.querySelector(`input[name="q_${questionId}"]:checked`);
            if (selected) answered++;
        });

        this.answered = answered;
        const total = questions.length;
        const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

        console.log(`📊 Progress: ${answered}/${total} questions answered (${percentage}%)`);

        if (this.elements.answeredCount) {
            this.elements.answeredCount.textContent = answered;
        }
        if (this.elements.progressPercentage) {
            this.elements.progressPercentage.textContent = `${percentage}%`;
        }

        // Enable submit only if all answered
        if (this.elements.submitBtn) {
            this.elements.submitBtn.disabled = answered < total;
        }
    }

    startTimer(seconds) {
        this.remainingSeconds = seconds;
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.remainingSeconds--;
            this.updateTimerDisplay();
            
            // Add warning animation when time is low (last 2 minutes)
            if (this.remainingSeconds <= 120 && this.elements.timerCard) {
                this.elements.timerCard.classList.add('warning');
            }
            
            if (this.remainingSeconds <= 0) {
                this.stopTimer();
                this.autoSubmit();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        if (!this.elements.timer) return;
        
        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.elements.timer.textContent = formatted;
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    gatherAnswers() {
        if (!this.examData) {
            console.error('❌ No exam data available for gathering answers');
            return [];
        }

        const questions = this.examData.Questions || this.examData.questions || [];
        
        if (!questions || questions.length === 0) {
            console.warn('⚠️ No questions found in exam data');
            return [];
        }
        
        console.log('📝 Gathering answers from', questions.length, 'questions');
        
        const answers = questions.map((question, index) => {
            const questionId = question.QuestionId || question.questionId || question.Id || question.id;
            const selected = document.querySelector(`input[name="q_${questionId}"]:checked`);
            
            console.log(`Question ${index + 1} (ID: ${questionId}):`, {
                selected: selected ? selected.value : 'none',
                questionElement: document.querySelector(`input[name="q_${questionId}"]`) ? 'found' : 'not found'
            });
            
            return {
                questionId: parseInt(questionId, 10),
                selectedOptionId: selected ? parseInt(selected.value, 10) : null
            };
        });
        
        console.log('📊 Gathered answers:', answers);
        return answers;
    }

    async submitExam() {
        console.log('📤 Submitting exam...', {
            submissionId: this.submissionId,
            studentId: this.studentId,
            examData: this.examData
        });
        
        if (!this.submissionId) {
            notifications.error('Error', 'No active submission');
            return;
        }

        // Check if all questions are answered
        const questions = this.examData?.Questions || this.examData?.questions || [];
        if (this.answered < questions.length) {
            const confirmed = await notifications.confirm(
                'Incomplete Exam',
                'You have not answered all questions. Submit anyway?',
                { type: 'warning' }
            );
            
            if (!confirmed) return;
        }

        // Disable submit button
        if (this.elements.submitBtn) {
            this.elements.submitBtn.disabled = true;
            this.elements.submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';
        }

        this.stopTimer();

        try {
            const answers = this.gatherAnswers();
            
            // Filter out answers with null selectedOptionId
            const validAnswers = answers.filter(answer => answer.selectedOptionId !== null);
            
            console.log(`📊 Valid answers: ${validAnswers.length}/${answers.length}`);
            
            if (validAnswers.length === 0) {
                notifications.error('Error', 'No answers selected. Please answer at least one question.');
                // Re-enable submit button
                if (this.elements.submitBtn) {
                    this.elements.submitBtn.disabled = false;
                    this.elements.submitBtn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>Submit Exam';
                }
                return;
            }
            
            const payload = {
                examId: parseInt(this.examData?.id || this.examData?.Id || this.examId, 10),
                studentId: parseInt(this.studentId, 10),
                answers: validAnswers
            };
            
            console.log('📤 Submitting payload:', payload);
            
            const response = await API.submission.submitExam(payload);
            console.log('📊 Submit response:', response);
            
            if (response.success) {
                notifications.success('Success', 'Exam submitted successfully!');
                // Wait a moment before showing result
                setTimeout(() => {
                    this.showResult();
                }, 1000);
            } else {
                const errorMessage = response.message || response.error || 'Failed to submit exam';
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('❌ Error submitting exam:', error);
            
            let errorMessage = 'Failed to submit exam';
            if (error.message) {
                errorMessage += ': ' + error.message;
            }
            
            notifications.error('Submission Failed', errorMessage);
            
            // Re-enable submit button
            if (this.elements.submitBtn) {
                this.elements.submitBtn.disabled = false;
                this.elements.submitBtn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>Submit Exam';
            }
        }
    }

    async autoSubmit() {
        console.log('⏰ Time expired - auto-submitting...');
        notifications.warning('Time Expired', 'Exam is being submitted automatically');
        await this.submitExam();
    }

    async showResult() {
        console.log('📊 Fetching exam result...');
        
        try {
            // Use stored exam data or get it fresh
            let examId = this.examData?.id || this.examData?.Id || this.examId;
            
            const response = await API.submission.getResult(examId, this.studentId);
            console.log('📊 Result response:', response);
            
            if (response.success && response.data) {
                const result = response.data.Data || response.data.data || response.data;
                
                // Hide exam form and timer
                if (this.elements.questionsForm) {
                    this.elements.questionsForm.style.display = 'none';
                }
                if (this.elements.timerCard) {
                    this.elements.timerCard.style.display = 'none';
                }
                if (this.elements.progressIndicator) {
                    this.elements.progressIndicator.style.display = 'none';
                }
                
                // Show result
                if (this.elements.resultContainer) {
                    this.elements.resultContainer.style.display = 'block';
                }
                
                const score = result.score !== undefined ? result.score : (result.Score !== undefined ? result.Score : 0);
                const passingScore = this.examData?.passingScore || this.examData?.PassingScore || 60;
                const isPassed = score >= passingScore;
                
                // Update score
                if (this.elements.scoreEl) {
                    this.elements.scoreEl.textContent = `${score.toFixed(1)}%`;
                }
                
                // Update icon
                if (this.elements.resultIcon) {
                    this.elements.resultIcon.className = isPassed ? 'result-icon pass' : 'result-icon fail';
                    this.elements.resultIcon.innerHTML = isPassed 
                        ? '<i class="bi bi-trophy-fill"></i>'
                        : '<i class="bi bi-x-circle-fill"></i>';
                }
                
                // Update meta
                if (this.elements.metaEl) {
                    const correct = result.correctAnswers || result.CorrectAnswers || 0;
                    const total = result.totalQuestions || result.TotalQuestions || 0;
                    const status = isPassed ? 'Passed' : 'Failed';
                    
                    this.elements.metaEl.innerHTML = `
                        <strong>${status}</strong> • Correct: ${correct}/${total} • 
                        Submitted: ${new Date().toLocaleString()}
                    `;
                }
                
                // Show detailed results (optional)
                if (this.elements.resultJson && result) {
                    this.elements.resultJson.textContent = JSON.stringify(result, null, 2);
                }
                
                notifications.success('Result Loaded', `You scored ${score.toFixed(1)}%`);
            }
        } catch (error) {
            console.error('❌ Error fetching result:', error);
            
            // Show basic completion message
            if (this.elements.resultContainer) {
                this.elements.resultContainer.style.display = 'block';
            }
            if (this.elements.scoreEl) {
                this.elements.scoreEl.textContent = 'Submitted Successfully';
            }
            if (this.elements.metaEl) {
                this.elements.metaEl.textContent = 'Your exam has been submitted. Results will be available soon.';
            }
        }
    }

    cancelExam() {
        const confirmed = confirm('Are you sure you want to leave this exam? Your progress will not be saved.');
        if (confirmed) {
            this.stopTimer();
            window.history.back();
        }
    }

    showError(message) {
        if (this.elements.loadingState) {
            this.elements.loadingState.innerHTML = `
                <div class="empty-state-exam" style="padding: 0; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 2.5rem 2rem; text-align: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
                        <i class="bi bi-lock-fill" style="font-size: 4rem; margin-bottom: 1rem; display: block;"></i>
                        <h2 style="color: white; margin: 0; font-weight: 800; font-size: 2rem;">Exam Locked</h2>
                        <p style="color: rgba(255, 255, 255, 0.9); margin-top: 0.5rem; font-size: 1.1rem;">This exam is currently unavailable</p>
                    </div>
                    <div style="padding: 2rem;">
                        <p style="font-size: 1.1rem; color: #4b5563; margin-bottom: 2rem;">${message}</p>
                        <button onclick="window.history.back()" class="btn-exam-primary" style="max-width: 250px;">
                            <i class="bi bi-arrow-left me-2"></i>Return to Dashboard
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

// Initialize Exam Manager
let examManager;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Exam Page...');
    
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token || API.isTokenExpired()) {
        window.location.href = '../index.html';
        return;
    }
    
    examManager = new ExamManager();
});
