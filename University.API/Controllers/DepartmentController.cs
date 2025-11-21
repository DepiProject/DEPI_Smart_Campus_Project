using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using University.App.DTOs;
using University.App.Services.IServices;

namespace University.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // All endpoints require authentication
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
            if (id <= 0)
                return BadRequest(new { message = "Invalid department ID" });
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
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                var department = await _departmentService.AddDepartment(dto);
                if (department == null)
                    return BadRequest(new { message = "Failed to create department" });

                return CreatedAtAction(
                    nameof(GetDepartmentById),
                    new { id = department.Id },
                    department
                );
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<ActionResult<DepartmentDTO>> UpdateDepartment(int id, UpdateDepartmentDTO dto)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid department ID" });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var updatedDepartment = await _departmentService.UpdateDepartment(id, dto);
                if (updatedDepartment == null)
                    return NotFound(new { message = $"Department with ID {id} not found" });

                return Ok(updatedDepartment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteDepartment(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid department ID" });
            try
            {
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