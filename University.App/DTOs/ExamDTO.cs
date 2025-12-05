using System.ComponentModel.DataAnnotations;

namespace University.App.DTOs
{
    // ===== READ DTOs =====

    public class ExamDTO
    {
        public int ExamId { get; set; }
        public string? CourseName { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime ExamDate { get; set; }
        public int Duration { get; set; }
        public decimal TotalPoints { get; set; }
        public int CourseId { get; set; }
    }

    public class ExamWithQuestionsDTO
    {
        public int ExamId { get; set; }
        public string? CourseName { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime ExamDate { get; set; }
        public int Duration { get; set; }
        public decimal TotalPoints { get; set; }
        public int CourseId { get; set; }
        public List<ExamQuestionDTO> Questions { get; set; } = new();
    }

    public class ExamQuestionDTO
    {
        public int QuestionId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public int OrderNumber { get; set; }

        public List<MCQOptionDTO> MCQOptions { get; set; } = new();
    }

    public class MCQOptionDTO
    {
        public int OptionId { get; set; }
        public string OptionText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public int OrderNumber { get; set; }
    }


    // CREATE DTOs 

    public class CreateExamDto
    {
        [Required(ErrorMessage = "Title is required")]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Exam date is required")]
        public DateTime ExamDate { get; set; }

        [Required(ErrorMessage = "Duration is required")]
        [Range(1, 300, ErrorMessage = "Duration must be between 1 and 300 minutes")]
        public int Duration { get; set; }

        [Required(ErrorMessage = "Total points is required")]
        [Range(0.01, 1000, ErrorMessage = "Total points must be between 0.01 and 1000")]
        public decimal TotalPoints { get; set; }

        [Required(ErrorMessage = "Course ID is required")]
        public int CourseId { get; set; }
    }

    public class CreateQuestionDto
    {
        [Required(ErrorMessage = "Question text is required")]
        [StringLength(1000, ErrorMessage = "Question text cannot exceed 1000 characters")]
        public string QuestionText { get; set; } = string.Empty;

        [Required(ErrorMessage = "Order number is required")]
        [Range(1, 1000, ErrorMessage = "Order number must be between 1 and 1000")]
        public int OrderNumber { get; set; }

        [Required(ErrorMessage = "Score is required")]
        [Range(0.01, 100, ErrorMessage = "Score must be between 0.01 and 100")]
        public decimal Score { get; set; }

        [Required(ErrorMessage = "Exam ID is required")]
        public int ExamId { get; set; }

        
        [Required(ErrorMessage = "Exam ID is required")]
        public int CourseId { get; set; }

        [Required(ErrorMessage = "Options are required")]
        [MinLength(2, ErrorMessage = "Question must have at least 2 options")]
        public List<CreateMCQOptionDto> MCQOptions { get; set; } = new();
    }

    public class CreateMCQOptionDto
    {
        [Required(ErrorMessage = "Option text is required")]
        [StringLength(500, ErrorMessage = "Option text cannot exceed 500 characters")]
        public string OptionText { get; set; } = string.Empty;

        [Required(ErrorMessage = "Order number is required")]
        [Range(1, 10, ErrorMessage = "Order number must be between 1 and 10")]
        public int OrderNumber { get; set; }

        [Required(ErrorMessage = "IsCorrect is required")]
        public bool IsCorrect { get; set; }
    }

    // UPDATE DTOs 

    public class UpdateExamDto
    {
        [Required(ErrorMessage = "Title is required")]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Exam date is required")]
        public DateTime ExamDate { get; set; }

        [Required(ErrorMessage = "Duration is required")]
        [Range(1, 300, ErrorMessage = "Duration must be between 1 and 300 minutes")]
        public int Duration { get; set; }

        [Required(ErrorMessage = "Total points is required")]
        [Range(0.01, 1000, ErrorMessage = "Total points must be between 0.01 and 1000")]
        public decimal TotalPoints { get; set; }
    }

    public class UpdateQuestionDto
    {
        [Required(ErrorMessage = "Question text is required")]
        [StringLength(1000, ErrorMessage = "Question text cannot exceed 1000 characters")]
        public string QuestionText { get; set; } = string.Empty;

        [Required(ErrorMessage = "Order number is required")]
        [Range(1, 1000, ErrorMessage = "Order number must be between 1 and 1000")]
        public int OrderNumber { get; set; }

        [Required(ErrorMessage = "Score is required")]
        [Range(0.01, 100, ErrorMessage = "Score must be between 0.01 and 100")]
        public decimal Score { get; set; }

        [Required(ErrorMessage = "Options are required")]
        [MinLength(2, ErrorMessage = "Question must have at least 2 options")]
        public List<UpdateMCQOptionDto> MCQOptions { get; set; } = new();
    }

    public class UpdateMCQOptionDto
    {
        public int? OptionId { get; set; } // Null for new options

        [Required(ErrorMessage = "Option text is required")]
        [StringLength(500, ErrorMessage = "Option text cannot exceed 500 characters")]
        public string OptionText { get; set; } = string.Empty;

        [Required(ErrorMessage = "Order number is required")]
        [Range(1, 10, ErrorMessage = "Order number must be between 1 and 10")]
        public int OrderNumber { get; set; }

        [Required(ErrorMessage = "IsCorrect is required")]
        public bool IsCorrect { get; set; }
    }

    // ===== Helper for True/False =====

    public static class QuestionDtoHelpers
    {
        public static CreateQuestionDto CreateTrueFalseQuestion(
            string questionText,
            int orderNumber,
            decimal score,
            int examId,
            bool correctAnswer)
        {
            return new CreateQuestionDto
            {
                QuestionText = questionText,
                OrderNumber = orderNumber,
                Score = score,
                ExamId = examId,
                MCQOptions = new List<CreateMCQOptionDto>
                {
                    new CreateMCQOptionDto
                    {
                        OptionText = "True",
                        OrderNumber = 1,
                        IsCorrect = correctAnswer == true
                    },
                    new CreateMCQOptionDto
                    {
                        OptionText = "False",
                        OrderNumber = 2,
                        IsCorrect = correctAnswer == false
                    }
                }
            };
        }
    }
}
