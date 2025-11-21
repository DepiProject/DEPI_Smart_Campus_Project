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
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                var instructor = await _instructorService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = instructor.InstructorId }, instructor);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateInstructorDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var instructor = await _instructorService.UpdateAsync(id, dto);
                return Ok(instructor);
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
                var result = await _instructorService.DeleteAsync(id);
                if (!result)
                    return NotFound(new { message = "Instructor not found" });

                return Ok(new { message = "Instructor deleted successfully" });
            }
            catch (InvalidOperationException ex)
            {
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