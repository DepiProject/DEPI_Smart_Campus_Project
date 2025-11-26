using System.ComponentModel.DataAnnotations;

namespace University.App.DTOs
{
    public class ExamAnswerDto
    {
        [Required(ErrorMessage = "Question ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Question ID must be greater than 0")]
        public int QuestionId { get; set; }

        [Required(ErrorMessage = "Selected option ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Selected option ID must be greater than 0")]
        public int SelectedOptionId { get; set; }
    }


    public class SubmitExamDto
    {
        [Required(ErrorMessage = "Exam ID is required")]
        public int ExamId { get; set; }

        [Required(ErrorMessage = "Student ID is required")]
        public int StudentId { get; set; }

        [Required(ErrorMessage = "Answers are required")]
        [MinLength(1, ErrorMessage = "At least one answer is required")]
        public List<ExamAnswerDto> Answers { get; set; } = new();
    }


    public class ExamResultDto
    {
        public int SubmissionId { get; set; }
        public int ExamId { get; set; }
        public string ExamTitle { get; set; } = string.Empty;
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public decimal TotalPoints { get; set; }
        public decimal Percentage { get; set; }
        public int CorrectAnswers { get; set; }
        public int TotalQuestions { get; set; }
        public bool IsSubmitted { get; set; }
        public bool IsGraded { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public int? GradedBy { get; set; }
        public string? GradedByName { get; set; }
        public List<QuestionResultDto> QuestionResults { get; set; } = new List<QuestionResultDto>();
    }

    public class QuestionResultDto
    {
        public int QuestionId { get; set; }
        public string QuestionText { get; set; } = string.Empty;

        public decimal MaxScore { get; set; }
        public decimal PointsAwarded { get; set; }
        public bool IsCorrect { get; set; }

        // Student answer
       
        public int? StudentSelectedOptionId { get; set; }
        public string? StudentSelectedOptionText { get; set; }

        // Correct answer

        public int? CorrectOptionId { get; set; }
        public string? CorrectOptionText { get; set; }
    }

    public class StartExamDto
    {
        [Required(ErrorMessage = "Exam ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Exam ID must be greater than 0")]
        public int ExamId { get; set; }

        [Required(ErrorMessage = "Student ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Student ID must be greater than 0")]
        public int StudentId { get; set; }
    }

    public class ExamSubmissionDto
    {
        public int SubmissionId { get; set; }

        [Required(ErrorMessage = "Exam ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Exam ID must be greater than 0")]
        public int ExamId { get; set; }
        public string ExamTitle { get; set; } = string.Empty;

        [Required(ErrorMessage = "Student ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Student ID must be greater than 0")]
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public decimal? Score { get; set; }
        public bool IsSubmitted { get; set; }
        public bool IsGraded { get; set; }
        public int? GradedBy { get; set; }
    }
}