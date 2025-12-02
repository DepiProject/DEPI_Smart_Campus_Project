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
            this.elements.submitBtn.addEventListener('click', () => this.submitExam());
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
            // Get exam details before starting
            const response = await API.exam.getById(this.examId);
            
            if (response.success && response.data) {
                const exam = response.data.Data || response.data.data || response.data;
                
                console.log('✅ Exam info loaded:', exam);
                
                // Update UI with exam info
                if (this.elements.examTitle) {
                    this.elements.examTitle.textContent = exam.title || exam.Title || 'Exam';
                }
                
                if (this.elements.examSubtitle) {
                    this.elements.examSubtitle.textContent = exam.description || exam.Description || 'Prepare to demonstrate your knowledge';
                }
                
                if (this.elements.durationInfo) {
                    const duration = exam.durationMinutes || exam.DurationMinutes || 0;
                    this.elements.durationInfo.textContent = `${duration} minutes`;
                }
                
                if (this.elements.questionsCount) {
                    const questions = exam.questions || exam.Questions || [];
                    this.elements.questionsCount.textContent = questions.length;
                }
                
                if (this.elements.passingScore) {
                    const passing = exam.passingScore || exam.PassingScore || 60;
                    this.elements.passingScore.textContent = `${passing}%`;
                }
                
                // Hide loading, show info banner
                if (this.elements.loadingState) {
                    this.elements.loadingState.style.display = 'none';
                }
                if (this.elements.infoBanner) {
                    this.elements.infoBanner.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('❌ Error loading exam info:', error);
            this.showError('Failed to load exam information');
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
            const payload = {
                examId: parseInt(this.examId, 10),
                studentId: parseInt(this.studentId, 10)
            };
            
            console.log('📤 Starting exam with payload:', payload);
            
            const response = await API.submission.startExam(this.examId, this.studentId);
            console.log('📊 Start exam response:', response);
            
            if (response.success && response.data) {
                const data = response.data.Data || response.data.data || response.data;
                
                this.submissionId = data.submissionId || data.SubmissionId;
                this.examData = data.exam || data.Exam;
                
                console.log('✅ Exam started:', {
                    submissionId: this.submissionId,
                    examData: this.examData
                });
                
                // Hide info banner, show exam
                if (this.elements.infoBanner) {
                    this.elements.infoBanner.style.display = 'none';
                }
                
                // Update title
                if (this.elements.examTitle) {
                    this.elements.examTitle.textContent = this.examData.title || this.examData.Title || 'Exam';
                }
                
                // Render questions
                this.renderQuestions();
                
                // Start timer
                const durationMinutes = this.examData.durationMinutes || this.examData.DurationMinutes || 0;
                this.startTimer(durationMinutes * 60);
                
                // Show exam form and timer
                if (this.elements.questionsForm) {
                    this.elements.questionsForm.style.display = 'block';
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
        if (!this.examData || !this.examData.questions) {
            console.error('❌ No questions to render');
            return;
        }

        const questions = this.examData.questions || this.examData.Questions || [];
        console.log('📝 Rendering', questions.length, 'questions');
        
        if (this.elements.totalQuestions) {
            this.elements.totalQuestions.textContent = questions.length;
        }

        this.elements.questionsContainer.innerHTML = questions.map((question, index) => {
            const questionId = question.id || question.Id || question.questionId || question.QuestionId;
            const questionText = question.text || question.Text || question.questionText || question.QuestionText;
            const options = question.options || question.Options || [];
            
            return `
                <div class="question-card animate-fadeInUp" style="animation-delay: ${index * 0.1}s">
                    <div class="d-flex align-items-start gap-3">
                        <div class="question-number">${index + 1}</div>
                        <div class="flex-grow-1">
                            <p class="question-text mb-0">${questionText}</p>
                            <div class="option-wrapper">
                                ${options.map(option => {
                                    const optionId = option.id || option.Id || option.optionId || option.OptionId;
                                    const optionText = option.text || option.Text || option.optionText || option.OptionText;
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
        if (!this.examData || !this.examData.questions) return;

        const questions = this.examData.questions || this.examData.Questions || [];
        let answered = 0;

        questions.forEach(question => {
            const questionId = question.id || question.Id || question.questionId || question.QuestionId;
            const selected = document.querySelector(`input[name="q_${questionId}"]:checked`);
            if (selected) answered++;
        });

        this.answered = answered;
        const total = questions.length;
        const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

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
        if (!this.examData || !this.examData.questions) return [];

        const questions = this.examData.questions || this.examData.Questions || [];
        
        return questions.map(question => {
            const questionId = question.id || question.Id || question.questionId || question.QuestionId;
            const selected = document.querySelector(`input[name="q_${questionId}"]:checked`);
            
            return {
                questionId: parseInt(questionId, 10),
                optionId: selected ? parseInt(selected.value, 10) : null
            };
        });
    }

    async submitExam() {
        console.log('📤 Submitting exam...');
        
        if (!this.submissionId) {
            notifications.error('Error', 'No active submission');
            return;
        }

        // Check if all questions are answered
        if (this.answered < (this.examData?.questions?.length || 0)) {
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
            
            const payload = {
                submissionId: this.submissionId,
                answers: answers
            };
            
            console.log('📤 Submitting answers:', payload);
            
            const response = await API.submission.submitExam(payload);
            console.log('📊 Submit response:', response);
            
            if (response.success) {
                // Get result
                await this.showResult();
            } else {
                throw new Error(response.error || 'Failed to submit exam');
            }
        } catch (error) {
            console.error('❌ Error submitting exam:', error);
            notifications.error('Error', 'Failed to submit exam: ' + error.message);
            
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
            const examId = this.examData.id || this.examData.Id;
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
                
                const score = result.score || result.Score || 0;
                const isPassed = score >= (this.examData.passingScore || 60);
                
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
                
                notifications.success('Exam Submitted', `You scored ${score.toFixed(1)}%`);
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
                <div class="empty-state-exam">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button onclick="window.history.back()" class="btn-exam-primary" style="max-width: 200px;">
                        Go Back
                    </button>
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
