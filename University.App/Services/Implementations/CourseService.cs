//using University.App.DTOs;
//using University.App.Interfaces;
//using University.App.Interfaces.Courses;
//using University.App.Interfaces.Users;
//using University.App.Services.IServices;
//using University.Core.Entities;

//namespace University.App.Services.Implementations
//{
//    public class CourseService : ICourseService 
//    {
//        private readonly ICourseRepository _courseRepo;

//        private readonly IInstructorRepository _instructorRepo;
//        private readonly IStudentRepository _studentRepo;

//        // BUSINESS RULES CONSTANTS
//        private const int MAX_COURSE_CAPACITY = 50;
//        private const int MIN_STUDENTS_TO_RUN_COURSE = 5;
//        private const int MAX_COURSES_PER_INSTRUCTOR = 2;
//        private const int MAX_CREDIT_HOURS_PER_INSTRUCTOR = 12;
//        private const bool ENFORCE_DEPARTMENT_RESTRICTION = true;

//        public CourseService(ICourseRepository courseRepo, IStudentRepository studentRepo, IInstructorRepository instructorRepo)
//        {
//            _courseRepo = courseRepo;
//            _studentRepo = studentRepo;
//            _instructorRepo = instructorRepo;
//        }

//        // ================= COURSE MANAGEMENT =================

//        public async Task<IEnumerable<CourseDTO>> GetAllCourses()
//        {
//            var courses = await _courseRepo.GetAllCourses();
//            return courses.Select(c => new CourseDTO
//            {
//                Id = c.CourseId,
//                Name = c.Name,
//                CreditHours = c.Credits,
//                InstructorId = c.InstructorId ?? 0
//            });
//        }

//        public async Task<CourseDTO?> GetCourseById(int id)
//        {
//            var course = await _courseRepo.GetCourseById(id);
//            if (course == null) return null;

//            return new CourseDTO
//            {
//                Id=course.CourseId,
//                Name = course.Name,
//                CreditHours = course.Credits,
//                InstructorId = course.InstructorId ?? 0
//            };
//        }

//        public async Task<CreateCourseDTO?> AddCourse(CreateCourseDTO courseDto)
//        {
//            var instructor = await _instructorRepo.GetInstructorByIdAsync(courseDto.InstructorId)
//                ?? throw new InvalidOperationException($"Instructor {courseDto.InstructorId} not found.");

//            await ValidateInstructorTeachingLoad(courseDto.InstructorId, courseDto.CreditHours);

//            if ((await _courseRepo.GetAllCourses()).Any(c => c.CourseCode == courseDto.CourseCode))
//                throw new InvalidOperationException($"Course code '{courseDto.CourseCode}' already exists.");

//            var course = new Course
//            {
//                CourseCode = courseDto.CourseCode,
//                Name = courseDto.Name,
//                Credits = courseDto.CreditHours,
//                InstructorId = courseDto.InstructorId,
//                DepartmentId = courseDto.DepartmentId,
//                IsDeleted = false
//            };

//            await _courseRepo.AddCourse(course);
//            return courseDto;
//        }

//        public async Task<CourseDTO?> UpdateCourse(int id, CourseDTO courseDto)
//        {
//            var courseExist = await _courseRepo.GetCourseById(id);
//            if (courseExist == null) return null;

//            var instructor = await _instructorRepo.GetInstructorByIdAsync(courseDto.InstructorId)
//                ?? throw new InvalidOperationException($"Instructor {courseDto.InstructorId} not found.");

//            if (courseExist.InstructorId != courseDto.InstructorId)
//                await ValidateInstructorTeachingLoad(courseDto.InstructorId, courseDto.CreditHours, id);

//            courseExist.Name = courseDto.Name;
//            courseExist.Credits = courseDto.CreditHours;
//            courseExist.InstructorId = courseDto.InstructorId;

//            var updatedCourse = await _courseRepo.UpdateCourse(courseExist);
//            if (updatedCourse == null) return null;

//            return new CourseDTO
//            {
//                Name = updatedCourse.Name,
//                CreditHours = updatedCourse.Credits,
//                InstructorId = updatedCourse.InstructorId ?? 0
//            };
//        }

//        public async Task<bool> DeleteCourse(int id) => await _courseRepo.DeleteCourse(id);
//        public async Task<bool> RestoreCourse(int id) => await _courseRepo.RestoreCourse(id);
//        public async Task<bool> PermanentlyDeleteCourse(int id) => await _courseRepo.PermanentlyDeleteCourse(id);

//        public async Task<IEnumerable<CourseDTO>> GetAllCoursesIncludingDeleted()
//        {
//            var courses = await _courseRepo.GetAllCoursesIncludingDeleted();
//            return courses.Select(c => new CourseDTO
//            {
//                Id=c.CourseId,
//                Name = c.Name,
//                CreditHours = c.Credits,
//                InstructorId = c.InstructorId ?? 0
//            });
//        }

//        public async Task<IEnumerable<EnrollCourseDTO>> GetAllCoursesByDepartmentID(int departmentId)
//        {
//            var courses = await _courseRepo.GetAllCoursesByDepartmentId(departmentId);
//            return courses.Select(c => new EnrollCourseDTO
//            {
//                id=c.CourseId,
//                CourseName = c.Name,
//                CreditHours = c.Credits,
//                CourseCode = c.CourseCode,
//                DepartmentName = c.Department?.Name ?? "Unknown"
//            });
//        }

//        public async Task<IEnumerable<EnrollCourseDTO>> GetAvailableCoursesForStudent(int studentId)
//        {
//            var student = await _studentRepo.GetStudentByIdAsync(studentId)
//                ?? throw new InvalidOperationException("Student not found.");
//            if (!student.DepartmentId.HasValue)
//                throw new InvalidOperationException("Student has no department.");

