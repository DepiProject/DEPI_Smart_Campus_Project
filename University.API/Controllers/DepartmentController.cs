using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using University.App.DTOs;
using University.App.Services.IServices;

namespace University.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;

        public DepartmentController(IDepartmentService departmentService)
        {
            _departmentService = departmentService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DepartmentDTO>>> GetAllDepartments()
        {
            try
            {
                var departments = await _departmentService.GetAllDepartments();
                return Ok(departments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving departments", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DepartmentDTO>> GetDepartmentById(int id)
        {
            // VALIDATION ENHANCED: Department ID validation
            // Prevents retrieval attempts with invalid IDs (0 or negative)
            if (id <= 0)
                return BadRequest(new { message = "Invalid department ID. ID must be a positive integer." });
            try
            {
                var department = await _departmentService.GetDepartmentById(id);
                if (department == null)
                    return NotFound(new { message = $"Department with ID {id} not found" });

                return Ok(department);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the department", error = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<DepartmentDTO>> CreateDepartment(CreateDepartmentDTO dto)
        {
            // VALIDATION ENHANCED: Check ModelState validity
            // Validates all data annotations from CreateDepartmentDTO:
            // - Name: Required, MaxLength(100), MinLength(3)
            // - Building: Required, MaxLength(50), MinLength(2)
            // - HeadId: Required, positive integer range
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                // Service-level validations performed:
                // - Department name uniqueness (no duplicates)
                // - Head instructor existence verification
                // - Head instructor uniqueness (not head of other departments)
                var department = await _departmentService.AddDepartment(dto);
                if (department == null)
                    return BadRequest(new { message = "Failed to create department. Please ensure all required fields are valid." });

                return CreatedAtAction(
                    nameof(GetDepartmentById),
                    new { id = department.Id },
                    department
                );
            }
            catch (InvalidOperationException ex)
            {
                // Handles: Duplicate name, Invalid head instructor, Head already assigned elsewhere
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred while creating the department", error = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<ActionResult<DepartmentDTO>> UpdateDepartment(int id, UpdateDepartmentDTO dto)
        {
            // VALIDATION ENHANCED: Department ID validation
            // Prevents update attempts with invalid IDs (0 or negative)
            if (id <= 0)
                return BadRequest(new { message = "Invalid department ID. ID must be a positive integer." });

            // VALIDATION ENHANCED: Check ModelState validity
            // Validates all data annotations from UpdateDepartmentDTO:
            // - Name: Required, MaxLength(100), MinLength(3)
            // - Building: Required, MaxLength(50), MinLength(2)
            // - HeadId: Required, positive integer range
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // Service-level validations performed:
                // - Department existence check
                // - Name uniqueness (excluding current department)
                // - Head instructor existence verification
                // - Head instructor uniqueness (not head of other departments)
                var updatedDepartment = await _departmentService.UpdateDepartment(id, dto);
                if (updatedDepartment == null)
                    return NotFound(new { message = $"Department with ID {id} not found" });

                return Ok(updatedDepartment);
            }
            catch (InvalidOperationException ex)
            {
                // Handles: Duplicate name, Invalid head instructor, Head already assigned elsewhere
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred while updating the department", error = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteDepartment(int id)
        {
            // VALIDATION ENHANCED: Department ID validation
            // Prevents deletion attempts with invalid IDs (0 or negative)
            if (id <= 0)
                return BadRequest(new { message = "Invalid department ID. ID must be a positive integer." });
            try
            {
                // VALIDATION ENHANCED: Delete operation validation
                // Service checks:
                // - Department existence before deletion
                // - Uses soft delete to preserve data integrity and audit trail
                // TODO: Consider adding business rule checks:
                // - Prevent deletion if department has active students
                // - Prevent deletion if department has active courses
                // - Prevent deletion if department has assigned instructors
                var deleted = await _departmentService.DeleteDepartment(id);
                if (!deleted)
                    return NotFound(new { message = $"Department with ID {id} not found" });

                return Ok(new { message = "Department deleted successfully", id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the department", error = ex.Message });
            }
        }
    }
}