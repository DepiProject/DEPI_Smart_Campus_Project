// =====================================================
// Instructor Dashboard - Exams Module
// Complete Fixed Version - Integrated with Main Dashboard
// =====================================================


// ===== LOAD EXAMS =====
InstructorDashboard.prototype.loadExams = async function() {
    console.log('📝 Loading exams for instructor...');
    console.log('📌 Current Instructor ID:', this.currentInstructorId);
    
    const examsTableBody = document.getElementById('examsTableBody');
    const examsSearchInput = document.getElementById('examsSearchInput');
    
    // Setup modal listener for loading courses when modal opens
    const examModal = document.getElementById('examModal');
    if (examModal && !examModal.hasAttribute('data-listener-set')) {
        examModal.setAttribute('data-listener-set', 'true');
        examModal.addEventListener('show.bs.modal', () => {
            console.log('📚 Exam modal opening - loading courses...');
            this.loadExamCourses();
        });
        examModal.addEventListener('hidden.bs.modal', () => {
            this.resetExamForm();
        });
    }
    
    try {
        if (!this.currentInstructorId) {
            console.error('❌ Instructor ID is not available!');
            if (examsTableBody) {
                examsTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted py-4">
                            <i class="bi bi-hourglass-split" style="font-size: 3rem; opacity: 0.3;"></i>
                            <p class="mt-2">Loading instructor information...</p>
                        </td>
                    </tr>
                `;
            }
            // Wait for instructor ID to be loaded
            setTimeout(() => {
                if (this.currentInstructorId) {
                    this.loadExams();
                }
            }, 2000);
            return;
        }

        // Get instructor's courses first
        const coursesResponse = await API.request(`/Course/instructor/${this.currentInstructorId}`, {
            method: 'GET'
        });

        if (!coursesResponse.success || !coursesResponse.data?.data) {
            console.error('❌ Failed to load courses:', coursesResponse.error);
            if (examsTableBody) {
                examsTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted py-4">
                            <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
                            <p class="mt-2">No courses assigned yet. Contact admin to assign courses.</p>
                        </td>
                    </tr>
                `;
            }
            return;
        }

        let courses = coursesResponse.data.data;
        if (!Array.isArray(courses)) {
            courses = [courses];
        }

        console.log('✅ Found', courses.length, 'courses for instructor');
        
        // Store courses for later use
        this.instructorCourses = courses;

        // Get all exams
        const response = await API.exam.getAll(1, 100);
        
        if (response.success && response.data) {
            const allExams = response.data.Data || response.data.data || response.data || [];
            console.log('✅ All exams loaded:', allExams);
            
            // Filter for instructor's courses
            const instructorExams = allExams.filter(exam => {
                const examCourseId = exam.CourseId || exam.courseId;
                const courseMatch = courses.find(c => {
                    const cid = c.CourseId || c.courseId || c.id || c.Id;
                    return cid && parseInt(cid, 10) === parseInt(examCourseId, 10);
                });
                return courseMatch !== undefined;
            });
            
            console.log('✅ Instructor exams filtered:', instructorExams.length, 'exams');
            
            this.allExams = instructorExams;
            this.renderExams(instructorExams);
            this.updateExamStats(instructorExams);
            
            if (examsSearchInput) {
                examsSearchInput.addEventListener('keyup', () => {
                    this.searchExams(examsSearchInput.value);
                });
            }
        } else {
            console.error('❌ Failed to load exams:', response);
            if (examsTableBody) {
                examsTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted py-4">
                            <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
                            <p class="mt-2">No exams found. Click "Create New Exam" to get started!</p>
                        </td>
                    </tr>
                `;
            }
        }
    } catch (error) {
        console.error('❌ Error loading exams:', error);
        if (examsTableBody) {
            examsTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading exams: ' + error.message + '</td></tr>';
        }
    }
};


// ===== RENDER EXAMS =====
InstructorDashboard.prototype.renderExams = function(exams) {
    const examsTableBody = document.getElementById('examsTableBody');
    
    if (!examsTableBody) {
        console.warn('⚠️ examsTableBody element not found');
        return;
    }
    
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
        const course = this.instructorCourses.find(c => {
            const cid = c.CourseId || c.courseId || c.id || c.Id;
            return cid && parseInt(cid, 10) === parseInt(courseId, 10);
        });
        
        const courseName = course 
            ? (course.CourseName || course.courseName || course.Name || course.name || 'Unknown')
            : (exam.CourseName || exam.courseName || 'Unknown Course');
        
        const title = exam.Title || exam.title || 'Untitled Exam';
        const duration = exam.Duration || exam.duration || 0;
        const questionCount = exam.QuestionCount || exam.questionCount || 0;
        const submissionCount = exam.SubmissionCount || exam.submissionCount || 0;
        const avgScore = exam.AverageScore || exam.averageScore || 0;
        const examId = exam.ExamId || exam.examId || exam.Id || exam.id;
        
        return `
            <tr>
                <td><strong class="text-primary">${courseName}</strong></td>
                <td>
                    <strong>${title}</strong><br>
                    <small class="text-muted">ID: ${examId}</small>
                </td>
                <td><span class="badge bg-info"><i class="bi bi-clock"></i> ${duration} min</span></td>
                <td><span class="badge bg-secondary"><i class="bi bi-question-circle"></i> ${questionCount}</span></td>
                <td><span class="badge ${submissionCount > 0 ? 'bg-success' : 'bg-secondary'}"><i class="bi bi-people"></i> ${submissionCount}</span></td>
                <td><strong class="${avgScore >= 50 ? 'text-success' : 'text-danger'}">${avgScore.toFixed(1)}%</strong></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="instructorDashboard.viewExamDetails(${examId}, ${courseId})" title="View">
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


// ===== UPDATE STATS =====
InstructorDashboard.prototype.updateExamStats = function(exams) {
    const totalExamsCount = document.getElementById('totalExamsCount');
    const totalSubmissionsCount = document.getElementById('totalSubmissionsCount');
    const averageExamScore = document.getElementById('averageExamScore');
    
    if (totalExamsCount) totalExamsCount.textContent = exams.length;
    
    if (exams.length > 0) {
        const totalSubmissions = exams.reduce((sum, exam) => sum + (exam.SubmissionCount || exam.submissionCount || 0), 0);
        const avgScore = exams.reduce((sum, exam) => sum + (exam.AverageScore || exam.averageScore || 0), 0) / exams.length;
        
        if (totalSubmissionsCount) totalSubmissionsCount.textContent = totalSubmissions;
        if (averageExamScore) averageExamScore.textContent = avgScore.toFixed(1) + '%';
    } else {
        if (totalSubmissionsCount) totalSubmissionsCount.textContent = '0';
        if (averageExamScore) averageExamScore.textContent = '0%';
    }
};


// ===== SEARCH EXAMS =====
InstructorDashboard.prototype.searchExams = function(searchTerm) {
    if (!this.allExams) return;
    
    const filtered = this.allExams.filter(exam => {
        const title = (exam.Title || exam.title || '').toLowerCase();
        const courseId = exam.CourseId || exam.courseId;
        const course = this.instructorCourses.find(c => {
            const cid = c.CourseId || c.courseId || c.id || c.Id;
            return cid && parseInt(cid, 10) === parseInt(courseId, 10);
        });
        const courseName = (course ? (course.CourseName || course.courseName || course.Name || course.name || '') : '').toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return title.includes(search) || courseName.includes(search);
    });
    
    this.renderExams(filtered);
};


// ===== LOAD COURSES FOR DROPDOWN =====
InstructorDashboard.prototype.loadExamCourses = async function() {
    console.log('🔵 [loadExamCourses] START');
    console.log('🔵 Current instructor courses cache:', this.instructorCourses);
    
    const courseSelect = document.getElementById('examCourse') || document.getElementById('examCourseSelect');
    if (!courseSelect) {
        console.error('❌ No course select element found');
        return;
    }

    // Show loading
    courseSelect.innerHTML = '<option value="">Loading courses...</option>';
    courseSelect.disabled = true;

    try {
        // Get instructor ID
        let instructorId = this.currentInstructorId;
        console.log('🔵 Instructor ID from dashboard:', instructorId);
        
        // Fallback 1: From localStorage
        if (!instructorId) {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            instructorId = userInfo.InstructorId || userInfo.instructorId || userInfo.id || userInfo.Id;
            console.log('🔵 Instructor ID from localStorage:', instructorId);
        }

        // Fallback 2: Fetch profile
        if (!instructorId) {
            console.log('🔵 Fetching profile to get instructor ID...');
            const profileResponse = await API.instructor.getMyProfile();
            
            if (profileResponse.success && profileResponse.data) {
                const profile = profileResponse.data.data || profileResponse.data.Data || profileResponse.data;
                instructorId = profile.instructorId || profile.InstructorId || profile.id || profile.Id;
                this.currentInstructorId = instructorId;
                console.log('🔵 Instructor ID from profile:', instructorId);
            }
        }

        if (!instructorId) {
            console.error('❌ No instructor ID available');
            courseSelect.innerHTML = '<option value="">Unable to load courses. Please login again.</option>';
            courseSelect.disabled = true;
            return;
        }

        // Use cached courses if available
        if (this.instructorCourses && this.instructorCourses.length > 0) {
            console.log('✅ Using cached courses:', this.instructorCourses.length);
            const validCourses = this.instructorCourses;
            
            courseSelect.innerHTML = '<option value="">Select a Course</option>';
            
            validCourses.forEach((course, idx) => {
                const courseId = course.CourseId || course.courseId || course.id || course.Id;
                const name = course.CourseName || course.courseName || course.Name || course.name;
                const code = course.CourseCode || course.courseCode || course.Code || course.code || '';
                
                const label = code ? `${code} - ${name}` : name;
                
                const option = document.createElement('option');
                // Critical: Set value as string of the numeric ID
                const idString = String(parseInt(courseId, 10));
                option.value = idString;
                option.setAttribute('data-course-id', idString);
                option.textContent = label;
                courseSelect.appendChild(option);
                
                console.log(`✅ Added cached course option [${idx}]:`, { courseId, idString, label, optionValue: option.value });
            });

            courseSelect.disabled = false;
            console.log('✅ [loadExamCourses] SUCCESS (from cache) - Dropdown has', courseSelect.options.length, 'options');
            return;
        }

        // Fetch courses from API
        console.log('🔵 Fetching courses from API for instructor:', instructorId);
        const response = await API.request(`/Course/instructor/${instructorId}`, {
            method: 'GET'
        });
        
        console.log('🔵 API Response:', response);

        if (!response.success) {
            console.error('❌ API returned error:', response);
            courseSelect.innerHTML = '<option value="">No courses assigned to you</option>';
            courseSelect.disabled = true;
            return;
        }

        // Extract courses array
        let courses = [];
        
        if (Array.isArray(response.data)) {
            courses = response.data;
        } else if (response.data) {
            courses = response.data.data || 
                     response.data.Data || 
                     response.data.items ||
                     response.data.Items ||
                     [];
            
            if (!Array.isArray(courses) && typeof response.data === 'object') {
                courses = [response.data];
            }
        }

        console.log('🔵 Extracted courses:', courses);

        // Validate courses
        const validCourses = courses.filter(c => {
            if (!c || typeof c !== 'object') return false;
            
            const id = c.CourseId || c.courseId || c.id || c.Id;
            const name = c.CourseName || c.courseName || c.Name || c.name;
            
            return id && parseInt(id) > 0 && name;
        });

        console.log('🔵 Valid courses count:', validCourses.length);

        // Cache courses
        this.instructorCourses = validCourses;

        if (validCourses.length === 0) {
            courseSelect.innerHTML = '<option value="">No courses assigned to you</option>';
            courseSelect.disabled = true;
            console.warn('⚠️ No valid courses found');
            return;
        }

        // Populate dropdown
        courseSelect.innerHTML = '<option value="">Select a Course</option>';
        
        validCourses.forEach((course, idx) => {
            const courseId = course.CourseId || course.courseId || course.id || course.Id;
            const name = course.CourseName || course.courseName || course.Name || course.name;
            const code = course.CourseCode || course.courseCode || course.Code || course.code || '';
            
            const label = code ? `${code} - ${name}` : name;
            
            const option = document.createElement('option');
            // Critical: Set value as string of the numeric ID
            const idString = String(parseInt(courseId, 10));
            option.value = idString;
            option.setAttribute('data-course-id', idString);
            option.textContent = label;
            courseSelect.appendChild(option);
            
            console.log(`✅ Added course option [${idx}]:`, { courseId, idString, label, optionValue: option.value });
        });

        courseSelect.disabled = false;

        console.log('✅ [loadExamCourses] SUCCESS - Dropdown has', courseSelect.options.length, 'options');

    } catch (error) {
        console.error('❌ [loadExamCourses] Error:', error);
        courseSelect.innerHTML = '<option value="">No courses found. Please contact admin.</option>';
        courseSelect.disabled = true;
        
        if (this.showToast) {
            this.showToast('Error', 'Failed to load courses. Please try again.', 'error');
        }
    }
};


// ===== QUESTION MANAGEMENT =====
InstructorDashboard.prototype.addQuestion = function() {
    const container = document.getElementById('questionsContainer');
    if (!container) return;

    const qid = 'q_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const el = document.createElement('div');
    el.className = 'card mb-3 question-card';
    el.setAttribute('data-qid', qid);
    el.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="mb-0">Question</h6>
                <div>
                    <button type="button" class="btn btn-sm btn-danger me-1" onclick="instructorDashboard.removeQuestion('${qid}')">
                        <i class="bi bi-trash"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="instructorDashboard.addOptionToQuestion('${qid}')">
                        <i class="bi bi-plus-lg"></i> Option
                    </button>
                </div>
            </div>
            <div class="mb-2">
                <textarea class="form-control question-text" rows="2" placeholder="Enter question text"></textarea>
            </div>
            <div class="options-list" id="${qid}_options">
                ${[1,2,3,4].map(i => `
                    <div class="input-group mb-2 option-item">
                        <span class="input-group-text">
                            <input type="radio" name="correct_${qid}" value="${i}">
                        </span>
                        <input type="text" class="form-control option-text" placeholder="Option ${i}">
                        <button class="btn btn-outline-danger" type="button" onclick="this.closest('.option-item').remove()">&times;</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    container.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
};


InstructorDashboard.prototype.removeQuestion = function(qid) {
    const el = document.querySelector(`[data-qid="${qid}"]`);
    if (el) el.remove();
};


InstructorDashboard.prototype.addOptionToQuestion = function(qid) {
    const optionsEl = document.getElementById(`${qid}_options`);
    if (!optionsEl) return;
    
    const index = optionsEl.querySelectorAll('.option-item').length + 1;
    const wrapper = document.createElement('div');
    wrapper.className = 'input-group mb-2 option-item';
    wrapper.innerHTML = `
        <span class="input-group-text">
            <input type="radio" name="correct_${qid}" value="${index}">
        </span>
        <input type="text" class="form-control option-text" placeholder="Option ${index}">
        <button class="btn btn-outline-danger" type="button" onclick="this.closest('.option-item').remove()">&times;</button>
    `;
    optionsEl.appendChild(wrapper);
};


// ===== GATHER EXAM DATA - FIXED VERSION =====
InstructorDashboard.prototype.gatherExamData = function() {
    const title = document.getElementById('examTitle')?.value.trim();
    const courseSelect = document.getElementById('examCourse') || document.getElementById('examCourseSelect');
    
    // Robust courseId extraction
    let courseId = 0;
    if (courseSelect) {
        const rawValue = (courseSelect.value || '').trim();
        console.log('🔍 Raw courseSelect.value:', rawValue);
        
        // Only parse if value is not empty
        if (rawValue && rawValue !== '') {
            const parsed = parseInt(rawValue, 10);
            console.log('🔍 Parsed result:', parsed, 'isNaN:', isNaN(parsed));
            courseId = !isNaN(parsed) ? parsed : 0;
        }
        
        // If still 0, check selected option attributes
        if (courseId === 0 && courseSelect.selectedIndex > 0) {
            const selectedOption = courseSelect.options[courseSelect.selectedIndex];
            const dataValue = selectedOption?.getAttribute('data-course-id') || '';
            const dataParsed = parseInt(dataValue, 10);
            console.log('🔍 Fallback data-course-id:', dataValue, 'parsed:', dataParsed);
            courseId = !isNaN(dataParsed) ? dataParsed : 0;
        }
    }
    
    const duration = parseInt(document.getElementById('examDuration')?.value || 0, 10);
    const totalMarks = parseInt(document.getElementById('examTotalMarks')?.value || 0, 10);
    const passingScore = parseInt(document.getElementById('examPassingScore')?.value || 0, 10);
    const description = document.getElementById('examDescription')?.value.trim() || '';
    
    console.log('🔍 Course Select Debug:', {
        element: courseSelect,
        rawValue: courseSelect?.value,
        selectedIndex: courseSelect?.selectedIndex,
        parsedCourseId: courseId,
        isValid: !isNaN(courseId) && courseId > 0
    });

    const questions = [];
    const container = document.getElementById('questionsContainer');
    
    if (container) {
        const qcards = container.querySelectorAll('.question-card');
        qcards.forEach(card => {
            const qid = card.getAttribute('data-qid');
            const textEl = card.querySelector('.question-text');
            const qtext = textEl ? textEl.value.trim() : '';
            
            const options = [];
            const optionItems = card.querySelectorAll('.option-item');
            
            optionItems.forEach(opt => {
                const optTextEl = opt.querySelector('.option-text');
                const optText = optTextEl ? optTextEl.value.trim() : '';
                const radio = opt.querySelector(`input[type="radio"][name="correct_${qid}"]`);
                const isCorrect = radio && radio.checked;
                
                if (optText.length > 0) {
                    options.push({ text: optText, isCorrect });
                }
            });

            if (qtext && options.length > 0) {
                questions.push({ text: qtext, options });
            }
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
    console.log('✅ courseId is valid for submission:', !isNaN(data.courseId) && data.courseId > 0);
    return data;
};


// ===== RESET FORM =====
InstructorDashboard.prototype.resetExamForm = function() {
    const form = document.getElementById('examForm');
    if (form) form.reset();
    
    const container = document.getElementById('questionsContainer');
    if (container) container.innerHTML = '';
    
    const btnText = document.getElementById('examBtnText');
    if (btnText) btnText.textContent = 'Save Exam';
    
    document.getElementById('examBtnSpinner')?.classList.add('d-none');
};


// ===== SAVE EXAM - FIXED VERSION =====
InstructorDashboard.prototype.saveExam = async function() {
    const btn = document.getElementById('saveExamBtn');
    const btnText = document.getElementById('examBtnText');
    const spinner = document.getElementById('examBtnSpinner');

    const data = this.gatherExamData();
    console.log('📋 Gathered exam data:', data);

    // Validation
    if (!data.title) {
        this.showToast('Validation', 'Exam title is required', 'warning');
        return;
    }
    
    // Fixed courseId validation
    if (!data.courseId || isNaN(data.courseId) || data.courseId <= 0) {
        console.error('❌ Invalid courseId:', data.courseId);
        this.showToast('Validation', 'Please select a valid course from the dropdown', 'warning');
        return;
    }
    
    // Verify course belongs to instructor
    const courseExists = (this.instructorCourses || []).some(c => {
        const cid = c.CourseId || c.courseId || c.id || c.Id;
        return parseInt(cid, 10) === data.courseId;
    });
    
    if (!courseExists) {
        console.error('❌ Course not in instructor courses:', {
            selectedCourseId: data.courseId,
            availableCourses: this.instructorCourses
        });
        this.showToast('Validation', 'Selected course is not assigned to you', 'error');
        return;
    }
    
    if (!data.durationMinutes || data.durationMinutes <= 0 || data.durationMinutes > 300) {
        this.showToast('Validation', 'Duration must be between 1-300 minutes', 'warning');
        return;
    }
    
    if (!data.totalMarks || data.totalMarks < 0.01) {
        this.showToast('Validation', 'Total marks must be greater than 0', 'warning');
        return;
    }
    
    if (!data.questions || data.questions.length === 0) {
        this.showToast('Validation', 'Please add at least one question', 'warning');
        return;
    }

    // Validate each question
    for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];
        if (!q.text || !q.text.trim()) {
            this.showToast('Validation', `Question ${i+1}: Text is required`, 'warning');
            return;
        }
        
        const validOptions = q.options.filter(o => o.text && o.text.trim());
        if (validOptions.length < 2) {
            this.showToast('Validation', `Question ${i+1}: At least 2 options required`, 'warning');
            return;
        }
        
        const hasCorrect = validOptions.some(o => o.isCorrect);
        if (!hasCorrect) {
            this.showToast('Validation', `Question ${i+1}: Mark correct answer`, 'warning');
            return;
        }
    }

    // Create exam payload
    const examPayload = {
        title: data.title,
        courseId: data.courseId,
        duration: data.durationMinutes,
        totalPoints: data.totalMarks,
        examDate: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    };

    console.log('📝 Creating exam with payload:', examPayload);

    try {
        if (btn) btn.disabled = true;
        if (spinner) spinner.classList.remove('d-none');
        if (btnText) btnText.textContent = 'Creating...';

        const examResponse = await API.exam.create(examPayload);
        console.log('✅ Exam creation response:', examResponse);

        if (!examResponse.success) {
            throw new Error(examResponse.error || examResponse.message || 'Failed to create exam');
        }

        const examId = examResponse.data?.Data?.ExamId || 
                      examResponse.data?.data?.ExamId || 
                      examResponse.data?.ExamId ||
                      examResponse.data?.examId;
                      
        if (!examId) {
            throw new Error('No exam ID returned from server');
        }

        console.log('✅ Exam created with ID:', examId);

        // Add questions
        if (btnText) btnText.textContent = 'Adding questions...';
        
        for (let i = 0; i < data.questions.length; i++) {
            const q = data.questions[i];
            const validOpts = q.options.filter(o => o.text && o.text.trim());

            const qPayload = {
                questionText: q.text.trim(),
                orderNumber: i + 1,
                score: 1,
                examId: examId,
                courseId: data.courseId,
                mCQOptions: validOpts.map((o, idx) => ({
                    optionText: o.text.trim(),
                    orderNumber: idx + 1,
                    isCorrect: !!o.isCorrect
                }))
            };

            console.log(`📝 Adding question ${i+1}:`, qPayload);
            await API.exam.addQuestion(qPayload);
        }

        this.showToast('Success', 'Exam created successfully!', 'success');
        this.resetExamForm();
        
        const modalEl = document.getElementById('examModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        
        await this.loadExams();

    } catch (error) {
        console.error('❌ Error creating exam:', error);
        this.showToast('Error', error.message || 'Failed to create exam', 'error');
    } finally {
        if (btn) btn.disabled = false;
        if (spinner) spinner.classList.add('d-none');
        if (btnText) btnText.textContent = 'Save Exam';
    }
};


// ===== VIEW / EDIT / DELETE =====
InstructorDashboard.prototype.viewExamDetails = async function(examId, courseId) {
    try {
        const response = await API.request(`/Exam/${examId}/course/${courseId}/with-questions`, { method: 'GET' });
        if (response.success) {
            this.showToast('Info', 'Exam loaded successfully', 'info');
        } else {
            this.showToast('Error', 'Failed to load exam', 'error');
        }
    } catch (error) {
        this.showToast('Error', 'Error loading exam', 'error');
    }
};


InstructorDashboard.prototype.editExam = function(examId) {
    this.showToast('Info', 'Edit feature coming soon', 'info');
};


InstructorDashboard.prototype.deleteExam = async function(examId) {
    if (!confirm('Delete this exam?')) return;
    
    try {
        const response = await API.exam.delete(examId);
        if (response.success) {
            this.showToast('Success', 'Exam deleted', 'success');
            this.loadExams();
        } else {
            this.showToast('Error', 'Failed to delete', 'error');
        }
    } catch (error) {
        this.showToast('Error', 'Error deleting exam', 'error');
    }
};