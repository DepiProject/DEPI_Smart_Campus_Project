using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using University.App.DTOs;
using University.App.Services.IServices;

namespace University.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubmissionController : ControllerBase
    {
        private readonly ISubmissionService _submissionService;
      
        public SubmissionController(ISubmissionService submissionService)
        {
            _submissionService = submissionService;
        }

        [HttpPost("start")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> StartExam([FromBody] StartExamDto dto)
        {
            try
            {
                var submission = await _submissionService.StartExamAsync(dto.ExamId, dto.StudentId);
                return Ok(new
                {
                    success = true,
                    message = "Exam started successfully",
                    data = submission
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("submit")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> SubmitExam([FromBody] SubmitExamDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, errors = ModelState });

                var result = await _submissionService.SubmitExamAsync(dto);
                return Ok(new
                {
                    success = true,
                    message = "Exam submitted successfully",
                    data = result
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("result/{examId}/{studentId}")]
        [Authorize(Roles = "Student,Instructor")]
        public async Task<IActionResult> GetExamResult(int examId, int studentId)
        {
            try
            {
                var result = await _submissionService.GetExamResultAsync(examId, studentId);
                if (result == null)
                    return NotFound(new { success = false, message = "Exam submission not found or not yet submitted" });

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("status/{examId}/{studentId}")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> GetSubmissionStatus(int examId, int studentId)
        {
            try
            {
                var status = await _submissionService.GetSubmissionStatusAsync(examId, studentId);
                if (status == null)
                    return NotFound(new { success = false, message = "No submission found" });

                return Ok(new { success = true, data = status });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("student/{studentId}")]
        [Authorize(Roles = "Student,Instructor")]
        public async Task<IActionResult> GetStudentSubmissions(int studentId)
        {
            try
            {
                var submissions = await _submissionService.GetStudentSubmissionsAsync(studentId);
                return Ok(new { success = true, data = submissions });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("exam/{examId}")]
        [Authorize(Roles = "Instructor")]
        public async Task<IActionResult> GetExamSubmissions(int examId)
        {
            try
            {
                var submissions = await _submissionService.GetExamSubmissionsAsync(examId);
                return Ok(new { success = true, data = submissions });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}