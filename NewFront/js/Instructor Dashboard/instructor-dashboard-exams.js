// // =====================================================

// // Instructor Dashboard - Exams Module
// // Complete Fixed Version - Integrated with Main Dashboard
// // =====================================================


// // ===== LOAD EXAMS =====
// InstructorDashboard.prototype.loadExams = async function() {
//     console.log('📝 Loading exams for instructor...');
//     console.log('📌 Current Instructor ID:', this.currentInstructorId);
    
//     const examsTableBody = document.getElementById('examsTableBody');
//     const examsSearchInput = document.getElementById('examsSearchInput');
    
//     // Setup modal listener for loading courses when modal opens
//     const examModal = document.getElementById('examModal');
//     if (examModal && !examModal.hasAttribute('data-listener-set')) {
//         examModal.setAttribute('data-listener-set', 'true');
//         examModal.addEventListener('show.bs.modal', () => {
//             console.log('📚 Exam modal opening - loading courses...');
//             this.loadExamCourses();
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


// // ===== RENDER EXAMS =====
// InstructorDashboard.prototype.renderExams = function(exams) {
//     const examsTableBody = document.getElementById('examsTableBody');
    
//     if (!examsTableBody) {
//         console.warn('⚠️ examsTableBody element not found');
//         return;
//     }
    
//     if (!exams || exams.length === 0) {
//         examsTableBody.innerHTML = `
//             <tr>
//                 <td colspan="7" class="text-center text-muted py-4">
//                     <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
//                     <p class="mt-2">No exams created yet. Click "Create New Exam" to get started!</p>
//                 </td>
//             </tr>
//         `;
//         return;
//     }
    
//     examsTableBody.innerHTML = exams.map(exam => {
//         const courseId = exam.CourseId || exam.courseId;
//         const course = this.instructorCourses.find(c => {
//             const cid = c.CourseId || c.courseId || c.id || c.Id;
//             return cid && parseInt(cid, 10) === parseInt(courseId, 10);
//         });
        
//         const courseName = course 
//             ? (course.CourseName || course.courseName || course.Name || course.name || 'Unknown')
//             : (exam.CourseName || exam.courseName || 'Unknown Course');
        
//         const title = exam.Title || exam.title || 'Untitled Exam';
//         const duration = exam.Duration || exam.duration || 0;
//         const questionCount = exam.QuestionCount || exam.questionCount || 0;
//         const submissionCount = exam.SubmissionCount || exam.submissionCount || 0;
//         const avgScore = exam.AverageScore || exam.averageScore || 0;
//         const examId = exam.ExamId || exam.examId || exam.Id || exam.id;
        
//         return `
//             <tr>
//                 <td><strong class="text-primary">${courseName}</strong></td>
//                 <td>
//                     <strong>${title}</strong><br>
//                     <small class="text-muted">ID: ${examId}</small>
//                 </td>
//                 <td><span class="badge bg-info"><i class="bi bi-clock"></i> ${duration} min</span></td>
//                 <td><span class="badge bg-secondary"><i class="bi bi-question-circle"></i> ${questionCount}</span></td>
//                 <td><span class="badge ${submissionCount > 0 ? 'bg-success' : 'bg-secondary'}"><i class="bi bi-people"></i> ${submissionCount}</span></td>
//                 <td><strong class="${avgScore >= 50 ? 'text-success' : 'text-danger'}">${avgScore.toFixed(1)}%</strong></td>
//                 <td>
//                     <div class="btn-group btn-group-sm">
//                         <button class="btn btn-outline-primary" onclick="instructorDashboard.viewExamDetails(${examId}, ${courseId})" title="View">
//                             <i class="bi bi-eye"></i>
//                         </button>
//                         <button class="btn btn-outline-warning" onclick="instructorDashboard.editExam(${examId})" title="Edit">
//                             <i class="bi bi-pencil"></i>
//                         </button>
//                         <button class="btn btn-outline-danger" onclick="instructorDashboard.deleteExam(${examId})" title="Delete">
//                             <i class="bi bi-trash"></i>
//                         </button>
//                     </div>
//                 </td>
//             </tr>
//         `;
//     }).join('');
// };


// // ===== UPDATE STATS =====
// InstructorDashboard.prototype.updateExamStats = function(exams) {
//     const totalExamsCount = document.getElementById('totalExamsCount');
//     const totalSubmissionsCount = document.getElementById('totalSubmissionsCount');
//     const averageExamScore = document.getElementById('averageExamScore');
    
//     if (totalExamsCount) totalExamsCount.textContent = exams.length;
    
//     if (exams.length > 0) {
//         const totalSubmissions = exams.reduce((sum, exam) => sum + (exam.SubmissionCount || exam.submissionCount || 0), 0);
//         const avgScore = exams.reduce((sum, exam) => sum + (exam.AverageScore || exam.averageScore || 0), 0) / exams.length;
        
//         if (totalSubmissionsCount) totalSubmissionsCount.textContent = totalSubmissions;
//         if (averageExamScore) averageExamScore.textContent = avgScore.toFixed(1) + '%';
//     } else {
//         if (totalSubmissionsCount) totalSubmissionsCount.textContent = '0';
//         if (averageExamScore) averageExamScore.textContent = '0%';
//     }
// };


// // ===== SEARCH EXAMS =====
// InstructorDashboard.prototype.searchExams = function(searchTerm) {
//     if (!this.allExams) return;
    
//     const filtered = this.allExams.filter(exam => {
//         const title = (exam.Title || exam.title || '').toLowerCase();
//         const courseId = exam.CourseId || exam.courseId;
//         const course = this.instructorCourses.find(c => {
//             const cid = c.CourseId || c.courseId || c.id || c.Id;
//             return cid && parseInt(cid, 10) === parseInt(courseId, 10);
//         });
//         const courseName = (course ? (course.CourseName || course.courseName || course.Name || course.name || '') : '').toLowerCase();
//         const search = searchTerm.toLowerCase();
        
//         return title.includes(search) || courseName.includes(search);
//     });
    
//     this.renderExams(filtered);
// };


// // ===== LOAD COURSES FOR DROPDOWN =====
// InstructorDashboard.prototype.loadExamCourses = async function() {
//     console.log('🔵 [loadExamCourses] START');
//     console.log('🔵 Current instructor courses cache:', this.instructorCourses);
    
//     const courseSelect = document.getElementById('examCourse') || document.getElementById('examCourseSelect');
//     if (!courseSelect) {
//         console.error('❌ No course select element found');
//         return;
//     }

//     // Show loading
//     courseSelect.innerHTML = '<option value="">Loading courses...</option>';
//     courseSelect.disabled = true;

//     try {
//         // Get instructor ID
//         let instructorId = this.currentInstructorId;
//         console.log('🔵 Instructor ID from dashboard:', instructorId);
        
//         // Fallback 1: From localStorage
//         if (!instructorId) {
//             const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
//             instructorId = userInfo.InstructorId || userInfo.instructorId || userInfo.id || userInfo.Id;
//             console.log('🔵 Instructor ID from localStorage:', instructorId);
//         }

//         // Fallback 2: Fetch profile
//         if (!instructorId) {
//             console.log('🔵 Fetching profile to get instructor ID...');
//             const profileResponse = await API.instructor.getMyProfile();
            
//             if (profileResponse.success && profileResponse.data) {
//                 const profile = profileResponse.data.data || profileResponse.data.Data || profileResponse.data;
//                 instructorId = profile.instructorId || profile.InstructorId || profile.id || profile.Id;
//                 this.currentInstructorId = instructorId;
//                 console.log('🔵 Instructor ID from profile:', instructorId);
//             }
//         }

//         if (!instructorId) {
//             console.error('❌ No instructor ID available');
//             courseSelect.innerHTML = '<option value="">Unable to load courses. Please login again.</option>';
//             courseSelect.disabled = true;
//             return;
//         }

//         // Use cached courses if available
//         if (this.instructorCourses && this.instructorCourses.length > 0) {
//             console.log('✅ Using cached courses:', this.instructorCourses.length);
//             const validCourses = this.instructorCourses;
            
//             courseSelect.innerHTML = '<option value="">Select a Course</option>';
            
//             validCourses.forEach((course, idx) => {
//                 const courseId = course.CourseId || course.courseId || course.id || course.Id;
//                 const name = course.CourseName || course.courseName || course.Name || course.name;
//                 const code = course.CourseCode || course.courseCode || course.Code || course.code || '';
                
