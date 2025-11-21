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
                var result = await _studentService.DeleteAsync(id);
                if (!result)
                    return NotFound(new { message = "Student not found" });

                return Ok(new { message = "Student deleted successfully" });
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
        }
    }
}