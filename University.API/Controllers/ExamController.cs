using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using University.App.DTOs;
using University.App.Services.IServices;

namespace University.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExamController : ControllerBase
    {
        private readonly IExamService _examService;

        public ExamController(IExamService examService)
        {
            _examService = examService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllExams()
        {
            try
            {
                var exams = await _examService.GetAllExams();
                return Ok(new { success = true, data = exams });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        [HttpGet("course/{courseId}")]
        public async Task<IActionResult> GetCourseExams(int courseId)
        {
            if (courseId <= 0)
                return BadRequest(new { success = false, message = "Invalid course ID" });

            try
            {
                var exams = await _examService.GetAllExamsForCourse(courseId);
                return Ok(new { success = true, data = exams });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        [HttpGet("{id}/course/{courseId}")]
        public async Task<IActionResult> GetExamById(int id, int courseId)
        {
            if (id <= 0 || courseId <= 0)
                return BadRequest(new { success = false, message = "Invalid exam or course ID" });

            try
            {
                var exam = await _examService.GetExamById(id, courseId);
                return Ok(new { success = true, data = exam });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        [HttpGet("{id}/course/{courseId}/with-questions")]
        public async Task<IActionResult> GetExamWithQuestions(int id, int courseId)
        {
            if (id <= 0 || courseId <= 0)
                return BadRequest(new { success = false, message = "Invalid exam or course ID" });

            try
            {
                var exam = await _examService.GetExamWithQuestions(id, courseId);
                return Ok(new { success = true, data = exam });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }


        [HttpPost]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<IActionResult> CreateExam([FromBody] CreateExamDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, errors = ModelState });

            try
            {
                var exam = await _examService.AddExam(dto);
                return CreatedAtAction(
                    nameof(GetExamById),
                    new { id = exam.CourseId, courseId = exam.CourseId },
                    new { success = true, message = "Exam created successfully", data = exam }
                );
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = "Validation error", error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = "Operation failed", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        [HttpPut("{id}/course/{courseId}")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<IActionResult> UpdateExam(int id, int courseId, [FromBody] UpdateExamDto dto)
        {
            if (id <= 0 || courseId <= 0)
                return BadRequest(new { success = false, message = "Invalid exam or course ID" });

            if (!ModelState.IsValid)
                return BadRequest(new { success = false, errors = ModelState });

            try
            {
                var exam = await _examService.UpdateExam(id, courseId, dto);
                return Ok(new { success = true, message = "Exam updated successfully", data = exam });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        [HttpDelete("{id}/course/{courseId}")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<IActionResult> DeleteExam(int id, int courseId)
        {
            if (id <= 0 || courseId <= 0)
                return BadRequest(new { success = false, message = "Invalid exam or course ID" });

            try
            {
                var deleted = await _examService.DeleteExam(id, courseId);
                if (!deleted)
                    return NotFound(new { success = false, message = "Exam not found" });

                return Ok(new { success = true, message = "Exam deleted successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }


        [HttpGet("{examId}/questions")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<IActionResult> GetExamQuestions(int examId)
        {
            if (examId <= 0)
                return BadRequest(new { success = false, message = "Invalid exam ID" });

            try
            {
                var questions = await _examService.GetQuestionsByExamId(examId);
                return Ok(new { success = true, data = questions });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }


        [HttpGet("{examId}/questions/{questionId}")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<IActionResult> GetQuestionById(int examId, int questionId)
        {
            try
            {
                var question = await _examService.GetQuestionById(questionId, examId);
                return Ok(new { success = true, data = question });
            }
            catch (Exception ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
        }


        [HttpPost("questions")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<IActionResult> AddQuestion([FromBody] CreateQuestionDto dto)
        {
       
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, errors = ModelState });

                var question = await _examService.AddExamQuestion(dto);
                return CreatedAtAction(
                    nameof(GetQuestionById),
                    new { examId = dto.ExamId, courseId = dto.CourseId, questionId = question?.QuestionId },
                    new { success = true, message = "Question added successfully", data = question }
                );
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }


        [HttpPut("{examId}/questions/{questionId}")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<IActionResult> UpdateQuestion(
            int examId,
            int questionId,
            [FromBody] UpdateQuestionDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, errors = ModelState });

                var question = await _examService.UpdateExamQuestion(questionId, examId, dto);
                return Ok(new { success = true, message = "Question updated successfully", data = question });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{examId}/questions/{questionId}")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<IActionResult> DeleteQuestion(int examId, int questionId)
        {
            try
            {
                var deleted = await _examService.DeleteExamQuestion(questionId, examId);
                if (!deleted)
                    return NotFound(new { success = false, message = "Question not found" });

                return Ok(new { success = true, message = "Question deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }





    }
}