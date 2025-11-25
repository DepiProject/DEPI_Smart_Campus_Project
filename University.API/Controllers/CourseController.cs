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
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<CourseDTO>>> GetAllCourses()
        {
            try
            {
                var courses = await _courseService.GetAllCourses();
                return Ok(new
                {
                    Success = true,
                    Message = "Courses retrieved successfully",
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
        // Get all courses including soft-deleted ones (Admin only)
        [HttpGet("all-including-deleted")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<IEnumerable<CourseDTO>>> GetAllCoursesIncludingDeleted()
        {
            try
            {
                var courses = await _courseService.GetAllCoursesIncludingDeleted();
                return Ok(new
                {
                    Success = true,
                    Message = "All courses (including deleted) retrieved successfully",
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

        // Get a specific course by ID

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CourseDTO>> GetCourseById(int id)
        {
            if (id <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid course ID"
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
        /// Business Rules Applied:
        /// - Instructor must exist
        /// - Instructor cannot teach more than 2 courses
        /// - Instructor cannot teach more than 12 credit hours
        /// - Course code must be unique
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<CreateCourseDTO>> CreateCourse([FromBody] CreateCourseDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid data",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });

            try
            {
                var course = await _courseService.AddCourse(dto);
                if (course == null)
                    return BadRequest(new
                    {
                        Success = false,
                        Message = "Failed to create course"
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
                return BadRequest(new
                {
                    Success = false,
                    Message = "Validation error",
                    Error = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
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
        /// Business Rules Applied:
        /// - New instructor must exist
        /// - New instructor workload validated (if instructor changes)
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CourseDTO>> UpdateCourse(int id, [FromBody] UpdateCourseDTO dto)
        {
            if (id <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid course ID"
                });

            if (!ModelState.IsValid)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid data",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });

            try
            {
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
        /// Note: Related data (enrollments, exams, attendance) is preserved
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> DeleteCourse(int id)
        {
            if (id <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid course ID"
                });

            try
            {
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
        /// </summary>
        [HttpPost("{id}/restore")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> RestoreCourse(int id)
        {
            if (id <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid course ID"
                });

            try
            {
                var restored = await _courseService.RestoreCourse(id);
                if (!restored)
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Course not found"
                    });

                return Ok(new
                {
                    Success = true,
                    Message = "Course restored successfully"
                });
            }
            catch (InvalidOperationException ex)
            {
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
        /// </summary>
        [HttpGet("instructor/{instructorId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<InstructorCoursesDTO>>> GetCoursesByInstructorId(int instructorId)
        {
            if (instructorId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid instructor ID"
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
        /// </summary>
        [HttpGet("department/{departmentId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<EnrollCourseDTO>>> GetAllCoursesByDepartmentID(int departmentId)
        {
            if (departmentId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid department ID"
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
        /// Students can only see courses from their own department
        /// </summary>
        [HttpGet("student/{studentId}/available")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<IEnumerable<EnrollCourseDTO>>> GetAvailableCoursesForStudent(int studentId)
        {
            if (studentId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid student ID"
                });

            try
            {
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
        /// </summary>
        [HttpGet("{courseId}/can-run")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult> CanCourseRun(int courseId)
        {
            if (courseId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid course ID"
                });

            try
            {
                var canRun = await _courseService.CanCourseRun(courseId);
                return Ok(new
                {
                    Success = true,
                    CourseId = courseId,
                    CanRun = canRun,
                    Message = canRun
                        ? "Course has minimum required enrollment and can run"
                        : "Course does not have minimum required enrollment (5 students)"
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