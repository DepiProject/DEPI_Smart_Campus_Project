using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using University.App.DTOs;
using University.App.Services.IServices;

namespace University.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize]
    public class EnrollmentController : ControllerBase
    {
        private readonly IEnrollmentService _enrollmentService;

        public EnrollmentController(IEnrollmentService enrollmentService)
        {
            _enrollmentService = enrollmentService;
        }

        // ============= ENROLLMENT MANAGEMENT =============

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]

        [Authorize(Roles = "Student")]
        public async Task<ActionResult<CreateEnrollmentDTO>> EnrollStudent([FromBody] CreateEnrollmentDTO dto)
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
                var enrollment = await _enrollmentService.AddEnrollCourse(dto);
                if (enrollment == null)
                    return BadRequest(new
                    {
                        Success = false,
                        Message = "Failed to enroll student"
                    });

                return CreatedAtAction(
                    nameof(GetEnrollmentsByStudentId),
                    new { studentId = enrollment.StudentId },
                    new
                    {
                        Success = true,
                        Message = "Student enrolled in course successfully",
                        Data = enrollment
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
                // Return the specific business rule message so frontend can show exact reason
                return Conflict(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while enrolling the student",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Remove a student enrollment
        /// </summary>
        [HttpDelete("{enrollmentId}")]
        [Authorize(Roles = "Student")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> RemoveEnrollment(int enrollmentId)
        {
            if (enrollmentId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid enrollment ID"
                });

            try
            {
                var removed = await _enrollmentService.RemoveEnrollCourse(enrollmentId);
                if (!removed)
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Enrollment not found"
                    });

                return Ok(new
                {
                    Success = true,
                    Message = "Enrollment removed successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while removing the enrollment",
                    Error = ex.Message
                });
            }
        }

        // ============= QUERY ENDPOINTS =============

        /// <summary>
        /// Get all enrollments for a specific student
        /// </summary>
        [HttpGet("student/{studentId}")]

        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<StudentEnrollmentDTO>>> GetEnrollmentsByStudentId(int studentId)
        {
            if (studentId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid student ID"
                });

            try
            {
                var enrollments = await _enrollmentService.GetEnrollmentsByStudentId(studentId);
                return Ok(new
                {
                    Success = true,
                    Message = "Student enrollments retrieved successfully",
                    StudentId = studentId,
                    EnrollmentCount = enrollments.Count(),
                    Data = enrollments
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while retrieving student enrollments",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get all students enrolled in a specific course
        /// </summary>
        [HttpGet("course/{courseId}")]
        [Authorize(Roles = "Admin,Instructor")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<StudentEnrollmentDTO>>> GetEnrollmentsByCourseId(int courseId)
        {
            if (courseId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid course ID"
                });

            try
            {
                var enrollments = await _enrollmentService.GetEnrollmentStudentsByCourseID(courseId);
                return Ok(new
                {
                    Success = true,
                    Message = "Course enrollments retrieved successfully",
                    CourseId = courseId,
                    EnrollmentCount = enrollments.Count(),
                    Data = enrollments
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while retrieving course enrollments",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Calculate and get student's final grade for a specific course
        /// NEW ENDPOINT: Calculates grade based on all exam scores, determines letter grade (A+, A, B+, etc.)
        /// Updates enrollment status to "Completed" if all exams are finished
        /// </summary>
        [HttpGet("student/{studentId}/course/{courseId}/grade")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<StudentEnrollmentDTO>> GetStudentCourseGrade(int studentId, int courseId)
        {
            if (studentId <= 0 || courseId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid student ID or course ID"
                });

            try
            {
                var result = await _enrollmentService.CalculateAndUpdateStudentCourseGradeAsync(studentId, courseId);
                if (result == null)
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Enrollment not found"
                    });

                return Ok(new
                {
                    Success = true,
                    Message = "Grade calculated successfully",
                    Data = result
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
                return BadRequest(new
                {
                    Success = false,
                    Message = "Operation failed",
                    Error = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while calculating grade",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get all active enrollments (Admin only)
        /// Returns only non-deleted, non-rejected enrollments
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<StudentEnrollmentDTO>>> GetAllActiveEnrollments()
        {
            try
            {
                var activeEnrollments = await _enrollmentService.GetAllActiveEnrollmentsAsync();
                
                return Ok(new
                {
                    Success = true,
                    Message = "Active enrollments retrieved successfully",
                    Count = activeEnrollments.Count(),
                    Data = activeEnrollments
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while retrieving active enrollments",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get all enrollments including soft-deleted ones (Admin only)
        /// NEW ENDPOINT: View all enrollments including those marked as deleted
        /// </summary>
        [HttpGet("all-including-deleted")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<StudentEnrollmentDTO>>> GetAllEnrollmentsIncludingDeleted()
        {
            try
            {
                var enrollments = await _enrollmentService.GetAllEnrollmentsIncludingDeletedAsync();
                return Ok(new
                {
                    Success = true,
                    Message = "All enrollments (including deleted) retrieved successfully",
                    Count = enrollments.Count(),
                    Data = enrollments
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while retrieving enrollments",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Soft delete an enrollment (Admin only)
        /// NEW ENDPOINT: Marks enrollment as deleted (IsDeleted=true, DeletedAt=UTC time)
        /// Does not remove data from database
        /// </summary>
        [HttpDelete("soft-delete/{enrollmentId}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> SoftDeleteEnrollment(int enrollmentId)
        {
            if (enrollmentId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid enrollment ID"
                });

            try
            {
                var deleted = await _enrollmentService.DeleteEnrollmentAsync(enrollmentId);
                if (!deleted)
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Enrollment not found"
                    });

                return Ok(new
                {
                    Success = true,
                    Message = "Enrollment soft deleted successfully"
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
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while deleting the enrollment",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Hard delete an enrollment (Admin only)
        /// Permanently removes enrollment from database
        /// </summary>
        [HttpDelete("hard-delete/{enrollmentId}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> HardDeleteEnrollment(int enrollmentId)
        {
            if (enrollmentId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid enrollment ID"
                });

            try
            {
                var deleted = await _enrollmentService.HardDeleteEnrollmentAsync(enrollmentId);
                if (!deleted)
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Enrollment not found"
                    });

                return Ok(new
                {
                    Success = true,
                    Message = "Enrollment permanently deleted"
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
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while deleting the enrollment",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Approve a pending enrollment (Admin only)
        /// Changes status from "Pending" to "Enrolled"
        /// </summary>
        [HttpPost("{enrollmentId}/approve")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> ApproveEnrollment(int enrollmentId)
        {
            if (enrollmentId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid enrollment ID"
                });

            try
            {
                var approved = await _enrollmentService.ApproveEnrollmentAsync(enrollmentId);
                if (!approved)
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Enrollment not found or already approved"
                    });

                return Ok(new
                {
                    Success = true,
                    Message = "Enrollment approved successfully"
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while approving the enrollment",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Reject a pending enrollment (Admin only)
        /// Changes status from "Pending" to "Rejected"
        /// </summary>
        [HttpPost("{enrollmentId}/reject")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> RejectEnrollment(int enrollmentId)
        {
            if (enrollmentId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid enrollment ID"
                });

            try
            {
                var rejected = await _enrollmentService.RejectEnrollmentAsync(enrollmentId);
                if (!rejected)
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Enrollment not found"
                    });

                return Ok(new
                {
                    Success = true,
                    Message = "Enrollment rejected successfully"
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while rejecting the enrollment",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Restore a soft-deleted enrollment (Admin only)
        /// NEW ENDPOINT: Restores enrollment (IsDeleted=false, DeletedAt=null)
        /// </summary>
        [HttpPost("{enrollmentId}/restore")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> RestoreEnrollment(int enrollmentId)
        {
            if (enrollmentId <= 0)
                return BadRequest(new
                {
                    Success = false,
                    Message = "Invalid enrollment ID"
                });

            try
            {
                var restored = await _enrollmentService.RestoreEnrollmentAsync(enrollmentId);
                if (!restored)
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Enrollment not found"
                    });

                return Ok(new
                {
                    Success = true,
                    Message = "Enrollment restored successfully"
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = "Cannot restore enrollment",
                    Error = ex.Message
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
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while restoring the enrollment",
                    Error = ex.Message
                });
            }
        }
    }
}