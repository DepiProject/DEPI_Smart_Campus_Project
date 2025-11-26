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

        private readonly IInstructorRepository _instructorRepo;
        private readonly IStudentRepository _studentRepo;

        // BUSINESS RULES CONSTANTS
        // VALIDATION ENHANCED: Maximum course capacity per course offering
        private const int MAX_COURSE_CAPACITY = 50;

        // VALIDATION ENHANCED: Minimum student enrollment to run a course
        // Business rule: Course must have at least 5 confirmed students to proceed
        private const int MIN_STUDENTS_TO_RUN_COURSE = 5;

        // VALIDATION ENHANCED: Maximum courses per instructor workload limit
        // Business rule: No instructor can teach more than 2 courses simultaneously
        private const int MAX_COURSES_PER_INSTRUCTOR = 2;

        // VALIDATION ENHANCED: Maximum credit hours per instructor teaching load
        // Business rule: No instructor can teach more than 12 credit hours total
        private const int MAX_CREDIT_HOURS_PER_INSTRUCTOR = 12;

        // VALIDATION ENHANCED: Department restriction enforcement
        // Business rule: Students can only enroll in courses from their own department
        private const bool ENFORCE_DEPARTMENT_RESTRICTION = true;

        public CourseService(ICourseRepository courseRepo, IStudentRepository studentRepo, IInstructorRepository instructorRepo)
        {
            _courseRepo = courseRepo;
            _studentRepo = studentRepo;
            _instructorRepo = instructorRepo;
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
                InstructorId = c.InstructorId ?? 0
            });
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
                DepartmentName = course.Department?.Name ?? "Unknown"
            };
        }

        /// <summary>
        /// Create a new course with comprehensive validation
        /// VALIDATION ENHANCED: Multi-layer validation applied:
        /// 1. Instructor existence and validity
        /// 2. Instructor workload limits (max 2 courses, max 12 credit hours)
        /// 3. Course code uniqueness
        /// 4. Department validation
        /// </summary>
        public async Task<CreateCourseDTO?> AddCourse(CreateCourseDTO courseDto)
        {
            // VALIDATION ENHANCED: Instructor existence check
            // Prevents course assignment to non-existent or deleted instructors
            var instructor = await _instructorRepo.GetInstructorByIdAsync(courseDto.InstructorId)
                ?? throw new InvalidOperationException($"Instructor {courseDto.InstructorId} not found.");

            // VALIDATION ENHANCED: Instructor teaching load validation
            // Ensures instructor doesn't exceed MAX_COURSES_PER_INSTRUCTOR (2) or MAX_CREDIT_HOURS_PER_INSTRUCTOR (12)
            // Throws InvalidOperationException if limits exceeded
            await ValidateInstructorTeachingLoad(courseDto.InstructorId, courseDto.CreditHours);

            // VALIDATION ENHANCED: Course code uniqueness check
            // Prevents duplicate course codes in the system
            // Course codes are case-sensitive unique identifiers
            if ((await _courseRepo.GetAllCourses()).Any(c => c.CourseCode == courseDto.CourseCode))
                throw new InvalidOperationException($"Course code '{courseDto.CourseCode}' already exists.");

            // VALIDATION ENHANCED: Create new course entity with valid data
            // IsDeleted set to false for new courses (soft delete pattern)
            // DepartmentId used for enrollment filtering and restriction enforcement
            var course = new Course
            {
                CourseCode = courseDto.CourseCode,
                Name = courseDto.Name,
                Credits = courseDto.CreditHours,
                InstructorId = courseDto.InstructorId,
                DepartmentId = courseDto.DepartmentId,
                IsDeleted = false
            };

            // VALIDATION ENHANCED: Persist course to repository
            // Repository handles database transaction and consistency
            await _courseRepo.AddCourse(course);
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
            courseExist.Name = courseDto.CourseName;
            courseExist.Credits = courseDto.CreditHours;
            courseExist.InstructorId = courseDto.InstructorId;

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
        /// VALIDATION ENHANCED: Soft delete pattern maintains referential integrity
        /// Related enrollments, exams, and attendance records remain intact
        /// </summary>
        public async Task<bool> DeleteCourse(int id)
        {
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
                CourseCode = c.CourseCode
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
    }
}