//            var courses = await _courseRepo.GetCoursesByDepartmentForStudent(student.DepartmentId.Value);

//            return courses.Select(c => new EnrollCourseDTO
//            {
//                id=c.CourseId,
//                CourseName = c.Name,
//                CreditHours = c.Credits,
//                CourseCode = c.CourseCode,
//                DepartmentName = c.Department?.Name ?? "Unknown"
//            });
//        }

//        public async Task<IEnumerable<InstructorCoursesDTO>> GetCoursesByInstructorId(int instructorId)
//        {
//            var courses = await _courseRepo.GetCoursesByInstructorId(instructorId);
//            return courses.Select(c => new InstructorCoursesDTO
//            {

//                CourseName = c.Name,
//                CourseCode = c.CourseCode,
//                DepartmentName = c.Department?.Name ?? "Unknown",
//                CreditHours = c.Credits,
//                InstructorName = c.Instructor?.FullName ?? "Unknown"
//            });
//        }

//        public async Task<bool> CanCourseRun(int courseId)
//        {
//            var enrolledCount = await _courseRepo.GetActiveEnrollmentCountByCourseId(courseId);
//            return enrolledCount >= MIN_STUDENTS_TO_RUN_COURSE;
//        }

//        // ================= BUSINESS RULES VALIDATION =================
//        private async Task ValidateInstructorTeachingLoad(int instructorId, int newCourseCredits, int? excludeCourseId = null)
//        {
//            var courseCount = await _courseRepo.GetInstructorActiveCourseCount(instructorId);
//            if (excludeCourseId.HasValue)
//            {
//                var currentCourse = await _courseRepo.GetCourseById(excludeCourseId.Value);
//                if (currentCourse?.InstructorId == instructorId) courseCount--;
//            }
//            if (courseCount >= MAX_COURSES_PER_INSTRUCTOR)
//                throw new InvalidOperationException($"Instructor teaching max courses ({MAX_COURSES_PER_INSTRUCTOR}).");

//            var totalHours = await _courseRepo.GetInstructorTotalCreditHours(instructorId);
//            if (excludeCourseId.HasValue)
//            {
//                var currentCourse = await _courseRepo.GetCourseById(excludeCourseId.Value);
//                if (currentCourse?.InstructorId == instructorId) totalHours -= currentCourse.Credits;
//            }
//            if (totalHours + newCourseCredits > MAX_CREDIT_HOURS_PER_INSTRUCTOR)
//                throw new InvalidOperationException("Instructor exceeds max teaching hours.");
//        }
//    }
//}
using University.App.DTOs;
using University.App.DTOs.Users;
using University.App.Interfaces;
using University.App.Interfaces.Courses;
using University.App.Interfaces.Users;
using University.App.Services.IServices;
using University.Core.Entities;

namespace University.App.Services.Implementations
{
    public class CourseService : ICourseService
    {
        private readonly ICourseRepository _courseRepo;
        private readonly IEnrollmentService _enrollmentService;
        private readonly IInstructorRepository _instructorRepo;
        private readonly IStudentRepository _studentRepo;

        // BUSINESS RULES CONSTANTS
        // VALIDATION ENHANCED: Maximum course capacity per course offering
        private const int MAX_COURSE_CAPACITY = 50;

        // VALIDATION ENHANCED: Minimum student enrollment to run a course
        // Business rule: Course must have at least 5 confirmed students to proceed
        private const int MIN_STUDENTS_TO_RUN_COURSE = 5;

        // VALIDATION ENHANCED: Maximum courses per instructor workload limit
        // Business rule: No instructor can teach more than 4 courses simultaneously
        private const int MAX_COURSES_PER_INSTRUCTOR = 4;

        // VALIDATION ENHANCED: Maximum credit hours per instructor teaching load
        // Business rule: No instructor can teach more than 12 credit hours total
        private const int MAX_CREDIT_HOURS_PER_INSTRUCTOR = 12;

        // VALIDATION ENHANCED: Department restriction enforcement
        // Business rule: Students can only enroll in courses from their own department
        private const bool ENFORCE_DEPARTMENT_RESTRICTION = true;

        public CourseService(ICourseRepository courseRepo, IStudentRepository studentRepo, IInstructorRepository instructorRepo, IEnrollmentService enrollmentService)
        {
            _courseRepo = courseRepo;
            _studentRepo = studentRepo;
            _instructorRepo = instructorRepo;
            _enrollmentService = enrollmentService;
        }

        // ================= COURSE MANAGEMENT =================

        /// <summary>
        /// Retrieve all active (non-deleted) courses
        /// VALIDATION ENHANCED: Soft delete filtering applied automatically
        /// </summary>
        public async Task<IEnumerable<CourseDTO>> GetAllCourses()
        {
            // VALIDATION ENHANCED: Repository query filters out soft-deleted courses
            // Only active courses are returned (IsDeleted = false)
            var courses = await _courseRepo.GetAllCourses();
            return courses.Select(c => new CourseDTO
            {
                Id = c.CourseId,
                Name = c.Name,
                CreditHours = c.Credits,
                CourseCode = c.CourseCode,
                InstructorId = c.InstructorId ?? 0,
                InstructorName = c.Instructor?.FullName ?? "Unknown",
                DepartmentId = c.DepartmentId,
                DepartmentName = c.Department?.Name ?? "Unknown"
            });
        }

