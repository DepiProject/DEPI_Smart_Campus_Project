// =====================================================
// API Service Module
// Handles all API communication
// =====================================================

const API = {
     baseURL: 'https://smartcampus-university.runasp.net/api',
    //baseURL: 'http://localhost:7034/swagger',

    // Get token dynamically to always use the latest
    get token() {
        return localStorage.getItem('authToken');
    },

    // Set the API base URL
    setBaseURL(url) {
        this.baseURL = url;
    },

    // Get authorization headers
    getHeaders(includeAuth = true, additionalHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...additionalHeaders
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    },

    // Generic fetch method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getHeaders(options.auth !== false, options.headers);
        
        const config = {
            method: options.method || 'GET',
            headers: headers
        };

        // Add body if present
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        console.log('📤 API Request:', { 
            url, 
            method: config.method, 
            headers: config.headers,
            body: config.body 
        });

        // Retry on network-level failures (e.g., "Failed to fetch")
        const maxNetworkRetries = 2;
        let attempt = 0;
        let lastError = null;
        let response = null;

        while (attempt <= maxNetworkRetries) {
            try {
                if (attempt > 0) console.warn(`🔁 API request retry ${attempt} for ${url}`);
                response = await fetch(url, config);
                lastError = null;
                break; // success
            } catch (netErr) {
                lastError = netErr;
                console.error(`❌ Network error on API request (attempt ${attempt}):`, netErr);
                attempt++;
                // simple backoff
                await new Promise(r => setTimeout(r, 300 * attempt));
            }
        }

        if (!response && lastError) {
            console.error('❌ API Network Failure after retries:', lastError);
            return {
                success: false,
                status: 0,
                error: lastError.message || 'Network error',
                Message: lastError.message || 'Network error',
                data: null
            };
        }
        
        try {
            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const textData = await response.text();
                console.log('📄 Non-JSON Response (raw text):', textData);
                data = textData;
            }

            console.log('📥 API Response:', { 
                status: response.status, 
                statusText: response.statusText,
                ok: response.ok, 
                data,
                dataType: typeof data
            });

            if (!response.ok) {
                // Extract error details from response
                let errorMessage = `HTTP ${response.status}`;
                let errorDetails = data;
                
                if (typeof data === 'object') {
                    // Priority 1: Check for response.data.message field (our custom error format)
                    if (data.message) {
                        errorMessage = data.message;
                    }
                    // Priority 2: Check for ASP.NET Message field
                    else if (data.Message) {
                        errorMessage = data.Message;
                    }
                    // Priority 3: Check for ASP.NET validation errors format
                    else if (data.errors) {
                        const allErrors = [];
                        for (const key in data.errors) {
                            if (Array.isArray(data.errors[key])) {
                                allErrors.push(...data.errors[key]);
                            }
                        }
                        if (allErrors.length > 0) {
                            errorMessage = allErrors.join(', ');
                        }
                    }
                    // Priority 4: Check for Error field
                    else if (data.Error || data.error) {
                        errorMessage = data.Error || data.error;
                    }
                    
                    errorDetails = data;
                }
                
                console.error('❌ API Error Response:', { 
                    status: response.status, 
                    statusText: response.statusText,
                    data,
                    headers: {
                        contentType: response.headers.get('content-type'),
                        authorization: response.headers.get('authorization')
                    }
                });
                
                return {
                    success: false,
                    status: response.status,
                    error: errorMessage,
                    Message: errorMessage,
                    data: errorDetails,
                    Errors: data.Errors || []
                };
            }

            return {
                success: true,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('❌ API Error:', error);
            
            // Network errors or fetch failures
            return {
                success: false,
                status: error.status || 0,
                error: error.message || 'Network error',
                Message: error.message || 'Network error',
                data: error.data || null
            };
        }
    },

    // Authentication Endpoints
    auth: {
        // Login
        async login(email, password) {
            console.log('🔐 Attempting login with:', { email });
            
            const response = await API.request('/Auth/login', {
                method: 'POST',
                body: {
                    email: email,
                    password: password
                },
                auth: false // No token needed for login
            });

            console.log('✅ Login Response:', response);
            console.log('📊 Response Data:', response.data);

            if (response.success && response.data && response.data.token) {
                // Store token
                API.token = response.data.token;
                localStorage.setItem('authToken', response.data.token);
                console.log('✔️ Token stored successfully');

                // Decode and store user info
                const userInfo = API.decodeToken(response.data.token);
                console.log('👤 User Info:', userInfo);
                
                if (userInfo) {
                    localStorage.setItem('userInfo', JSON.stringify(userInfo));
                }
            } else {
                console.warn('⚠️ Login failed - no token in response');
            }

            return response;
        },

        // Logout
        logout() {
            API.token = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');
        }
    },

    // Helper: Decode JWT Token
    decodeToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Token decode error:', error);
            return null;
        }
    },

    // Helper: Get user role from token
    getUserRole() {
        const userInfo = this.decodeToken(this.token);
        if (userInfo) {
            console.log('👤 All claims in token:', userInfo);
            
            // Try multiple role claim names (JWT standard uses different formats)
            const role = userInfo.Role || 
                         userInfo.role || 
                         userInfo['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                         userInfo['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'];
            
            console.log('🎯 Extracted role:', role);
            return role || null;
        }
        return null;
    },

    // Helper: Check if token is expired
    isTokenExpired() {
        const userInfo = this.decodeToken(this.token);
        if (userInfo && userInfo.exp) {
            return Date.now() >= userInfo.exp * 1000;
        }
        return true;
    },

    // Helper: Check if user is authenticated
    isAuthenticated() {
        return this.token !== null && !this.isTokenExpired();
    },

    // Helper: Get stored user info
    getUserInfo() {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    },

    // ===== STUDENT ENDPOINTS =====
    student: {
        // Check if phone number is unique
        async checkPhoneUnique(phoneNumber) {
            return API.request(`/Student/check-phone/${encodeURIComponent(phoneNumber)}`, {
                method: 'GET'
            });
        },

        // Get all students (Admin only)
        async getAll(pageNumber = 1, pageSize = 10) {
            return API.request(`/Student?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
                method: 'GET'
            });
        },

        // Get student by ID (Admin only)
        async getById(id) {
            return API.request(`/Student/${id}`, {
                method: 'GET'
            });
        },

        // Get student by department (Admin only)
        async getByDepartment(departmentId) {
            return API.request(`/Student/department/${departmentId}`, {
                method: 'GET'
            });
        },

        // Get student by code (Admin only)
        async getByCode(studentCode) {
            return API.request(`/Student/code/${studentCode}`, {
                method: 'GET'
            });
        },

        // Get current student's profile (Student only)
        async getMyProfile() {
            return API.request('/Student/me', {
                method: 'GET'
            });
        },

        // Update current student's profile (Student only)
        async updateMyProfile(studentData) {
            return API.request('/Student/me', {
                method: 'PUT',
                body: studentData
            });
        },

        // Create student (Admin only)
        async create(studentData) {
            return API.request('/Student', {
                method: 'POST',
                body: studentData
            });
        },

        // Update student (Admin only)
        async update(id, studentData) {
            return API.request(`/Student/${id}`, {
                method: 'PUT',
                body: studentData
            });
        },

        // Archive student (Admin only) - SOFT DELETE (this is what the DELETE endpoint does)
        async archive(id) {
            return API.request(`/Student/${id}`, {
                method: 'DELETE'
            });
        },

        // Alias for backwards compatibility
        async delete(id) {
            return this.archive(id);
        },

        // Soft delete operations
        async getAllIncludingDeleted() {
            const timestamp = new Date().getTime();
            return API.request(`/Student/all-including-deleted?_t=${timestamp}`, {
                method: 'GET'
            });
        },

        async restore(id) {
            return API.request(`/Student/${id}/restore`, {
                method: 'POST'
            });
        },

        async permanentDelete(id) {
            return API.request(`/Student/${id}/permanent`, {
                method: 'DELETE'
            });
        },

        async canPermanentlyDelete(id) {
            return API.request(`/Student/${id}/can-permanently-delete`, {
                method: 'GET'
            });
        }
    },

    // ===== INSTRUCTOR ENDPOINTS =====
    instructor: {
        // Check if phone number is unique
        async checkPhoneUnique(phoneNumber) {
            return API.request(`/Instructor/check-phone/${encodeURIComponent(phoneNumber)}`, {
                method: 'GET'
            });
        },

        // Get all instructors (Admin only)
        async getAll(pageNumber = 1, pageSize = 10) {
            return API.request(`/Instructor?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
                method: 'GET'
            });
        },

        // Get instructor by ID (Admin only)
        async getById(id) {
            return API.request(`/Instructor/${id}`, {
                method: 'GET'
            });
        },

        // Get instructor by department (Admin only)
        async getByDepartment(departmentId) {
            return API.request(`/Instructor/department/${departmentId}`, {
                method: 'GET'
            });
        },

        // Get current instructor's profile (Instructor only)
        async getMyProfile() {
            return API.request('/Instructor/me', {
                method: 'GET'
            });
        },

        // Update current instructor's profile (Instructor only)
        async updateMyProfile(instructorData) {
            return API.request('/Instructor/me', {
                method: 'PUT',
                body: instructorData
            });
        },

        // Create instructor (Admin only)
        async create(instructorData) {
            return API.request('/Instructor', {
                method: 'POST',
                body: instructorData
            });
        },

        // Update instructor (Admin only)
        async update(id, instructorData) {
            return API.request(`/Instructor/${id}`, {
                method: 'PUT',
                body: instructorData
            });
        },

        // Archive instructor (Admin only) - SOFT DELETE (preserves data)
        async archive(id) {
            console.log('📦 API.instructor.archive called for ID:', id);
            return API.request(`/Instructor/${id}/archive`, {
                method: 'POST'
            });
        },

        // Delete instructor permanently (Admin only) - HARD DELETE (removes from database)
        async delete(id) {
            console.log('🔥 API.instructor.delete (PERMANENT) called for ID:', id);
            console.log('🌐 Will call endpoint: /Instructor/${id}/permanent with DELETE method');
            return API.request(`/Instructor/${id}/permanent`, {
                method: 'DELETE'
            });
        },

        // Soft delete operations
        async getAllIncludingDeleted() {
            const timestamp = new Date().getTime();
            return API.request(`/Instructor/all-including-deleted?_t=${timestamp}`, {
                method: 'GET'
            });
        },

        async restore(id) {
            return API.request(`/Instructor/${id}/restore`, {
                method: 'POST'
            });
        },

        async permanentDelete(id) {
            const instructorId = parseInt(id, 10);
            return API.request(`/Instructor/${instructorId}/permanent`, {
                method: 'DELETE'
            });
        },

        async canPermanentlyDelete(id) {
            const instructorId = parseInt(id, 10);
            return API.request(`/Instructor/${instructorId}/can-permanently-delete`, {
                method: 'GET'
            });
        }
    },

    // ===== ADMIN ENDPOINTS =====
    admin: {
        // Get current admin's profile (Admin only)
        async getMyProfile() {
            return API.request('/Auth/me', {
                method: 'GET'
            });
        },

        // Update current admin's profile (Admin only)
        async updateMyProfile(adminData) {
            return API.request('/Auth/update-profile', {
                method: 'PUT',
                body: adminData
            });
        }
    },

    // ===== DEPARTMENT ENDPOINTS =====
    department: {
        // Get all departments
        async getAll(pageNumber = 1, pageSize = 10) {
            return API.request(`/Department?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
                method: 'GET'
            });
        },

        // Get department by ID
        async getById(id) {
            return API.request(`/Department/${id}`, {
                method: 'GET'
            });
        },

        // Create department
        async create(departmentData) {
            return API.request('/Department', {
                method: 'POST',
                body: departmentData
            });
        },

        // Update department
        async update(id, departmentData) {
            return API.request(`/Department/${id}`, {
                method: 'PUT',
                body: departmentData
            });
        },

        // Archive department (soft delete)
        async archive(id) {
            return API.request(`/Department/${id}`, {
                method: 'DELETE'
            });
        },

        // Alias for backwards compatibility
        async delete(id) {
            return this.archive(id);
        },

        // Soft delete operations
        async getAllIncludingDeleted() {
            const timestamp = new Date().getTime();
            return API.request(`/Department/all-including-deleted?_t=${timestamp}`, {
                method: 'GET'
            });
        },

        async restore(id) {
            return API.request(`/Department/${id}/restore`, {
                method: 'POST'
            });
        },

        async permanentDelete(id) {
            return API.request(`/Department/${id}/permanent`, {
                method: 'DELETE'
            });
        },

        async canPermanentlyDelete(id) {
            return API.request(`/Department/${id}/can-permanently-delete`, {
                method: 'GET'
            });
        }
    },

    // ===== COURSE ENDPOINTS =====
    course: {
        // Get all courses
        async getAll(pageNumber = 1, pageSize = 10) {
            return API.request(`/Course?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
                method: 'GET'
            });
        },

        // Get all courses including deleted (Admin only)
        async getAllIncludingDeleted() {
            const timestamp = new Date().getTime();
            return API.request(`/Course/all-including-deleted?_t=${timestamp}`, {
                method: 'GET'
            });
        },

        // Get course by ID
        async getById(id) {
            return API.request(`/Course/${id}`, {
                method: 'GET'
            });
        },

        // Create course
        async create(courseData) {
            return API.request('/Course', {
                method: 'POST',
                body: courseData
            });
        },

        // Update course
        async update(id, courseData) {
            return API.request(`/Course/${id}`, {
                method: 'PUT',
                body: courseData
            });
        },

        // Archive course (soft delete - marks as deleted)
        async archive(id) {
            return API.request(`/Course/${id}`, {
                method: 'DELETE'
            });
        },

        // Alias for backwards compatibility  
        async delete(id) {
            return this.archive(id);
        },

        // Permanently delete course (removes from database)
        async permanentDelete(id) {
            return API.request(`/Course/${id}/permanent`, {
                method: 'DELETE'
            });
        },

        // Restore soft-deleted course
        async restore(id) {
            return API.request(`/Course/${id}/restore`, {
                method: 'POST'
            });
        },

        // Restore course with instructor reassignment
        async restoreWithInstructor(id, instructorId) {
            return API.request(`/Course/${id}/restore-with-instructor`, {
                method: 'POST',
                body: { instructorId }
            });
        },

        // Get available instructors for course restoration
        async getAvailableInstructorsForRestore(id) {
            return API.request(`/Course/${id}/available-instructors-for-restore`, {
                method: 'GET'
            });
        },

        // Check if course can be permanently deleted
        async canPermanentlyDelete(id) {
            return API.request(`/Course/${id}/can-permanently-delete`, {
                method: 'GET'
            });
        }
    },

    // ===== ENROLLMENT ENDPOINTS =====
    enrollment: {
        // Get all enrollments (ACTIVE ONLY - excludes hard-deleted)
        async getAll(pageNumber = 1, pageSize = 100) {
            // Add cache-busting to ensure fresh data
            const timestamp = new Date().getTime();
            const random = Math.random();
            return API.request(`/Enrollment?pageNumber=${pageNumber}&pageSize=${pageSize}&_t=${timestamp}&_r=${random}`, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        },

        // Get enrollment by student ID
        async getByStudentId(studentId) {
            return API.request(`/Enrollment/student/${studentId}`, {
                method: 'GET'
            });
        },

        // Get enrollments by course ID
        async getByCourseId(courseId) {
            return API.request(`/Enrollment/course/${courseId}`, {
                method: 'GET'
            });
        },

        // Get all enrollments including deleted
        async getAllIncludingDeleted() {
            // Add cache-busting timestamp to prevent browser caching
            const timestamp = new Date().getTime();
            // Add random number for extra cache busting
            const random = Math.random();
            return API.request(`/Enrollment/all-including-deleted?_t=${timestamp}&_r=${random}`, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        },

        // Create enrollment (student enrolls in course)
        async create(enrollmentData) {
            return API.request('/Enrollment', {
                method: 'POST',
                body: enrollmentData
            });
        },

        // Delete enrollment (student drops course)
        async delete(enrollmentId) {
            return API.request(`/Enrollment/${enrollmentId}`, {
                method: 'DELETE'
            });
        },

        // Soft delete enrollment (Admin only)
        async softDelete(enrollmentId) {
            return API.request(`/Enrollment/soft-delete/${enrollmentId}`, {
                method: 'DELETE'
            });
        },

        // Hard delete enrollment (Admin only - permanent)
        async hardDelete(enrollmentId) {
            return API.request(`/Enrollment/hard-delete/${enrollmentId}`, {
                method: 'DELETE'
            });
        },

        // Restore soft-deleted enrollment (Admin only)
        async restore(enrollmentId) {
            return API.request(`/Enrollment/${enrollmentId}/restore`, {
                method: 'POST'
            });
        },

        // Get student's grade for a course
        async getGrade(studentId, courseId) {
            return API.request(`/Enrollment/student/${studentId}/course/${courseId}/grade`, {
                method: 'GET'
            });
        },

        // Approve enrollment (Admin only)
        async approve(enrollmentId) {
            return API.request(`/Enrollment/${enrollmentId}/approve`, {
                method: 'POST'
            });
        },

        // Reject enrollment (Admin only)
        async reject(enrollmentId) {
            return API.request(`/Enrollment/${enrollmentId}/reject`, {
                method: 'POST'
            });
        }
    },

    // ===== EXAM ENDPOINTS =====
    exam: {
        // Get all exams
        async getAll(pageNumber = 1, pageSize = 10) {
            return API.request(`/Exam?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
                method: 'GET'
            });
        },

        // Get exam by ID
        async getById(id) {
            return API.request(`/Exam/${id}`, {
                method: 'GET'
            });
        },

        // Create exam
        async create(examData) {
            return API.request('/Exam', {
                method: 'POST',
                body: examData
            });
        },

        // Update exam
        async update(id, examData) {
            return API.request(`/Exam/${id}`, {
                method: 'PUT',
                body: examData
            });
        },

        // Delete exam
        async delete(id) {
            return API.request(`/Exam/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // ===== ATTENDANCE ENDPOINTS =====
    attendance: {
        // Get student attendance history
        async getStudentHistory(studentId) {
            return API.request(`/Attendance/student/${studentId}`, {
                method: 'GET'
            });
        },

        // Get attendance summary for student
        async getSummary(studentId, courseId = null) {
            const params = courseId ? `?courseId=${courseId}` : '';
            return API.request(`/Attendance/summary/${studentId}${params}`, {
                method: 'GET'
            });
        },

        // Filter attendance records
        async filter(studentId = null, courseId = null, from = null, to = null) {
            const params = new URLSearchParams();
            if (studentId) params.append('studentId', studentId);
            if (courseId) params.append('courseId', courseId);
            if (from) params.append('from', from);
            if (to) params.append('to', to);
            
            return API.request(`/Attendance/filter?${params.toString()}`, {
                method: 'GET'
            });
        },

        // Get attendance by ID
        async getById(id) {
            return API.request(`/Attendance/${id}`, {
                method: 'GET'
            });
        },

        // Mark attendance (Instructor)
        async markAttendance(attendanceData) {
            // Ensure property names are PascalCase for C# backend
            const dto = {
                StudentId: attendanceData.studentId || attendanceData.StudentId,
                CourseId: attendanceData.courseId || attendanceData.CourseId,
                Date: attendanceData.date || attendanceData.Date,
                Status: attendanceData.status || attendanceData.Status
            };
            
            // Ensure Date is in DateTime format if it's just a date string
            if (typeof dto.Date === 'string' && !dto.Date.includes('T')) {
                dto.Date = dto.Date + 'T00:00:00';
            }
            
            return API.request('/Attendance/mark', {
                method: 'POST',
                body: dto
            });
        },

        // Update attendance status (Instructor)
        async updateStatus(id, status) {
            return API.request(`/Attendance/${id}`, {
                method: 'PUT',
                body: { status }
            });
        },

        // Delete attendance record (Instructor)
        async delete(id) {
            return API.request(`/Attendance/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // ===== SUBMISSION ENDPOINTS =====
    submission: {
        // Start exam
        async startExam(examId, studentId) {
            return API.request('/Submission/start', {
                method: 'POST',
                body: {
                    examId: examId,
                    studentId: studentId
                }
            });
        },

        // Submit exam
        async submitExam(submissionData) {
            return API.request('/Submission/submit', {
                method: 'POST',
                body: submissionData
            });
        },

        // Get exam result
        async getResult(examId, studentId) {
            return API.request(`/Submission/result/${examId}/${studentId}`, {
                method: 'GET'
            });
        },

        // Get submission status
        async getStatus(examId, studentId) {
            return API.request(`/Submission/status/${examId}/${studentId}`, {
                method: 'GET'
            });
        }
    }
};