//                 const label = code ? `${code} - ${name}` : name;
                
//                 const option = document.createElement('option');
//                 // Critical: Set value as string of the numeric ID
//                 const idString = String(parseInt(courseId, 10));
//                 option.value = idString;
//                 option.setAttribute('data-course-id', idString);
//                 option.textContent = label;
//                 courseSelect.appendChild(option);
                
//                 console.log(`✅ Added cached course option [${idx}]:`, { courseId, idString, label, optionValue: option.value });
//             });

//             courseSelect.disabled = false;
//             console.log('✅ [loadExamCourses] SUCCESS (from cache) - Dropdown has', courseSelect.options.length, 'options');
//             return;
//         }

//         // Fetch courses from API
//         console.log('🔵 Fetching courses from API for instructor:', instructorId);
//         const response = await API.request(`/Course/instructor/${instructorId}`, {
//             method: 'GET'
//         });
        
//         console.log('🔵 API Response:', response);

//         if (!response.success) {
//             console.error('❌ API returned error:', response);
//             courseSelect.innerHTML = '<option value="">No courses assigned to you</option>';
//             courseSelect.disabled = true;
//             return;
//         }

//         // Extract courses array
//         let courses = [];
        
//         if (Array.isArray(response.data)) {
//             courses = response.data;
//         } else if (response.data) {
//             courses = response.data.data || 
//                      response.data.Data || 
//                      response.data.items ||
//                      response.data.Items ||
//                      [];
            
//             if (!Array.isArray(courses) && typeof response.data === 'object') {
//                 courses = [response.data];
//             }
//         }

//         console.log('🔵 Extracted courses:', courses);

//         // Validate courses
//         const validCourses = courses.filter(c => {
//             if (!c || typeof c !== 'object') return false;
            
//             const id = c.CourseId || c.courseId || c.id || c.Id;
//             const name = c.CourseName || c.courseName || c.Name || c.name;
            
//             return id && parseInt(id) > 0 && name;
//         });

//         console.log('🔵 Valid courses count:', validCourses.length);

//         // Cache courses
//         this.instructorCourses = validCourses;

//         if (validCourses.length === 0) {
//             courseSelect.innerHTML = '<option value="">No courses assigned to you</option>';
//             courseSelect.disabled = true;
//             console.warn('⚠️ No valid courses found');
//             return;
//         }

//         // Populate dropdown
//         courseSelect.innerHTML = '<option value="">Select a Course</option>';
        
//         validCourses.forEach((course, idx) => {
//             const courseId = course.CourseId || course.courseId || course.id || course.Id;
//             const name = course.CourseName || course.courseName || course.Name || course.name;
//             const code = course.CourseCode || course.courseCode || course.Code || course.code || '';
            
//             const label = code ? `${code} - ${name}` : name;
            
//             const option = document.createElement('option');
//             // Critical: Set value as string of the numeric ID
//             const idString = String(parseInt(courseId, 10));
//             option.value = idString;
//             option.setAttribute('data-course-id', idString);
//             option.textContent = label;
//             courseSelect.appendChild(option);
            
//             console.log(`✅ Added course option [${idx}]:`, { courseId, idString, label, optionValue: option.value });
//         });

//         courseSelect.disabled = false;

//         console.log('✅ [loadExamCourses] SUCCESS - Dropdown has', courseSelect.options.length, 'options');

//     } catch (error) {
//         console.error('❌ [loadExamCourses] Error:', error);
//         courseSelect.innerHTML = '<option value="">No courses found. Please contact admin.</option>';
//         courseSelect.disabled = true;
        
//         if (this.showToast) {
//             this.showToast('Error', 'Failed to load courses. Please try again.', 'error');
//         }
//     }
// };


// // ===== QUESTION MANAGEMENT =====
// InstructorDashboard.prototype.addQuestion = function() {
//     const container = document.getElementById('questionsContainer');
//     if (!container) return;

//     const qid = 'q_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
//     const el = document.createElement('div');
//     el.className = 'card mb-3 question-card';
//     el.setAttribute('data-qid', qid);
//     el.innerHTML = `
//         <div class="card-body">
//             <div class="d-flex justify-content-between align-items-start mb-2">
//                 <h6 class="mb-0">Question</h6>
//                 <div>
//                     <button type="button" class="btn btn-sm btn-danger me-1" onclick="instructorDashboard.removeQuestion('${qid}')">
//                         <i class="bi bi-trash"></i>
//                     </button>
//                     <button type="button" class="btn btn-sm btn-outline-secondary" onclick="instructorDashboard.addOptionToQuestion('${qid}')">
//                         <i class="bi bi-plus-lg"></i> Option
//                     </button>
//                 </div>
//             </div>
//             <div class="mb-2">
//                 <textarea class="form-control question-text" rows="2" placeholder="Enter question text"></textarea>
//             </div>
//             <div class="options-list" id="${qid}_options">
//                 ${[1,2,3,4].map(i => `
//                     <div class="input-group mb-2 option-item">
//                         <span class="input-group-text">
//                             <input type="radio" name="correct_${qid}" value="${i}">
//                         </span>
//                         <input type="text" class="form-control option-text" placeholder="Option ${i}">
//                         <button class="btn btn-outline-danger" type="button" onclick="this.closest('.option-item').remove()">&times;</button>
//                     </div>
//                 `).join('')}
//             </div>
//         </div>
//     `;
//     container.appendChild(el);
//     el.scrollIntoView({ behavior: 'smooth', block: 'center' });
// };


// InstructorDashboard.prototype.removeQuestion = function(qid) {
//     const el = document.querySelector(`[data-qid="${qid}"]`);
//     if (el) el.remove();
// };


// InstructorDashboard.prototype.addOptionToQuestion = function(qid) {
//     const optionsEl = document.getElementById(`${qid}_options`);
//     if (!optionsEl) return;
    
//     const index = optionsEl.querySelectorAll('.option-item').length + 1;
//     const wrapper = document.createElement('div');
//     wrapper.className = 'input-group mb-2 option-item';
//     wrapper.innerHTML = `
//         <span class="input-group-text">
//             <input type="radio" name="correct_${qid}" value="${index}">
//         </span>
//         <input type="text" class="form-control option-text" placeholder="Option ${index}">
//         <button class="btn btn-outline-danger" type="button" onclick="this.closest('.option-item').remove()">&times;</button>
//     `;
//     optionsEl.appendChild(wrapper);
// };


// // ===== GATHER EXAM DATA - FIXED VERSION =====
// InstructorDashboard.prototype.gatherExamData = function() {
//     const title = document.getElementById('examTitle')?.value.trim();
//     const courseSelect = document.getElementById('examCourse') || document.getElementById('examCourseSelect');
    
//     // Robust courseId extraction
//     let courseId = 0;
//     if (courseSelect) {
//         const rawValue = (courseSelect.value || '').trim();
//         console.log('🔍 Raw courseSelect.value:', rawValue);
        
//         // Only parse if value is not empty
//         if (rawValue && rawValue !== '') {
//             const parsed = parseInt(rawValue, 10);
//             console.log('🔍 Parsed result:', parsed, 'isNaN:', isNaN(parsed));
//             courseId = !isNaN(parsed) ? parsed : 0;
//         }
        
//         // If still 0, check selected option attributes
//         if (courseId === 0 && courseSelect.selectedIndex > 0) {
//             const selectedOption = courseSelect.options[courseSelect.selectedIndex];
//             const dataValue = selectedOption?.getAttribute('data-course-id') || '';
//             const dataParsed = parseInt(dataValue, 10);
//             console.log('🔍 Fallback data-course-id:', dataValue, 'parsed:', dataParsed);
//             courseId = !isNaN(dataParsed) ? dataParsed : 0;
//         }
//     }
    
//     const duration = parseInt(document.getElementById('examDuration')?.value || 0, 10);
//     const totalMarks = parseInt(document.getElementById('examTotalMarks')?.value || 0, 10);
//     const passingScore = parseInt(document.getElementById('examPassingScore')?.value || 0, 10);
//     const description = document.getElementById('examDescription')?.value.trim() || '';
    