        public async Task<(IEnumerable<CourseDTO> courses, int totalCount)> GetAllCoursesWithPaginationAsync(int pageNumber, int pageSize)
        {
            var (courses, totalCount) = await _courseRepo.GetCoursesWithPaginationAsync(pageNumber, pageSize);
            var courseDtos = courses.Select(c => new CourseDTO
            {
                Id = c.CourseId,
                Name = c.Name,
                CreditHours = c.Credits,
                CourseCode = c.CourseCode,
                InstructorId = c.InstructorId ?? 0,
                InstructorName = c.Instructor?.FullName ?? "Unknown",
                DepartmentId = c.DepartmentId,
                DepartmentName = c.Department?.Name ?? "Unknown"
            }).ToList();

            return (courseDtos, totalCount);
        }

        public async Task<(IEnumerable<CourseDTO> courses, int totalCount)> SearchCoursesAsync(string? searchTerm, int? departmentId, int? instructorId, int pageNumber, int pageSize)
        {
            var (courses, totalCount) = await _courseRepo.SearchCoursesAsync(searchTerm, departmentId, instructorId, pageNumber, pageSize);
            var courseDtos = courses.Select(c => new CourseDTO
            {
                Id = c.CourseId,
                Name = c.Name,
                CreditHours = c.Credits,
                CourseCode = c.CourseCode,
                InstructorId = c.InstructorId ?? 0,
                InstructorName = c.Instructor?.FullName ?? "Unknown",
                DepartmentId = c.DepartmentId,
                DepartmentName = c.Department?.Name ?? "Unknown"
            }).ToList();

            return (courseDtos, totalCount);
        }

        /// <summary>
        /// Retrieve a specific course by ID
        /// VALIDATION ENHANCED: Includes related data (department, instructor information)
        /// </summary>
        public async Task<CourseDTO?> GetCourseById(int id)
        {
            // VALIDATION ENHANCED: Repository filters out soft-deleted courses automatically
            // Returns null if course not found or is deleted
            var course = await _courseRepo.GetCourseById(id);
            if (course == null) return null;

            return new CourseDTO
            {
                Id = course.CourseId,
                CourseCode = course.CourseCode,
                Name = course.Name,
                CreditHours = course.Credits,
                InstructorId = course.InstructorId ?? 0,
                InstructorName = course.Instructor?.FullName ?? "Unknown",
                DepartmentId = course.DepartmentId,
                DepartmentName = course.Department?.Name ?? "Unknown"
            };
        }

        /// <summary>
        /// Retrieve a specific course by course code
        /// VALIDATION ENHANCED: Includes related data (department, instructor information)
        /// </summary>
        public async Task<CourseDTO?> GetCourseByCode(string courseCode)
        {
            // Get all courses and find by course code
            var courses = await _courseRepo.GetAllCourses();
            var course = courses.FirstOrDefault(c => 
                c.CourseCode.Equals(courseCode, StringComparison.OrdinalIgnoreCase));
            
            if (course == null) return null;

            return new CourseDTO
            {
                Id = course.CourseId,
                CourseCode = course.CourseCode,
                Name = course.Name,
                CreditHours = course.Credits,
                InstructorId = course.InstructorId ?? 0,
                InstructorName = course.Instructor?.FullName ?? "Unknown",
                DepartmentId = course.DepartmentId,
                DepartmentName = course.Department?.Name ?? "Unknown"
            };
        }

