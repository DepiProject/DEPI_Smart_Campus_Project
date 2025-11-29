using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using University.App.DTOs;
using University.App.Services.IServices;

namespace University.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly IAttendanceService _attendanceService;

        public AttendanceController(IAttendanceService attendanceService)
        {
            _attendanceService = attendanceService;
        }


        [HttpPost("mark")]
        [Authorize(Roles = "Instructor")]
        public async Task<ActionResult> MarkAttendance(MarkAttendanceDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                await _attendanceService.MarkAttendanceAsync(dto);
                return Ok(new { message = "Attendance marked successfully" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("student/{studentId}")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<ActionResult<List<AttendanceDto>>> GetStudentHistory(int studentId)
        {
            if (studentId <= 0)
                return BadRequest("Invalid student ID");

            try
            {
                var history = await _attendanceService.GetStudentHistoryAsync(studentId);
                return Ok(history);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        [HttpGet("filter")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult<List<AttendanceDto>>> FilterAttendances(
            [FromQuery] int? studentId,
            [FromQuery] int? courseId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            var attendances = await _attendanceService.FilterAsync(studentId, courseId, from, to);
            return Ok(attendances);
        }

        [Authorize(Roles = "Admin,Student,Instructor")]
        [HttpGet("summary/{studentId}")]
        public async Task<ActionResult<object>> GetAttendanceSummary(
            int studentId,
            [FromQuery] int? courseId = null)
        {
            if (studentId <= 0)
                return BadRequest("Invalid student ID");

            try
            {
                var summary = await _attendanceService.GetAttendanceSummaryAsync(studentId, courseId);
                return Ok(summary);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Instructor")]
        public async Task<ActionResult> UpdateAttendance(int id, [FromBody] UpdateAttendanceDto dto)
        {
            if (id <= 0)
                return BadRequest("Invalid attendance ID");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                await _attendanceService.UpdateAttendanceAsync(id, dto.Status);
                return Ok(new { message = "Attendance updated successfully", id });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Instructor")]
        public async Task<ActionResult> DeleteAttendance(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid attendance ID");

            try
            {
                await _attendanceService.DeleteAttendanceAsync(id);
                return Ok(new { message = "Attendance deleted successfully", id });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { error = ex.Message});
            }
        }
    }
}