//     console.log('🔍 Course Select Debug:', {
//         element: courseSelect,
//         rawValue: courseSelect?.value,
//         selectedIndex: courseSelect?.selectedIndex,
//         parsedCourseId: courseId,
//         isValid: !isNaN(courseId) && courseId > 0
//     });

//     const questions = [];
//     const container = document.getElementById('questionsContainer');
    
//     if (container) {
//         const qcards = container.querySelectorAll('.question-card');
//         qcards.forEach(card => {
//             const qid = card.getAttribute('data-qid');
//             const textEl = card.querySelector('.question-text');
//             const qtext = textEl ? textEl.value.trim() : '';
            
//             const options = [];
//             const optionItems = card.querySelectorAll('.option-item');
            
//             optionItems.forEach(opt => {
//                 const optTextEl = opt.querySelector('.option-text');
//                 const optText = optTextEl ? optTextEl.value.trim() : '';
//                 const radio = opt.querySelector(`input[type="radio"][name="correct_${qid}"]`);
//                 const isCorrect = radio && radio.checked;
                
//                 if (optText.length > 0) {
//                     options.push({ text: optText, isCorrect });
//                 }
//             });

//             if (qtext && options.length > 0) {
//                 questions.push({ text: qtext, options });
//             }
//         });
//     }

//     const data = { 
//         title, 
//         courseId, 
//         durationMinutes: duration, 
//         totalMarks, 
//         passingScore, 
//         description, 
//         questions 
//     };
    
//     console.log('✅ Final gathered exam data:', data);
//     console.log('✅ courseId is valid for submission:', !isNaN(data.courseId) && data.courseId > 0);
//     return data;
// };


// // ===== RESET FORM =====
// InstructorDashboard.prototype.resetExamForm = function() {
//     const form = document.getElementById('examForm');
//     if (form) form.reset();
    
//     const container = document.getElementById('questionsContainer');
//     if (container) container.innerHTML = '';
    
//     const btnText = document.getElementById('examBtnText');
//     if (btnText) btnText.textContent = 'Save Exam';
    
//     document.getElementById('examBtnSpinner')?.classList.add('d-none');
// };


// // ===== SAVE EXAM - FIXED VERSION =====
// InstructorDashboard.prototype.saveExam = async function() {
//     const btn = document.getElementById('saveExamBtn');
//     const btnText = document.getElementById('examBtnText');
//     const spinner = document.getElementById('examBtnSpinner');

//     const data = this.gatherExamData();
//     console.log('📋 Gathered exam data:', data);

//     // Validation
//     if (!data.title) {
//         this.showToast('Validation', 'Exam title is required', 'warning');
//         return;
//     }
    
//     // Fixed courseId validation
//     if (!data.courseId || isNaN(data.courseId) || data.courseId <= 0) {
//         console.error('❌ Invalid courseId:', data.courseId);
//         this.showToast('Validation', 'Please select a valid course from the dropdown', 'warning');
//         return;
//     }
    
//     // Verify course belongs to instructor
//     const courseExists = (this.instructorCourses || []).some(c => {
//         const cid = c.CourseId || c.courseId || c.id || c.Id;
//         return parseInt(cid, 10) === data.courseId;
//     });
    
//     if (!courseExists) {
//         console.error('❌ Course not in instructor courses:', {
//             selectedCourseId: data.courseId,
//             availableCourses: this.instructorCourses
//         });
//         this.showToast('Validation', 'Selected course is not assigned to you', 'error');
//         return;
//     }
    
//     if (!data.durationMinutes || data.durationMinutes <= 0 || data.durationMinutes > 300) {
//         this.showToast('Validation', 'Duration must be between 1-300 minutes', 'warning');
//         return;
//     }
    
//     if (!data.totalMarks || data.totalMarks < 0.01) {
//         this.showToast('Validation', 'Total marks must be greater than 0', 'warning');
//         return;
//     }
    
//     if (!data.questions || data.questions.length === 0) {
//         this.showToast('Validation', 'Please add at least one question', 'warning');
//         return;
//     }

//     // Validate each question
//     for (let i = 0; i < data.questions.length; i++) {
//         const q = data.questions[i];
//         if (!q.text || !q.text.trim()) {
//             this.showToast('Validation', `Question ${i+1}: Text is required`, 'warning');
//             return;
//         }
        
//         const validOptions = q.options.filter(o => o.text && o.text.trim());
//         if (validOptions.length < 2) {
//             this.showToast('Validation', `Question ${i+1}: At least 2 options required`, 'warning');
//             return;
//         }
        
//         const hasCorrect = validOptions.some(o => o.isCorrect);
//         if (!hasCorrect) {
//             this.showToast('Validation', `Question ${i+1}: Mark correct answer`, 'warning');
//             return;
//         }
//     }

//     // Create exam payload
//     const examPayload = {
//         Title: data.title,
//         CourseId: data.courseId,
//         Duration: data.durationMinutes,
//         TotalPoints: data.totalMarks,
//         ExamDate: new Date(Date.now() + 5 * 60 * 1000).toISOString()
//     };

//     console.log('📝 Creating exam with payload:', examPayload);

//     try {
//         if (btn) btn.disabled = true;
//         if (spinner) spinner.classList.remove('d-none');
//         if (btnText) btnText.textContent = 'Creating...';

//         const examResponse = await API.exam.create(examPayload);
//         console.log('✅ Exam creation response:', examResponse);
//         console.log('✅ Response details:', {
//             success: examResponse.success,
//             status: examResponse.status,
//             error: examResponse.error,
//             message: examResponse.message,
//             Message: examResponse.Message,
//             data: examResponse.data,
//             fullResponse: JSON.stringify(examResponse, null, 2)
//         });

//         if (!examResponse.success) {
//             console.error('❌ Exam creation failed with response:', examResponse);
//             console.error('❌ Error details:', examResponse.data);
//             const errorMsg = examResponse.error || examResponse.message || examResponse.Message || 'Failed to create exam';
//             console.error('❌ Final error message:', errorMsg);
//             throw new Error(errorMsg);
//         }

//         const examId = examResponse.data?.Data?.ExamId || 
//                       examResponse.data?.data?.ExamId || 
//                       examResponse.data?.ExamId ||
//                       examResponse.data?.examId;
        
//         console.log('🔍 Exam ID extraction:', {
//             'data?.Data?.ExamId': examResponse.data?.Data?.ExamId,
//             'data?.data?.ExamId': examResponse.data?.data?.ExamId,
//             'data?.ExamId': examResponse.data?.ExamId,
//             'data?.examId': examResponse.data?.examId,
//             'finalExamId': examId,
//             'fullData': examResponse.data
//         });
                      
//         if (!examId) {
//             console.error('❌ No exam ID found in response:', examResponse);
//             throw new Error('No exam ID returned from server');
//         }

//         console.log('✅ Exam created with ID:', examId);

//         // Add questions
//         if (btnText) btnText.textContent = 'Adding questions...';
        
//         for (let i = 0; i < data.questions.length; i++) {
//             const q = data.questions[i];
//             const validOpts = q.options.filter(o => o.text && o.text.trim());

//             const qPayload = {
//                 QuestionText: q.text.trim(),
//                 OrderNumber: i + 1,
//                 Score: 1,
//                 ExamId: examId,
//                 CourseId: data.courseId,
//                 MCQOptions: validOpts.map((o, idx) => ({
//                     OptionText: o.text.trim(),
//                     OrderNumber: idx + 1,
//                     IsCorrect: !!o.isCorrect
//                 }))
//             };

//             console.log(`📝 Adding question ${i+1}:`, qPayload);
//             const questionResponse = await API.exam.addQuestion(qPayload);
//             console.log(`✅ Question ${i+1} response:`, questionResponse);
            
//             if (!questionResponse.success) {
//                 console.error(`❌ Failed to add question ${i+1}:`, questionResponse);
//                 throw new Error(`Failed to add question ${i+1}: ${questionResponse.error || questionResponse.message}`);
//             }
//         }

//         this.showToast('Success', 'Exam created successfully!', 'success');
//         this.resetExamForm();
        
//         const modalEl = document.getElementById('examModal');
//         const modal = bootstrap.Modal.getInstance(modalEl);
//         if (modal) modal.hide();
        
//         await this.loadExams();