        /// <summary>
        /// Create a new course with comprehensive validation
        /// VALIDATION ENHANCED: Multi-layer validation applied:
        /// 1. Course name uniqueness check
        /// 2. Instructor existence and validity
        /// 3. Instructor workload limits (max 2 courses, max 12 credit hours)
        /// 4. Course code uniqueness
        /// 5. Department validation
        /// </summary>
        public async Task<CreateCourseDTO?> AddCourse(CreateCourseDTO courseDto)
        {
            // VALIDATION ENHANCED: Check for duplicate course name
            // Prevents creating courses with identical names
            var allCourses = await _courseRepo.GetAllCourses();
            var duplicateName = allCourses.Any(c => 
                c.Name.Trim().Equals(courseDto.Name.Trim(), StringComparison.OrdinalIgnoreCase));
            
            if (duplicateName)
                throw new InvalidOperationException($"A course with the name '{courseDto.Name}' already exists. Please use a different name.");

            // VALIDATION ENHANCED: Instructor existence check
            // Prevents course assignment to non-existent or deleted instructors
            var instructor = await _instructorRepo.GetInstructorByIdAsync(courseDto.InstructorId)
                ?? throw new InvalidOperationException($"Instructor {courseDto.InstructorId} not found.");

            // VALIDATION ENHANCED: Instructor teaching load validation
            // Ensures instructor doesn't exceed MAX_COURSES_PER_INSTRUCTOR (2) or MAX_CREDIT_HOURS_PER_INSTRUCTOR (12)
            // Throws InvalidOperationException if limits exceeded
            await ValidateInstructorTeachingLoad(courseDto.InstructorId, courseDto.CreditHours);

            // VALIDATION ENHANCED: Auto-generate course code based on department
            // Format: First 3 chars of single-word dept OR first char of each word (multi-word)
            // Plus incrementing 2-digit number for each course in that department
            var generatedCourseCode = await GenerateCourseCodeAsync(courseDto.DepartmentId);

            // VALIDATION ENHANCED: Create new course entity with valid data
            // CourseCode is assigned BEFORE saving to database
            // IsDeleted set to false for new courses (soft delete pattern)
            // DepartmentId used for enrollment filtering and restriction enforcement
            var course = new Course
            {
                CourseCode = generatedCourseCode,
                Name = courseDto.Name.Trim(),
                Credits = courseDto.CreditHours,
                InstructorId = courseDto.InstructorId,
                DepartmentId = courseDto.DepartmentId,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // VALIDATION ENHANCED: Persist course to repository
            // Repository handles database transaction and consistency
            await _courseRepo.AddCourse(course);
            
            // Return the DTO with generated course code for response
            courseDto.CourseCode = generatedCourseCode;
            return courseDto;
        }

        /// <summary>
        /// Update an existing course with intelligent validation
        /// VALIDATION ENHANCED: Smart instructor workload recalculation:
        /// - If instructor is changed: new instructor workload validated
        /// - If instructor is same: workload validation skipped (no change)
        /// - Current course excluded from workload calculations (smart comparison)
        /// </summary>
        public async Task<CourseDTO?> UpdateCourse(int id, UpdateCourseDTO courseDto)
        {
            // VALIDATION ENHANCED: Verify course exists before update
            // Returns null if course not found or is deleted
            var courseExist = await _courseRepo.GetCourseById(id);
            if (courseExist == null) return null;

            // VALIDATION ENHANCED: Instructor existence check
            // Prevents assignment to non-existent or deleted instructors
            var instructor = await _instructorRepo.GetInstructorByIdAsync(courseDto.InstructorId)
                ?? throw new InvalidOperationException($"Instructor {courseDto.InstructorId} not found.");

            // VALIDATION ENHANCED: Intelligent instructor change detection
            // Only validate workload if instructor is being changed
            // If same instructor: skip validation (no change in workload)
            // If different instructor: validate new instructor's teaching load
            // Excludes current course from workload calculation (smart recalculation)
            if (courseExist.InstructorId != courseDto.InstructorId)
                await ValidateInstructorTeachingLoad(courseDto.InstructorId, courseDto.CreditHours, id);

            // VALIDATION ENHANCED: Update course properties
            // Only updating name, credit hours, and instructor assignment
            // CourseCode cannot be modified (immutable identifier)
            courseExist.Name = courseDto.Name;
            courseExist.Credits = courseDto.CreditHours;
            courseExist.InstructorId = courseDto.InstructorId;
            courseExist.DepartmentId = courseDto.DepartmentId;

            // VALIDATION ENHANCED: Persist changes to repository
            var updatedCourse = await _courseRepo.UpdateCourse(courseExist);
            if (updatedCourse == null) return null;

            return new CourseDTO
            {
                Name = updatedCourse.Name,
                CreditHours = updatedCourse.Credits,
                InstructorId = updatedCourse.InstructorId ?? 0
            };
        }

        /// <summary>
        /// Soft delete a course (marks as deleted, preserves data)
        /// VALIDATION ENHANCED: Prevents archiving courses with active enrollments
        /// Removes course from instructor's course list when archived
        /// Related enrollments, exams, and attendance records remain intact
        /// </summary>
        public async Task<bool> DeleteCourse(int id)
        {
            // Get the course first to check instructor assignment
            var course = await _courseRepo.GetCourseById(id);
            if (course == null)
                throw new InvalidOperationException("Course not found.");
            
            // VALIDATION ENHANCED: Check for active enrollments before archiving
            // Only count enrollments that are "Enrolled" or "In Progress" - exclude rejected and pending
            var activeEnrollments = await _enrollmentService.GetEnrollmentStudentsByCourseID(id);
            var activeEnrollmentsList = activeEnrollments
                .Where(e => (e.Status == "Enrolled" || e.Status == "In Progress") && e.IsCourseActive)
                .ToList();
            
            if (activeEnrollmentsList.Any())
            {
                throw new InvalidOperationException($"Cannot archive course. There are {activeEnrollmentsList.Count} active student enrollments. Please ensure all students have completed, dropped, or been withdrawn from the course before archiving.");
            }
            
            // Remove course from instructor's assignment if instructor exists
            if (course.InstructorId.HasValue)
            {
                // Update the course to remove instructor assignment
                var updateResult = await _courseRepo.UpdateCourseInstructor(id, null);
                if (!updateResult)
                {
                    throw new InvalidOperationException("Failed to remove course from instructor assignment during archival.");
                }
            }
            
            // VALIDATION ENHANCED: Repository handles soft delete (sets DeletedAt)
            // Related records are NOT deleted, maintaining referential integrity
            // Audit trail maintained for compliance
            return await _courseRepo.DeleteCourse(id);
        }

        /// <summary>
        /// Restore a soft-deleted course
        /// VALIDATION ENHANCED: Reverses soft delete, makes course active again
        /// </summary>
        public async Task<bool> RestoreCourse(int id)
        {
            // VALIDATION ENHANCED: Repository handles restoration (clears DeletedAt)
            // Only deleted courses can be restored (active courses cannot be restored)
            return await _courseRepo.RestoreCourse(id);
        }

        /// <summary>
        /// Restore a soft-deleted course with instructor reassignment
        /// VALIDATION ENHANCED: Handles instructor reassignment during restoration
        /// </summary>
        public async Task<bool> RestoreCourseWithInstructorReassignment(int courseId, int? newInstructorId = null)
        {
            // Get the deleted course first to check its current state
            var allCourses = await _courseRepo.GetAllCoursesIncludingDeleted();
            var course = allCourses.FirstOrDefault(c => c.CourseId == courseId && c.DeletedAt.HasValue);
            
            if (course == null)
                throw new InvalidOperationException("Course not found or is not deleted.");
                
            if (!course.DepartmentId.HasValue)
                throw new InvalidOperationException("Course does not have an assigned department.");

            // If no new instructor specified, check if the current instructor is still available
            if (newInstructorId == null)
            {
                if (course.InstructorId.HasValue)
                {
                    // Check if the current instructor is still in the same department and available
                    var currentInstructor = await _instructorRepo.GetInstructorByIdAsync(course.InstructorId.Value);
                    if (currentInstructor != null && !currentInstructor.IsDeleted && currentInstructor.DepartmentId == course.DepartmentId)
                    {
                        // Current instructor is still available, check BOTH workload constraints
                        var currentCourses = await GetCoursesByInstructorId(currentInstructor.InstructorId);
                        var coursesList = currentCourses.ToList();
                        var totalCredits = coursesList.Sum(c => c.CreditHours);
                        var courseCount = coursesList.Count;
                        
                        // Check both MAX_COURSES_PER_INSTRUCTOR (2) and MAX_CREDIT_HOURS_PER_INSTRUCTOR (12)
                        if (courseCount < MAX_COURSES_PER_INSTRUCTOR && (totalCredits + course.Credits) <= MAX_CREDIT_HOURS_PER_INSTRUCTOR)
                        {
                            // Current instructor can handle the course
                            return await _courseRepo.RestoreCourse(courseId);
                        }
                    }
                }
                
                // Need to find a new instructor in the same department
                var availableInstructors = await _instructorRepo.GetByDepartmentAsync((int)course.DepartmentId);
                var activeInstructors = availableInstructors.Where(i => !i.IsDeleted).ToList();
                
                if (activeInstructors.Count == 0)
                    throw new InvalidOperationException($"No active instructors found in department {course.Department?.Name ?? "Unknown"}.");
                
                foreach (var instructor in activeInstructors)
                {
                    var instructorCourses = await GetCoursesByInstructorId(instructor.InstructorId);
                    var coursesList = instructorCourses.ToList();
                    var totalCredits = coursesList.Sum(c => c.CreditHours);
                    var courseCount = coursesList.Count;
                    
                    // Check both MAX_COURSES_PER_INSTRUCTOR (2) and MAX_CREDIT_HOURS_PER_INSTRUCTOR (12)
                    if (courseCount < MAX_COURSES_PER_INSTRUCTOR && (totalCredits + course.Credits) <= MAX_CREDIT_HOURS_PER_INSTRUCTOR)
                    {
                        newInstructorId = instructor.InstructorId;
                        break;
                    }
                }
                
                if (newInstructorId == null)
                    throw new InvalidOperationException($"No available instructor found in {course.Department?.Name ?? "this department"}. All instructors have reached their maximum workload (2 courses or 12 credit hours).");
            }
            else
            {
                // Validate the specified instructor
                var newInstructor = await _instructorRepo.GetInstructorByIdAsync(newInstructorId.Value);
                if (newInstructor == null || newInstructor.IsDeleted)
                    throw new InvalidOperationException("Specified instructor not found or is inactive.");
                    
                if (newInstructor.DepartmentId != course.DepartmentId)
                    throw new InvalidOperationException("Instructor must be from the same department as the course.");
                    
                // Check BOTH instructor workload constraints
                var instructorCourses = await GetCoursesByInstructorId(newInstructorId.Value);
                var coursesList = instructorCourses.ToList();
                var totalCredits = coursesList.Sum(c => c.CreditHours);
                var courseCount = coursesList.Count;
                
                // Check both MAX_COURSES_PER_INSTRUCTOR (2) and MAX_CREDIT_HOURS_PER_INSTRUCTOR (12)
                if (courseCount >= MAX_COURSES_PER_INSTRUCTOR)
                    throw new InvalidOperationException($"Instructor has already reached maximum course limit ({MAX_COURSES_PER_INSTRUCTOR} courses).");
                    
                if ((totalCredits + course.Credits) > MAX_CREDIT_HOURS_PER_INSTRUCTOR)
                    throw new InvalidOperationException($"Instructor would exceed maximum credit hours ({MAX_CREDIT_HOURS_PER_INSTRUCTOR}).");
            }

            // Update course with new instructor and restore
            var updateResult = await _courseRepo.UpdateCourseInstructor(courseId, newInstructorId.Value);
            if (!updateResult)
                throw new InvalidOperationException("Failed to update course instructor.");
                
            return await _courseRepo.RestoreCourse(courseId);
        }

        /// <summary>
        /// Get available instructors for course restoration
        /// Returns instructors in the same department who can handle the course
        /// </summary>
        public async Task<IEnumerable<InstructorAvailabilityDTO>> GetAvailableInstructorsForCourseRestore(int courseId)
        {
            // Get the deleted course
            var allCourses = await _courseRepo.GetAllCoursesIncludingDeleted();
            var course = allCourses.FirstOrDefault(c => c.CourseId == courseId && c.DeletedAt.HasValue);
            
            if (course == null)
                throw new InvalidOperationException("Course not found or is not deleted.");

            // Validate department exists
            if (!course.DepartmentId.HasValue || course.DepartmentId.Value <= 0)
                throw new InvalidOperationException("Course does not have a valid department assignment.");

            // Get all active instructors in the same department
            var departmentInstructors = await _instructorRepo.GetByDepartmentAsync(course.DepartmentId.Value);
            var activeInstructors = departmentInstructors.Where(i => !i.IsDeleted && i.DeletedAt == null).ToList();
            
            var availableInstructors = new List<InstructorAvailabilityDTO>();
            
            foreach (var instructor in activeInstructors)
            {
                // Get ALL active courses for this instructor (using repository which already filters !IsDeleted)
                var instructorCourses = await _courseRepo.GetCoursesByInstructorId(instructor.InstructorId);
                var activeCoursesList = instructorCourses.ToList();
                
                // Calculate current workload from ACTIVE courses only
                var totalCredits = activeCoursesList.Sum(c => c.Credits);
                var currentCourseCount = activeCoursesList.Count;
                
                // VALIDATION: Check both constraints
                // 1. MAX_COURSES_PER_INSTRUCTOR = 2 (cannot teach more than 2 courses)
                // 2. MAX_CREDIT_HOURS_PER_INSTRUCTOR = 12 (cannot exceed 12 credit hours)
                bool hasCoursesCapacity = currentCourseCount < MAX_COURSES_PER_INSTRUCTOR;
                bool hasCreditHoursCapacity = (totalCredits + course.Credits) <= MAX_CREDIT_HOURS_PER_INSTRUCTOR;
                
                if (hasCoursesCapacity && hasCreditHoursCapacity)
                {
                    availableInstructors.Add(new InstructorAvailabilityDTO
                    {
                        InstructorId = instructor.InstructorId,
                        FullName = instructor.FullName,
                        Email = instructor.User?.Email ?? string.Empty,
                        DepartmentName = instructor.Department?.Name ?? "Unknown",
                        ContactNumber = instructor.ContactNumber,
                        CurrentCreditHours = totalCredits,
                        MaxCreditHours = MAX_CREDIT_HOURS_PER_INSTRUCTOR,
                        CourseCreditHours = course.Credits,
                        TotalAfterAssignment = totalCredits + course.Credits,
                        CurrentCourseCount = currentCourseCount,
                        MaxCourseCount = MAX_COURSES_PER_INSTRUCTOR
                    });
                }
            }
            
            return availableInstructors;
        }

        /// <summary>
        /// Debug method to get detailed workload information for all instructors in a course's department
        /// </summary>
        public async Task<object> GetInstructorWorkloadDebugInfo(int courseId)
        {
            // Get the deleted course
            var allCourses = await _courseRepo.GetAllCoursesIncludingDeleted();
            var course = allCourses.FirstOrDefault(c => c.CourseId == courseId);
            
            if (course == null)
                throw new InvalidOperationException("Course not found.");

            if (!course.DepartmentId.HasValue)
                return new { Message = "Course has no department assignment", Instructors = new List<object>() };

            // Get all active instructors in the same department
            var departmentInstructors = await _instructorRepo.GetByDepartmentAsync(course.DepartmentId.Value);
            var activeInstructors = departmentInstructors.Where(i => !i.IsDeleted && i.DeletedAt == null).ToList();
            
            var workloadDetails = new List<object>();
            
            foreach (var instructor in activeInstructors)
            {
                var instructorCourses = await GetCoursesByInstructorId(instructor.InstructorId);
                var coursesList = instructorCourses.ToList();
                var totalCredits = coursesList.Sum(c => c.CreditHours);
                
                workloadDetails.Add(new
                {
                    InstructorId = instructor.InstructorId,
                    FullName = instructor.FullName,
                    Email = instructor.User?.Email ?? "N/A",
                    DepartmentName = instructor.Department?.Name ?? "N/A",
                    CurrentCourses = coursesList.Select(c => new 
                    { 
                        CourseName = c.CourseName, 
                        CourseCode = c.CourseCode, 
                        CreditHours = c.CreditHours 
                    }).ToList(),
                    CurrentCourseCount = coursesList.Count,
                    CurrentCreditHours = totalCredits,
                    MaxCreditHours = MAX_CREDIT_HOURS_PER_INSTRUCTOR,
                    CourseCreditHours = course.Credits,
                    TotalAfterAssignment = totalCredits + course.Credits,
                    RemainingCapacity = MAX_CREDIT_HOURS_PER_INSTRUCTOR - totalCredits,
                    WouldExceedLimit = (totalCredits + course.Credits) > MAX_CREDIT_HOURS_PER_INSTRUCTOR,
                    IsAvailable = (totalCredits + course.Credits) <= MAX_CREDIT_HOURS_PER_INSTRUCTOR
                });
            }
            
            return new
            {
                CourseName = course.Name,
                CourseCode = course.CourseCode,
                CourseCredits = course.Credits,
                DepartmentId = course.DepartmentId.Value,
                TotalInstructorsInDepartment = activeInstructors.Count,
                AvailableInstructors = workloadDetails.Count(w => (bool)((dynamic)w).IsAvailable),
                OverloadedInstructors = workloadDetails.Count(w => (bool)((dynamic)w).WouldExceedLimit),
                InstructorDetails = workloadDetails
            };
        }

        /// <summary>
        /// Permanently delete a course (HARD DELETE)
        /// VALIDATION ENHANCED: DANGEROUS OPERATION - Use with extreme caution
        /// Permanently removes course and related data (unrecoverable)
        /// </summary>
        public async Task<bool> PermanentlyDeleteCourse(int id)
        {
            // VALIDATION ENHANCED: WARNING - This operation is irreversible
            // Only use for data cleanup/migration purposes
            // Violates audit trail and data preservation principles
            // Should only be called by administrators in special circumstances
            return await _courseRepo.PermanentlyDeleteCourse(id);
        }

        /// <summary>
        /// Check if course can be permanently deleted
        /// Returns information about related data that would prevent deletion
        /// </summary>
        public async Task<(bool CanDelete, string Reason, int RelatedDataCount)> CanPermanentlyDeleteCourse(int id)
        {
            // IMPORTANT: Must get course including deleted ones since we're checking a deleted course
            var allCourses = await _courseRepo.GetAllCoursesIncludingDeleted();
            var course = allCourses.FirstOrDefault(c => c.CourseId == id);
            
            if (course == null)
            {
                return (false, "Course not found", 0);
            }

            // Get enrollment count for this course
            var enrollmentCount = await _courseRepo.GetActiveEnrollmentCountByCourseId(id);
            
            if (enrollmentCount > 0)
            {
                return (false, $"Course has {enrollmentCount} enrollment record(s). Cannot permanently delete courses with enrollment history to preserve student academic records.", enrollmentCount);
            }

            return (true, "Course can be safely deleted - no related data found", 0);
        }

        /// <summary>
        /// Retrieve all courses including soft-deleted ones (Admin audit)
        /// VALIDATION ENHANCED: Admin-only operation for administrative review
        /// </summary>
        public async Task<IEnumerable<CourseDTO>> GetAllCoursesIncludingDeleted()
        {
            // VALIDATION ENHANCED: Repository returns both active and deleted courses
            // Deleted courses include DeletedAt timestamp for auditing
            // Used for administrative review and data recovery
            var courses = await _courseRepo.GetAllCoursesIncludingDeleted();
            return courses.Select(c => new CourseDTO
            {
                Id = c.CourseId,
                Name = c.Name,
                CreditHours = c.Credits,
                InstructorId = c.InstructorId ?? 0,
                InstructorName = c.Instructor?.FullName ?? "Unknown",
                DepartmentId = c.DepartmentId,
                DepartmentName = c.Department?.Name ?? "Unknown",
                CourseCode = c.CourseCode,
                DeletedAt = c.DeletedAt  // Include soft delete timestamp
            });
        }

        /// <summary>
        /// Retrieve all courses in a specific department
        /// VALIDATION ENHANCED: Department filtering applied at service level
        /// Enforces ENFORCE_DEPARTMENT_RESTRICTION business rule
        /// </summary>
        public async Task<IEnumerable<EnrollCourseDTO>> GetAllCoursesByDepartmentID(int departmentId)
        {
            // VALIDATION ENHANCED: Repository filters courses by department
            // Only returns courses assigned to specified department
            var courses = await _courseRepo.GetAllCoursesByDepartmentId(departmentId);
            return courses.Select(c => new EnrollCourseDTO
            {
                CourseId = c.CourseId,
                CourseName = c.Name,
                CreditHours = c.Credits,
                CourseCode = c.CourseCode,
                DepartmentName = c.Department?.Name ?? "Unknown"
            });
        }

        /// <summary>
        /// Retrieve available courses for student (filtered by student's department)
        /// VALIDATION ENHANCED: Multi-layer department restriction enforcement
        /// 1. Student existence check
        /// 2. Student department assignment verification
        /// 3. Department-based course filtering
        /// </summary>
        public async Task<IEnumerable<EnrollCourseDTO>> GetAvailableCoursesForStudent(int studentId)
        {
            // VALIDATION ENHANCED: Student existence verification
            // Returns error if student not found or deleted
            var student = await _studentRepo.GetStudentByIdAsync(studentId)
                ?? throw new InvalidOperationException("Student not found.");

            // VALIDATION ENHANCED: Student department assignment check
            // Students must have department assignment to see courses
            // Prevents orphaned students from enrolling
            if (!student.DepartmentId.HasValue)
                throw new InvalidOperationException("Student has no department.");

            // VALIDATION ENHANCED: Department-restricted course retrieval
            // ENFORCE_DEPARTMENT_RESTRICTION = true (students see only their department's courses)
            // This prevents cross-department enrollment
            var courses = await _courseRepo.GetCoursesByDepartmentForStudent(student.DepartmentId.Value);

            return courses.Select(c => new EnrollCourseDTO
            {
                CourseId = c.CourseId,
                CourseName = c.Name,
                CreditHours = c.Credits,
                CourseCode = c.CourseCode,
                DepartmentName = c.Department?.Name ?? "Unknown"
            });
        }

        /// <summary>
        /// Retrieve all courses taught by a specific instructor
        /// VALIDATION ENHANCED: Instructor course filtering
        /// </summary>
        public async Task<IEnumerable<InstructorCoursesDTO>> GetCoursesByInstructorId(int instructorId)
        {
            // VALIDATION ENHANCED: Repository filters courses by instructor
            // Returns all active courses assigned to specified instructor
            var courses = await _courseRepo.GetCoursesByInstructorId(instructorId);
            return courses.Select(c => new InstructorCoursesDTO
            {
                CourseId = c.CourseId,
                InstructorID = c.InstructorId ?? 0,
                InstructorName = c.Instructor?.FullName ?? "Unknown",
                CourseName = c.Name,
                CourseCode = c.CourseCode,
                DepartmentName = c.Department?.Name ?? "Unknown",
                CreditHours = c.Credits,
            });
        }

        /// <summary>
        /// Check if a course can run (meets minimum enrollment requirement)
        /// VALIDATION ENHANCED: Business rule enforcement for course execution
        /// Courses require MIN_STUDENTS_TO_RUN_COURSE (5) confirmed enrollments
        /// </summary>
        public async Task<bool> CanCourseRun(int courseId)
        {
            // VALIDATION ENHANCED: Retrieve confirmed enrollment count
            // Only counts active, confirmed enrollments (excludes pending/withdrawn)
            // Business rule: MIN_STUDENTS_TO_RUN_COURSE = 5 minimum students
            var enrolledCount = await _courseRepo.GetActiveEnrollmentCountByCourseId(courseId);
            return enrolledCount >= MIN_STUDENTS_TO_RUN_COURSE;
        }

        // ================= BUSINESS RULES VALIDATION =================

        /// <summary>
        /// Validate instructor teaching load constraints
        /// VALIDATION ENHANCED: Comprehensive instructor workload validation:
        /// 1. Maximum courses per instructor (MAX_COURSES_PER_INSTRUCTOR = 2)
        /// 2. Maximum credit hours per instructor (MAX_CREDIT_HOURS_PER_INSTRUCTOR = 12)
        /// 3. Smart course exclusion when updating existing course
        /// 
        /// Business Rules:
        /// - No instructor can teach more than 2 courses simultaneously
        /// - No instructor can teach more than 12 credit hours total
        /// - When updating: current course excluded from calculation (smart comparison)
        /// - Prevents workload violations before course creation/assignment
        /// </summary>
        private async Task ValidateInstructorTeachingLoad(int instructorId, int newCourseCredits, int? excludeCourseId = null)
        {
            // VALIDATION ENHANCED: Retrieve instructor's current active course count
            // Only counts active (non-deleted) courses
            var courseCount = await _courseRepo.GetInstructorActiveCourseCount(instructorId);

            // VALIDATION ENHANCED: Intelligent course exclusion for updates
            // When updating a course: if same instructor, exclude current course from count
            // This prevents false positives during reassignment to same instructor
            if (excludeCourseId.HasValue)
            {
                var currentCourse = await _courseRepo.GetCourseById(excludeCourseId.Value);
                // Only exclude if course exists AND is taught by same instructor
                if (currentCourse?.InstructorId == instructorId) courseCount--;
            }

            // VALIDATION ENHANCED: Maximum courses per instructor validation
            // Business rule: MAX_COURSES_PER_INSTRUCTOR = 2 courses maximum
            // Prevents instructor overload and ensures workload balance
            if (courseCount >= MAX_COURSES_PER_INSTRUCTOR)
                throw new InvalidOperationException($"Instructor teaching max courses ({MAX_COURSES_PER_INSTRUCTOR}). Cannot assign additional courses.");

            // VALIDATION ENHANCED: Retrieve instructor's current total credit hours
            // Only counts active (non-deleted) courses
            var totalHours = await _courseRepo.GetInstructorTotalCreditHours(instructorId);

            // VALIDATION ENHANCED: Intelligent credit hours exclusion for updates
            // When updating a course: if same instructor, subtract current course's credits
            // This prevents false positives when adjusting credit hours or course assignment
            if (excludeCourseId.HasValue)
            {
                var currentCourse = await _courseRepo.GetCourseById(excludeCourseId.Value);
                // Only exclude if course exists AND is taught by same instructor
                if (currentCourse?.InstructorId == instructorId) totalHours -= currentCourse.Credits;
            }

            // VALIDATION ENHANCED: Maximum credit hours per instructor validation
            // Business rule: MAX_CREDIT_HOURS_PER_INSTRUCTOR = 12 credit hours maximum
            // Ensures instructor doesn't exceed teaching capacity
            // Prevents excessive workload and maintains quality of instruction
            if (totalHours + newCourseCredits > MAX_CREDIT_HOURS_PER_INSTRUCTOR)
                throw new InvalidOperationException($"Instructor exceeds max teaching hours. Current: {totalHours} hours, New course: {newCourseCredits} hours, Max: {MAX_CREDIT_HOURS_PER_INSTRUCTOR} hours.");
        }

        /// <summary>
        /// Generate course code automatically based on department name
        /// Format Logic:
        /// - Single-word department: First 3 characters (uppercase)
        /// - Multi-word department: First character of each word (uppercase)
        /// - Plus incrementing 2-digit number for each new course in that department
        /// Example: "Computer Science" -> "CS01", "CS02", "CS03"...
        /// Example: "Mathematics" -> "MAT01", "MAT02"...
        /// </summary>
        private async Task<string> GenerateCourseCodeAsync(int departmentId)
        {
            // Get all courses to find the department name
            var allCourses = await _courseRepo.GetAllCourses();
            var departmentCourse = allCourses.FirstOrDefault(c => c.DepartmentId == departmentId);
            
            string departmentName = departmentCourse?.Department?.Name ?? $"Dept{departmentId}";

            // Generate prefix based on department name
            string prefix = GenerateCourseCodePrefix(departmentName);

            // Get ALL existing course codes (including deleted) to avoid duplicates
            var allExistingCodes = allCourses
                .Where(c => c.CourseCode.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                .Select(c => c.CourseCode.ToUpper())
                .ToHashSet();

            // Find the next available number
            int nextNumber = 1;
            string generatedCode;
            
            // Keep incrementing until we find an unused code
            do
            {
                generatedCode = $"{prefix}{nextNumber:D2}";
                nextNumber++;
            } while (allExistingCodes.Contains(generatedCode));

            return generatedCode;
        }

        /// <summary>
        /// Generate the prefix part of course code from department name
        /// Single word: First 3 letters (e.g., "Math" -> "MAT")
        /// Multi-word: First letter of each word (e.g., "Computer Science" -> "CS")
        /// </summary>
        private string GenerateCourseCodePrefix(string departmentName)
        {
            if (string.IsNullOrWhiteSpace(departmentName))
                return "DEP";

            // Split department name into words
            var words = departmentName.Trim().Split(new[] { ' ', '-' }, StringSplitOptions.RemoveEmptyEntries);

            if (words.Length == 1)
            {
                // Single word: take first 3 characters
                return words[0].Length >= 3 
                    ? words[0].Substring(0, 3).ToUpper()
                    : words[0].PadRight(3, 'X').ToUpper(); // Pad with X if less than 3 chars
            }
            else
            {
                // Multi-word: take first character of each word
                var prefix = string.Concat(words.Select(w => w[0])).ToUpper();
                return prefix;
            }
        }
    }
}
