namespace University.Core.Entities
{
    public class ExamAnswer
    {
        public int AnswerId { get; set; }

        public int? SelectedOptionId { get; set; }
        public bool? IsCorrect { get; set; }
        public decimal? PointsAwarded { get; set; }

        public int? SubmissionId { get; set; }
        public ExamSubmission? Submission { get; set; }

        public int QuestionId { get; set; }
        public ExamQuestion? Question { get; set; }
    }
}