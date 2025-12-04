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
    public class StudentController : ControllerBase
    {
        private readonly IStudentService _studentService;

        public StudentController(IStudentService studentService)
        {
            _studentService = studentService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var students = await _studentService.GetAllAsync();
            return Ok(students);
        }

        [HttpGet("paginated")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllPaginated([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            if (pageNumber < 1 || pageSize < 1)
                return BadRequest(new { message = "Page number and page size must be greater than 0" });

            var (students, totalCount) = await _studentService.GetAllWithPaginationAsync(pageNumber, pageSize);
            return Ok(new
            {
                data = students,
                totalCount,
                pageNumber,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }

        [HttpGet("search")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SearchStudents(
            [FromQuery] string? searchTerm,
            [FromQuery] int? departmentId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            if (pageNumber < 1 || pageSize < 1)
                return BadRequest(new { message = "Page number and page size must be greater than 0" });

            var (students, totalCount) = await _studentService.SearchStudentsAsync(searchTerm, departmentId, pageNumber, pageSize);
            return Ok(new
            {
                data = students,
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
            var student = await _studentService.GetByIdAsync(id);
            if (student == null)
                return NotFound(new { message = "Student not found" });

            return Ok(student);
        }

        [HttpGet("department/{departmentId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByDepartment(int departmentId)
        {
            var students = await _studentService.GetByDepartmentAsync(departmentId);
            return Ok(students);
        }

        [HttpGet("code/{studentCode}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByStudentCode(string studentCode)
        {
            var student = await _studentService.GetByStudentCodeAsync(studentCode);
            if (student == null)
                return NotFound(new { message = "Student not found" });

            return Ok(student);
        }

        [HttpGet("check-phone/{phoneNumber}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CheckPhoneUnique(string phoneNumber)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber))
                return BadRequest(new { isUnique = false, message = "Phone number is required" });

            var isUnique = await _studentService.IsPhoneNumberUniqueAsync(phoneNumber);
            return Ok(new { isUnique });
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateStudentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                var student = await _studentService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = student.StudentId }, student);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateStudentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var student = await _studentService.UpdateAsync(id, dto);
                return Ok(student);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _studentService.SoftDeleteAsync(id);
                if (!result)
                    return NotFound(new { message = "Student not found" });

                return Ok(new { message = "Student archived successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Profile details Student only
        [HttpGet("me")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var student = await _studentService.GetMyProfileAsync(userId);

            if (student == null)
                return NotFound(new { message = "Student profile not found" });

            return Ok(student);
        }


        [HttpPut("me")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateStudentProfileDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var student = await _studentService.UpdateMyProfileAsync(userId, dto);
                return Ok(student);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ========== SOFT DELETE OPERATIONS ==========

        [HttpGet("all-including-deleted")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllIncludingDeleted()
        {
            var students = await _studentService.GetAllIncludingDeletedAsync();
            return Ok(students);
        }

        [HttpPost("{id}/restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Restore(int id)
        {
            if (id <= 0)
                return BadRequest(new { Success = false, Message = "Invalid student ID" });

            try
            {
                var restored = await _studentService.RestoreAsync(id);
                if (!restored)
                    return NotFound(new { Success = false, Message = "Student not found or is already active" });

                return Ok(new { Success = true, Message = "Student restored successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "An error occurred while restoring the student", Error = ex.Message });
            }
        }

        [HttpDelete("{id}/permanent")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PermanentDelete(int id)
        {
            if (id <= 0)
                return BadRequest(new { Success = false, Message = "Invalid student ID" });

            try
            {
                var deleted = await _studentService.PermanentlyDeleteAsync(id);
                if (!deleted)
                    return NotFound(new { Success = false, Message = "Student not found" });

                return Ok(new { Success = true, Message = "Student permanently deleted" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "An error occurred while deleting the student", Error = ex.Message });
            }
        }

        [HttpGet("{id}/can-permanently-delete")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CanPermanentlyDelete(int id)
        {
            if (id <= 0)
                return BadRequest(new { Success = false, Message = "Invalid student ID" });

            try
            {
                var result = await _studentService.CanPermanentlyDeleteAsync(id);
                return Ok(new { Success = true, CanDelete = result.CanDelete, Reason = result.Reason, RelatedData = result.RelatedDataCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Success = false, Message = "An error occurred while checking student", Error = ex.Message });
            }
        }
    }
}