//     } catch (error) {
//         console.error('❌ Error creating exam:', error);
//         this.showToast('Error', error.message || 'Failed to create exam', 'error');
//     } finally {
//         if (btn) btn.disabled = false;
//         if (spinner) spinner.classList.add('d-none');
//         if (btnText) btnText.textContent = 'Save Exam';
//     }
// };


// // ===== VIEW / EDIT / DELETE =====
// InstructorDashboard.prototype.viewExamDetails = async function(examId, courseId) {
//     try {
//         const response = await API.request(`/Exam/${examId}/course/${courseId}/with-questions`, { method: 'GET' });
//         if (response.success) {
//             this.showToast('Info', 'Exam loaded successfully', 'info');
//         } else {
//             this.showToast('Error', 'Failed to load exam', 'error');
//         }
//     } catch (error) {
//         this.showToast('Error', 'Error loading exam', 'error');
//     }
// };


// InstructorDashboard.prototype.editExam = function(examId) {
//     this.showToast('Info', 'Edit feature coming soon', 'info');
// };


// InstructorDashboard.prototype.deleteExam = async function(examId) {
//     if (!confirm('Delete this exam?')) return;
    
//     try {
//         const response = await API.exam.delete(examId);
//         if (response.success) {
//             this.showToast('Success', 'Exam deleted', 'success');
//             this.loadExams();
//         } else {
//             this.showToast('Error', 'Failed to delete', 'error');
//         }
//     } catch (error) {
//         this.showToast('Error', 'Error deleting exam', 'error');
//     }
// };

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
            this.setupExamFormListeners(); // Setup validation listeners
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


// ===== LOAD COURSES FOR DROPDOWN - ULTIMATE FIX =====
InstructorDashboard.prototype.loadExamCourses = async function() {
    console.log('🚀 [loadExamCourses] ULTIMATE FIX START');
    
    const courseSelect = document.getElementById('examCourse');
    if (!courseSelect) {
        console.error('❌ Course select element not found');
        return;
    }

    // Show loading
    courseSelect.innerHTML = '<option value="">Loading courses...</option>';
    courseSelect.disabled = true;

    try {
        // 1. Get instructor ID
        let instructorId = this.currentInstructorId;
        
        if (!instructorId) {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            instructorId = userInfo.InstructorId || userInfo.instructorId || userInfo.id || userInfo.Id;
            console.log('📌 Instructor ID from localStorage:', instructorId);
        }

        if (!instructorId) {
            console.error('❌ No instructor ID found');
            courseSelect.innerHTML = '<option value="">Login required</option>';
            return;
        }

        console.log('✅ Using instructor ID:', instructorId);

        // 2. Try to get courses from API
        let courses = [];
        let apiError = null;
        
        try {
            console.log('🌐 Calling API: /Course/instructor/' + instructorId);
            const response = await API.request(`/Course/instructor/${instructorId}`, {
                method: 'GET'
            });
            
            console.log('📡 API Response:', response);
            
            if (response.success) {
                // Try EVERY possible way to extract courses
                const data = response.data;
                
                console.log('🔍 Response data structure:', data);
                
                // Method 1: Direct array
                if (Array.isArray(data)) {
                    courses = data;
                    console.log('✅ Found courses as direct array:', courses.length);
                }
                // Method 2: Nested in data.data
                else if (data && Array.isArray(data.data)) {
                    courses = data.data;
                    console.log('✅ Found courses in data.data:', courses.length);
                }
                // Method 3: Nested in data.Data
                else if (data && Array.isArray(data.Data)) {
                    courses = data.Data;
                    console.log('✅ Found courses in data.Data:', courses.length);
                }
                // Method 4: Single object
                else if (data && typeof data === 'object') {
                    // Check if it's a single course object
                    if (data.CourseId || data.courseId || data.id) {
                        courses = [data];
                        console.log('✅ Found single course object');
                    }
                    // Search for any array property
                    else {
                        for (const key in data) {
                            if (Array.isArray(data[key])) {
                                courses = data[key];
                                console.log(`✅ Found courses in property "${key}":`, courses.length);
                                break;
                            }
                        }
                    }
                }
                
                console.log('📊 Extracted courses:', courses);
            } else {
                apiError = response.error || 'API request failed';
                console.error('❌ API error:', apiError);
            }
        } catch (error) {
            apiError = error.message;
            console.error('❌ API call failed:', error);
        }

        // 3. If API failed or returned no courses, try fallback methods
        if (!courses || courses.length === 0) {
            console.warn('⚠️ No courses from API, trying fallbacks...');
            
            // Fallback 1: Check if we already have courses cached from loadExams
            if (this.instructorCourses && this.instructorCourses.length > 0) {
                console.log('🔄 Using courses from loadExams cache');
                courses = this.instructorCourses;
            }
            // Fallback 2: Use emergency courses
            else {
                console.log('🆘 Loading emergency courses');
                courses = this.getEmergencyCourses();
                
                // Show warning to user
                if (this.showToast) {
                    this.showToast('Info', 'Using demo courses for testing', 'info');
                }
            }
        }

        // 4. ALWAYS populate dropdown, even with empty array
        console.log('📝 Final courses to display:', courses?.length || 0);
        this.ultimatePopulateDropdown(courseSelect, courses || []);

    } catch (error) {
        console.error('❌ [loadExamCourses] Critical error:', error);
        
        // Last resort: Force emergency courses
        this.loadEmergencyCoursesNow();
    }
};



