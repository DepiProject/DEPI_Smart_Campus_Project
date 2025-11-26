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
                var result = await _instructorService.DeleteAsync(id);
                if (!result)
                    return NotFound(new { message = "Instructor not found" });

                return Ok(new { message = "Instructor deleted successfully" });
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
    }
}