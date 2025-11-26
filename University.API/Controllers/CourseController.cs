using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using University.App.DTOs;
using University.App.Services.IServices;

namespace University.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourseController : ControllerBase
    {
        private readonly ICourseService _courseService;

        public CourseController(ICourseService courseService)
        {
            _courseService = courseService;
        }

        // ============= COURSE MANAGEMENT =============
        /// <summary>
        /// Get all active courses (not deleted)
        /// VALIDATION ENHANCED: Retrieves only active courses, excluding soft-deleted entries
        /// </summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<CourseDTO>>> GetAllCourses()
        {
            try
            {
                // VALIDATION ENHANCED: Service filters out soft-deleted courses
                // Only returns active courses available for enrollment
                var courses = await _courseService.GetAllCourses();
                return Ok(new
                {
                    Success = true,
                    Message = "Active courses retrieved successfully",
                    Count = courses.Count(),
                    Data = courses
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while retrieving courses",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get all courses including soft-deleted ones (Admin only)
        /// VALIDATION ENHANCED: Admin-only operation showing all courses with deletion status
        /// </summary>
        [HttpGet("all-including-deleted")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<IEnumerable<CourseDTO>>> GetAllCoursesIncludingDeleted()
        {
            try
            {
                // VALIDATION ENHANCED: Requires Admin role for audit trail access
                // Returns both active and deleted courses with DeletedAt timestamps
                var courses = await _courseService.GetAllCoursesIncludingDeleted();
                var courseCount = courses.Count();
                var deletedCount = courses.Count(c => c.DeletedAt.HasValue);

                return Ok(new
                {
                    Success = true,
                    Message = "All courses (including deleted) retrieved successfully",
                    TotalCourses = courseCount,
                    ActiveCourses = courseCount - deletedCount,
                    DeletedCourses = deletedCount,
                    Count = courseCount,
                    Data = courses
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while retrieving courses",
                    Error = ex.Message
                });
            }
        }

        // Get a specific course by ID

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CourseDTO>> GetCourseById(int id)
        {
            // VALIDATION ENHANCED: Course ID validation
            // Prevents retrieval attempts with invalid IDs (0 or negative)
            if (id <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid course ID. ID must be a positive integer."
                });

            try
            {
                var course = await _courseService.GetCourseById(id);
                if (course == null)
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Course not found or has been deleted"
                    });

                return Ok(new
                {
                    Success = true,
                    Message = "Course retrieved successfully",
                    Data = course
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while retrieving the course",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Create a new course (Admin/Instructor)
        /// VALIDATION ENHANCED: Comprehensive business rules applied:
        /// - Course code must be unique (no duplicates)
        /// - Instructor must exist in system
        /// - Instructor cannot teach more than 2 courses (MAX_COURSES_PER_INSTRUCTOR)
        /// - Instructor cannot teach more than 12 credit hours (MAX_CREDIT_HOURS_PER_INSTRUCTOR)
        /// - Department must exist and be valid
        /// - Course name and credit hours validated at DTO level
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<CreateCourseDTO>> CreateCourse([FromBody] CreateCourseDTO dto)
        {
            // VALIDATION ENHANCED: Check ModelState validity
            // Validates all data annotations from CreateCourseDTO:
            // - CourseCode: Required, StringLength(10), MinLength(2)
            // - Name: Required, StringLength(80), MinLength(3)
            // - CreditHours: Required, Range(1, 6)
            // - InstructorId: Required, positive integer
            // - DepartmentId: Required, positive integer
            if (!ModelState.IsValid)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid data",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });

            try
            {
                // Service-level validations performed:
                // - Course code uniqueness check
                // - Instructor existence verification
                // - Instructor workload validation (max 2 courses, max 12 credit hours)
                // - Department existence check
                var course = await _courseService.AddCourse(dto);
                if (course == null)
                    return BadRequest(new
                    {
                        Success = false,
                        Message = "Failed to create course. Please ensure all required fields are valid."
                    });

                return CreatedAtAction(
                    nameof(GetCourseById),
                    new { id = course.CourseCode },
                    new
                    {
                        Success = true,
                        Message = "Course created successfully",
                        Data = course
                    });
            }
            catch (ArgumentException ex)
            {
                // Handles: Invalid argument (format, etc.)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Validation error",
                    Error = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                // Handles: Business rule violations
                // - Duplicate course code
                // - Instructor not found
                // - Instructor exceeds max courses
                // - Instructor exceeds max credit hours
                return Conflict(new
                {
                    Success = false,
                    Message = "Business rule violation",
                    Error = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while creating the course",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Update an existing course (Admin/Instructor)
        /// VALIDATION ENHANCED: Intelligent business rules applied:
        /// - New instructor must exist in system
        /// - New instructor workload validated (if instructor changes)
        ///   * Cannot exceed 2 total courses
        ///   * Cannot exceed 12 total credit hours
        ///   * Current course excluded from calculation if same instructor
        /// - Course name and credit hours must be valid
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CourseDTO>> UpdateCourse(int id, [FromBody] UpdateCourseDTO dto)
        {
            // VALIDATION ENHANCED: Course ID validation
            // Prevents update attempts with invalid IDs (0 or negative)
            if (id <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid course ID. ID must be a positive integer."
                });

            // VALIDATION ENHANCED: Check ModelState validity
            // Validates UpdateCourseDTO constraints:
            // - CourseName: Required, StringLength(80), MinLength(3)
            // - CreditHours: Required, Range(1, 6)
            // - InstructorId: Required, positive integer range
            if (!ModelState.IsValid)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid data",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });

            try
            {
                // Service-level validations performed:
                // - Course existence check
                // - New instructor existence verification
                // - Workload calculation (self-assignment allowed)
                // - Instructor doesn't exceed max courses
                // - Instructor doesn't exceed max credit hours
                var updatedCourse = await _courseService.UpdateCourse(id, dto);
                if (updatedCourse == null)
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Course not found or has been deleted"
                    });

                return Ok(new
                {
                    Success = true,
                    Message = "Course updated successfully",
                    Data = updatedCourse
                });
            }
            catch (InvalidOperationException ex)
            {
                // Handles business rule violations:
                // - Instructor not found
                // - Instructor exceeds max courses
                // - Instructor exceeds max credit hours
                return BadRequest(new
                {
                    Success = false,
                    Message = "Business rule violation",
                    Error = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while updating the course",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Soft delete a course (Admin only)
        /// VALIDATION ENHANCED: Business rule protection applied
        /// Note: Related data (enrollments, exams, attendance) is preserved through soft delete
        /// Soft delete maintains referential integrity and audit trail
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> DeleteCourse(int id)
        {
            // VALIDATION ENHANCED: Course ID validation
            // Prevents deletion attempts with invalid IDs (0 or negative)
            if (id <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid course ID. ID must be a positive integer."
                });

            try
            {
                // VALIDATION ENHANCED: Soft delete implementation
                // Service checks:
                // - Course existence before deletion
                // - Uses soft delete to preserve data integrity
                // - Related enrollments, exams, attendance preserved
                // - Audit trail maintained for compliance
                var deleted = await _courseService.DeleteCourse(id);
                if (!deleted)
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Course not found"
                    });

                return Ok(new
                {
                    Success = true,
                    Message = "Course deleted successfully (soft delete)",
                    Note = "Related exams, enrollments, and attendance records are preserved"
                });
            }
            catch (InvalidOperationException ex)
            {
                // Handles business rule violations (if any implemented in future)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Cannot delete course",
                    Error = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while deleting the course",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Restore a soft-deleted course (Admin only)
        /// VALIDATION ENHANCED: Soft delete restoration with validation
        /// Only deleted courses can be restored; active courses cannot be re-restored
        /// </summary>
        [HttpPost("{id}/restore")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> RestoreCourse(int id)
        {
            // VALIDATION ENHANCED: Course ID validation
            // Prevents restoration with invalid IDs (0 or negative)
            if (id <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid course ID. ID must be a positive integer."
                });

            try
            {
                // Service validation: Ensures course exists and is actually deleted
                // Cannot restore an active (non-deleted) course
                var restored = await _courseService.RestoreCourse(id);
                if (!restored)
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Course not found or is already active"
                    });

                return Ok(new
                {
                    Success = true,
                    Message = "Course restored successfully",
                    Note = "All related records (enrollments, exams, attendance) remain intact",
                    CourseId = id
                });
            }
            catch (InvalidOperationException ex)
            {
                // Handles: Attempting to restore an active (non-deleted) course
                return BadRequest(new
                {
                    Success = false,
                    Message = "Cannot restore course",
                    Error = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while restoring the course",
                    Error = ex.Message
                });
            }
        }

        // ============= QUERY ENDPOINTS =============

        /// <summary>
        /// Get all courses taught by a specific instructor
        /// VALIDATION ENHANCED: ID validation and filtering applied
        /// </summary>
        [HttpGet("instructor/{instructorId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<InstructorCoursesDTO>>> GetCoursesByInstructorId(int instructorId)
        {
            // VALIDATION ENHANCED: Instructor ID validation
            // Prevents retrieval with invalid IDs (0 or negative)
            if (instructorId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid instructor ID. ID must be a positive integer."
                });

            try
            {
                var courses = await _courseService.GetCoursesByInstructorId(instructorId);
                return Ok(new
                {
                    Success = true,
                    Message = "Instructor courses retrieved successfully",
                    InstructorId = instructorId,
                    CourseCount = courses.Count(),
                    Data = courses
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while retrieving instructor courses",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get all courses in a specific department
        /// VALIDATION ENHANCED: Department filtering with ID validation
        /// </summary>
        [HttpGet("department/{departmentId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<EnrollCourseDTO>>> GetAllCoursesByDepartmentID(int departmentId)
        {
            // VALIDATION ENHANCED: Department ID validation
            // Prevents retrieval with invalid IDs (0 or negative)
            if (departmentId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid department ID. ID must be a positive integer."
                });

            try
            {
                var courses = await _courseService.GetAllCoursesByDepartmentID(departmentId);
                return Ok(new
                {
                    Success = true,
                    Message = "Department courses retrieved successfully",
                    DepartmentId = departmentId,
                    CourseCount = courses.Count(),
                    Data = courses
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while retrieving department courses",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get available courses for a specific student (filtered by their department)
        /// VALIDATION ENHANCED: Student ID validation and department filtering
        /// Students can only see courses from their own department
        /// </summary>
        [HttpGet("student/{studentId}/available")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<IEnumerable<EnrollCourseDTO>>> GetAvailableCoursesForStudent(int studentId)
        {
            // VALIDATION ENHANCED: Student ID validation
            // Prevents retrieval with invalid IDs (0 or negative)
            if (studentId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid student ID. ID must be a positive integer."
                });

            try
            {
                // Service validation: Ensures student exists and has department assignment
                var courses = await _courseService.GetAvailableCoursesForStudent(studentId);
                return Ok(new
                {
                    Success = true,
                    Message = "Available courses for student retrieved successfully",
                    Note = "Only courses from student's department are shown",
                    StudentId = studentId,
                    CourseCount = courses.Count(),
                    Data = courses
                });
            }
            catch (InvalidOperationException ex)
            {
                // Handles: Student not found, student has no department
                return BadRequest(new
                {
                    Success = false,
                    Message = "Cannot retrieve courses",
                    Error = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while retrieving available courses",
                    Error = ex.Message
                });
            }
        }

        // ============= UTILITY ENDPOINTS =============

        /// <summary>
        /// Check if a course can run (minimum 5 students enrolled)
        /// VALIDATION ENHANCED: Business rule validation for course execution readiness
        /// Courses require minimum enrollment (MIN_STUDENTS_TO_RUN_COURSE = 5) to run
        /// </summary>
        [HttpGet("{courseId}/can-run")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> CanCourseRun(int courseId)
        {
            // VALIDATION ENHANCED: Course ID validation
            // Prevents check with invalid IDs (0 or negative)
            if (courseId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid course ID. ID must be a positive integer."
                });

            try
            {
                // VALIDATION ENHANCED: Service checks minimum enrollment requirement
                // Business rule: MIN_STUDENTS_TO_RUN_COURSE = 5 students minimum
                // Returns true only if course has 5+ confirmed enrollments
                var canRun = await _courseService.CanCourseRun(courseId);
                return Ok(new
                {
                    Success = true,
                    CourseId = courseId,
                    CanRun = canRun,
                    MinimumEnrollment = 5,
                    Message = canRun
                        ? "Course has minimum required enrollment and can run"
                        : "Course does not have minimum required enrollment (5 students)"
                });
            }
            catch (KeyNotFoundException ex)
            {
                // Handles: Course not found
                return NotFound(new
                {
                    Success = false,
                    Message = "Course not found",
                    Error = ex.Message,
                    CourseId = courseId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while checking course status",
                    Error = ex.Message
                });
            }
        }
    }
}