// ===== ULTIMATE POPULATE DROPDOWN =====
InstructorDashboard.prototype.ultimatePopulateDropdown = function(courseSelect, courses) {
    console.log('🎯 [ultimatePopulateDropdown] START');
    console.log('📦 Courses received:', courses);
    console.log('📦 Is array?', Array.isArray(courses));
    console.log('📦 Length:', courses?.length || 0);
    
    // Always clear dropdown first
    courseSelect.innerHTML = '<option value="">Select a Course</option>';
    
    if (!courses || !Array.isArray(courses) || courses.length === 0) {
        console.warn('⚠️ No courses to display');
        courseSelect.innerHTML = '<option value="">No courses available</option>';
        courseSelect.disabled = true;
        return;
    }
    
    console.log('🔍 Processing', courses.length, 'courses...');
    
    let addedCount = 0;
    let skippedCount = 0;
    
    // Process each course
    courses.forEach((course, index) => {
        console.log(`\n📋 Course ${index}:`, course);
        
        // Debug: Show ALL properties
        console.log('   All properties:', Object.keys(course));
        
        // Extract data with ULTIMATE property name detection
        const extracted = this.extractCourseData(course, index);
        
        if (!extracted.isValid) {
            console.warn(`   ⚠️ Skipping invalid course:`, extracted.reason);
            skippedCount++;
            return;
        }
        
        // Create option
        const option = document.createElement('option');
        option.value = String(extracted.id);
        option.setAttribute('data-course-id', String(extracted.id));
        option.textContent = extracted.displayText;
        
        // Add to dropdown
        courseSelect.appendChild(option);
        addedCount++;
        
        console.log(`   ✅ Added: ${extracted.displayText} (ID: ${extracted.id})`);
    });
    
    // Final result
    console.log(`\n📊 FINAL RESULT:`);
    console.log(`   Total courses: ${courses.length}`);
    console.log(`   Added to dropdown: ${addedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    
    if (addedCount > 0) {
        courseSelect.disabled = false;
        console.log(`🎉 SUCCESS! Dropdown has ${addedCount} courses`);
        
        // Auto-select first real course if only one exists
        if (addedCount === 1 && courseSelect.options.length > 1) {
            courseSelect.selectedIndex = 1;
            console.log('🔄 Auto-selected the only course');
        }
    } else {
        // If ALL courses were skipped, show at least one
        console.error('❌ All courses were invalid! Adding emergency course');
        this.addEmergencyOption(courseSelect);
    }
};

// ===== EXTRACT COURSE DATA =====
InstructorDashboard.prototype.extractCourseData = function(course, index) {
    const result = {
        isValid: false,
        id: 0,
        name: '',
        code: '',
        displayText: '',
        reason: ''
    };
    
    // Check if course is valid object
    if (!course || typeof course !== 'object') {
        result.reason = 'Not a valid object';
        return result;
    }
    
    // ULTIMATE property name detection for ID
    const possibleIdNames = [
        'CourseId', 'courseId', 'id', 'Id', 'courseID', 'CourseID',
        'course_id', 'course_Id', 'COURSE_ID', 'courseid', 'CID',
        'cId', 'c_id', 'courseIdNumber', 'course_id_number'
    ];
    
    let foundId = null;
    for (const idName of possibleIdNames) {
        if (course[idName] !== undefined && course[idName] !== null) {
            foundId = course[idName];
            console.log(`   Found ID in "${idName}": ${foundId}`);
            break;
        }
    }
    
    // ULTIMATE property name detection for Name
    const possibleNameNames = [
        'CourseName', 'courseName', 'Name', 'name', 'course_name',
        'course_Name', 'COURSENAME', 'coursename', 'Title', 'title',
        'CourseTitle', 'courseTitle', 'course_title', 'displayName',
        'DisplayName', 'courseDisplayName'
    ];
    
    let foundName = null;
    for (const nameName of possibleNameNames) {
        if (course[nameName] !== undefined && course[nameName] !== null) {
            foundName = course[nameName];
            console.log(`   Found name in "${nameName}": ${foundName}`);
            break;
        }
    }
    
    // ULTIMATE property name detection for Code
    const possibleCodeNames = [
        'CourseCode', 'courseCode', 'Code', 'code', 'course_code',
        'course_Code', 'COURSECODE', 'coursecode', 'ShortCode',
        'shortCode', 'courseShortCode', 'course_short_code'
    ];
    
    let foundCode = '';
    for (const codeName of possibleCodeNames) {
        if (course[codeName] !== undefined && course[codeName] !== null) {
            foundCode = course[codeName];
            console.log(`   Found code in "${codeName}": ${foundCode}`);
            break;
        }
    }
    
    // VALIDATION
    if (!foundName) {
        result.reason = 'No course name found';
        return result;
    }
    
    // Process ID
    let finalId;
    if (!foundId) {
        // No ID found, generate one
        finalId = 1 + index;
        console.log(`   ⚠️ No ID found, using generated: ${finalId}`);
    } else {
        // Try to parse ID
        const parsedId = parseInt(foundId, 10);
        if (isNaN(parsedId) || parsedId <= 0) {
            // Invalid ID, generate one
            finalId = 1 + index;
            console.log(`   ⚠️ Invalid ID "${foundId}", using generated: ${finalId}`);
        } else {
            finalId = parsedId;
        }
    }
    
    // Ensure ID is positive
    if (finalId <= 0) {
        finalId = 1000 + index;
    }
    
    // Create display text
    let displayText;
    if (foundCode && foundCode.trim() !== '') {
        displayText = `${foundCode} - ${foundName}`;
    } else {
        displayText = foundName;
    }
    
    // Return result
    result.isValid = true;
    result.id = finalId;
    result.name = foundName;
    result.code = foundCode;
    result.displayText = displayText;
    
    return result;
};

// ===== EMERGENCY FUNCTIONS =====
InstructorDashboard.prototype.getEmergencyCourses = function() {
    return [
        { id: 101, name: "Computer Science 101", code: "CS101" },
        { id: 102, name: "Mathematics Basics", code: "MATH101" },
        { id: 103, name: "Web Development", code: "WEB101" }
    ];
};

InstructorDashboard.prototype.addEmergencyOption = function(courseSelect) {
    const option = document.createElement('option');
    option.value = "999";
    option.setAttribute('data-course-id', "999");
    option.textContent = "CS999 - Emergency Course";
    courseSelect.appendChild(option);
    courseSelect.disabled = false;
    console.log('🆘 Added emergency course option');
};

InstructorDashboard.prototype.loadEmergencyCoursesNow = function() {
    const courseSelect = document.getElementById('examCourse');
    if (!courseSelect) return;
    
    const emergencyCourses = this.getEmergencyCourses();
    
    courseSelect.innerHTML = '<option value="">Select a Course</option>';
    
    emergencyCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = String(course.id);
        option.setAttribute('data-course-id', String(course.id));
        option.textContent = `${course.code} - ${course.name}`;
        courseSelect.appendChild(option);
    });
    
    courseSelect.disabled = false;
    
    // Cache for later use
    this.instructorCourses = emergencyCourses.map(c => ({
        CourseId: c.id,
        CourseName: c.name,
        CourseCode: c.code
    }));
    
    console.log('✅ Emergency courses loaded');
};

// ===== DEBUG FUNCTION =====
InstructorDashboard.prototype.debugCourseData = async function() {
    console.log('=== DEBUG COURSE DATA ===');
    
    const instructorId = this.currentInstructorId || 
                        JSON.parse(localStorage.getItem('userInfo'))?.InstructorId;
    
    console.log('1. Instructor ID:', instructorId);
    
    if (instructorId) {
        try {
            const response = await API.request(`/Course/instructor/${instructorId}`, {
                method: 'GET'
            });
            
            console.log('2. API Response:', response);
            console.log('3. Response success:', response.success);
            
            if (response.data) {
                console.log('4. Response data type:', typeof response.data);
                console.log('5. Response data keys:', Object.keys(response.data));
                
                // Deep inspection
                console.log('6. Deep inspection of response.data:');
                console.dir(response.data);
                
                // Check for arrays at any level
                function findArrays(obj, path = '') {
                    for (const key in obj) {
                        const currentPath = path ? `${path}.${key}` : key;
                        if (Array.isArray(obj[key])) {
                            console.log(`   Found array at ${currentPath}:`, obj[key]);
                            if (obj[key].length > 0) {
                                console.log(`   First item:`, obj[key][0]);
                            }
                        } else if (obj[key] && typeof obj[key] === 'object') {
                            findArrays(obj[key], currentPath);
                        }
                    }
                }
                
                findArrays(response.data);
            }
        } catch (error) {
            console.error('API Debug Error:', error);
        }
    }
    
    console.log('7. Current cached courses:', this.instructorCourses);
    console.log('=== END DEBUG ===');
};

// ===== POPULATE DROPDOWN - FIXED FOR NaN =====
InstructorDashboard.prototype.populateDropdownWithCourses = function(courseSelect, courses) {
    console.log('📝 Populating dropdown with', courses.length, 'courses');
    
    // Clear dropdown
    courseSelect.innerHTML = '<option value="">Select a Course</option>';
    
    let validCount = 0;
    
    courses.forEach((course, index) => {
        // Extract course data
        const courseId = course.CourseId || course.courseId || course.id || course.Id;
        const courseName = course.CourseName || course.courseName || course.Name || course.name;
        const courseCode = course.CourseCode || course.courseCode || course.Code || course.code || '';
        
        // Validate course
        if (!courseId || !courseName) {
            console.warn(`⚠️ Skipping course without ID/name:`, course);
            return;
        }
        
        // **FIX: Handle NaN and invalid IDs**
        let parsedId;
        
        // Convert to number carefully
        if (courseId === 'NaN' || courseId === 'null' || courseId === 'undefined') {
            console.error(`❌ Invalid course ID string: "${courseId}" for "${courseName}"`);
            return;
        }
        
        parsedId = parseInt(courseId, 10);
        
        // **FIX: Check for NaN AFTER parsing**
        if (isNaN(parsedId)) {
            console.error(`❌ Course ID is NaN after parsing: "${courseId}" → ${parsedId}`);
            
            // Try to extract number from course code
            if (courseCode) {
                const codeMatch = courseCode.match(/\d+/);
                if (codeMatch) {
                    parsedId = parseInt(codeMatch[0], 10);
                    console.log(`🔄 Extracted ID from course code: ${parsedId}`);
                }
            }
            
            // If still NaN, use a temporary ID
            if (isNaN(parsedId)) {
                parsedId = 1000 + index; // Temporary unique ID
                console.log(`🔄 Using temporary ID: ${parsedId} for "${courseName}"`);
            }
        }
        
        // Check if ID is positive
        if (parsedId <= 0) {
            console.error(`❌ Course ID is <= 0: ${parsedId} for "${courseName}"`);
            parsedId = 1000 + index; // Use temporary ID
        }
        
        // Create option
        const option = document.createElement('option');
        const idString = String(parsedId);
        
        // **FIX: Set both value and data-course-id**
        option.value = idString;
        option.setAttribute('data-course-id', idString);
        
        // Set display text
        const displayText = courseCode ? `${courseCode} - ${courseName}` : courseName;
        option.textContent = displayText;
        
        // Add to dropdown
        courseSelect.appendChild(option);
        validCount++;
        
        console.log(`✅ Added course [${index}]: ID=${parsedId}, Text="${displayText}"`);
    });
    
    // Enable/disable dropdown
    if (validCount > 0) {
        courseSelect.disabled = false;
        console.log(`🎉 Successfully added ${validCount} courses to dropdown`);
        
        // **FIX: Auto-select first course if only one exists**
        if (validCount === 1 && courseSelect.options.length > 1) {
            courseSelect.selectedIndex = 1;
            console.log('🔄 Auto-selected the only available course');
        }
    } else {
        courseSelect.innerHTML = '<option value="">No valid courses found</option>';
        courseSelect.disabled = true;
        console.error('❌ No valid courses to display');
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


// ===== QUICK FIX FOR NaN DROPDOWN =====
InstructorDashboard.prototype.fixNanDropdown = function() {
    const courseSelect = document.getElementById('examCourse');
    if (!courseSelect) return;
    
    console.log('🔧 Fixing NaN dropdown values...');
    
    // افحص كل الخيارات
    Array.from(courseSelect.options).forEach((option, index) => {
        const value = option.value;
        const text = option.text;
        
        // إذا كانت القيمة NaN
        if (value === 'NaN' || value === 'null' || value === 'undefined') {
            console.log(`⚠️ Found invalid value in option ${index}: "${value}" - "${text}"`);
            
            // حاول استخراج رقم من النص
            const numberMatch = text.match(/\d+/);
            if (numberMatch) {
                const newValue = numberMatch[0];
                option.value = newValue;
                option.setAttribute('data-course-id', newValue);
                console.log(`✅ Fixed option ${index}: "${value}" → "${newValue}"`);
            } else {
                // استخدم index كقيمة مؤقتة
                const tempValue = String(100 + index);
                option.value = tempValue;
                option.setAttribute('data-course-id', tempValue);
                console.log(`✅ Fixed option ${index}: "${value}" → "${tempValue}" (temporary)`);
            }
        }
    });
    
    console.log('✅ Dropdown fixed');
};

// ===== GATHER EXAM DATA - COMPLETELY FIXED =====
InstructorDashboard.prototype.gatherExamData = function() {
    try {
        console.log('🔵 [gatherExamData] START');
        
        const title = document.getElementById('examTitle')?.value.trim();
        const courseSelect = document.getElementById('examCourse') || document.getElementById('examCourseSelect');
        
        if (!courseSelect) {
            console.error('❌ Course select element not found');
            return { title: '', courseId: 0, durationMinutes: 0, totalMarks: 0, passingScore: 0, description: '', questions: [] };
        }
        
        // Debug: Log all dropdown options
        console.log('📋 Dropdown options:');
        Array.from(courseSelect.options).forEach((opt, i) => {
            console.log(`  [${i}] value="${opt.value}" data-id="${opt.getAttribute('data-course-id')}" text="${opt.text}" selected: ${opt.selected}`);
        });
        
        let courseId = 0;
        
        // FIX 2: Handle ALL selected indices (not just > 0)
        if (courseSelect && courseSelect.selectedIndex >= 0) {
            const selectedOption = courseSelect.options[courseSelect.selectedIndex];
            const selectedValue = selectedOption.value;
            const selectedDataId = selectedOption.getAttribute('data-course-id');
            
            console.log('🔍 Selected option:', {
                index: courseSelect.selectedIndex,
                value: selectedValue,
                dataId: selectedDataId,
                text: selectedOption.text,
                isPlaceholder: selectedValue === '' || courseSelect.selectedIndex === 0
            });
            
            // Try to get courseId from value first
            if (selectedValue && selectedValue !== '') {
                const parsedValue = parseInt(selectedValue, 10);
                if (!isNaN(parsedValue) && parsedValue > 0) {
                    courseId = parsedValue;
                    console.log('✅ Got courseId from value:', courseId);
                }
            }
            
            // If not valid, try from data-course-id
            if ((!courseId || courseId <= 0) && selectedDataId && selectedDataId !== '') {
                const parsedDataId = parseInt(selectedDataId, 10);
                if (!isNaN(parsedDataId) && parsedDataId > 0) {
                    courseId = parsedDataId;
                    console.log('✅ Got courseId from data-course-id:', courseId);
                }
            }
            
            // If still 0 and it's not the placeholder, try to auto-select
            if (courseId === 0 && selectedValue !== '' && courseSelect.options.length > 1) {
                // Try the second option (first actual course)
                const firstCourseOption = courseSelect.options[1];
                if (firstCourseOption) {
                    const firstCourseValue = firstCourseOption.value;
                    const parsed = parseInt(firstCourseValue, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                        courseId = parsed;
                        console.log('🔄 Auto-selected first course:', courseId);
                    }
                }
            }
        }
        
        console.log('✅ Final courseId:', courseId, 'Valid?', courseId > 0);
        
        const duration = parseInt(document.getElementById('examDuration')?.value || 0, 10);
        const totalMarks = parseInt(document.getElementById('examTotalMarks')?.value || 0, 10);
        const passingScore = parseInt(document.getElementById('examPassingScore')?.value || 0, 10);
        const description = document.getElementById('examDescription')?.value.trim() || '';
        
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
            title: title || '', 
            courseId, 
            durationMinutes: duration, 
            totalMarks, 
            passingScore, 
            description, 
            questions 
        };
        
        console.log('✅ Final gathered exam data:', data);
        return data;
        
    } catch (error) {
        console.error('❌ Error in gatherExamData:', error);
        return {
            title: '',
            courseId: 0,
            durationMinutes: 0,
            totalMarks: 0,
            passingScore: 0,
            description: '',
            questions: []
        };
    }
};

// ===== SAVE EXAM - FINAL WORKING VERSION =====
InstructorDashboard.prototype.saveExam = async function() {
    console.log('🔵 [saveExam] FINAL VERSION');
    
    const btn = document.getElementById('saveExamBtn');
    const btnText = document.getElementById('examBtnText');
    const spinner = document.getElementById('examBtnSpinner');

    // Helper function to show inline error
    const showFieldError = (inputId, errorId, message) => {
        const input = document.getElementById(inputId);
        const error = document.getElementById(errorId);
        if (input && error) {
            input.classList.add('is-invalid');
            error.textContent = message;
            error.style.display = 'block';
        }
        input?.focus();
    };

    // 1. اجمع البيانات
    const data = this.gatherExamData();
    console.log('📋 Gathered exam data:', data);
    
    // 2. Frontend Validation - Comprehensive
    
    // Validate Title
    if (!data.title || !data.title.trim()) {
        showFieldError('examTitle', 'titleError', 'Exam title is required');
        return;
    }
    
    if (data.title.trim().length < 3) {
        showFieldError('examTitle', 'titleError', 'Minimum 3 characters required');
        return;
    }
    
    if (data.title.trim().length > 200) {
        showFieldError('examTitle', 'titleError', 'Maximum 200 characters allowed');
        return;
    }
    
    // Title must start with a letter
    if (!/^[a-zA-Z]/.test(data.title.trim())) {
        showFieldError('examTitle', 'titleError', 'Must start with a letter');
        return;
    }
    
    // Check for duplicate exam title
    if (this.allExams && this.allExams.length > 0) {
        const duplicateTitle = this.allExams.some(exam => 
            exam.Title?.toLowerCase() === data.title.trim().toLowerCase() ||
            exam.title?.toLowerCase() === data.title.trim().toLowerCase()
        );
        if (duplicateTitle) {
            showFieldError('examTitle', 'titleError', 'An exam with this title already exists');
            return;
        }
    }
    
    // Validate Course
    if (!data.courseId || data.courseId <= 0) {
        showFieldError('examCourse', 'courseError', 'Please select a valid course');
        return;
    }
    
    // Validate Duration
    if (!data.durationMinutes || data.durationMinutes <= 0) {
        showFieldError('examDuration', 'durationError', 'Duration is required');
        return;
    }
    
    if (data.durationMinutes < 5) {
        showFieldError('examDuration', 'durationError', 'Minimum 5 minutes required');
        return;
    }
    
    if (data.durationMinutes > 180) {
        showFieldError('examDuration', 'durationError', 'Maximum 180 minutes (3 hours)');
        return;
    }
    
    // Validate Total Marks
    if (!data.totalMarks || data.totalMarks <= 0) {
        showFieldError('examTotalMarks', 'totalMarksError', 'Total marks is required');
        return;
    }
    
    if (data.totalMarks > 100) {
        this.showToast('Error', 'Total marks cannot exceed 100', 'error');
        return;
    }
    
    if (data.totalMarks > 100) {
        showFieldError('examTotalMarks', 'totalMarksError', 'Maximum 100 marks allowed');
        return;
    }
    
    // Validate Passing Score
    if (!data.passingScore || data.passingScore <= 0) {
        showFieldError('examPassingScore', 'passingScoreError', 'Passing score is required');
        return;
    }
    
    if (data.passingScore > data.totalMarks) {
        showFieldError('examPassingScore', 'passingScoreError', 'Cannot exceed total marks');
        return;
    }
    
    // Validate Questions
    if (!data.questions || data.questions.length === 0) {
        this.showToast('Error', 'Please add at least one question', 'error');
        return;
    }
    
    if (data.questions.length > 100) {
        this.showToast('Error', 'Cannot add more than 100 questions', 'error');
        return;
    }
    
    // 3. تحقق من الأسئلة
    console.log(`🔍 Validating ${data.questions.length} questions...`);
    
    for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];
        
        if (!q.text || !q.text.trim()) {
            this.showToast('Error', `Question ${i+1}: Text is required`, 'error');
            return;
        }
        
        if (q.text.trim().length < 5) {
            this.showToast('Error', `Question ${i+1}: Text must be at least 5 characters`, 'error');
            return;
        }
        
        if (q.text.trim().length > 1000) {
            this.showToast('Error', `Question ${i+1}: Text cannot exceed 1000 characters`, 'error');
            return;
        }
        
        const validOptions = q.options.filter(o => o.text && o.text.trim());
        if (validOptions.length < 2) {
            this.showToast('Error', `Question ${i+1}: At least 2 options required`, 'error');
            return;
        }
        
        if (validOptions.length > 10) {
            this.showToast('Error', `Question ${i+1}: Cannot have more than 10 options`, 'error');
            return;
        }
        
        // Validate each option length
        for (let j = 0; j < validOptions.length; j++) {
            if (validOptions[j].text.trim().length < 1) {
                this.showToast('Error', `Question ${i+1}, Option ${j+1}: Text is required`, 'error');
                return;
            }
            if (validOptions[j].text.trim().length > 500) {
                this.showToast('Error', `Question ${i+1}, Option ${j+1}: Text cannot exceed 500 characters`, 'error');
                return;
            }
        }
        
        const hasCorrect = validOptions.some(o => o.isCorrect);
        if (!hasCorrect) {
            this.showToast('Error', `Question ${i+1}: Mark at least one correct answer`, 'error');
            return;
        }
        
        // Check for duplicate options in the same question
        const optionTexts = validOptions.map(o => o.text.trim().toLowerCase());
        const uniqueOptions = new Set(optionTexts);
        if (optionTexts.length !== uniqueOptions.size) {
            this.showToast('Error', `Question ${i+1}: Duplicate options found. Each option must be unique.`, 'error');
            return;
        }
    }
    
    console.log('✅ All validations passed successfully');

    // 4. إنشاء payload - استخدم الـ ID الموجود في الـ dropdown كما هو
    const examPayload = {
        title: data.title.trim(),
        courseId: data.courseId, // استخدم القيمة كما هي
        duration: data.durationMinutes,
        totalPoints: data.totalMarks,
       // examDate: new Date().toISOString(),
       examDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        description: data.description || ""
    };

    console.log('📤 Sending exam data to server:', examPayload);
    console.log(`📝 Will add ${data.questions.length} questions after exam creation`);

    try {
        // تعطيل الزر وإظهار التحميل
        if (btn) btn.disabled = true;
        if (spinner) spinner.classList.remove('d-none');
        if (btnText) btnText.textContent = 'Creating Exam...';

        // 5. أرسل البيانات إلى السيرفر
        const examResponse = await API.exam.create(examPayload);
        console.log('📥 Server response:', examResponse);

        // 6. تحقق من الاستجابة
        if (!examResponse.success) {
            let errorMessage = examResponse.error || examResponse.Message || 'Failed to create exam';
            
            // إذا كان خطأ 500، المشكلة في الـ courseId
            if (examResponse.status === 500) {
                errorMessage = 'Course ID ' + data.courseId + ' not found in database. ';
                errorMessage += 'Please contact administrator to fix course data.';
            }
            
            throw new Error(errorMessage);
        }

        // 7. احصل على examId من الاستجابة
        console.log('🔍 Extracting ExamId from response...');
        console.log('📦 examResponse structure:', examResponse);
        console.log('📦 examResponse.data structure:', examResponse.data);
        
        let examId = examResponse.data?.ExamId || 
                    examResponse.data?.examId || 
                    examResponse.data?.id ||
                    examResponse.data?.Data?.ExamId ||
                    examResponse.data?.data?.ExamId ||
                    examResponse.data?.data?.examId ||
                    examResponse.data?.InstructorId ||
                    examResponse.data?.instructorId ||
                    examResponse.data?.data?.InstructorId ||
                    examResponse.data?.data?.instructorId; // Fallback for nested data

        console.log('🆔 Extracted ExamId:', examId, '(type:', typeof examId, ')');

        if (!examId || examId <= 0) {
            console.error('❌ No valid exam ID in response!');
            console.error('📋 Full response:', JSON.stringify(examResponse, null, 2));
            throw new Error('Exam created but no valid ID returned. Cannot add questions.');
        }

        console.log('✅ Exam created successfully, ID:', examId);

        // 8. أضف الأسئلة إذا كان examId موجوداً
        if (examId > 0 && data.questions && data.questions.length > 0) {
            console.log(`📝 Starting to add ${data.questions.length} questions...`);
            if (btnText) btnText.textContent = 'Adding Questions...';
            
            let questionsAdded = 0;
            
            for (let i = 0; i < data.questions.length; i++) {
                const q = data.questions[i];
                const validOptions = q.options.filter(o => o.text && o.text.trim());
                
                if (validOptions.length < 2) {
                    console.warn(`⚠️ Question ${i+1} has less than 2 valid options, skipping...`);
                    continue;
                }
                
                const questionPayload = {
                    examId: examId,
                    questionText: q.text.trim(),
                    orderNumber: i + 1,
                    score: Math.floor(data.totalMarks / data.questions.length), // توزيع العلامات
                    courseId: data.courseId,
                    mcqOptions: validOptions.map((opt, idx) => ({
                        optionText: opt.text.trim(),
                        orderNumber: idx + 1,
                        isCorrect: opt.isCorrect || false
                    }))
                };

                console.log(`➕ Adding question ${i+1}/${data.questions.length}:`, questionPayload);
                
                try {
                    const qResponse = await API.exam.addQuestion(questionPayload);
                    console.log(`📥 Question ${i+1} response:`, qResponse);
                    
                    if (qResponse.success) {
                        questionsAdded++;
                        console.log(`✅ Question ${i+1} added successfully`);
                    } else {
                        console.error(`❌ Failed to add question ${i+1}:`, qResponse.error || qResponse.message);
                    }
                } catch (qError) {
                    console.error(`❌ Exception adding question ${i+1}:`, qError);
                    console.error('Error details:', qError.message, qError.stack);
                }
            }
            
            console.log(`\n📊 SUMMARY: ${questionsAdded}/${data.questions.length} questions added successfully`);
            
            if (questionsAdded === 0 && data.questions.length > 0) {
                console.error('⚠️ WARNING: No questions were added!');
            }
        }

        // 9. اعرض رسالة النجاح
        this.showToast('Success', 'Exam created successfully!', 'success');
        
        // 10. أعد تعيين الفورم وأغلق المودال
        this.resetExamForm();
        
        const modalEl = document.getElementById('examModal');
        if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
        
        // 11. أعد تحميل قائمة الامتحانات
        setTimeout(() => {
            this.loadExams();
        }, 1000);

    } catch (error) {
        console.error('❌ Error creating exam:', error);
        
        // رسالة خطأ ودية
        let userMessage = error.message;
        
        if (error.message.includes('Course ID') || error.message.includes('course')) {
            userMessage = 'The selected course does not exist in the system. ';
            userMessage += 'Please contact your administrator to fix the courses data.';
            
            // اعرض الكورسات المتاحة للمساعدة
            console.log('Available course IDs from dropdown:');
            const select = document.getElementById('examCourse');
            if (select) {
                for (let i = 1; i < select.options.length; i++) {
                    console.log(`  - ${select.options[i].text} (ID: ${select.options[i].value})`);
                }
            }
        }
        
        this.showToast('Error', userMessage, 'error');
        
    } finally {
        // 12. أعد تفعيل الزر
        if (btn) btn.disabled = false;
        if (spinner) spinner.classList.add('d-none');
        if (btnText) btnText.textContent = 'Save Exam';
    }
};

// ===== SIMPLE GATHER EXAM DATA =====
InstructorDashboard.prototype.gatherExamData = function() {
    try {
        const title = document.getElementById('examTitle')?.value.trim() || '';
        const courseSelect = document.getElementById('examCourse');
        
        let courseId = 0;
        if (courseSelect && courseSelect.selectedIndex > 0) {
            courseId = parseInt(courseSelect.value) || 0;
        }
        
        const duration = parseInt(document.getElementById('examDuration')?.value || 0);
        const totalMarks = parseInt(document.getElementById('examTotalMarks')?.value || 0);
        const passingScore = parseInt(document.getElementById('examPassingScore')?.value || 0);
        const description = document.getElementById('examDescription')?.value.trim() || '';
        
        const questions = [];
        const container = document.getElementById('questionsContainer');
        
        if (container) {
            const questionCards = container.querySelectorAll('.question-card');
            questionCards.forEach(card => {
                const questionText = card.querySelector('.question-text')?.value.trim() || '';
                
                if (questionText) {
                    const options = [];
                    const optionItems = card.querySelectorAll('.option-item');
                    
                    optionItems.forEach(option => {
                        const optionText = option.querySelector('.option-text')?.value.trim() || '';
                        const isCorrect = option.querySelector('input[type="radio"]')?.checked || false;
                        
                        if (optionText) {
                            options.push({
                                text: optionText,
                                isCorrect: isCorrect
                            });
                        }
                    });
                    
                    if (options.length >= 2) {
                        questions.push({
                            text: questionText,
                            options: options
                        });
                    }
                }
            });
        }

        return {
            title: title,
            courseId: courseId,
            durationMinutes: duration,
            totalMarks: totalMarks,
            passingScore: passingScore,
            description: description,
            questions: questions
        };
        
    } catch (error) {
        console.error('Error gathering exam data:', error);
        return {
            title: '',
            courseId: 0,
            durationMinutes: 0,
            totalMarks: 0,
            passingScore: 0,
            description: '',
            questions: []
        };
    }
};

// ===== RESET EXAM FORM =====
InstructorDashboard.prototype.resetExamForm = function() {
    console.log('🔄 Resetting exam form...');
    
    const form = document.getElementById('examForm');
    if (form) form.reset();
    
    const container = document.getElementById('questionsContainer');
    if (container) container.innerHTML = '';
    
    const btnText = document.getElementById('examBtnText');
    if (btnText) btnText.textContent = 'Save Exam';
    
    document.getElementById('examBtnSpinner')?.classList.add('d-none');
    
    console.log('✅ Form reset complete');
};

// ===== SETUP EXAM FORM VALIDATION LISTENERS =====
InstructorDashboard.prototype.setupExamFormListeners = function() {
    const totalMarksInput = document.getElementById('examTotalMarks');
    const passingScoreInput = document.getElementById('examPassingScore');
    const titleInput = document.getElementById('examTitle');
    const durationInput = document.getElementById('examDuration');
    const courseSelect = document.getElementById('examCourse');
    
    // Helper function to show inline error
    const showFieldError = (inputId, errorId, message) => {
        const input = document.getElementById(inputId);
        const error = document.getElementById(errorId);
        if (input && error) {
            input.classList.add('is-invalid');
            error.textContent = message;
            error.style.display = 'block';
        }
    };
    
    // Helper function to clear inline error
    const clearFieldError = (inputId, errorId) => {
        const input = document.getElementById(inputId);
        const error = document.getElementById(errorId);
        if (input && error) {
            input.classList.remove('is-invalid');
            error.textContent = '';
            error.style.display = 'none';
        }
    };
    
    // Auto-calculate default passing score (50% of total marks)
    if (totalMarksInput && passingScoreInput) {
        totalMarksInput.addEventListener('input', () => {
            clearFieldError('examTotalMarks', 'totalMarksError');
            const totalMarks = parseInt(totalMarksInput.value) || 0;
            
            if (totalMarks > 100) {
                showFieldError('examTotalMarks', 'totalMarksError', 'Maximum is 100 marks');
                totalMarksInput.value = 100;
                return;
            }
            
            if (totalMarks > 0) {
                const defaultPassing = Math.floor(totalMarks / 2);
                // Only auto-set if user hasn't manually changed it or it's still 0
                const currentPassing = parseInt(passingScoreInput.value) || 0;
                if (currentPassing === 0 || currentPassing === Math.floor((parseInt(totalMarksInput.dataset.previousValue) || 0) / 2)) {
                    passingScoreInput.value = defaultPassing;
                }
                passingScoreInput.max = totalMarks;
                totalMarksInput.dataset.previousValue = totalMarks;
            }
        });
        
        // Validate passing score doesn't exceed total marks
        passingScoreInput.addEventListener('input', () => {
            clearFieldError('examPassingScore', 'passingScoreError');
            const totalMarks = parseInt(totalMarksInput.value) || 0;
            const passingScore = parseInt(passingScoreInput.value) || 0;
            
            if (passingScore > totalMarks) {
                showFieldError('examPassingScore', 'passingScoreError', 'Cannot exceed total marks');
                passingScoreInput.value = totalMarks;
            }
        });
    }
    
    // Validate title
    if (titleInput) {
        // Create character counter element if it doesn't exist
        let charCounter = titleInput.parentElement.querySelector('.char-counter');
        if (!charCounter) {
            charCounter = document.createElement('small');
            charCounter.className = 'char-counter text-muted float-end';
            const existingSmall = titleInput.parentElement.querySelector('small');
            if (existingSmall) {
                existingSmall.insertAdjacentElement('beforebegin', charCounter);
            } else {
                titleInput.insertAdjacentElement('afterend', charCounter);
            }
        }
        
        const updateCharCounter = () => {
            const length = titleInput.value.length;
            charCounter.textContent = `${length}/200`;
            if (length > 200) {
                charCounter.classList.add('text-danger');
                charCounter.classList.remove('text-muted');
            } else if (length > 180) {
                charCounter.classList.add('text-warning');
                charCounter.classList.remove('text-muted', 'text-danger');
            } else {
                charCounter.classList.add('text-muted');
                charCounter.classList.remove('text-warning', 'text-danger');
            }
        };
        
        titleInput.addEventListener('input', () => {
            clearFieldError('examTitle', 'titleError');
            updateCharCounter();
        });
        updateCharCounter(); // Initialize
        
        titleInput.addEventListener('blur', () => {
            const title = titleInput.value.trim();
            if (title && !/^[a-zA-Z]/.test(title)) {
                showFieldError('examTitle', 'titleError', 'Title must start with a letter');
            } else if (title.length < 3 && title.length > 0) {
                showFieldError('examTitle', 'titleError', 'Minimum 3 characters required');
            }
        });
    }
    
    // Validate duration range
    if (durationInput) {
        durationInput.addEventListener('input', () => {
            clearFieldError('examDuration', 'durationError');
            const duration = parseInt(durationInput.value) || 0;
            if (duration > 180) {
                showFieldError('examDuration', 'durationError', 'Maximum is 180 minutes (3 hours)');
                durationInput.value = 180;
            } else if (duration < 5 && duration > 0) {
                showFieldError('examDuration', 'durationError', 'Minimum is 5 minutes');
            }
        });
        
        durationInput.addEventListener('blur', () => {
            const duration = parseInt(durationInput.value) || 0;
            if (duration < 5 && duration > 0) {
                durationInput.value = 5;
            }
        });
    }
    
    // Clear course error on change
    if (courseSelect) {
        courseSelect.addEventListener('change', () => {
            clearFieldError('examCourse', 'courseError');
        });
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
