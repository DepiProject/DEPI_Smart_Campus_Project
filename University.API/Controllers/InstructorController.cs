using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using University.App.DTOs.Users;
using University.App.Services.IServices.Users;

namespace University.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InstructorController : ControllerBase
    {
        private readonly IInstructorService _instructorService;

        public InstructorController(IInstructorService instructorService)
        {
            _instructorService = instructorService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var instructors = await _instructorService.GetAllAsync();
            return Ok(instructors);
        }

        [HttpGet("paginated")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllPaginated([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            if (pageNumber < 1 || pageSize < 1)
                return BadRequest(new { message = "Page number and page size must be greater than 0" });

            var (instructors, totalCount) = await _instructorService.GetAllWithPaginationAsync(pageNumber, pageSize);
            return Ok(new
            {
                data = instructors,
                totalCount,
                pageNumber,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }

        [HttpGet("search")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SearchInstructors(
            [FromQuery] string? searchTerm,
            [FromQuery] int? departmentId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            if (pageNumber < 1 || pageSize < 1)
                return BadRequest(new { message = "Page number and page size must be greater than 0" });

            var (instructors, totalCount) = await _instructorService.SearchInstructorsAsync(searchTerm, departmentId, pageNumber, pageSize);
            return Ok(new
            {
                data = instructors,
                totalCount,
                pageNumber,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                searchTerm,
                departmentId
            });
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetById(int id)
        {
            var instructor = await _instructorService.GetByIdAsync(id);
            if (instructor == null)
                return NotFound(new { message = "Instructor not found" });

            return Ok(instructor);
        }

        [HttpGet("department/{departmentId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByDepartment(int departmentId)
        {
            var instructors = await _instructorService.GetByDepartmentAsync(departmentId);
            return Ok(instructors);
        }

        [HttpGet("check-phone/{phoneNumber}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CheckPhoneUnique(string phoneNumber)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber))
                return BadRequest(new { isUnique = false, message = "Phone number is required" });

            var isUnique = await _instructorService.IsPhoneNumberUniqueAsync(phoneNumber);
            return Ok(new { isUnique });
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateInstructorDto dto)
        {
            // VALIDATION ENHANCED: Check ModelState validity
            // Validates all data annotations from CreateInstructorDto:
            // - Email format and uniqueness
            // - Password strength requirements (uppercase, lowercase, digits, special chars)
            // - Name length and format constraints
            // - Phone number format (11 digits)
            // - Cross-field validation (FullName contains FirstName and LastName)
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                var instructor = await _instructorService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = instructor.InstructorId }, instructor);
            }
            catch (InvalidOperationException ex)
            {
                // Catches duplicate email or invalid department ID scenarios
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateInstructorDto dto)
        {
            // VALIDATION ENHANCED: Check ModelState validity for update operations
            // Validates UpdateInstructorDto constraints:
            // - FullName is required and meets length requirements
            // - ContactNumber (if provided) must be exactly 11 characters
            // - DepartmentId (if provided) must be a positive integer
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var instructor = await _instructorService.UpdateAsync(id, dto);
                return Ok(instructor);
            }
            catch (KeyNotFoundException ex)
            {
                // Instructor with provided ID not found
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                // Invalid DepartmentId provided
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                // VALIDATION ENHANCED: Delete operation enforces business rules
                // The service validates:
                // - Instructor exists
                // - Instructor is not a department head
                // - Instructor has no active courses with enrollments
                // Uses soft delete to preserve data integrity and audit trail
                var result = await _instructorService.SoftDeleteAsync(id);
                if (!result)
                    return NotFound(new { message = "Instructor not found" });

                return Ok(new { message = "Instructor archived successfully" });
            }
            catch (InvalidOperationException ex)
            {
                // Business rule violations (head of dept, active courses, etc.)
                return BadRequest(new { message = ex.Message });
            }
        }

        // Profile details instructor previliage
        [HttpGet("me")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var instructor = await _instructorService.GetMyProfileAsync(userId);

            if (instructor == null)
                return NotFound(new { message = "Instructor profile not found" });

            return Ok(instructor);
        }

        [HttpPut("me")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateInstructorProfileDto dto)
        {
            // VALIDATION ENHANCED: Check ModelState validity for instructor self-updates
            // Validates UpdateInstructorProfileDto constraints:
            // - FullName is required and meets length requirements (5-150 chars)
            // - ContactNumber (if provided) must be exactly 11 characters
            // - Limited fields available for instructor self-update (security policy)
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var instructor = await _instructorService.UpdateMyProfileAsync(userId, dto);
                return Ok(instructor);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // ========== SOFT DELETE OPERATIONS ==========

        [HttpGet("all-including-deleted")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllIncludingDeleted()
        {
            var instructors = await _instructorService.GetAllIncludingDeletedAsync();
            return Ok(instructors);
        }

        [HttpPost("{id}/restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Restore(int id)
        {
            if (id <= 0)
                return BadRequest(new { Success = false, Message = "Invalid instructor ID" });

            try
            {
                var restored = await _instructorService.RestoreAsync(id);
                if (!restored)
                    return NotFound(new { Success = false, Message = "Instructor not found or is already active" });

                return Ok(new { Success = true, Message = "Instructor restored successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "An error occurred while restoring the instructor", Error = ex.Message });
            }
        }

        [HttpDelete("{id}/permanent")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PermanentDelete(int id)
        {
            if (id <= 0)
                return BadRequest(new { Success = false, Message = "Invalid instructor ID" });

            try
            {
                var deleted = await _instructorService.PermanentlyDeleteAsync(id);
                if (!deleted)
                    return NotFound(new { Success = false, Message = "Instructor not found" });

                return Ok(new { Success = true, Message = "Instructor permanently deleted" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "An error occurred while deleting the instructor", Error = ex.Message });
            }
        }

        [HttpGet("{id}/can-permanently-delete")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CanPermanentlyDelete(int id)
        {
            if (id <= 0)
                return BadRequest(new { Success = false, Message = "Invalid instructor ID" });

            try
            {
                var result = await _instructorService.CanPermanentlyDeleteAsync(id);
                return Ok(new { Success = true, CanDelete = result.CanDelete, Reason = result.Reason, RelatedData = result.RelatedDataCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "An error occurred while checking instructor", Error = ex.Message });
            }
        }

        // ========== REASSIGNMENT OPERATIONS ==========

        /// <summary>
        /// Reassign all courses from one instructor to another before deletion
        /// </summary>
        [HttpPost("{fromId}/reassign-courses/{toId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ReassignCourses(int fromId, int toId)
        {
            if (fromId <= 0 || toId <= 0)
                return BadRequest(new { Success = false, Message = "Invalid instructor IDs" });

            if (fromId == toId)
                return BadRequest(new { Success = false, Message = "Cannot reassign to the same instructor" });

            try
            {
                var count = await _instructorService.ReassignCoursesToInstructorAsync(fromId, toId);
                return Ok(new 
                { 
                    Success = true, 
                    Message = $"{count} course(s) reassigned successfully",
                    ReassignedCount = count 
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "An error occurred while reassigning courses", Error = ex.Message });
            }
        }
    }
}