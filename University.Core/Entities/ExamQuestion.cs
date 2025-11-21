namespace University.Core.Entities
{
    public class ExamQuestion
    {
        public int QuestionId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public int OrderNumber { get; set; }
        public int ExamId { get; set; }
        public Exam? Exam { get; set; }

        // All questions use MCQ options (even True/False will have 2 options)
        public ICollection<MCQOption> Options { get; set; } = new List<MCQOption>();
        public ICollection<ExamAnswer> Answers { get; set; } = new List<ExamAnswer>();
    }
}